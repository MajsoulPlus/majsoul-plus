import * as Ajv from 'ajv'
import * as fs from 'fs'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import * as semver from 'semver'
import { appDataDir, Global, GlobalPath } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import { fillObject, getRemoteOrCachedFile, fetchAnySite } from '../utils'
import * as schema from './schema.json'
import { UserConfigs } from '../config'

export const defaultExtensionPermission: MajsoulPlus.ExtensionPreferences = {
  nodeRequire: false,
  document: false,
  localStorage: false,
  XMLHttpRequest: false,
  WebSocket: false,
  writeableWindowObject: false
}

export const defaultExtension: MajsoulPlus.Extension = {
  id: 'majsoul_plus',
  version: '2.0.0',
  name: 'Majsoul Plus',
  author: 'Majsoul Plus Team',
  description: 'No description provided.',
  dependencies: {},
  preview: 'preview.png',
  entry: 'script.js',
  loadBeforeGame: false,
  applyServer: [0, 1, 2],
  executePreferences: defaultExtensionPermission
}

Object.freeze(defaultExtension)
Object.freeze(defaultExtensionPermission)

class MajsoulPlusExtensionManager {
  private loadedExtensions: { [extension: string]: semver.SemVer } = {}
  private loadedExtensionDetails: {
    [extension: string]: {
      enabled: boolean
      extension: MajsoulPlus.Extension
    }
  } = {}
  private extensionScripts: Map<string, string[]> = new Map()
  private codejs = ''

  constructor() {
    this.loadedExtensions['majsoul_plus'] = semver.parse(Global.version)
    this.loadedExtensionDetails['majsoul_plus'] = {
      enabled: true,
      extension: defaultExtension
    }
  }

  use(ext: string) {
    // 检查目录 ID 是否合法
    if (!ext.match(/^[_a-zA-Z]+$/)) {
      console.error(
        `failed to load extension ${ext}: invalid extension folder path(id) `
      )
      return this
    }

    const folder = path.resolve(appDataDir, GlobalPath.ExtensionDir, ext)
    const cfg = path.resolve(folder, 'extension.json')

    // 检查扩展目录存在性
    if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
      console.error(`failed to load extension ${ext}: ${folder} not found`)
      return this
    }

    // 检查配置文件存在性
    if (!fs.existsSync(cfg) || !fs.statSync(cfg).isFile()) {
      console.error(`failed to load extension ${ext}: ${cfg} not found`)
      return this
    }

    // 加载扩展配置文件
    const extension: MajsoulPlus.Extension = JSON.parse(
      fs.readFileSync(cfg, {
        encoding: 'utf-8'
      })
    )

    // 向空缺的字段填入默认值
    fillObject(extension, defaultExtension)

    // JSON Schema
    const ajv = new Ajv({ allErrors: true })
    const validate = ajv.compile(schema)
    const valid = validate(extension)
    if (!valid) {
      console.error(`failed to load extension ${ext}: json schema failed`)
      console.error(validate.errors)
      console.log(extension)
      return this
    }

    // ID 唯一性检查
    if (this.loadedExtensions[extension.id]) {
      console.error(`failed to load extension ${ext}: extension already loaded`)
      return this
    }

    // 加载到这一步时可以显示在 Manager 内
    this.loadedExtensionDetails[ext] = {
      enabled: false,
      extension
    }

    // 检查扩展的 version 字段是否合法
    if (!semver.valid(extension.version)) {
      console.error(
        `failed to load extension ${ext}: broken version ${extension.version}`
      )
      return this
    }

    // 检查依赖
    if (extension.dependencies) {
      for (const dep in extension.dependencies) {
        // dependency not found
        if (!this.loadedExtensions[dep]) {
          console.error(
            `failed to load extension ${ext}: dependency ${dep} not found`
          )
          return this
        } else {
          // invalid range
          if (semver.validRange(extension.dependencies[dep]) === null) {
            console.error(
              `failed to load extension ${ext}: broken dependency version ${
                extension.dependencies[dep]
              }`
            )
            return this
          }

          // parse version range
          const range = new semver.Range(extension.dependencies[dep])

          // check dependency version range
          if (!semver.satisfies(this.loadedExtensions[dep], range)) {
            console.error(
              `failed to load extension ${ext}: the version of ${dep} loaded is ${
                this.loadedExtensions[dep]
              }, but required ${extension.dependencies[dep]}`
            )
            return this
          }
        }
      }
    }

    /**
     * Warnings
     */
    // 扩展的 id 与文件夹名不同
    if (extension.id !== ext) {
      console.warn(
        `warning on loading extension ${ext}: folder name & id mismatch`
      )
    }

    // 没有找到预览图片
    if (
      !fs.existsSync(path.resolve(folder, extension.preview)) ||
      !fs.statSync(path.resolve(folder, extension.preview)).isFile()
    ) {
      console.warn(
        `warning on loading extension ${ext}: preview image not found`
      )
    }

    // 所有错误检测均已通过
    this.useScript(ext, extension)
    this.loadedExtensionDetails[ext].enabled = true
    return this
  }

  useScript(folder: string, extension: MajsoulPlus.Extension) {
    if (!Array.isArray(extension.entry)) {
      extension.entry = [extension.entry]
    }

    let err = false

    const useScript = (entry: string) => {
      if (err) return

      const p = path.resolve(appDataDir, GlobalPath.ExtensionDir, folder, entry)
      if (!fs.existsSync(p)) {
        console.error(`extension entry ${entry} not found!`)
        return
      }

      try {
        const script = fs.readFileSync(p, { encoding: 'utf-8' })
        const scripts = this.extensionScripts.get(extension.id) || []
        scripts.push(script)
        this.extensionScripts.set(extension.id, scripts)
      } catch (e) {
        console.error(
          `failed to load extension ${extension.name} from ${p}: ${e}`
        )
        err = true
      }
    }

    extension.entry.forEach(useScript)
    if (!err) {
      this.loadedExtensions[extension.id] = semver.parse(extension.version)
    }
    return this
  }

  register(server: Koa, router: Router) {
    server.use(async (ctx, next) => {
      // 只针对 code.js 进行特殊处理 注入扩展
      const originalUrl = ctx.request.originalUrl.replace(/^\/0\//g, '')
      let prefix = '',
        postfix = ''
      if (path.basename(originalUrl) === 'code.js') {
        if (this.codejs === '') {
          const code = await getRemoteOrCachedFile(
            ctx.request.originalUrl,
            false
          )

          // TODO: 将 Yo 插件化
          // 针对非国服的 Yo 对象处理
          if (UserConfigs.userData.serverToPlay !== 0) {
            const yo = await fetchAnySite(
              'https://passport.mahjongsoul.com/js/yo_acc.prod_ja.js',
              'utf-8'
            )

            prefix = `// inject https://passport.mahjongsoul.com/js/yo_acc.prod_ja.js\n${yo}\n`
          }

          this.extensionScripts.forEach((scripts, ext) => {
            const extension = this.loadedExtensionDetails[ext].extension
            if (
              extension.applyServer.includes(UserConfigs.userData.serverToPlay)
            ) {
              const extCode = `/**
 * Extension： ${extension.id}
 * Author: ${extension.author}
 * Version: ${extension.version}
 */
${scripts.join('\n')}\n\n`
              if (extension.loadBeforeGame) {
                prefix += extCode
              } else {
                postfix += extCode
              }
            }
          })

          this.codejs =
            prefix +
            '\n\n\n' +
            '// code.js\n' +
            code.data.toString('utf-8') +
            '\n\n\n' +
            postfix
        }

        ctx.res.statusCode = 200
        ctx.body = this.codejs
      } else {
        await next()
      }
    })
  }

  getDetails() {
    return { ...this.loadedExtensionDetails }
  }
}

export default new MajsoulPlusExtensionManager()
