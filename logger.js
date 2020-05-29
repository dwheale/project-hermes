const log4js = require('log4js')

log4js.configure({
  appenders: {
    log: { type: 'file', filename: 'console.log' },
    out: { type: 'stdout' }
  },
  categories: { default: { appenders: ['log', 'out'], level: 'debug' } }
})

const logger = log4js.getLogger('default')

module.exports = logger