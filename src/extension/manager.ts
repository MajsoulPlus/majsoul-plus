import * as fs from 'fs'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import BaseManager from '../BaseManager'
import { UserConfigs } from '../config'
import { appDataDir, GlobalPath, RemoteDomains } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import { fetchAnySite, getRemoteOrCachedFile } from '../utils'
import * as schema from './schema.json'
import { ResourcePackManager } from '../resourcepack/resourcepack'

const defaultExtension: MajsoulPlus.Extension = {
  id: 'majsoul_plus',
  version: '2.0.0',
  name: '未命名',
  author: '未知作者',
  description: '无描述',
  preview: 'preview.png',
  dependencies: {},

  entry: 'script.js',
  loadBeforeGame: false,
  applyServer: [0, 1, 2],
  resourcepack: []
}

Object.freeze(defaultExtension)

export default class MajsoulPlusExtensionManager extends BaseManager {
  private extensionScripts: Map<string, string[]> = new Map()
  private codejs = ''

  private useScriptPromises = []

  constructor(configPath: string) {
    super('extension', configPath, defaultExtension, schema)
  }

  load(id: string) {
    this.use(id, (pack: MajsoulPlus.Extension) => {
      ResourcePackManager.loadExtensionPack(pack)
    })
  }

  enableFromConfig() {
    super.enableFromConfig()
    ResourcePackManager.setLoadedExtensions(this.getDetails())
    for (const key in this.loadedDetails) {
      if (this.loadedDetails[key]) {
        const pack = this.loadedDetails[key]
        if (
          pack.enabled &&
          (pack.metadata as MajsoulPlus.Extension).applyServer.includes(
            UserConfigs.userData.serverToPlay
          )
        ) {
          this.useScriptPromises.push(
            this.useScript(pack.metadata.id, pack.metadata)
          )
        }
      }
    }
  }

  clear() {
    super.clear()
    ResourcePackManager.clearExtensionPack()
    this.extensionScripts = new Map()
    this.codejs = ''
    this.useScriptPromises = []
  }

  addScript(id: string, script: string) {
    const scripts = this.extensionScripts.get(id) || []
    scripts.push(script)
    this.extensionScripts.set(id, scripts)
  }

  async useScript(folder: string, extension: MajsoulPlus.Extension) {
    if (!Array.isArray(extension.entry)) {
      extension.entry = [extension.entry]
    }

    const err = false

    const useScript = async (entry: string) => {
      if (err) return

      // 加载远程脚本 远程脚本不缓存
      if (entry.match(/^https?:\/\//)) {
        const script = await fetchAnySite(entry, 'utf-8')
        this.addScript(extension.id, script)
      } else {
        // 本地脚本
        const p = path.resolve(
          appDataDir,
          GlobalPath.ExtensionDir,
          folder,
          entry
        )
        if (!fs.existsSync(p)) {
          console.error(`extension entry ${entry} not found!`)
          return
        }

        try {
          const script = fs.readFileSync(p, { encoding: 'utf-8' })
          this.addScript(extension.id, script)
        } catch (e) {
          console.error(
            `failed to load extension ${extension.name} from ${p}: ${e}`
          )
          this.addScript(
            extension.id,
            `// failed to load extension ${extension.name} from ${p}: ${e}`
          )
        }
      }
    }

    return Promise.all(extension.entry.map(useScript))
  }

  register(server: Koa, router: Router) {
    // 获取扩展基本信息
    router.get(`/majsoul_plus/extension/:id`, async (ctx, next) => {
      ctx.response.status = this.loadedMap.has(ctx.params.id) ? 200 : 404
      ctx.body = this.loadedMap.has(ctx.params.id)
        ? JSON.stringify(this.loadedMap.get(ctx.params.id), null, 2)
        : 'Not Found'
    })

    server.use(async (ctx, next) => {
      // 等待所有脚本加载完成
      await Promise.all(this.useScriptPromises)

      // 针对 code.js 进行特殊处理 注入扩展
      const originalUrl = ctx.request.originalUrl.replace(/^\/0\//g, '')
      let prefix = '',
        postfix = ''
      if (path.basename(originalUrl) === 'code.js') {
        if (this.codejs === '') {
          const code = await getRemoteOrCachedFile(
            ctx.request.originalUrl,
            false,
            data =>
              UserConfigs.userData.serverToPlay === 0
                ? Buffer.from(
                    data
                      .toString('utf-8')
                      .replace(/\.\.\/region\/region\.txt/g, 'region.txt')
                  )
                : data
          )
          // 注入修改过的 console
          const extensionConsole = `const extensionConsole = id => {
return new Proxy(
  {},
  {
    get: (target, name) => {
      return typeof console[name] === 'function'
        ? (...args) => console[name].apply(this, [\`[\${id}]\`, ...args])
        : () => undefined
    }
  }
)
}\n\n`

          const extensionFetch = `const extensionFetch = id => {
  return (input, init) => {
    if (typeof input !== 'string') {
      return
    }
    return fetch(\`majsoul_plus/extension/\${id}/\${input}\`, init)
  }
}\n\n`

          // 设置 localStorage 供用户登录
          const loginScript = `// 注入登录脚本
let userLocalStorage = JSON.parse('${JSON.stringify(
            UserConfigs.localStorage[
              RemoteDomains[UserConfigs.userData.serverToPlay.toString()].name
            ]
          )}')
// TODO: 找到这里需要做适配的原因
if (!Array.isArray(userLocalStorage)) 
  userLocalStorage = []
userLocalStorage.forEach(arr => localStorage.setItem(arr[0], arr[1]))
console.log('[Majsoul_Plus] 登录信息注入成功')
`

          Array.from(this.extensionScripts.entries())
            .filter(entry => this.loadedDetails[entry[0]].sequence > 0)
            .sort(
              (a, b) =>
                this.loadedDetails[a[0]].sequence -
                this.loadedDetails[b[0]].sequence
            )
            .forEach(entries => {
              const id = entries[0],
                scripts = entries[1]

              // 当未加载时跳出
              if (!this.loadedDetails[id].enabled) return

              const extension: MajsoulPlus.Extension = this.loadedDetails[id]
                .metadata
              if (
                extension.applyServer.includes(
                  UserConfigs.userData.serverToPlay
                )
              ) {
                const extCode = `/**
 * Extension： ${extension.id}
 * Author: ${extension.author}
 * Version: ${extension.version}
 */
Majsoul_Plus.${extension.id} = {};
((context, console, fetchSelf) => {
${scripts.join('\n')}
})(
  Majsoul_Plus.${extension.id},
  extensionConsole('${extension.id}'),
  extensionFetch('${extension.id}')
);\n\n`
                if (extension.loadBeforeGame) {
                  prefix += extCode
                } else {
                  postfix += extCode
                }
              }
            })

          this.codejs =
            'const Majsoul_Plus = {}\n' +
            extensionConsole +
            extensionFetch +
            loginScript +
            '\n\n\n' +
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

  changeEnable(event: Electron.Event, id: string, enabled: boolean) {
    super.changeEnable(event, id, enabled)
    ResourcePackManager.setLoadedExtensions(this.loadedDetails)
  }

  removePack(event: Electron.Event, id: string) {
    super.removePack(event, id)
    ResourcePackManager.setLoadedExtensions(this.loadedDetails)
  }
}
