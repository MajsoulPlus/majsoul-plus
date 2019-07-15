import * as fs from 'fs'
import * as http from 'http'
import * as https from 'https'
import { ServerOptions } from 'https'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import { UserConfigs } from './config'
import ExtensionManager from './extension/manager'
import { ResourcePackManager } from './resourcepack/resourcepack'
import { getRemoteOrCachedFile, isPath } from './utils'

const serverOptions: ServerOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificate/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificate/cert.crt'))
}

Object.freeze(serverOptions)

const router = new Router()
const server = new Koa()

export function LoadServer() {
  // 注册资源包路由
  ResourcePackManager.register(server, router)

  // 注册扩展路由
  ExtensionManager.register(server, router)

  // 使用 koa-router 的路由
  server.use(router.routes())

  // 处理国服的 region/region.txt
  server.use(async (ctx, next) => {
    if (
      UserConfigs.userData.serverToPlay === 0 &&
      ctx.request.originalUrl === '/region.txt'
    ) {
      ctx.res.statusCode = 200
      ctx.body = 'mainland'
    } else {
      await next()
    }
  })

  // 默认从远端获取文件
  server.use(async ctx => {
    const isRoutePath = isPath(ctx.request.originalUrl)
    const resp = await getRemoteOrCachedFile(ctx.request.originalUrl)
    ctx.res.statusCode = resp.code
    ctx.body = isRoutePath ? resp.data.toString('utf-8') : resp.data
  })
}

export const httpServer = http.createServer(server.callback())
export const httpsServer = https.createServer(serverOptions, server.callback())
