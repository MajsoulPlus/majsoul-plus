/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* eslint-disable prefer-promise-reject-errors */

const path = require('path')
const fs = require('fs')
const electron = require('electron')

const configs = require('./configs')
const AdmZip = require('adm-zip')
const url = require('url')
/**
 * @type {typeof import("https")}
 */
const https = require('https')

// 用于存储Mod对象
let mods

/**
 * 播放器
 * @type {Electron.BrowserWindow}
 */
let audioPlayer

const Util = {
  /**
   * 加密或者解密文件
   * @param {Buffer} buffer
   * @returns {Buffer}
   */
  XOR (buffer) {
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
  isEncryptRes (originalUrl) {
    return originalUrl.includes(configs.EXTEND_RES_KEYWORD)
  },

  /**
   * 判断请求是否为路由路径
   * @param {string} originalUrl
   * @return {boolean}
   */
  isPath (originalUrl) {
    return (
      originalUrl.endsWith('\\') ||
      originalUrl.endsWith('/') ||
      originalUrl.includes('?')
    )
  },

  /**
   * 递归创建目录，异步方法
   * @author huqiji
   * @description http://huqiji.iteye.com/blog/2278036
   * @param {string} dirname 文件夹路径
   * @returns {Promise<void>}
   */
  mkdirs (dirname) {
    return new Promise(resolve => {
      fs.stat(dirname, err => {
        if (!err) {
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
   * 递归创建目录，同步方法
   * @param {string} dirname 文件夹路径
   * @returns {void}
   */
  mkdirsSync (dirname) {
    try {
      fs.statSync(dirname)
    } catch (error) {
      this.mkdirsSync(path.dirname(dirname))
      fs.mkdirSync(dirname)
    }
  },

  /**
   * 转换远程Url
   * @param {string} originalUrl
   * @returns {string}
   */
  getRemoteUrl (originalUrl) {
    return configs.REMOTE_DOMAIN + originalUrl
  },

  /**
   * 读取远程的官方资源数据
   * @param {string} originalUrl 原始请求的相对路径
   * @param {boolean} encrypt  是否是加密数据
   * @param {string} encoding 请求的数据格式，默认是binary
   * @returns {Promise<{statusCode: number,data:Buffer | string}>}
   */
  getRemoteSource (originalUrl, encrypt, encoding = 'binary') {
    return new Promise((resolve, reject) => {
      const remoteUrl = this.getRemoteUrl(originalUrl)
      https.get(
        {
          ...url.parse(remoteUrl),
          headers: { 'User-Agent': configs.HTTP_GET_USER_AGENT }
        },
        httpRes => {
          const { statusCode } = httpRes
          httpRes.setEncoding(encoding)
          const chunks = []
          let chunksSize = 0
          httpRes.on('data', chunk => {
            chunks.push(chunk)
            chunksSize += chunk.length
          })
          httpRes.on('end', () => {
            let fileData = null
            switch (chunks.length) {
              case 0:
                fileData = Buffer.alloc(0)
                break
              case 1:
                fileData = Buffer.from(chunks[0], encoding)
                break
              default:
                fileData = Buffer.alloc(chunksSize)
                for (let i = 0, position = 0, l = chunks.length; i < l; i++) {
                  /**
                   * @type {string | Buffer}
                   */
                  const chunk = chunks[i]
                  if (Buffer.isBuffer(chunk)) {
                    chunk.copy(fileData, position)
                  } else {
                    Buffer.from(chunk, encoding).copy(fileData, position)
                  }
                  position += chunk.length
                }
                break
            }
            if (statusCode < 200 || statusCode >= 400) {
              console.warn(
                `从远端服务器请求 ${remoteUrl} 失败, statusCode = ${statusCode}`
              )
              reject({
                res: httpRes,
                data: (encrypt ? this.XOR(fileData) : fileData).toString(
                  encoding
                )
              })
            } else {
              if (statusCode === 302 || statusCode === 301) {
                return resolve(
                  this.getRemoteSource(
                    httpRes.headers.location,
                    encrypt,
                    encoding
                  )
                )
              }
              resolve({
                res: httpRes,
                data: (encrypt ? this.XOR(fileData) : fileData).toString(
                  encoding
                )
              })
            }
          })
        }
      )
    })
  },

  /**
   * 使用https，从指定网址获取一个文件到一个指定路径
   * @param {string} URI 远程URI地址
   * @param {string} encoding 编码格式
   * @param {Function} dataCallback 当获取到数据时候的callback
   */
  httpsGetFile (URI, encoding = 'binary', dataCallback) {
    return new Promise((resolve, reject) => {
      https.get(
        {
          ...url.parse(URI),
          headers: { 'User-Agent': configs.HTTP_GET_USER_AGENT }
        },
        httpRes => {
          const { statusCode } = httpRes
          httpRes.setEncoding(encoding)
          const chunks = []
          let chunksSize = 0
          httpRes.on('data', chunk => {
            chunks.push(chunk)
            chunksSize += chunk.length
            if (dataCallback) {
              dataCallback(chunk)
            }
          })
          httpRes.on('end', () => {
            let fileData = null
            switch (chunks.length) {
              case 0:
                fileData = Buffer.alloc(0)
                break
              case 1:
                fileData = chunks[0]
                break
              default:
                fileData = Buffer.alloc(chunksSize)
                for (let i = 0, position = 0, l = chunks.length; i < l; i++) {
                  /**
                   * @type {string | Buffer}
                   */
                  const chunk = chunks[i]
                  if (Buffer.isBuffer(chunk)) {
                    chunk.copy(fileData, position)
                  } else {
                    Buffer.from(chunk, encoding).copy(fileData, position)
                  }
                  position += chunk.length
                }
                break
            }
            if (statusCode < 200 || statusCode >= 400) {
              console.warn(
                `尝试下载资源 ${URI} 失败, statusCode = ${statusCode}`
              )
              reject({
                res: httpRes,
                data: fileData
              })
            } else {
              if (statusCode === 302 || statusCode === 301) {
                console.warn(`访问 ${URI} 被重定向, statusCode = ${statusCode}`)
                return resolve(
                  this.httpsGetFile(
                    httpRes.headers.location,
                    encoding,
                    dataCallback
                  )
                )
              }
              resolve({
                res: httpRes,
                data: fileData
              })
            }
          })
        }
      )
    })
  },

  /**
   * 从远程URI转成本地存储路径
   * @param {string} originalUrl
   * @param {boolean} isPath
   * @return {string}
   */
  getLocalURI (
    originalUrl,
    isPath,
    dirBase = path.join(__dirname, configs.LOCAL_DIR)
  ) {
    const indexOfProps = originalUrl.indexOf('?')
    originalUrl = originalUrl.substring(
      0,
      indexOfProps === -1 ? undefined : indexOfProps
    )
    let localURI = path.join(dirBase, originalUrl)
    return isPath ? localURI : localURI //  `${localURI}localfile.dirindexfile` : localURI
  },

  /**
   * 写入本地文件
   * @param {string} pathToWrite
   * @param {Buffer | string} data
   * @param {string} encoding 默认是'binary'
   * @return {Promise<void>}
   */
  writeFile (pathToWrite, data, encoding = 'binary') {
    return new Promise((resolve, reject) => {
      this.mkdirs(path.dirname(pathToWrite)).then(() => {
        fs.writeFile(pathToWrite, data, encoding, err => {
          if (err) {
            reject(err)
          }
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
  readFile (filepath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filepath, (err, data) => {
        if (err) {
          reject(err)
        }
        resolve(data)
      })
    })
  },

  /**
   * @param {Buffer | string} data
   * @param {string} encoding
   */
  encodeData (data, encoding = 'binary') {
    return Buffer.from(data, encoding)
  },

  /**
   * 获取文件的路由函数
   * @param {express.Request} req Request对象
   * @param {express.Response} res Response对象
   * @param {express.NextFunction} next NextFunction对象
   */
  processRequest (req, res) {
    if (!mods) {
      this.loadMods()
    }

    const originalUrl = req.originalUrl
    const encrypt = this.isEncryptRes(originalUrl)
    const isPath = this.isPath(originalUrl)
    const localURI = this.getLocalURI(originalUrl, isPath)

    let promise = Promise.reject()
    mods.forEach(mod => {
      promise = promise.then(
        data => data,
        () => {
          const modDir = mod.dir
          let promiseMod = Promise.reject()
          // const readModFile = path => {
          //   return this.readFile(localURI)
          // }
          if (mod.replace && mod.replace.length > 0) {
            mod.replace.forEach(replaceInfo => {
              const regExp = new RegExp(replaceInfo.from)
              if (!regExp.test(originalUrl)) {
                return
              }
              const localURI = this.getLocalURI(
                originalUrl.replace(regExp, replaceInfo.to),
                isPath,
                path.join(mod.filesDir, modDir || '/files')
              )
              promiseMod = promiseMod.then(
                data => data,
                () => this.readFile(localURI)
              )
            })
          }
          const localURI = this.getLocalURI(
            originalUrl,
            isPath,
            path.join(mod.filesDir, modDir || '/files')
          )
          promiseMod = promiseMod.then(
            data => data,
            () => this.readFile(localURI)
          )
          return promiseMod
        }
      )
    })
    promise
      .then(data => data, () => this.readFile(localURI))
      .then(
        data => data,
        () => {
          return this.getRemoteSource(originalUrl, encrypt && !isPath).then(
            ({ data, res: result }) => {
              res.statusCode = result.statusCode
              if (!isPath) {
                this.writeFile(localURI, data)
              }
              return data
            },
            ({ data, res: result }) => {
              res.statusCode = result.statusCode
              return Promise.reject(data)
            }
          )
        }
      )
      .then(
        data => {
          let sendData = isPath
            ? this.encodeData(data).toString('utf-8')
            : this.encodeData(data)
          if (encrypt) {
            sendData = this.XOR(sendData)
          }
          res.setHeader('Content-Length', sendData.length)
          res.end(sendData)
        },
        data => {
          let sendData = this.encodeData(data).toString('utf-8')
          res.setHeader('Content-Length', sendData.length)
          res.end(sendData)
        }
      )
      .catch(err => console.error(err))
  },

  /**
   * 加载Mod
   */
  loadMods () {
    // Mod文件根目录
    // const modRootDir = path.join(__dirname, configs.MODS_DIR)
    // 所有已在目录中的Mod目录
    // const modDirs = fs.readdirSync(modRootDir)
    try {
      const data = fs.readFileSync(configs.MODS_CONFIG_PATH)
      mods = JSON.parse(data.toString('utf-8'))
    } catch (error) {
      console.error(error)
      mods = []
    }
  },

  /**
   * 同步删除文件夹
   * @param {string} dir 要删除的目录
   * @author romin
   * @description 同步删除文件夹，https://juejin.im/post/5ab32b20518825557f00d36c
   */
  removeDirSync (dir) {
    let files = fs.readdirSync(dir)
    for (var i = 0; i < files.length; i++) {
      let newPath = path.join(dir, files[i])
      let stat = fs.statSync(newPath)
      if (stat.isDirectory()) {
        // 如果是文件夹就递归下去
        this.removeDirSync(newPath)
      } else {
        // 删除文件
        fs.unlinkSync(newPath)
      }
    }
    fs.rmdirSync(dir) // 如果文件夹是空的，就将自己删除掉
  },
  /**
   * 截取屏幕画面
   * @param {Electron.WebContents} webContents
   */
  takeScreenshot (webContents) {
    audioPlayer.webContents.send(
      'audio-play',
      path.join(__dirname, 'bin/audio/screenshot.mp3')
    )
    webContents.send('take-screenshot')
  },
  /**
   * 初始化音频播放器
   */
  initPlayer () {
    audioPlayer = new electron.BrowserWindow({
      show: false
    })
    audioPlayer.loadURL(
      'file://' + path.join(__dirname, 'bin/audio/player.html')
    )
  },
  /**
   * 退出播放器窗口
   */
  shutoffPlayer () {
    audioPlayer.close()
  },
  /**
   * 选取一个路径和目标，生成一个压缩文件，返回生成的压缩文件路径
   * @param {string} from 要被打包的文件夹
   * @param {string} to 打包到的路径
   */
  zipDir (from, to) {
    const zip = new AdmZip()
    zip.addLocalFolder(from, path.basename(from))
    zip.writeZip(to, true)
    return to
  },
  /**
   * 判断A标签是否比B标签较新
   * @param {string} taga A标签，类似 v1.2.3
   * @param {string} tagb B标签，类似 v1.2.3
   * @return {number} 返回0，则版本相同，1为需要完整下载版本如引用新依赖，2为新小功能版本，3为小版本修复，4为开发版本更新
   */
  compareVersion (taga, tagb) {
    let tagaArr = taga.substring(1).split('-')
    let tagbArr = tagb.substring(1).split('-')
    let tagaDev = false
    let tagbDev = false
    if (tagaArr.length > 1) {
      tagaDev = true
    }
    if (tagbArr.length > 1) {
      tagbDev = true
    }
    let tagaMain = tagaArr[0].split('.')
    let tagbMain = tagbArr[0].split('.')

    let laterFlag
    for (let i = 0; i < 3; i++) {
      if (parseInt(tagaMain[i], 10) > parseInt(tagbMain[i], 10)) {
        laterFlag = i + 1
        break
      } else if (parseInt(tagaMain[i], 10) < parseInt(tagbMain[i], 10)) {
        laterFlag = 0
        break
      }
    }

    if (typeof laterFlag === 'number') {
      return laterFlag
    }
    if (laterFlag === undefined) {
      if (tagbDev && !tagaDev) {
        return true
      } else if (tagaDev && !tagbDev) {
        return false
      } else if (tagaDev && tagbDev) {
        const tagaDevArr = tagaArr[1].split('.')
        const tagbDevArr = tagbArr[1].split('.')
        const devStrToNum = devStr => {
          switch (devStr) {
            case 'alpha':
              return 1
            case 'beta':
              return 2
            case 'rc':
              return 3
            default:
              return 0
          }
        }
        tagaDevArr[0] = devStrToNum(tagaDevArr[0])
        tagbDevArr[0] = devStrToNum(tagbDevArr[0])
        for (let i = 0; i < 2; i++) {
          if (parseInt(tagaDevArr[i], 10) > parseInt(tagbDevArr[i], 10)) {
            laterFlag = 4
            break
          } else if (
            parseInt(tagaDevArr[i], 10) < parseInt(tagbDevArr[i], 10)
          ) {
            laterFlag = 0
            break
          }
        }
        if (laterFlag === undefined) {
          return 0
        }
        return laterFlag
      } else {
        return 0
      }
    }
  }
}

Object.keys(Util).forEach(key => {
  if (typeof Util[key] === 'function') {
    Util[key] = Util[key].bind(Util)
  }
})

module.exports = Util
