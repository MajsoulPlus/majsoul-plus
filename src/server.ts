import * as fs from 'fs'
import * as https from 'https'
import { ServerOptions } from 'https'
import * as Koa from 'koa'
import * as path from 'path'
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
import { GlobalPath, appDataDir } from './global'

// tslint:disable-next-line
export const Server = new Koa()

// TODO: Load extensions here
Server.use(async (ctx, next) => {
  await next()
})

Server.use(async (ctx, next) => {
  const originalUrl = ctx.request.originalUrl
  const encrypt = isEncryptRes(originalUrl)
  const isRoutePath = isPath(originalUrl)
  const localURI = getLocalURI(
    originalUrl,
    isRoutePath,
    path.join(appDataDir, GlobalPath.LocalDir)
  )

  let allData: string | Buffer

  if (!isRoutePath && fs.existsSync(localURI)) {
    try {
      allData = await readFile(localURI)
    } catch (e) {
      console.error(e)
      return
    }
  } else {
    try {
      const { res: result, data } = await getRemoteSource(
        originalUrl,
        encrypt && !isRoutePath
      )
      ctx.res.statusCode = result.statusCode
      if (!isRoutePath) {
        writeFile(localURI, data)
      }
      allData = data
    } catch ({ res: result, data }) {
      ctx.res.statusCode = result.statusCode
      return
    }
  }

  let sendData = isRoutePath
    ? encodeData(allData).toString('utf-8')
    : encodeData(allData)
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
