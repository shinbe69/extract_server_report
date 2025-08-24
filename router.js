const express = require('express')
const router = express.Router()
const Tesseract = require('tesseract.js');
const { fromPath } = require("pdf2pic"); // convert pdf page to image
const path = require('path')
const multer = require('multer')
const sharp = require('sharp')

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'report-upload/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.get('/check-health', (req, res) => {
    res.sendStatus(200)
})

router.get('/update', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/dataCollector.html'))
})

router.post('/upload-report', upload.single('reportFile'), (req, res) => {
    const networkUsageKeyList = JSON.parse(req.body.networkUsageKeyList)
    const keyList = JSON.parse(req.body.keyList)
    const prepareData = {}
    const options = {
        density: 200,
        saveFilename: "page",
        savePath: "",
        format: "png",
        width: 1200,
        height: 1600
    };
    const convert = fromPath(req.file.path, options);
    convert.bulk(-1)
    .then(async (output) => {
        for await (const singlePage of output) {
            await sharp(singlePage.name)
            .resize({ width: 2000 }) 
            .grayscale()
            .threshold(150) // tweak threshold value
            .toFile('processed'.concat(singlePage.name));
            const result = await Tesseract.recognize('processed'.concat(singlePage.name), "eng", {
                tessedit_pageseg_mode: 3,
                tessedit_ocr_engine_mode: 1,
            });
            const contentArr = result.data.text.split('\n')
            contentArr.forEach((singleline, index) => {
                
                for (let n = 0; n < keyList.length; n++) {
                    if (prepareData[`${keyList[n]}`] === undefined) {
                        const singlelineArr = singleline.split(keyList[n])
                        if (singlelineArr.length === 1) break
                        else {
                            const rawValueArr = singlelineArr[singlelineArr.length - 1].split(' ')
                            const prepareValue = []
                            for(let m = 0; m < rawValueArr.length; m++) {
                                if (keyList.includes(rawValueArr[m])) break
                                else prepareValue.push(rawValueArr[m])
                            }
                            prepareData[`${keyList[n]}`] = prepareValue.join(' ').toString().trim()
                        }
                    }
                }
                //add networkUsage value
                for (let k = 0; k < networkUsageKeyList.length; k++) {
                    if (prepareData[`${networkUsageKeyList[k]}`] === undefined) {
                        if (singleline.toLowerCase().includes(networkUsageKeyList[k].toLowerCase())) {
                            for (j = index + 1; j < index + 5; j++) {
                                if (contentArr[j].trim() != '') {
                                    if (contentArr[j].toLowerCase().includes('total') && !networkUsageKeyList.some(item => contentArr[j].toLowerCase().includes(item.toLowerCase()))) {
                                        console.log(networkUsageKeyList[k], contentArr[j])
                                        prepareData[`${networkUsageKeyList[k]}`] = (prepareData[`${networkUsageKeyList[k]}`] ? prepareData[`${networkUsageKeyList[k]}`] : '') + ' ' + contentArr[j]
                                    }
                                }
                            }
                        }
                    }
                }
            })
        }
        console.log('Prepare data:', prepareData)
        res.json(prepareData)
    })
    .catch((err) => {
        console.error("Conversion error:", err);
        res.sendStatus(500)
    });
})

router.post('/save-info', async (req, res) => {
    console.log('data:', req.body)
})

module.exports = router