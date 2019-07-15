import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import BaseManager from '../BaseManager.js'
import { appDataDir, GlobalPath } from '../global.js'
import { MajsoulPlus } from '../majsoul_plus'
import { getRemoteSource } from '../utils'
import { isEncryptRes, readFile, XOR } from '../utils.js'
import * as schema from './schema.json'

const defaultResourcePack: MajsoulPlus.ResourcePack = {
  id: 'majsoul_plus',
  version: '2.0.0',
  name: 'Majsoul Plus',
  author: 'Majsoul Plus Team',
  description: 'No description provided.',
  preview: 'preview.png',
  dependencies: {},

  replace: []
}

Object.freeze(defaultResourcePack)

export default class ResourcePackManager extends BaseManager {
  constructor(configPath: string) {
    super('resourcepack', configPath, defaultResourcePack, schema)
  }

  load(id: string) {
    this.use(id, (pack: MajsoulPlus.ResourcePack) => {
      pack.replace.forEach((rep, index) => {
        if (typeof rep === 'string') {
          pack.replace[index] = {
            from: [rep, 'jp/' + rep, 'en/' + rep],
            to: rep,
            'all-servers': true
          }
        } else if (rep['all-servers']) {
          const all = []
          if (typeof rep.from === 'string') {
            rep.from = [rep.from]
          }
          rep.from.forEach(key => {
            all.push(key, 'jp/' + key, 'en/' + key)
          })
          rep.from = all
        }
      })
    })
  }

  register(server: Koa, router: Router) {
    // 获取资源包基本信息
    router.get(`/majsoul_plus/resourcepack/:id`, async (ctx, next) => {
      ctx.response.status = this.loadedMap.has(ctx.params.id) ? 200 : 404
      ctx.body = this.loadedMap.has(ctx.params.id)
        ? JSON.stringify(this.loadedMap.get(ctx.params.id), null, 2)
        : 'Not Found'
    })

    // 为每一个资源包分配一个路径
    this.loadedMap.forEach((pack: MajsoulPlus.ResourcePack, packName) => {
      router.get(
        `/majsoul_plus/resourcepack/${packName}/*`,
        async (ctx, next) => {
          let queryPath = ctx.path.substr(
            `/majsoul_plus/resourcepack/${packName}/`.length
          )
          const encrypted = isEncryptRes(queryPath)

          // 检测 from 中是否存在 queryPath
          // 有则重定向到对应的 to
          for (let rep of pack.replace) {
            rep = rep as MajsoulPlus.ResourcePackReplaceEntry
            if ((rep.from as string[]).includes(queryPath)) {
              queryPath = rep.to
              break
            }
          }

          try {
            const content = await readFile(
              path.resolve(
                appDataDir,
                GlobalPath.ResourcePackDir,
                packName,
                'assets',
                queryPath
              )
            )
            ctx.response.status = 200
            ctx.body = encrypted ? XOR(content as Buffer) : content
          } catch (e) {
            ctx.response.status = 404
            ctx.body = undefined
          }
        }
      )
    })

    // 修改资源映射表
    router.get(`/resversion([^w]+)w.json`, async (ctx, next) => {
      ctx.response.type = 'application/json'
      const remote = await getRemoteSource(ctx.path, false)

      if (remote.code !== 200) {
        ctx.res.statusCode = remote.code
        ctx.body = {
          code: remote.code,
          message: remote.data
        }
      } else {
        ctx.res.statusCode = remote.code
        const resMap = JSON.parse(remote.data.toString('utf-8'))

        this.loadedMap.forEach((pack: MajsoulPlus.ResourcePack) => {
          if (
            pack.id !== 'majsoul_plus' &&
            this.loadedDetails[pack.id].enabled
          ) {
            pack.replace.forEach(
              (rep: MajsoulPlus.ResourcePackReplaceEntry) => {
                const repo = rep as MajsoulPlus.ResourcePackReplaceEntry
                const from =
                  typeof repo.from === 'string' ? [repo.from] : repo.from

                from.forEach(rep => {
                  if (resMap.res[rep] !== undefined) {
                    resMap.res[rep].prefix = `majsoul_plus/resourcepack/${
                      pack.id
                    }`
                  }
                })
              }
            )
          }
        })
        ctx.body = JSON.stringify(resMap, null, 2)
      }
    })
  }
}
