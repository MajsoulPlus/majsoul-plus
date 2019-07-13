import * as fs from 'fs'
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
        const remoteSource = await getRemoteSource(
          originalUrl,
          encrypt && !isRoutePath
        )
        ctx.res.statusCode = remoteSource.res.status
        if (!isRoutePath && remoteSource.res.status.toString()[0] !== '4') {
          writeFile(localURI, remoteSource.data)
        }
        allData = remoteSource.data
      } catch (e) {
        console.error(e)
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
}

// tslint:disable-next-line
export const serverOptions: ServerOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificate/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificate/cert.crt'))
}

Object.freeze(serverOptions)

export const httpsServer = https.createServer(serverOptions, Server.callback())
