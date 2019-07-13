import * as fs from 'fs'
import * as http from 'http'
import * as https from 'https'
import { ServerOptions } from 'https'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import ExtensionManager from './extension/manager'
import ResourcePackManager from './resourcepack/manager'
import { getRemoteOrCachedFile } from './utils'

const router = new Router()

// tslint:disable-next-line
export const Server = new Koa()

export function LoadServer() {
  // 资源包
  ResourcePackManager.register(Server, router)

  // 扩展
  ExtensionManager.register(Server, router)

  // 注册路由
  Server.use(router.routes())

  // 默认从远端获取文件
  Server.use(async ctx => {
    const resp = await getRemoteOrCachedFile(ctx.request.originalUrl)
    ctx.res.statusCode = resp.code
    ctx.body = resp.data
  })
}

export const serverOptions: ServerOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificate/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificate/cert.crt'))
}

Object.freeze(serverOptions)

export const httpServer = http.createServer(Server.callback())
export const httpsServer = https.createServer(serverOptions, Server.callback())
