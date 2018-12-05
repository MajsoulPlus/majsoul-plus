const express = require('express')
const path = require('path')
const fs = require('fs')
let http

const Util = {
  CONFIG: {
    PORT: 8000,
    XOR_KEY: 73,
    EXTEND_RES_KEYWORD: 'extendRes',
    REMOTE_DOMAIN: 'http://majsoul.union-game.com',
    LOCAL_DIR: '/static',
    MODS_DIR: '/mod'
  },
  /**
   * 加密或者解密文件
   * @param {Buffer} buffer
   * @returns {Buffer}
   */
  XOR(buffer) {
    let array = []
    for (let index = 0; index < buffer.length; index++) {
      const byte = buffer.readUInt8(index)
      array.push(this.CONFIG.XOR_KEY ^ byte)
    }
    return Buffer.from(array)
  },

  /**
   * 判断请求资源是否是加密资源
   * @param {string} originalUrl 原始请求的相对路径
   * @returns {boolean}
   */
  isEncryptRes(originalUrl) {
    return originalUrl.includes(this.CONFIG.EXTEND_RES_KEYWORD)
  },

  /**
   * 判断请求是否为路由路径
   * @param {string} originalUrl
   * @return {boolean}
   */
  isPath(originalUrl) {
    return originalUrl.endsWith('\\') || originalUrl.endsWith('/')
  },

  /**
   * 递归创建目录，异步方法
   * @author huqiji
   * @description http://huqiji.iteye.com/blog/2278036
   * @param {string} dirname 文件夹路径
   * @returns {Promise<void>}
   */
  mkdirs(dirname) {
    return new Promise(resolve => {
      fs.exists(dirname, exists => {
        if (exists) {
          resolve()
        } else {
          resolve(
            this.mkdirs(path.dirname(dirname)).then(() => {
              return new Promise(resolve => fs.mkdir(dirname, resolve))
            })
          )
        }
      })
    })
  },

  /**
   * 转换远程Url
   * @param {string} originalUrl
   * @returns {string}
   */
  getRemoteUrl(originalUrl) {
    return this.CONFIG.REMOTE_DOMAIN + originalUrl
  },

  /**
   * 读取远程的官方资源数据
   * @param {string} originalUrl 原始请求的相对路径
   * @param {boolean} encrypt  是否是加密数据
   * @param {string} encoding 请求的数据格式，默认是binary
   * @returns {Promise<Buffer | string>}
   */
  getRemoteSource(originalUrl, encrypt, encoding = 'binary') {
    return new Promise((resolve, reject) => {
      const remoteUrl = this.getRemoteUrl(originalUrl)
      console.log(`从远端服务器请求 ${remoteUrl}`)
      http.get(remoteUrl, httpRes => {
        const { statusCode } = httpRes
        if (200 > statusCode || 400 <= statusCode) {
          reject(
            `从远端服务器请求 ${remoteUrl} 失败, statusCode = ${statusCode}`
          )
        }
        httpRes.setEncoding(encoding)
        let fileData = ''
        httpRes.on('data', chunk => {
          fileData += chunk
        })
        httpRes.on('end', () => {
          console.log(`从远端服务器请求 ${remoteUrl} 成功`)
          resolve(
            encrypt ? this.XOR(this.encodeData(fileData, encoding)) : fileData
          )
        })
      })
    })
  },

  /**
   * 从远程URI转成本地存储路径
   * @param {string} originalUrl
   * @param {boolean} isPath
   * @return {string}
   */
  getLocalURI(originalUrl, isPath) {
    let localURI = path.join(__dirname, this.CONFIG.LOCAL_DIR, originalUrl)
    return isPath ? `${localURI}localfile.dirindexfile` : localURI
  },

  /**
   * 写入本地文件
   * @param {string} localURI
   * @param {Buffer | string} data
   * @param {string} encoding 默认是'binary'
   * @return {Promise<void>}
   */
  writeFile(localURI, data, encoding = 'binary') {
    return new Promise((resolve, reject) => {
      this.mkdirs(path.dirname(localURI)).then(() => {
        fs.writeFile(localURI, data, encoding, err => {
          if (err) reject(err)
          resolve()
        })
      })
    })
  },

  /**
   * 读取本地文件
   * @param {string} filepath
   * @return {Promise<Buffer | string>}
   */
  readFile(filepath, encrypt) {
    console.log('读取本地文件 ' + filepath)
    return new Promise((resolve, reject) => {
      fs.readFile(filepath, (err, data) => {
        if (err) {
          reject(`本地文件 ${filepath} 不存在`)
        } else {
          resolve(
            encrypt
              ? this.XOR(data)
              : data
          )
        }
      })
    })
  },

  /**
   * @param {Buffer | string} data
   * @param {string} encoding
   */
  encodeData(data, encoding = 'binary') {
    return Buffer.from(data, encoding)
  },

  /**
   * Promise流程确保确保返回本地或远程资源
   * @param {string} originalUrl 
   * @return {Promise<Buffer>}
   */
  getResponseData(originalUrl) {
    return new Promise(resolve => {
      const encrypt = this.isEncryptRes(originalUrl)
      const isPath = this.isPath(originalUrl)
      const localURI = this.getLocalURI(originalUrl, isPath)
      this.readFile(localURI, encrypt)
        .then(resolve)
        .catch(err => {
          console.log(err)
          return this.getRemoteSource(originalUrl, encrypt)
        })
        .then(data => {
          this.writeFile(localURI, data)
          return data
        })
        .then(data => {
          let sendData = isPath
            ? this.encodeData(data).toString('utf-8')
            : this.encodeData(data)
          if (encrypt) sendData = this.XOR(sendData)
          resolve(sendData)
        })
    })
  },

  /**
   * 获取文件的路由函数
   * @param {express.Request} req Request对象
   * @param {express.Response} res Response对象
   * @param {express.NextFunction} next NextFunction对象
   */
  processRequest(req, res, next) {
    const { originalUrl } = req
    this.getResponseData(originalUrl)
      .then(data => {
        res.send(data)
      })
  }
}

Object.keys(Util).forEach(key => {
  if (typeof Util[key] === 'function') {
    Util[key] = Util[key].bind(Util)
  }
})

http = Util.CONFIG.REMOTE_DOMAIN.startsWith('https')
  ? require('https')
  : require('http')

module.exports = Util
