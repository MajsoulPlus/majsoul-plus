import * as Ajv from 'ajv'
import * as fs from 'fs'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import * as semver from 'semver'
import { appDataDir, GlobalPath } from '../global.js'
import { MajsoulPlus } from '../majsoul_plus'
import { fillObject } from '../utils.js'
import { getRemoteSource } from '../utils/main'
import { defaultResourcePack } from './resourcepack.js'
import * as schema from './schema.json'

class ResourcePackManager {
  private resourcePacks: Map<string, MajsoulPlus.ResourcePack> = new Map()

  constructor() {
    this.resourcePacks.set('majsoul_plus', defaultResourcePack)
  }

  use(id: string) {
    // resourcepack id check
    if (!id.match(/^[_a-zA-Z]+$/)) {
      console.error(
        `failed to load resourcepack ${id}: invalid resourcepack id `
      )
      return this
    }

    const folder = path.resolve(appDataDir, GlobalPath.ResourcePackDir, id)
    const cfg = path.resolve(folder, 'resourcepack.json')

    // folder
    if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
      console.error(`failed to load resourcepack ${id}: ${folder} not found`)
      return this
    }

    // configuration file
    if (!fs.existsSync(cfg) || !fs.statSync(cfg).isFile()) {
      console.error(`failed to load resourcepack ${id}: ${cfg} not found`)
      return this
    }

    // get resourcepack
    const resourcepack: MajsoulPlus.ResourcePack = JSON.parse(
      fs.readFileSync(cfg, {
        encoding: 'utf-8'
      })
    )

    // fill default value
    fillObject(resourcepack, defaultResourcePack)

    // JSON Schema
    const ajv = new Ajv()
    const valid = ajv
      .addSchema(schema, 'resourcepack')
      .validate('resourcepack', resourcepack)
    if (!valid) {
      console.error(`failed to load resourcepack ${id}: json schema failed`)
      console.error(ajv.errors)
      return this
    }

    // id uniqueness check
    if (this.resourcePacks.has(resourcepack.id)) {
      console.error(
        `failed to load resourcepack ${id}: resourcepack already loaded`
      )
      return this
    }

    // version validate
    if (!semver.valid(resourcepack.version)) {
      console.error(
        `failed to load resourcepack ${id}: broken version ${
          resourcepack.version
        }`
      )
      return this
    }

    // check dependencies
    if (resourcepack.dependencies) {
      for (const dep in resourcepack.dependencies) {
        // dependency not found
        if (!this.resourcePacks.has(dep)) {
          console.error(
            `failed to load resourcepack ${id}: dependency ${dep} not found`
          )
          return this
        } else {
          // invalid range
          if (semver.validRange(resourcepack.dependencies[dep]) === null) {
            console.error(
              `failed to load resourcepack ${id}: broken dependency version ${
                resourcepack.dependencies[dep]
              }`
            )
            return this
          }

          // parse version range
          const range = new semver.Range(resourcepack.dependencies[dep])

          // check dependency version range
          if (!semver.satisfies(this.resourcePacks.get(dep).version, range)) {
            console.error(
              `failed to load resourcepack ${id}: the version of ${dep} loaded is ${
                this.resourcePacks.get(dep).version
              }, but required ${resourcepack.dependencies[dep]}`
            )
            return this
          }
        }
      }
    }

    /**
     * Warnings
     */
    // resourcepack id & folder name mismatch
    if (resourcepack.id !== id) {
      console.warn(
        `warning on loading resourcepack ${id}: folder name & id mismatch`
      )
    }

    // preview image not found
    if (
      !fs.existsSync(resourcepack.preview) ||
      !fs.statSync(resourcepack.preview).isFile()
    ) {
      console.warn(
        `warning on loading resourcepack ${id}: preview image not found`
      )
    }

    // all error checks are ok
    this.resourcePacks.set(id, resourcepack)
    return this
  }

  register(server: Koa, router: Router) {
    // 获取资源包基本信息
    router.get(
      `${true ? '/0' : ''}/majsoul_plus/resourcepack/:id`,
      async (ctx, next) => {
        ctx.response.status = this.resourcePacks.has(ctx.params.id) ? 200 : 404
        ctx.body = this.resourcePacks.has(ctx.params.id)
          ? JSON.stringify(this.resourcePacks.get(ctx.params.id), null, 2)
          : 'Not Found'
      }
    )

    // 为每一个资源包分配一个路径
    this.resourcePacks.forEach((value, key) => {
      router.get(
        // TODO: 兼容非国服 将此处 true 改为判断是否国服
        `${true ? '/0' : ''}/majsoul_plus/resourcepack/${key}/*`,
        async (ctx, next) => {
          ctx.response.status = 200
          ctx.body = ctx.path
          // await next()
        }
      )
    })

    // 修改资源映射表
    router.get(
      // TODO: 兼容非国服 将此处 true 改为判断是否国服
      `${true ? '/0' : ''}/resversion([^w]+)w.json`,
      async (ctx, next) => {
        ctx.response.type = 'application/json'
        const remote = await getRemoteSource(ctx.path, false)

        if (remote.res.status !== 200) {
          ctx.res.statusCode = remote.res.status
          ctx.body = {
            code: remote.res.status,
            message: remote.data
          }
        } else {
          ctx.res.statusCode = remote.res.status
          const resMap = JSON.parse(remote.data as string)
          ctx.body = JSON.stringify(resMap, null, 2)
        }
      }
    )
  }
}

export default new ResourcePackManager()
