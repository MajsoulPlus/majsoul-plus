import * as Ajv from 'ajv'
import * as fs from 'fs'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import * as semver from 'semver'
import { appDataDir, Global, GlobalPath } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import {
  encodeData,
  fillObject,
  getRemoteOrCachedFile,
  fetchAnySite
} from '../utils'
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
  executePreferences: defaultExtensionPermission
}

Object.freeze(defaultExtension)
Object.freeze(defaultExtensionPermission)

class MajsoulPlusExtensionManager {
  private loadedExtensions: { [extension: string]: semver.SemVer } = {}
  private loadedExtensionDetails: {
    [extension: string]: MajsoulPlus.Extension
  } = {}
  private extensionConfigs: MajsoulPlus.Extension[]
  private extensionMiddlewares: MajsoulPlus.ExtensionMiddleware[] = []

  constructor() {
    this.loadedExtensions['majsoul_plus'] = semver.parse(Global.version)
    this.loadedExtensionDetails['majsoul_plus'] = defaultExtension
  }

  use(ext: string) {
    // extension id check
    if (!ext.match(/^[_a-zA-Z]+$/)) {
      console.error(`failed to load extension ${ext}: invalid extension id `)
      return this
    }

    const folder = path.resolve(appDataDir, GlobalPath.ExtensionDir, ext)
    const cfg = path.resolve(folder, 'extension.json')

    // folder
    if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
      console.error(`failed to load extension ${ext}: ${folder} not found`)
      return this
    }

    // configuration file
    if (!fs.existsSync(cfg) || !fs.statSync(cfg).isFile()) {
      console.error(`failed to load extension ${ext}: ${cfg} not found`)
      return this
    }

    // get extension
    const extension: MajsoulPlus.Extension = JSON.parse(
      fs.readFileSync(cfg, {
        encoding: 'utf-8'
      })
    )

    // fill default value
    fillObject(extension, defaultExtension)

    // JSON Schema
    const ajv = new Ajv({ allErrors: true })
    const validate = ajv.compile(schema)
    const valid = validate(extension)
    if (!valid) {
      console.error(`failed to load extension ${ext}: json schema failed`)
      console.error(validate.errors)
      return this
    }

    // id uniqueness check
    if (this.loadedExtensions[extension.id]) {
      console.error(`failed to load extension ${ext}: extension already loaded`)
      return this
    }

    // version validate
    if (!semver.valid(extension.version)) {
      console.error(
        `failed to load extension ${ext}: broken version ${extension.version}`
      )
      return this
    }

    // check dependencies
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
    // extension id & folder name mismatch
    if (extension.id !== ext) {
      console.warn(
        `warning on loading extension ${ext}: folder name & id mismatch`
      )
    }

    // preview image not found
    if (
      !fs.existsSync(path.resolve(folder, extension.preview)) ||
      !fs.statSync(path.resolve(folder, extension.preview)).isFile()
    ) {
      console.warn(
        `warning on loading extension ${ext}: preview image not found`
      )
    }

    // all error checks are ok
    this.useScript(ext, extension)
    this.loadedExtensionDetails[ext] = extension
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
        const script = require(p)
        this.extensionMiddlewares.push(script())
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
        postfix: string
      if (path.basename(originalUrl) === 'code.js') {
        const code = await getRemoteOrCachedFile(ctx.request.originalUrl, false)

        // 针对非国服的 Yo 对象处理
        if (UserConfigs.userData.serverToPlay !== 0) {
          const yo = await fetchAnySite(
            'https://passport.mahjongsoul.com/js/yo_acc.prod_ja.js',
            'utf-8'
          )

          prefix = `// inject https://passport.mahjongsoul.com/js/yo_acc.prod_ja.js\n${yo}\n`
        }

        // TODO: 在 data 前后注入扩展
        postfix = ''
        ctx.body =
          prefix +
          '\n\n\n' +
          '// code.js\n' +
          code.data.toString('utf-8') +
          '\n\n\n' +
          postfix
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
