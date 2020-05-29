const express = require('express')
const router = express.Router()
const cors = require('cors')


const multer = require('multer')
const { RestClient } = require('@signalwire/node')
const bodyParser = require('body-parser')

const log4js = require('log4js')

function formatPhoneNumber(phoneNumberString) {
  let cleaned = ('' + phoneNumberString).replace(/\D/g, '')
  let match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    let intlCode = '+1'
    return [intlCode, match[2], match[3], match[4]].join('')
  }
  return null
}

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

const signalwireSpace = process.env.SIGNALWIRE_SPACE_URL
const signalwireToken = process.env.SIGNALWIRE_API_TOKEN
const signalwireProjectId = process.env.SIGNALWIRE_PROJECT_ID
const phoneNumber = process.env.SIGNALWIRE_PHONE_NUMBER
const signalwireClient = new RestClient(signalwireProjectId, signalwireToken, { signalwireSpaceUrl: signalwireSpace })

router.post('/test', function (req, res) {
  logger.debug('POST request at \'/test\' received: \n', req.body)
  res.status(201).send({ body: 'Success!!' })
})

//receives the message to be sent and returns the message sid
router.post('/send', function (req, res) {
  logger.debug('POST request at \'/send\' received: \n', req.body)
  const to = formatPhoneNumber(req.body.to)
  const messageBody = req.body.body

  signalwireClient.messages
      .create({
        from: phoneNumber,
        to: to,
        body: messageBody,
      })
      .then(message => {
        // logger.debug(message)
        res.status(201).send(message)
      })
      .catch(error => {
        res.status(error.status || '500').send(error.message || 'Internal Server Error')
      })
      .done()
})

router.get('/retrieve/:sid', function (req, res) {
  logger.debug('GET request at \'/retrieve\' received: \n', req.body)
  signalwireClient.messages(req.params.sid)
      .fetch()
      .then(message => {
        res.status(201).send({ message })
      })
      .catch(error => {
        res.status(error.status).send(error.message)
      })
      .done()
})

// retrieves all messages. Additional query params available include
// to - Read messages sent to only this phone number.
// limit - limit the number of results received
/* dateSent - he date of the messages to show. Specify a date as YYYY-MM-DD in GMT
   to read only messages sent on this date. For example: 2009-07-06. You can also
   specify an inequality, such as DateSent<=YYYY-MM-DD, to read messages sent on or before
   midnight on a date, and DateSent>=YYYY-MM-DD to read messages sent on or after midnight
   on a date.
   additionally you can use dateSentBefore and dateSentAfter to specify a range of time
 */
router.get('/retrieve-many', function(req, res) {
  logger.debug('GET request at \'/retrieve-many\' received')
  const limit = !!req.query.limit ? +req.query.limit : 20
  const dateSent = req.query.dateSent
  const dateSentBefore = req.query.dateSentBefore
  const dateSentAfter = req.query.dateSentAfter
  signalwireClient.messages.list({
    limit: limit,
    dateSent: dateSent,
    dateSentBefore: dateSentBefore,
    dateSentAfter: dateSentAfter
  }).then(messages => {
    res.status(200).send(messages)
  }).catch(error=> {
    res.status(error.status).send(error.message)
  })
})

// Endpoint to receive messages in this system. The messages LaML webhook on signalwire points here
router.post('/receive/', function (req, res) {
  logger.info('POST request at \'/receive\' received: \n', req.body)
  res.status(200)
})

module.exports = router