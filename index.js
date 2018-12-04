const express = require('express')
const server = express()
const Util = require('./Util.js')

server.get('*', (...args) => Util.processRequest.apply(Util, args))

server.listen(Util.CONFIG.PORT, () => {
  console.log(`服务器已开始监听 ${Util.CONFIG.PORT} 端口`)
})
