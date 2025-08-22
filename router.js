const express = require('express')
const router = express.Router()
const Tesseract = require('tesseract.js');
const { fromPath } = require("pdf2pic"); // convert pdf page to image
const path = require('path')
const multer = require('multer')

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
    const keyList = JSON.parse(req.body.keyList)
    console.log('Key list:', keyList)
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
            const result = await Tesseract.recognize(singlePage.path, "eng");
            const contentArr = result.data.text.split('\n')
            contentArr.forEach(singleline => {
                console.log('Line:', singleline)
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
                            prepareData[`${keyList[n]}`] = prepareValue.join(' ')
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

module.exports = router