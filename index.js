const express = require('express')
const app = express()
app.use(express.json())
const cors = require('cors')
const router = require('./router')

app.use(cors())
const server = app.listen(3003, '0.0.0.0', (err) => {
  if (err) throw err
  console.log('*** API server is now ready at port 3003 on localhost ***')
  //routing
  app.use(router)
})
process.on("SIGINT", () => {
  server.close(() => {
    console.log("Server closed gracefully");
    process.exit(0);
  });
});