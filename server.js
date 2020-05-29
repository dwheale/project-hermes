// TODO: create logic to identify specific client and log client's usage and activity esp. for billing purposes

const express = require('express')
const cors = require('cors')
const path = require('path')
const bodyParser = require('body-parser')
const log4js = require('log4js')
const multer = require('multer')



// routers
const messengerRouter = require('./routes/messenger')

const currentDate = () => {
  let date = new Date(),
      month = date.getMonth() + 1 < 2 ? '0' + (date.getMonth() + 1) : '' + (date.getMonth() + 1),
      day = date.getDate() < 2 ? '0' + date.getDate() : '' + date.getDate(),
      year = '' + date.getFullYear()

  return [year, month, day].join('-')
}

log4js.configure({
  appenders: {
    log: { type: 'file', filename: './logs/debug - ' + currentDate() + '.log' },
    prodLog: {type: 'file', filename: './logs/prod - ' + currentDate() + '.log' },
    out: { type: 'stdout' }
  },
  categories: {
    default: { appenders: ['log', 'out'], level: 'debug' } ,
    production: { appenders: ['prodLog'], level: 'info' }
  }
})

const logger = log4js.getLogger('default')

if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const app = express()
app.use(cors())
const port = process.env.PORT || 5000

app.use(bodyParser.urlencoded({
  extended: true
}))

app.use(bodyParser.json())

// for parsing multipart/form-data
const upload = multer()
app.use(upload.array())
app.use(express.static('public'))


if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')))

  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'))
  })
}

app.use('/messenger', messengerRouter)

app.listen(port, error => {
  if (error) {
    logger.error(error)
    throw error
  }
  logger.info('Server running on port ' + port)
})
