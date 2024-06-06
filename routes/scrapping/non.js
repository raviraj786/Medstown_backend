var http = require('http'); 
var fs = require('fs');
var path = require('path');
let S3 = require("aws-sdk/clients/s3")
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://rishabh:Evlvrjg1@cluster0.owgjy.mongodb.net/medicodb?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const medicineSchema = new mongoose.Schema({
    medicineName: {type: String, default: null},
    medicineType: {type: String, default: null},
    medicineCompany: {type: String, default: null},
    medicinePrice: {type: String, default: null},
    medicineQuantity: {type: String, default: null},
    medicineImage: {type: Array, default: []},
    medicineLeaf: {type: String, default: null},
    medicineId: {type: String, default: null},
    dateOfRegistration: {type: String, default: null},
    dateOfUpdate: {type: String, default: null},
    medicineDescription: {type: String, default: null},
    rxRequired: {type: Boolean, default: false},
    disease: {type: String, default: null},
});
(async () => {
    const browser = await puppeteer.launch();
    console.log("browser launched");
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.netmeds.com/non-prescriptions/covid-essentials/page/1');
    const data = await page.evaluate(() => {
        // extract the <a></a> tags from prescriptions_products div
        const anchors = Array.from(document.querySelectorAll('.drug-list-page .right-block .white-bg .all-product .row a'));
        let totalCount = document.querySelector('#total_count')?.innerText;
        // extract the href attribute from the <a></a> tags
        return ({
            totalCount: totalCount,
            anchors: anchors.map(anchor => anchor.href).filter(url => url.includes('non-prescriptions') && !url.includes('/manufacturers/') && !url.includes("/covid-essentials/")),
        })

    });
    if(parseFloat(data.totalCount/20) > 0.5) {
        var totalPage = Math.ceil(parseFloat(data.totalCount/20));
    } else {
        var totalPage = Math.floor(parseFloat(data.totalCount/20));
    }
    // console.log(totalPage);
    let arr = [];
    for(let i = 2; i <= totalPage; i++) {
        await page.goto(`https://www.netmeds.com/non-prescriptions/covid-essentials/page/${i}`);
        const data2 = await page.evaluate(() => {
            // extract the <a></a> tags from prescriptions_products div
            const anchors = Array.from(document.querySelectorAll('.drug-list-page .right-block .white-bg .all-product .row a'));
            // extract the href attribute from the <a></a> tags
            return ({
                anchors: anchors.map(anchor => anchor.href).filter(url => url.includes('non-prescriptions') && !url.includes('/manufacturers/') && !url.includes("/covid-essentials/")),
            })
        });
        data.anchors = data.anchors.concat(data2.anchors);
        arr.push(data2.anchors);
    }
    console.log("reached",data.anchors.length);
    console.log("started");
    let name = [];
    for(let i = 0; i < data.anchors.length; i++) {
        await page.goto(data.anchors[i]);
        const data3 = await page.evaluate(() => {
            let anchors = Array.from(document.querySelectorAll('.ga-vertical-gallery .slider-main div img')) === (undefined || null) ? '' : Array.from(document.querySelectorAll('.ga-vertical-gallery .slider-main div img'));
            return ({
                medicineName: document.querySelector('.drug-name')?.innerText,
                medicineType: document.querySelector('.drug-type')?.innerText,
                medicineCompany: document.querySelector('.drug-company')?.innerText,
                medicinePrice: document.querySelector('.drug-price')?.innerText,
                medicineQuantity: document.querySelector('.drug-quantity')?.innerText,
                medicineImage: anchors.map(anchor => anchor.src),
                medicineLeaf: document.querySelector('.drug-leaf')?.innerText,
                medicineId: document.querySelector('.drug-id')?.innerText,
                dateOfRegistration: document.querySelector('.drug-registration')?.innerText,
                dateOfUpdate: document.querySelector('.drug-update')?.innerText,
                medicineDescription: document.querySelector('.drug-description')?.innerText,
                rxRequired: document.querySelector('.drug-rx')?.innerText === 'Rx Required' ? true : false,
                disease: document.querySelector('.drug-disease')?.innerText,
            })
        });
        for(let j = 0; j < data3.medicineImage.length; j++) {
            var url = data3.medicineImage[j];
            var filename = path.basename(url);
            await page.goto(url);
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
        const Medicine = mongoose.model("Medicinedb", medicineSchema);
        const medicine = new Medicine({
            medicineName: data3.medicineName,
            medicineType: data3.medicineType,
            medicineCompany: data3.medicineCompany,
            medicinePrice: data3.medicinePrice,
            medicineQuantity: data3.medicineQuantity,
            medicineImage: data3.medicineImage,
            medicineLeaf: data3.medicineLeaf,
            medicineId: data3.medicineId,
            dateOfRegistration: data3.dateOfRegistration,
        });
        await medicine.save();
        console.log("data saved");
    }
    console.log(name.length);
    console.log("Please Close the server");
    await page.close();
    await browser.close();
})();


