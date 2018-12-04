const express = require('express')
const server = express()
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')

const utils = require('./utils')

const PORT_NUMBER = 8000

/**
 * 递归创建目录，异步方法
 * @author huqiji
 * @description http://huqiji.iteye.com/blog/2278036
 * @param {string} dirname 文件夹路径
 * @param {function} callback 回调函数
 */
const mkdirs = (dirname, callback) => {
  fs.exists(dirname, function(exists) {
    if (exists) {
      callback()
    } else {
      //console.log(path.dirname(dirname));
      mkdirs(path.dirname(dirname), function() {
        fs.mkdir(dirname, callback)
      })
    }
  })
}

/**
 * 获取文件的路由函数
 * @param {express.Request} req Request对象
 * @param {express.Response} res Response对象
 * @param {express.NextFunction} next NextFunction对象
 */
const getFile = async (req, res, next) => {
  let localURI = path.join(__dirname, '/static', req.originalUrl)
  console.log(`请求文件 ${req.originalUrl}`)
  console.log(`本地目录 ${localURI}`)
  if (req.originalUrl.indexOf('extendRes') > -1) {
    fs.readFile(localURI, (err, data) => {
      if (err) {
        console.log(
          `从服务器请求 http://majsoul.union-game.com${req.originalUrl}`
        )
        /**
         * @type {typeof import("http")|typeof import("https")}
         */
        http.get(
          `http://majsoul.union-game.com${req.originalUrl}`,
          httpRespone => {
            httpRespone.setEncoding('binary')
            let fileData = ''
            httpRespone.on('data', chunk => {
              fileData += chunk
            })
            httpRespone.on('end', () => {
              if (localURI[localURI.length - 1] === '\\') {
                localURI += 'localfile.dirindexfile'
              }
              mkdirs(path.dirname(localURI), () =>
                fs.writeFile(
                  localURI,
                  utils.xorImage(Buffer.from(fileData, 'binary')),
                  'binary',
                  err => {
                    if (err) {
                      console.error(err)
                    }
                    console.log(`从游戏服务器获取到加密文件 ${req.originalUrl}`)
                  }
                )
              )
              res.send(Buffer.from(fileData, 'binary'))
            })
          }
        )
      } else {
        res.send(utils.xorImage(data))
      }
    })
  } else {
    fs.exists(localURI, exists => {
      if (exists && localURI[localURI.length - 1] !== '\\') {
        res.sendFile(localURI)
      } else {
        console.log(
          `从服务器请求 http://majsoul.union-game.com${req.originalUrl}`
        )
        http.get(
          `http://majsoul.union-game.com${req.originalUrl}`,
          httpRespone => {
            httpRespone.setEncoding('binary')
            let fileData = ''
            httpRespone.on('data', chunk => {
              fileData += chunk
            })
            httpRespone.on('end', () => {
              if (localURI[localURI.length - 1] === '\\') {
                localURI += 'localfile.dirindexfile'
              }
              mkdirs(path.dirname(localURI), () =>
                fs.writeFile(localURI, fileData, 'binary', err => {
                  if (err) {
                    console.error(err)
                  }
                  console.log(`从游戏服务器获取到文件 ${req.originalUrl}`)
                  console.log(localURI)
                  if (path.basename(localURI) === 'localfile.dirindexfile') {
                    res.send(Buffer.from(fileData, 'binary').toString('utf-8'))
                  } else {
                    res.send(Buffer.from(fileData, 'binary'))
                  }
                })
              )
            })
          }
        )
      }
    })
  }
}
server.get('*', getFile)

server.listen(PORT_NUMBER, () => {
  console.log(`服务器已开始监听 ${PORT_NUMBER} 端口`)
})
