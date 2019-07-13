import * as AdmZip from 'adm-zip'
import * as childProcess from 'child_process'
import fetch, { Response } from 'electron-fetch'
import * as fs from 'fs'
import * as path from 'path'
import { Global, GlobalPath, appDataDir, RemoteDomains } from './global'
import { UserConfigs } from './config'

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
      fillObject(toFill[key], latest[key])
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
 * 读取远程的官方资源数据
 * @param originalUrl 原始请求的相对路径
 * @param encrypt 是否是加密数据
 * @param encoding 请求的数据格式，默认是binary
 */
export async function getRemoteSource(
  originalUrl: string,
  encrypt: boolean,
  encoding: BufferEncoding = 'binary'
): Promise<{
  res: Response
  statusCode?: number
  data: Buffer | string
}> {
  const remoteUrl = getRemoteUrl(originalUrl)
  const resp = await fetch(remoteUrl, {
    headers: {
      'User-Agent': Global.HttpGetUserAgent
    }
  })

  const statusCode = resp.status
  const fileData = await resp.buffer()
  if (statusCode < 200 || statusCode >= 400) {
    console.warn(
      `从远端服务器请求 ${remoteUrl} 失败, statusCode = ${statusCode}`
    )
    return {
      res: resp,
      data: (encrypt ? XOR(fileData) : fileData).toString(encoding)
    }
  } else if (statusCode === 302 || statusCode === 301) {
    return getRemoteSource(resp.headers['location'], encrypt, encoding)
  } else {
    return {
      res: resp,
      data: (encrypt ? XOR(fileData) : fileData).toString(encoding)
    }
  }
}

export function mkdirPromise(dirname: string) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dirname, err => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export function statPromise(dirname: string): Promise<fs.Stats> {
  return new Promise((resolve, reject) => {
    fs.stat(dirname, (err, stats) => {
      if (err) {
        reject(err)
      }
      resolve(stats)
    })
  })
}

/**
 * 递归创建目录，异步方法
 */
export async function mkdirs(dirname: string): Promise<void> {
  try {
    await statPromise(dirname)
  } catch (e) {
    await mkdirs(path.dirname(dirname))
    await mkdirPromise(dirname)
  }
}

/**
 * 递归创建目录，同步方法
 * @param dirname 文件夹路径
 */
export function mkdirsSync(dirname: string) {
  try {
    fs.statSync(dirname)
  } catch (error) {
    mkdirsSync(path.dirname(dirname))
    fs.mkdirSync(dirname)
  }
}

/**
 * 转换远程Url
 * @param originalUrl
 */
export function getRemoteUrl(originalUrl: string): string {
  return (
    RemoteDomains[UserConfigs.userData.serverToPlay].domain +
    originalUrl.replace(/^\/(0\/)?/g, '')
  )
}

/**
 * 从远程URI转成本地存储路径
 * @param originalUrl
 * @param isPath
 */
export function getLocalURI(originalUrl: string): string {
  const dirBase = path.join(appDataDir, GlobalPath.LocalDir)
  return path.join(
    dirBase,
    UserConfigs.userData.serverToPlay.toString(),
    /^([^?]+)(\?.*)?$/.exec(originalUrl)[1]
  )
}

/**
 * 写入本地文件
 */
export async function writeFile(
  to: string,
  data: Buffer | string,
  encoding = 'binary'
): Promise<void> {
  await mkdirs(path.dirname(to))
  return new Promise((resolve, reject) => {
    fs.writeFile(to, data, encoding, err => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

/**
 * 读取本地文件
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

export function encodeData(
  data: Buffer | string,
  encoding: BufferEncoding = 'binary'
) {
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

// https://stackoverflow.com/a/26038979
export function copyFileSync(source: string, target: string) {
  let targetFile = target

  //if target is a directory a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source))
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source))
}

export function copyFolderSync(source: string, target: string) {
  let files = []

  //check if folder needs to be created or integrated
  const targetFolder = path.join(target, path.basename(source))
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder)
  }

  //copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source)
    files.forEach(file => {
      const curSource = path.join(source, file)
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderSync(curSource, targetFolder)
      } else {
        copyFileSync(curSource, targetFolder)
      }
    })
  }
}
