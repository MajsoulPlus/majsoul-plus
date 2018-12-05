const express = require('express')
const server = express()
const Util = require('./Util.js')
const configs = require('./configs')

server.get('*', Util.processRequest)

server.listen(configs.PORT, () => {
  console.log(`服务器已开始监听 ${configs.PORT} 端口`)
})
