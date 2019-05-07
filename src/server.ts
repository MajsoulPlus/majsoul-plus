import * as fs from 'fs'
import * as https from 'https'
import { ServerOptions } from 'https'
import * as Koa from 'koa'
import * as path from 'path'
import { MajsoulPlus } from './majsoul_plus'
import { loadMods, Mods } from './mod/mods'
import {
  getLocalURI,
  isEncryptRes,
  isPath,
  readFile,
  encodeData,
  XOR,
  getRemoteSource,
  writeFile
} from './utils-refactor'

// tslint:disable-next-line
export const Server = new Koa()

// TODO: Load mods here
Server.use(async (ctx, next) => {
  await next()
})

Server.use(async (ctx, next) => {
  const originalUrl = ctx.request.originalUrl
  const encrypt = isEncryptRes(originalUrl)
  const isRoutePath = isPath(originalUrl)
  const localURI = getLocalURI(originalUrl, isRoutePath)

  let allData: string | Buffer

  try {
    const { res: result, data } = await getRemoteSource(
      originalUrl,
      encrypt && !isPath
    )
    ctx.res.statusCode = result.statusCode
    if (!isPath) {
      writeFile(localURI, data)
    }
    allData = data
  } catch ({ res: result, data }) {
    ctx.res.statusCode = result.statusCode
    return
  }

  let sendData = isRoutePath
    ? encodeData(allData).toString('utf-8')
    : encodeData(allData)
  console.log(sendData)
  if (encrypt) {
    sendData = XOR(sendData as Buffer)
  }
  ctx.body = sendData
})

// tslint:disable-next-line
export const serverOptions: ServerOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificate/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificate/cert.crt'))
}

Object.freeze(serverOptions)

export const httpsServer = https.createServer(serverOptions, Server.callback())
