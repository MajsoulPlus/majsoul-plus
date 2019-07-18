import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import BaseManager from '../BaseManager'
import { appDataDir, GlobalPath } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import { getRemoteSource, isEncryptRes, readFile, XOR } from '../utils'
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
  private extensionMap: Map<string, MajsoulPlus.ResourcePack> = new Map()
  private loadedExtensions: {
    [extension: string]: {
      enabled: boolean
      sequence: number
      errors: Array<string | string[]>
      metadata: MajsoulPlus.Extension
    }
  } = {}

  constructor(configPath: string) {
    super('resourcepack', configPath, defaultResourcePack, schema)
  }

  load(id: string) {
    this.use(id, (pack: MajsoulPlus.ResourcePack) =>
      this.preprocessReplaceString(pack)
    )
  }

  loadExtensionPack(ext: MajsoulPlus.Extension) {
    if (ext.resourcepack && ext.resourcepack.length > 0) {
      const res = {
        ...ext,
        replace: ext.resourcepack
      }
      this.preprocessReplaceString(res)
      this.extensionMap.set(res.id, res)
    }
  }

  removeExtensionPack(id: string) {
    this.extensionMap.delete(id)
  }

  setLoadedExtensions(loaded: {
    [extension: string]: {
      enabled: boolean
      sequence: number
      errors: Array<string | string[]>
      metadata: MajsoulPlus.Extension
    }
  }) {
    Object.values(loaded).forEach(pack => {
      pack.metadata['replace'] = pack.metadata.resourcepack
    })
    this.loadedExtensions = loaded
  }

  clearExtensionPack() {
    this.extensionMap.clear()
    this.loadedExtensions = {}
  }

  preprocessReplaceString(pack: MajsoulPlus.ResourcePack) {
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
    this.loadedMap.forEach((pack: MajsoulPlus.ResourcePack, id) => {
      router.get(`/majsoul_plus/resourcepack/${id}/*`, async (ctx, next) => {
        let queryPath = ctx.path.substr(
          `/majsoul_plus/resourcepack/${id}/`.length
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
              id,
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
      })
    })

    // 为每一个扩展分配一个路径
    this.extensionMap.forEach((pack: MajsoulPlus.ResourcePack, id) => {
      router.get(`/majsoul_plus/extension/${id}/*`, async (ctx, next) => {
        let queryPath = ctx.path.substr(`/majsoul_plus/extension/${id}/`.length)
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
              GlobalPath.ExtensionDir,
              id,
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
      })
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

          // 先加载扩展的资源
          // 后加载资源包的资源，资源包可覆盖扩展的替换
          // 资源包的资源替换顺序即为加载顺序
        ;[
          { list: this.loadedExtensions, name: 'extension' },
          { list: this.loadedDetails, name: 'resourcepack' }
        ].forEach(item => {
          Object.values(item.list)
            .filter(detail => detail.sequence > 0)
            .sort((a, b) => a.sequence - b.sequence)
            .forEach(detail => {
              const pack = detail.metadata as MajsoulPlus.ResourcePack
              if (pack.id !== 'majsoul_plus' && item.list[pack.id].enabled) {
                pack.replace.forEach(
                  (rep: MajsoulPlus.ResourcePackReplaceEntry) => {
                    const repo = rep as MajsoulPlus.ResourcePackReplaceEntry
                    const from =
                      typeof repo.from === 'string' ? [repo.from] : repo.from

                    from.forEach(rep => {
                      if (resMap.res[rep] !== undefined) {
                        resMap.res[rep].prefix = `majsoul_plus/${item.name}/${
                          pack.id
                        }`
                      }
                    })
                  }
                )
              }
            })
        })

        ctx.body = JSON.stringify(resMap, null, 2)
      }
    })
  }
}
