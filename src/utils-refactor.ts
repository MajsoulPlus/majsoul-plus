import * as AdmZip from 'adm-zip'
import * as childProcess from 'child_process'
import { WebContents } from 'electron'
import * as fs from 'fs'
import { IncomingMessage } from 'http'
import * as https from 'https'
import * as path from 'path'
import * as url from 'url'
import { Global, GlobalPath } from './global'
import { AudioPlayer } from './windows/audioPlayer'

/**
 * 以 latest 对象中的内容更新 toUpdate 对象
 * 若不存在则创建
 * @param toUpdate
 * @param latest
 */
export function updateObject(toUpdate: {}, latest: {}): {} {
  for (const key in toUpdate) {
    if (typeof toUpdate[key] === 'object' && typeof latest[key] === 'object') {
      updateObject(toUpdate[key], latest[key])
    } else if (latest[key] === undefined) {
      delete toUpdate[key]
    }
  }
  for (const key in latest) {
    if (toUpdate[key] === undefined && typeof latest[key] === 'object') {
      // 此处对对象作深拷贝
      toUpdate[key] = {}
      fillObject(toUpdate[key], latest[key])
    } else {
      toUpdate[key] = latest[key]
    }
  }
  return toUpdate
}

/**
 * 以 latest 对象的内容填充 toFill 对象中不存在的部分
 * 对存在的部分不作任何修改
 * @param toFill
 * @param latest
 */
export function fillObject(toFill: {}, latest: {}): {} {
  for (const key in latest) {
    if (typeof toFill[key] === 'object' && typeof latest[key] === 'object') {
      updateObject(toFill[key], latest[key])
    } else if (toFill[key] === undefined) {
      if (typeof latest[key] === 'object') {
        toFill[key] = {}
        updateObject(toFill[key], latest[key])
      } else {
        toFill[key] = latest[key]
      }
    }
  }
  return toFill
}

/**
 * 清理 toClean 对象中存在 但 sample 对象中不存在的键值
 * 对二者中都存在但类型不同的数据不予处理
 * @param toClean
 * @param sample
 */
export function cleanObject(toClean: {}, sample: {}): {} {
  for (const key in toClean) {
    if (sample[key] === undefined) {
      delete toClean[key]
    } else if (
      typeof sample[key] === 'object' &&
      typeof toClean[key] === 'object'
    ) {
      cleanObject(toClean[key], sample[key])
    }
  }
  return toClean
}

/**
 * 加密或者解密文件
 * @param buffer
 */
export function XOR(buffer: Buffer): Buffer {
  const array = []
  for (let index = 0; index < buffer.length; index++) {
    const byte = buffer.readUInt8(index)
    array.push(Global.XOR_KEY ^ byte)
  }
  return Buffer.from(array)
}

/**
 * 判断请求资源是否是加密资源
 * @param originalUrl 原始请求的相对路径
 */
export function isEncryptRes(originalUrl: string): boolean {
  return originalUrl.includes(Global.EXTEND_RES_KEYWORD)
}

/**
 * 判断请求是否为路由路径
 * @param originalUrl
 */
export function isPath(originalUrl: string): boolean {
  return (
    originalUrl.endsWith('\\') ||
    originalUrl.endsWith('/') ||
    originalUrl.includes('?')
  )
}

/**
 * 递归创建目录，异步方法
 * @author huqiji
 * @description http://huqiji.iteye.com/blog/2278036
 * @param dirname 文件夹路径
 */
export function mkdirs(dirname: string): Promise<void> {
  return new Promise(resolve => {
    fs.stat(dirname, err => {
      if (!err) {
        resolve()
      } else {
        resolve(
          this.mkdirs(path.dirname(dirname)).then(() => {
            return new Promise(res => fs.mkdir(dirname, res))
          })
        )
      }
    })
  })
}

/**
 * 递归创建目录，同步方法
 * @param dirname 文件夹路径
 */
export function mkdirsSync(dirname: string) {
  try {
    fs.statSync(dirname)
  } catch (error) {
    this.mkdirsSync(path.dirname(dirname))
    fs.mkdirSync(dirname)
  }
}

/**
 * 转换远程Url
 * @param originalUrl
 */
export function getRemoteUrl(originalUrl: string): string {
  return Global.RemoteDomain + originalUrl
}

/**
 * 读取远程的官方资源数据
 * @param originalUrl 原始请求的相对路径
 * @param encrypt 是否是加密数据
 * @param encoding 请求的数据格式，默认是binary
 */
export function getRemoteSource(
  originalUrl: string,
  encrypt: boolean,
  encoding: BufferEncoding = 'binary'
): Promise<{
  res: IncomingMessage
  statusCode?: number
  data: Buffer | string
}> {
  return new Promise((resolve, reject) => {
    const remoteUrl = this.getRemoteUrl(originalUrl)
    https.get(
      {
        ...url.parse(remoteUrl),
        headers: { 'User-Agent': Global.HttpGetUserAgent }
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
                const chunk: string | Buffer = chunks[i]
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
              data: (encrypt ? this.XOR(fileData) : fileData).toString(encoding)
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
              data: (encrypt ? this.XOR(fileData) : fileData).toString(encoding)
            })
          }
        })
      }
    )
  })
}

/**
 * 从远程URI转成本地存储路径
 * @param originalUrl
 * @param isPath
 * @param dirBase
 */
export function getLocalURI(
  originalUrl: string,
  isPath: boolean,
  dirBase = path.join(__dirname, GlobalPath.LocalDir)
): string {
  const indexOfProps = originalUrl.indexOf('?')
  originalUrl = originalUrl.substring(
    0,
    indexOfProps === -1 ? undefined : indexOfProps
  )
  const localURI = path.join(dirBase, originalUrl)
  return isPath ? localURI : localURI
  // `${localURI}localfile.dirindexfile` : localURI
}

/**
 * 写入本地文件
 * @param pathToWrite
 * @param data
 * @param encoding
 */
export function writeFile(
  pathToWrite: string,
  data: Buffer | string,
  encoding = 'binary'
): Promise<void> {
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
}

/**
 * 读取本地文件
 * @param filepath
 */
export function readFile(filepath: string): Promise<Buffer | string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

export function encodeData(data: Buffer | string, encoding = 'binary') {
  if (typeof data === 'string') {
    return Buffer.from(data as string, encoding)
  } else {
    return Buffer.from(data as Buffer)
  }
}

/**
 * 同步删除文件夹
 * @param dir 要删除的目录
 */
export function removeDirSync(dir: string) {
  let command = ''
  if (process.platform === 'win32') {
    command = `rmdir /s/q "${dir}"`
  } else {
    command = `rm -rf "${dir}"`
  }
  childProcess.execSync(command)
}

/**
 * 截取屏幕画面
 * @param webContents
 */
export function takeScreenshot(webContents: WebContents) {
  AudioPlayer.webContents.send(
    'audio-play',
    path.join(__dirname, 'bin/audio/screenshot.mp3')
  )
  webContents.send('take-screenshot')
}

/**
 * 选取一个路径和目标，生成一个压缩文件，返回生成的压缩文件路径
 * @param from 要被打包的文件夹
 * @param to 打包到的路径
 */
export function zipDir(from: string, to: string) {
  const zip = new AdmZip()
  zip.addLocalFolder(from, path.basename(from))
  zip.writeZip(to)
  return to
}

/**
 * 判断A标签是否比B标签较新
 * @param taga A标签，类似 v1.2.3
 * @param tagb B标签，类似 v1.2.3
 * @return 返回0，则版本相同，1为需要完整下载版本如引用新依赖，2为新小功能版本，3为小版本修复，4为开发版本更新
 */
export function compareVersion(taga: string, tagb: string): number {
  const tagaArr = taga.substring(1).split('-')
  const tagbArr = tagb.substring(1).split('-')
  let tagaDev = false
  let tagbDev = false
  if (tagaArr.length > 1) {
    tagaDev = true
  }
  if (tagbArr.length > 1) {
    tagbDev = true
  }
  const tagaMain = tagaArr[0].split('.')
  const tagbMain = tagbArr[0].split('.')

  let laterFlag: number | undefined = undefined
  for (let i = 0; i < 3; i++) {
    if (Number(tagaMain[i]) > Number(tagbMain[i])) {
      laterFlag = i + 1
      break
    } else if (Number(tagaMain[i]) < Number(tagbMain[i])) {
      laterFlag = 0
      break
    }
  }

  if (typeof laterFlag === 'number') {
    return laterFlag
  } else {
    if (tagbDev && !tagaDev) {
      return 1
    } else if (tagaDev && !tagbDev) {
      return 0
    } else if (tagaDev && tagbDev) {
      const tagaDevArr: Array<string | number> = tagaArr[1].split('.')
      const tagbDevArr: Array<string | number> = tagbArr[1].split('.')
      const devStrToNum = (devStr: string): number => {
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
      tagaDevArr[0] = devStrToNum(tagaDevArr[0] as string)
      tagbDevArr[0] = devStrToNum(tagbDevArr[0] as string)
      for (let i = 0; i < 2; i++) {
        if (Number(tagaDevArr[i]) > Number(tagbDevArr[i])) {
          laterFlag = 4
          break
        } else if (Number(tagaDevArr[i]) < Number(tagbDevArr[i])) {
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
