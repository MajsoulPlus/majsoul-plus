import * as Ajv from 'ajv'
import * as fs from 'fs'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import * as semver from 'semver'
import * as toposort from 'toposort'
import { appDataDir, GlobalPath, Logger } from '../global.js'
import { MajsoulPlus } from '../majsoul_plus'
import { getRemoteSource } from '../utils'
import { fillObject, isEncryptRes, readFile, XOR } from '../utils.js'
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

export default class ResourcePackManager {
  private static configPath: string
  private resourcePacks: Map<string, MajsoulPlus.ResourcePack> = new Map()
  private loadedResourcePackDetails: {
    [extension: string]: {
      enabled: boolean
      sequence: number
      errors: Array<string | string[]>
      metadata: MajsoulPlus.ResourcePack
    }
  } = {}
  private enabled: string[]

  constructor(configPath: string) {
    ResourcePackManager.configPath = configPath
    this.resourcePacks.set('majsoul_plus', defaultResourcePack)
    this.enabled = JSON.parse(
      fs.readFileSync(configPath, { encoding: 'utf-8' })
    )
  }

  use(id: string) {
    // 资源包 ID 检查
    if (!id.match(/^[_a-zA-Z0-9]+$/)) {
      Logger.debug(`invalid resourcepack id： ${id}`)
      return this
    }

    const folder = path.resolve(appDataDir, GlobalPath.ResourcePackDir, id)
    const cfg = path.resolve(folder, 'resourcepack.json')

    // 资源包目录存在性
    if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
      Logger.debug(`${id} folder not found: ${folder}`)
      return this
    }

    // 资源包配置文件存在性
    if (!fs.existsSync(cfg) || !fs.statSync(cfg).isFile()) {
      Logger.debug(`${id} configuration file not found: ${cfg}`)
      return this
    }

    // 获得资源包
    const resourcepack: MajsoulPlus.ResourcePack = JSON.parse(
      fs.readFileSync(cfg, {
        encoding: 'utf-8'
      })
    )

    // 填入默认数据
    fillObject(resourcepack, defaultResourcePack)

    // ID 与目录名必须保持一致
    if (resourcepack.id !== id) {
      Logger.debug(
        `folder name & id mismatch: folder name is ${id}, but id is ${
          resourcepack.id
        }`
      )
      return this
    }

    // id 唯一性检查
    // 理论上应该不存在，因为是按照目录名的
    if (this.resourcePacks.has(resourcepack.id)) {
      Logger.debug(`resourcepack already loaded or duplicated id: ${id}`)
      return this
    }

    // JSON Schema
    const ajv = new Ajv()
    const valid = ajv
      .addSchema(schema, 'resourcepack')
      .validate('resourcepack', resourcepack)
    if (!valid) {
      Logger.debug(`failed to load resourcepack ${id}: json schema failed`)
      Logger.debug(JSON.stringify(ajv.errors, null, 2))
      return this
    }

    // version validate
    if (!semver.valid(resourcepack.version)) {
      Logger.debug(
        `failed to load resourcepack ${id}: broken version ${
          resourcepack.version
        }`
      )
      return this
    }

    // 检查依赖
    if (resourcepack.dependencies) {
      for (const dep in resourcepack.dependencies) {
        // 依赖版本表示不合法
        if (semver.validRange(resourcepack.dependencies[dep]) === null) {
          Logger.debug(
            `failed to load resourcepack ${id}: broken dependency version ${
              resourcepack.dependencies[dep]
            }`
          )
          return this
        }
      }
    }

    // 无错误
    // 将所有 replace 都转换为 Object 形式
    // 并对其中原 string 的部分开启强制外服兼容
    resourcepack.replace.forEach((rep, index) => {
      if (typeof rep === 'string') {
        resourcepack.replace[index] = {
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

    this.resourcePacks.set(id, resourcepack)
    this.loadedResourcePackDetails[id] = {
      enabled: false,
      metadata: resourcepack,
      sequence: 0,
      errors: []
    }

    return this
  }

  enableFromConfig() {
    const validatedEnabled = []
    this.enabled.forEach(id => {
      const value = this.loadedResourcePackDetails[id]
      const resourcepack = value.metadata

      if (value.enabled) {
        validatedEnabled.push(id)
        return
      }

      for (const dep in resourcepack.dependencies) {
        // 依赖未找到
        if (!this.resourcePacks.has(dep)) {
          Logger.debug(`dependency of ${id} not found: ${dep}`)
          value.errors.push(['dependencyNotFound', dep])
        } else if (
          dep !== 'majsoul_plus' &&
          !this.loadedResourcePackDetails[dep].enabled
        ) {
          Logger.debug(`dependency of ${id} not enabled: ${dep}`)
          value.errors.push(['dependencyNotEnabled', dep])
        } else {
          // 解析依赖版本范围
          const range = new semver.Range(resourcepack.dependencies[dep])
          // 检查依赖版本
          if (!semver.satisfies(this.resourcePacks.get(dep).version, range)) {
            Logger.debug(
              `dependency version of ${id} mismatch: loaded ${dep}:${
                this.resourcePacks.get(dep).version
              }, but required ${dep}:${resourcepack.dependencies[dep]}`
            )
            value.errors.push([
              'dependencyVersionMismatch',
              resourcepack.dependencies[dep],
              this.resourcePacks.get(dep).version
            ])
          }
        }
      }

      if (value.errors.length === 0) {
        validatedEnabled.push(id)
        this.loadedResourcePackDetails[id].enabled = true
      }
    })

    // 确定顺序
    validatedEnabled.forEach((id, index) => {
      this.loadedResourcePackDetails[id].sequence = index + 1
    })
    this.enabled = validatedEnabled
  }

  register(server: Koa, router: Router) {
    // 获取资源包基本信息
    router.get(`/majsoul_plus/resourcepack/:id`, async (ctx, next) => {
      ctx.response.status = this.resourcePacks.has(ctx.params.id) ? 200 : 404
      ctx.body = this.resourcePacks.has(ctx.params.id)
        ? JSON.stringify(this.resourcePacks.get(ctx.params.id), null, 2)
        : 'Not Found'
    })

    // 为每一个资源包分配一个路径
    this.resourcePacks.forEach((pack, packName) => {
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

        this.resourcePacks.forEach(pack => {
          if (
            pack.id !== 'majsoul_plus' &&
            this.loadedResourcePackDetails[pack.id].enabled
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

  getDetails() {
    return { ...this.loadedResourcePackDetails }
  }

  disable(id: string) {
    const toDisable = this.loadedResourcePackDetails[id]
    if (toDisable.enabled) {
      const dependents = Object.values(this.loadedResourcePackDetails).filter(
        pack => (pack.enabled ? !!pack.metadata.dependencies[id] : false)
      )
      dependents.forEach(dep => this.disable(dep.metadata.id))
    }
    toDisable.sequence = 0
    toDisable.enabled = false
    this.enabled = this.enabled.filter(item => item !== id)
  }

  disableAll() {
    for (const id in this.loadedResourcePackDetails) {
      if (this.loadedResourcePackDetails[id]) {
        this.loadedResourcePackDetails[id].enabled = false
        this.loadedResourcePackDetails[id].errors = []
      }
    }
    this.enabled = []
  }

  enable(id: string) {
    this.loadedResourcePackDetails[id].errors = []
    this.enabled.push(id)
    this.enableFromConfig()
  }

  save() {
    fs.writeFileSync(
      ResourcePackManager.configPath,
      JSON.stringify(this.enabled, null, 2),
      {
        encoding: 'utf-8'
      }
    )
  }
}
