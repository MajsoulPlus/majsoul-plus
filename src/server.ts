import * as fs from 'fs'
import * as http from 'http'
import * as https from 'https'
import { ServerOptions } from 'https'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import { appDataDir, GlobalPath } from './global'
import resourcePackManager from './resourcepack/manager'
import {
  encodeData,
  getLocalURI,
  getRemoteSource,
  isEncryptRes,
  isPath,
  readFile,
  writeFile,
  XOR
} from './utils'

const router = new Router()

// tslint:disable-next-line
export const Server = new Koa()

export function LoadServer() {
  // Resource Packs
  resourcePackManager.register(Server, router)

  // TODO: Load extensions here
  Server.use(async (ctx, next) => {
    await next()
  })

  // Routers
  Server.use(router.routes())

  Server.use(async ctx => {
    const originalUrl = ctx.request.originalUrl.replace(/^\/0\//g, '')
    const isEncrypted = isEncryptRes(originalUrl)
    const isRoutePath = isPath(originalUrl)
    const localPath = getLocalURI(originalUrl)

    let originData: string | Buffer

    if (!isRoutePath && fs.existsSync(localPath)) {
      try {
        originData = await readFile(localPath)
      } catch (e) {
        console.error(e)
      }
    }

    // 当上述 readFile 出现异常时或上述 if 条件不符合时向远端服务器请求
    if (originData === undefined) {
      try {
        const remoteSource = await getRemoteSource(
          originalUrl,
          isEncrypted && !isRoutePath
        )
        ctx.res.statusCode = remoteSource.res.status
        if (!isRoutePath && remoteSource.res.status.toString()[0] !== '4') {
          writeFile(localPath, remoteSource.data)
        }
        originData = remoteSource.data
      } catch (e) {
        console.error(e)
        ctx.res.end()
      }
    }

    let responseData = isRoutePath
      ? encodeData(originData).toString('utf-8')
      : encodeData(originData)
    if (isEncrypted) {
      responseData = XOR(responseData as Buffer)
    }
    ctx.body = responseData
  })
}

// tslint:disable-next-line
export const serverOptions: ServerOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificate/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificate/cert.crt'))
}

Object.freeze(serverOptions)

export const httpServer = http.createServer(Server.callback())
export const httpsServer = https.createServer(serverOptions, Server.callback())
