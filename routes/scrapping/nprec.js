const puppeteer = require("puppeteer");
let fs = require("fs");
let path = require("path");
let S3 = require("aws-sdk/clients/s3");
const express = require("express");
const router = express.Router();
const uuid = require("uuid");
require("dotenv").config(); // Load environment variables
const Nonprescriptiondb = require("../../models/pharmacydb/nonprescriptiondb.js");
const Prescriptiondb = require("../../models/pharmacydb/prescriptiondb.js");

// write a api to scrap the data from the website






router.post("/scrapdata", async (req, res) => {
  const { url, type } = req.body;
  let browser;
  try {
    browser = await puppeteer.launch({
      ignoreDefaultArgs: ["--disable-extensions"],
      args: ["--no-sandbox"],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto(`${url}/page/1`);
    const data = await page.evaluate(() => {
      const anchors = Array.from(
        document.querySelectorAll(
          ".drug-list-page .right-block .white-bg .all-product .row a"
        )
      );
      let totalCount = document.querySelector("#total_count")?.innerText;
      return {
        totalCount: totalCount,
        anchors: anchors
          .map((anchor) => anchor.href)
          .filter(
            (url) =>
              url.includes("non-prescriptions") &&
              !url.includes("/manufacturers/") &&
              !url.includes("/covid-essentials/")
          ),
      };
    });

    const totalPages = Math.ceil(parseFloat(data.totalCount / 20));
    for (let i = 0; i <=totalPages; i++) {
      await page.goto(`${url}/page/${i}`);
      const data2 = await page.evaluate(() => {
        const anchors = Array.from(
          document.querySelectorAll(
            ".drug-list-page .right-block .white-bg .all-product .row a"
          )
        );
        return {
          anchors: anchors
            .map((anchor) => anchor.href)
            .filter(
              (url) =>
                url.includes("non-prescriptions") &&
                !url.includes("/manufacturers/") &&
                !url.includes("/covid-essentials/")
            ),
        };
      });
      data.anchors = data.anchors.concat(data2.anchors);
    }

    const supportedFormats = [".jpeg", ".jpg", ".png"];

    const isSupportedFormat = (url) => {
      const ext = path.extname(url).toLowerCase();
      return supportedFormats.includes(ext);
    };

    const uploadToS3 = async (filename, fileContent, contentType) => {
      const s3 = new S3({
        endpoint: process.env.S3_ENDPOINT,
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        s3BucketEndpoint: true,
        publicReadAccess: true,
      });
      const params = {
        Bucket: "medstown",
        Key: filename,
        Body: fileContent,
        ACL: "public-read",
        ContentDisposition: "inline",
        ContentType: contentType,
      };

      return s3.upload(params).promise();
    };

    for (let i = 0; i < data.anchors.length; i++) {
      await page.goto(data.anchors[i]);

      const data3 = await page.evaluate(() => {
        let anchors = Array.from(
          document.querySelectorAll(".ga-vertical-gallery .slider-main div img")
        );

        return {
          medicineName: document.querySelector(
            ".product-top .product-detail h1"
          )?.innerText,
          disease: document.querySelector(
            "#maincontent .product-top .product-right-block .product-detail a:nth-child(3) > span"
          )?.innerText,
          rxRequired:
            document.querySelector(".req_Rx")?.innerText === "Rx required",
          medicineType: document.querySelector(
            ".product-top .product-detail .drug-manu"
          )?.innerText,

          medicinePrice: document.querySelector(
            ".product-top .essentials .price-box .price"
          )
            ? document
                .querySelector(".product-top .essentials .price-box .price")
                ?.innerText.match(/\d+(\.\d+)?/)[0]
            : document
                .querySelector(
                  ".product-top .essentials .price-box .final-price"
                )
                ?.innerText.match(/\d+(\.\d+)?/)[0],

          medicineCompany: document
            .querySelector(".product-top .essentials .drug-con .drug-manu")
            ?.innerText.replace("* Mkt: ", ""),
          medicineDescription: document.querySelector(
            ".drug-content .product_desc_info"
          )?.innerText,
          medicineImage: [...new Set(anchors.map((anchor) => anchor.src))],
          medicineId:
            "MED" + Math.floor(Math.random().toString().substring(2, 10)),
          dateOfRegistration: new Date().toISOString(),
        };
      });

      // Check if the medicine already exists in the database
      const existingMedicine = await Nonprescriptiondb.findOne({
        medicineName: data3.medicineName,
        medicineCompany: data3.medicineCompany,
      });

      if (existingMedicine) {
        console.log(
          `Duplicate medicine found: ${data3.medicineName} by ${data3.medicineCompany}`
        );
        continue; // Skip saving this medicine
      }

      for (let j = 0; j < data3.medicineImage.length; j++) {
        const imgurl = data3.medicineImage[j];
        const filename = path.basename(imgurl);
        if (!isSupportedFormat(filename)) {
          console.log(`Unsupported format for image: ${filename}`);
          continue;
        }

        // try {
        //   const response = await page.goto(imgurl);
        //   const buffer = await response.buffer();  // Get image data as buffer
        //   const contentType = response.headers()['content-type'];
        //   await uploadToS3(filename, buffer, contentType);
        // } catch (uploadError) {
        //   console.error(`Failed to upload image ${filename}:`, uploadError);
        // }
      }

      for (let l = 0; l < data3.medicineImage.length; l++) {
        const image = data3.medicineImage[l].substring(
          data3.medicineImage[l].lastIndexOf("/") + 1
        );
        data3.medicineImage[
          l
        ] = `https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/${image}`;
      }

      if (data3.disease) {
        const medicine = new Nonprescriptiondb({
          ...data3,
          type: type,
        });
        await medicine.save();
        console.log("Saved medicine", i, "/", data.anchors.length);
      } else {
        console.log("Encountered medicine with disease: null");
      }
    }
  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).send({
      message: "An error occurred during scraping",
      error: error.message,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
    res.send({ message: "success" });
  }
});
















// prescription


router.get("/scrapdatas", async (req, res) => {
  const browser = await puppeteer.launch({ headless: true });
  console.log("Browser launched");

  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.netmeds.com/non-prescriptions/covid-essentials/page/1');

    const data = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('.drug-list-page .right-block .white-bg .all-product .row a'));
      const totalCount = document.querySelector('#total_count')?.innerText;
      return {
        totalCount: totalCount,
        anchors: anchors.map(anchor => anchor.href).filter(url => url.includes('non-prescriptions') && !url.includes('/manufacturers/') && !url.includes("/covid-essentials/")),
      };
    });

    const totalPage = Math.ceil(parseFloat(data.totalCount) / 20);
    let allAnchors = data.anchors;

    // Function to retry page navigation
    const navigateWithRetry = async (url, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          await page.goto(url);
          return true;
        } catch (error) {
          console.error(`Error navigating to ${url}, retrying (${i + 1}/${retries})...`);
          if (i === retries - 1) throw error; // If the last retry fails, throw the error
        }
      }
    };

    // Scrape pages with retry mechanism
    for (let i = 2; i <= totalPage; i++) {
      try {
        const success = await navigateWithRetry(`https://www.netmeds.com/non-prescriptions/covid-essentials/page/${i}`);
        if (success) {
          const newData = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('.drug-list-page .right-block .white-bg .all-product .row a'));
            return {
              anchors: anchors.map(anchor => anchor.href).filter(url => url.includes('non-prescriptions') && !url.includes('/manufacturers/') && !url.includes("/covid-essentials/")),
            };
          });
          allAnchors = allAnchors.concat(newData.anchors);
        }
      } catch (error) {
        console.error(`Failed to navigate to page ${i}, skipping to next page.`);
      }
    }

    console.log("Total product URLs found:", allAnchors.length);

    let medicines = [];

    for (let i = 0; i < allAnchors.length; i++) {
      await navigateWithRetry(allAnchors[i]);  // Retry on product page as well
      const data3 = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('.ga-vertical-gallery .slider-main div img')) || [];
        return {
          medicineName: document.querySelector('.drug-name')?.innerText,
          medicineType: document.querySelector('.drug-type')?.innerText,
          medicineCompany: document.querySelector('.drug-company')?.innerText,
          medicinePrice: document.querySelector('.drug-price')?.innerText.replace("₹", ""),
          medicineQuantity: document.querySelector('.drug-quantity')?.innerText,
          medicineImage: anchors.map(anchor => anchor.src),
          medicineLeaf: document.querySelector('.drug-leaf')?.innerText,
          medicineId: document.querySelector('.drug-id')?.innerText,
          dateOfRegistration: document.querySelector('.drug-registration')?.innerText,
          dateOfUpdate: document.querySelector('.drug-update')?.innerText,
          medicineDescription: document.querySelector('.drug-description')?.innerText,
          rxRequired: document.querySelector('.drug-rx')?.innerText === 'Rx Required',
          disease: document.querySelector('.drug-disease')?.innerText,
        };
      });

      // S3 upload logic remains the same
      const s3 = new S3({
        endpoint: "https://usc1.contabostorage.com",
        accessKeyId: "8fe5f069ca4c4b50bd74c7adf18fcf75",
        secretAccessKey: "90ea5d8271241f37b3e248ecee1843ff",
        s3BucketEndpoint: true,
        publicReadAccess: true,
      });

      const imageUploadPromises = data3.medicineImage.map(async (url, index) => {
        const filename = path.basename(url);
        await navigateWithRetry(url);  // Retry for image download as well
        await page.screenshot({ path: filename });

        const fileContent = fs.readFileSync(filename);
        const params = {
          Bucket: "medstown",
          Key: filename,
          Body: fileContent,
          ACL: "public-read",
          ContentDisposition: "inline",
          ContentType: "image/jpeg",
        };

        try {
          const uploadResult = await s3.upload(params).promise();
          console.log(`File uploaded successfully: ${uploadResult.Location}`);
        } catch (err) {
          console.error("Error uploading file to S3:", err);
        } finally {
          fs.unlinkSync(filename); // Delete the local file after upload
        }

        return `https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/${filename}`;
      });

      data3.medicineImage = await Promise.all(imageUploadPromises);
      medicines.push(data3);

      // Save to MongoDB (Consider batch saving if you have many items)
      const medicine = new Prescriptiondb({
        medicineName: data3.medicineName,
        medicineType: data3.medicineType,
        medicineCompany: data3.medicineCompany,
        medicinePrice: data3.medicinePrice,
        medicineQuantity: data3.medicineQuantity,
        medicineImage: data3.medicineImage,
        medicineLeaf: data3.medicineLeaf,
        medicineId: data3.medicineId,
        dateOfRegistration: data3.dateOfRegistration,
        // Add other fields as needed
      });

      try {
        await medicine.save();
        console.log("Data saved to MongoDB");
      } catch (err) {
        console.error("Error saving data to MongoDB:", err);
      }
    }

    console.log("Scraping completed. Total medicines:", medicines.length);
    res.status(200).json({ message: "Scraping completed", totalItems: medicines.length });
  } catch (error) {
    console.error("Error during scraping process:", error);
    res.status(500).json({ error: "An error occurred during scraping" });
  } finally {
    await browser.close();
    console.log("Browser closed");
  }
});













// write a api to delete images from root folder

router.get("/deleteimg", async (req, res) => {
  fs.readdirSync(__dirname).forEach((file) => {
    if (
      file.includes(
        ".png" || ".jpg" || ".jpeg" || ".gif" || ".svg" || ".webp" || ".avif"
      )
    ) {
      fs.unlinkSync(path.join(__dirname, file));
    }
  });
  res.send({
    message: "deleted",
  });
});

module.exports = router;
