const puppeteer = require("puppeteer");
let fs = require('fs');
let path = require('path');
let S3 = require("aws-sdk/clients/s3")
const express = require("express");
const router = express.Router();
const uuid = require("uuid");
const Nonprescriptiondb = require("../../models/pharmacydb/nonprescriptiondb.js");

// write a api to scrap the data from the website 
router.post("/scrapdata", async (req, res) => {
    const { url,type } = req.body;
    const browser = await puppeteer.launch({ignoreDefaultArgs: ['--disable-extensions'],args: ['--no-sandbox']});
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto(`${url}/page/1`);
    const data = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('.drug-list-page .right-block .white-bg .all-product .row a'));
        let totalCount = document.querySelector('#total_count')?.innerText;
        return ({
            totalCount: totalCount,
            anchors: anchors.map(anchor => anchor.href).filter(url => url.includes('non-prescriptions') && !url.includes('/manufacturers/') && !url.includes("/covid-essentials/")),
        })
    });
    if(parseFloat(data.totalCount/20) > 0.5) {
        var totalPage = Math.ceil(parseFloat(data.totalCount/20));
    }
    else {
        var totalPage = Math.floor(parseFloat(data.totalCount/20));
    }
    let arr = [];
    for(let i = 2; i <= totalPage; i++) {
        await page.goto(`${url}/page/${i}`);
        const data2 = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('.drug-list-page .right-block .white-bg .all-product .row a'));
            return ({
                anchors: anchors.map(anchor => anchor.href).filter(url => url.includes('non-prescriptions') && !url.includes('/manufacturers/') && !url.includes("/covid-essentials/")),
            })
        });
        data.anchors = data.anchors.concat(data2.anchors);
        console.log("Current Page: ", i);
    }
    let name = [];
    for(let i = 0; i < data.anchors.length ; i++) {
        await page.goto(data.anchors[i]);
        const data3 = await page.evaluate(() => {
            let anchors = Array.from(document.querySelectorAll('.ga-vertical-gallery .slider-main div img')) === (undefined || null) ? '' : Array.from(document.querySelectorAll('.ga-vertical-gallery .slider-main div img'));
            return ({
                medicineName: document.querySelector('.product-top .product-detail h1')?.innerText,
                disease: document.querySelector("#maincontent > div.content-section > div.product-top > div.product-right-block > div.product-detail > a:nth-child(3) > span")?.innerText,
                rxRequired: document.querySelector('.req_Rx')?.innerText === "Rx required" ? true : false,
                medicineType: document.querySelector('.product-top .product-detail .drug-manu')?.innerText,
                medicinePrice: parseInt(document.querySelector('.product-top .essentials .price-box .final-price')?.innerText.replace('Best Price* ₹ ', '')),
                medicineCompany: document.querySelector('.product-top .essentials .drug-con .drug-manu')?.innerText.replace('* Mkt: ', ''),
                medicineDescription: document.querySelector('.drug-content .product_desc_info')?.innerText,
                medicineImage:  [...new Set(anchors.map(anchor => anchor.src))],
                medicineId: "MED" + Math.floor(Math.random().toString().substring(2, 10)),
                dateOfRegistration: new Date().toISOString(),
            })
        });
        for(let j = 0; j < data3.medicineImage.length; j++) {
            var imgurl = data3.medicineImage[j];
            var filename = path.basename(imgurl);
            await page.goto(imgurl);
            await page.screenshot({path: filename});
            let s3 = new S3({
                endpoint: "https://usc1.contabostorage.com/medstown",
                accessKeyId: "8fe5f069ca4c4b50bd74c7adf18fcf75",
                secretAccessKey: "90ea5d8271241f37b3e248ecee1843ff",
                s3BucketEndpoint: true,
                publicReadAccess: true,
            });
            let fileContent = fs.readFileSync(filename);
            let params = {
                Bucket: "medstown",
                Key: filename,
                Body: fileContent,
                ACL: "public-read",
                ContentDisposition: "inline",
                ContentType: "image/jpeg, image/png, image/jpg , image/gif , image/svg+xml , image/webp , image/avif",
            };
            s3.upload(params, function (err, data) {
                if (err) {
                    throw err;
                }
                console.log(`File uploaded successfully`);
            });
        }  
        for (let l = 0; l < data3.medicineImage.length; l++) {
            const image =  data3.medicineImage[l].substring(data3.medicineImage[l].lastIndexOf('/') + 1);
            data3.medicineImage[l] = "https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/"+image;
        }
        name.push(data3);
        const medicine = new Nonprescriptiondb({
            medicineName: data3.medicineName,
            medicineType: data3.medicineType,
            medicineCompany: data3.medicineCompany,
            medicinePrice: data3.medicinePrice,
            medicineQuantity: data3.medicineQuantity,
            medicineImage: data3.medicineImage,
            medicineLeaf: data3.medicineLeaf,
            medicineId: data3.medicineId,
            dateOfRegistration: data3.dateOfRegistration,
            medicineDescription: data3.medicineDescription,
            disease: data3.disease,
            rxRequired: data3.rxRequired,
            type: type,
        });
        await medicine.save();
        console.log("count: ", i , "/" , data.anchors.length);
    }
    await browser.close();
    console.log("done");
    res.send({
        message: "success",
    });
});
// write a api to delete images from root folder

router.get('/deleteimg', async (req, res) => {
    fs.readdirSync(__dirname).forEach((file) => {
        if (file.includes('.png' || '.jpg' || '.jpeg' || '.gif' || '.svg' || '.webp' || '.avif')) {
            fs.unlinkSync(path.join(__dirname, file));
        }
    });
    res.send({
        message: "deleted",
    });
});

module.exports = router;




