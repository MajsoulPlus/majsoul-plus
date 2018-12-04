const express = require('express')
const path = require('path')
const fs = require('fs')

const configs = require('./configs')
let http

const modRootDir = path.join(__dirname, configs.MODS_DIR)
const modDirs = fs.readdirSync(modRootDir)
const mods = []
modDirs.forEach(dir => {
  const modDir = path.join(modRootDir, dir)
  fs.stat(modDir, (err, stats) => {
    if (err) {
      console.error(err)
    } else if (stats.isDirectory()) {
      fs.readFile(path.join(modDir, 'mod.json'), (err, data) => {
        if (!err) {
          const modInfo = JSON.parse(data)
          modInfo.filesDir = path.join(modDir, '/files')
          mods.push(modInfo)
          console.log('Mod加载 ' + modInfo.name)
        }
      })
    }
  })
})

const Util = {
  /**
   * 加密或者解密文件
   * @param {Buffer} buffer
   * @returns {Buffer}
   */
  XOR(buffer) {
    let array = []
    for (let index = 0; index < buffer.length; index++) {
      const byte = buffer.readUInt8(index)
      array.push(configs.XOR_KEY ^ byte)
    }
    return Buffer.from(array)
  },

  /**
   * 判断请求资源是否是加密资源
   * @param {string} originalUrl 原始请求的相对路径
   * @returns {boolean}
   */
  isEncryptRes(originalUrl) {
    return originalUrl.includes(configs.EXTEND_RES_KEYWORD)
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
    return configs.REMOTE_DOMAIN + originalUrl
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
          resolve(
            encrypt ? this.XOR(Buffer.from(fileData, 'binary')) : fileData
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
  getLocalURI(
    originalUrl,
    isPath,
    dirBase = path.join(__dirname, configs.LOCAL_DIR)
  ) {
    let localURI = path.join(dirBase, originalUrl)
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
   * @return {Promise<{err:Error, data:Buffer | string}>}
   */
  readFile(filepath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filepath, (err, data) => {
        resolve({ err, data })
      })
    })
  },

  /**
   * @param {Buffer | string} data
   * @param {string} encoding
   */
  getSendData(data, encoding = 'binary') {
    return Buffer.from(data, encoding)
  },

  /**
   * 获取文件的路由函数
   * @param {express.Request} req Request对象
   * @param {express.Response} res Response对象
   * @param {express.NextFunction} next NextFunction对象
   */
  processRequest(req, res, next) {
    const originalUrl = req.originalUrl
    const encrypt = this.isEncryptRes(originalUrl)
    const isPath = this.isPath(originalUrl)
    const localURI = this.getLocalURI(originalUrl, isPath)

    let promise = Promise.resolve()
    mods.forEach(mod => {
      promise = promise.then(({ err = true, data = null } = {}) => {
        if (err) {
          return this.readFile(
            this.getLocalURI(originalUrl, isPath, mod.filesDir)
          )
        }
        if (data) {
          return { err: false, data: data }
        }
        return { err: false, data: data }
      })
    })
    promise
      .then(({ err = true, data = null } = {}) => {
        if (err) {
          return this.readFile(localURI)
        }
        if (data) {
          return { err: false, data: data }
        }
        return { err: false, data: data }
      })
      .then(({ err = true, data = null } = {}) => {
        if (err) {
          return this.getRemoteSource(originalUrl, encrypt).then(data => {
            if (!isPath) {
              this.writeFile(localURI, data)
            }
            return data
          })
        }
        return data
      })
      .then(data => {
        let sendData = isPath
          ? this.getSendData(data).toString('utf-8')
          : this.getSendData(data)
        if (encrypt) {
          sendData = this.XOR(sendData)
        }
        res.send(sendData)
        res.sendFile
      })
      .catch(console.error)
  }
}

Object.keys(Util).forEach(key => {
  if (typeof Util[key] === 'function') {
    Util[key] = Util[key].bind(Util)
  }
})

http = configs.REMOTE_DOMAIN.startsWith('https')
  ? require('https')
  : require('http')

module.exports = Util
