const Tesseract = require('tesseract.js');
const { fromPath } = require("pdf2pic"); // convert pdf page to image
const path = require('path')

// const options = {
//   density: 200,
//   saveFilename: "page",
//   savePath: "",
//   format: "png",
//   width: 1200,
//   height: 1600
// };

// const convert = fromPath("exec_daily_2025-06-24.pdf", options);

// (async () => {
//   // convert first page to image
//   const page = await convert(1);

//   // OCR the image
//   const result = await Tesseract.recognize(page.path, "eng");
//   const contentArr = result.data.text.split('\n')
//   console.log(contentArr);
// })();


const express = require('express')
const app = express()
app.use(express.json())

app.listen(3003, '0.0.0.0', () => {
  console.log('*** API server is now ready at port 3003 on localhost ***')
  //routing
  app.get('/check-health', (req, res) => {
    res.sendStatus(200)
  })
  app.get('/update', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/dataCollector.html'))
  })
})