const SSE    = require('express-sse') //Server-side events
const events = require('events')

const STREAM = new SSE()

const emitter = new events.EventEmitter()

exports.eventStream = (req, res) => {
  console.log('Nueva conexion SSE ...')
  STREAM.init(req, res)
}

exports.start = () => {

  
  emitter.on('new-user', data => {
    STREAM.send(JSON.stringify(data), 'new-user')
  })
  
  emitter.on('new-restaurant', data => {
    STREAM.send(JSON.stringify(data), 'new-restaurant')
  })
  
  emitter.on('new-employer', data => {
    STREAM.send(JSON.stringify(data), 'new-employer')
  })

  emitter.on('new-dish', data => {
    STREAM.send(JSON.stringify(data), 'new-dish')
  })

  emitter.on('error-user', data => {
    STREAM.send(JSON.stringify(data), 'error-user')
  })

    //AQUI SE PONDRIAN OTROS EVENTOS

}

exports.emitter = emitter
exports.STREAM  = STREAM
