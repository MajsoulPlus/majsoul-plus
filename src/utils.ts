import * as AdmZip from 'adm-zip'
import * as childProcess from 'child_process'
import fetch from 'electron-fetch'
import * as fs from 'fs'
import * as path from 'path'
import { UserConfigs } from './config'
import { appDataDir, Global, GlobalPath, RemoteDomains, Logger } from './global'

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
      // 不对数组作填充处理
      if (!Array.isArray(toFill[key])) {
        fillObject(toFill[key], latest[key])
      }
    } else if (toFill[key] === undefined) {
      if (typeof latest[key] === 'object') {
        if (Array.isArray(latest[key])) {
          // FIXME: Array 的深拷贝
          toFill[key] = [...latest[key]]
        } else {
          toFill[key] = {}
          updateObject(toFill[key], latest[key])
        }
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

// 加密或者解密文件
export function XOR(buffer: Buffer): Buffer {
  const array = []
  for (let index = 0; index < buffer.length; index++) {
    const byte = buffer.readUInt8(index)
    array.push(Global.XOR_KEY ^ byte)
  }
  return Buffer.from(array)
}

// 判断请求资源是否是加密资源
export function isEncryptRes(originalUrl: string): boolean {
  return originalUrl.includes(Global.EXTEND_RES_KEYWORD)
}

// 判断请求是否为路由路径
export function isPath(originalUrl: string): boolean {
  return (
    originalUrl.endsWith('\\') ||
    originalUrl.endsWith('/') ||
    originalUrl.includes('?')
  )
}

/**
 * 读取远程的官方资源数据
 * @param url 原始请求的相对路径
 * @param encrypt 是否是加密数据
 */
export async function getRemoteSource(
  url: string,
  encrypt = false
): Promise<{ code: number; data: Buffer }> {
  const remoteUrl = getRemoteUrl(url)
  const resp = await fetch(remoteUrl, {
    headers: {
      'User-Agent': Global.HttpGetUserAgent
    }
  })

  const statusCode = resp.status
  const fileData = await resp.buffer()
  if (statusCode === 302 || statusCode === 301) {
    return getRemoteSource(resp.headers['location'], encrypt)
  } else {
    if (statusCode < 200 || statusCode >= 400) {
      Logger.warning(
        `从远端服务器请求 ${remoteUrl} 失败, statusCode = ${statusCode}`
      )
    }
    return {
      code: resp.status,
      data: encrypt ? XOR(fileData) : fileData
    }
  }
}

// fs.mkdir 的 Promise 形式
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

// fs.stst 的 Promise 形式
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

// 递归创建目录，异步方法
export async function mkdirs(dirname: string): Promise<void> {
  try {
    await statPromise(dirname)
  } catch (e) {
    await mkdirs(path.dirname(dirname))
    await mkdirPromise(dirname).catch(() => {})
  }
}

// 递归创建目录，同步方法
export function mkdirsSync(dirname: string) {
  try {
    fs.statSync(dirname)
  } catch (error) {
    mkdirsSync(path.dirname(dirname))
    fs.mkdirSync(dirname)
  }
}

// 将 path 转换为远程 URL
export function getRemoteUrl(originalUrl: string): string {
  return (
    RemoteDomains[UserConfigs.userData.serverToPlay].domain +
    originalUrl.replace(/^\/\d\/?/g, '')
  )
}

// 从远程 URI 转成本地存储路径
export function getLocalURI(originalUrl: string): string {
  const dirBase = path.join(appDataDir, GlobalPath.LocalDir)
  return path.join(
    dirBase,
    UserConfigs.userData.serverToPlay.toString(),
    /^([^?]+)(\?.*)?$/.exec(originalUrl)[1]
  )
}

// 获取资源，当本地存在时优先使用本地缓存
export async function getRemoteOrCachedFile(
  url: string,
  encode = true,
  callback: (data: Buffer) => Buffer = data => data
): Promise<{ code: number; data: Buffer | string }> {
  const originalUrl = url.replace(/^\/\d\//g, '')
  const isEncrypted = isEncryptRes(originalUrl)
  const isRoutePath = isPath(originalUrl)
  const localPath = getLocalURI(originalUrl)
  const ret: { code: number; data: Buffer } = {
    code: 0,
    data: undefined
  }

  let originData: Buffer

  if (!isRoutePath && fs.existsSync(localPath)) {
    try {
      originData = await readFile(localPath)
    } catch (e) {
      Logger.error(e)
    }
  }

  // 当上述 readFile 出现异常时或上述 if 条件不符合时向远端服务器请求
  if (originData === undefined) {
    try {
      const remoteSource = await getRemoteSource(
        originalUrl,
        isEncrypted && !isRoutePath
      )
      ret.code = remoteSource.code
      let data = remoteSource.data
      if (!isRoutePath && remoteSource.code.toString()[0] !== '4') {
        data = callback(remoteSource.data)
        writeFile(localPath, data)
      }
      originData = data
    } catch (e) {
      return { code: 403, data: e }
    }
  }
  let responseData: Buffer
  if (encode) {
    responseData = encodeData(originData)
    if (isEncrypted) {
      responseData = XOR(responseData as Buffer)
    }
  } else {
    responseData = originData
  }
  ret.data = responseData
  return ret
}

// 主进程获取资源
export async function fetchAnySite(url: string, encoding = 'binary') {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': Global.HttpGetUserAgent
    }
  })
  return (await resp.buffer()).toString(encoding)
}

// 写入本地文件
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

// 读取本地文件
export function readFile(filepath: string): Promise<Buffer> {
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

// 同步删除文件夹
export function removeDirSync(dir: string) {
  let command = ''
  if (process.platform === 'win32') {
    command = `rmdir /s/q "${dir}"`
  } else {
    command = `rm -rf "${dir}"`
  }
  childProcess.execSync(command)
}

export function getExportFileExtension(dir: string) {
  const extMap = new Map([
    ['resourcepack.json', 'mspr'],
    ['tool.json', 'mspt'],
    ['extension.json', 'mspe'],
    ['execute.json', 'mspe'],
    ['mod.json', 'mspm']
  ])

  let ret = ''
  extMap.forEach(
    (ext, filename) =>
      (ret = fs.existsSync(path.resolve(dir, filename)) ? ext : ret)
  )
  return ret
}

// 压缩目录至 to
export function zipDir(from: string, to: string) {
  const zip = new AdmZip()
  zip.addLocalFolder(from, path.basename(from))
  zip.writeZip(to)
  return to
}

// 解压压缩文件至 to
export function unzipDir(file: string, to: string) {
  const zip = new AdmZip(file)
  return new Promise((resolve, reject) => {
    zip.extractAllToAsync(to, true, err => {
      if (err) reject(err)
      else resolve(to)
    })
  })
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

  // check if folder needs to be created or integrated
  const targetFolder = path.join(target, path.basename(source))
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder)
  }

  // copy
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

export function getFoldersSync(folder: string): string[] {
  const folders = []
  fs.readdirSync(folder).forEach(file => {
    if (fs.statSync(path.join(folder, file)).isDirectory()) {
      folders.push(file)
    }
  })
  return folders
}
