import { Global } from '../global'
import fetch, { Response } from 'electron-fetch'
import { getRemoteUrl, XOR } from '../utils-refactor'

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
