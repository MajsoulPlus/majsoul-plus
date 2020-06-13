import * as fs from 'fs'
import * as http from 'http'
import * as https from 'https'
import { ServerOptions } from 'https'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import { UserConfigs } from './config'
import { ExtensionManager } from './extension/extension'
import { ResourcePackManager } from './resourcepack/resourcepack'
import { getRemoteOrCachedFile, isPath } from './utils'

const serverOptions: ServerOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificate/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificate/cert.crt'))
}

Object.freeze(serverOptions)

export function LoadServer() {
  const router = new Router()
  const server = new Koa()

  // 注册资源包路由
  ResourcePackManager.register(server, router)

  // 注册扩展路由
  ExtensionManager.register(server, router)

  // 使用 koa-router 的路由
  server.use(router.routes())

  // 默认从远端获取文件
  server.use(async ctx => {
    const isRoutePath = isPath(ctx.request.originalUrl)
    const resp = await getRemoteOrCachedFile(ctx.request.originalUrl)
    ctx.res.statusCode = resp.code
    ctx.body = isRoutePath ? resp.data.toString('utf-8') : resp.data
  })

  httpServer = http.createServer(server.callback())
  httpsServer = https.createServer(serverOptions, server.callback())
}

export function CloseServer() {
  // 释放原先存在的服务器实例
  if (httpServer || httpsServer) {
    UserConfigs.userData.useHttpServer
      ? httpServer.close()
      : httpsServer.close()

    httpServer = undefined
    httpsServer = undefined
  }
}

export function ListenServer(port: number) {
  // 初始化本地镜像服务器，当端口被占用时会随机占用另一个端口
  if (UserConfigs.userData.useHttpServer) {
    httpServer.listen(port)
    httpServer.on('error', err => {
      // TODO: 验证 http 端口冲突时的提示信息是否是下面的内容
      if (err.name === 'EADDRINUSE') {
        httpServer.close()
        // 随机监听一个空闲端口
        httpServer.listen(0)
      }
    })
  } else {
    httpsServer.listen(port)
    httpsServer.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        httpsServer.close()
        // 随机监听一个空闲端口
        httpsServer.listen(0)
      }
    })
  }
}

export let httpServer: http.Server
export let httpsServer: https.Server
