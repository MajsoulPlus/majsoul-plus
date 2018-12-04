const express = require('express')
const server = express()
const Util = require('./Util.js')

server.get('*', Util.processRequest)

server.listen(Util.Config.PORT, () => {
  console.log(`服务器已开始监听 ${Util.Config.PORT} 端口`)
})