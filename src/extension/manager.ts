import * as fs from 'fs'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as path from 'path'
import { format } from 'prettier'
import BaseManager from '../BaseManager'
import { UserConfigs } from '../config'
import { appDataDir, GlobalPath, Logger, RemoteDomains } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import { ResourcePackManager } from '../resourcepack/resourcepack'
import { fetchAnySite, getRemoteOrCachedFile } from '../utils'
import * as schema from './schema.json'

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
          Logger.error(`extension entry ${entry} not found!`)
          return
        }

        try {
          const script = fs.readFileSync(p, { encoding: 'utf-8' })
          this.addScript(extension.id, script)
        } catch (e) {
          Logger.error(
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
    // 加载扩展脚本
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

    router.get('/:version/code.js', async (ctx, next) => {
      if (this.codejs !== '') {
        ctx.res.statusCode = 200
        ctx.body = this.codejs
      }

      const loader = {
        codeVersion: ctx.params.version,
        hasLauncher: false,
        pre: [],
        post: [],
        launcher: ''
      }

      Array.from(this.extensionScripts.keys())
        .filter(key => this.loadedDetails[key].sequence > 0)
        .sort(
          (a, b) =>
            this.loadedDetails[a].sequence - this.loadedDetails[b].sequence
        )
        .forEach(id => {
          // 当未加载时跳出
          if (!this.loadedDetails[id].enabled) return

          const extension: MajsoulPlus.Extension = this.loadedDetails[id]
            .metadata
          if (
            extension.applyServer.includes(UserConfigs.userData.serverToPlay)
          ) {
            if (!loader.hasLauncher && id.endsWith('_launcher')) {
              loader.hasLauncher = true
              loader.launcher = id
              return
            } else if (loader.hasLauncher && id.endsWith('_launcher')) {
              Logger.error(`Multiple launchers, skipping ${id}`)
              return
            }
            if (extension.loadBeforeGame) {
              loader.pre.push(id)
            } else {
              loader.post.push(id)
            }
          }
        })

      this.codejs = `const Majsoul_Plus = {};
Majsoul_Plus.$ = ${JSON.stringify(loader, null, 2)};
[...Majsoul_Plus.$.pre, ...Majsoul_Plus.$.post, ...(Majsoul_Plus.$.hasLauncher ? [Majsoul_Plus.$.launcher] : [])].forEach(ext => Majsoul_Plus[ext] = {});

(async () => {
  const $ = Majsoul_Plus.$;
  await Promise.all(
    ['console', 'fetch'].map(name => addScript(\`majsoul_plus/plugin/\${name}.js\`))
  );

  await addScript(\`majsoul_plus/\${$.codeVersion}/code.js\`);

  await Promise.all(
    $.pre.map(ext => addScript(\`majsoul_plus/extension/scripts/\${ext}/\`))
  );

  if ($.hasLauncher) {
    await addScript(\`majsoul_plus/extension/scripts/\${$.launcher}/\`)
  } else {
    new GameMgr();
  }

  await Promise.all(
    $.post.map(ext => addScript(\`majsoul_plus/extension/scripts/\${ext}/\`))
  );
})()

function addScript(url) {
  return new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = url;
    tag.async = false;
    tag.onload = resolve;
    tag.onerror = reject;
    document.head.appendChild(tag);
  });
}
`
      ctx.res.statusCode = 200
      ctx.res.setHeader('Content-Type', 'application/javascript')
      ctx.body = format(this.codejs, { parser: 'babel' })
    })

    // 获取扩展基本信息
    router.get(`/majsoul_plus/extension/:id`, async (ctx, next) => {
      ctx.response.status = this.loadedMap.has(ctx.params.id) ? 200 : 404
      ctx.body = this.loadedMap.has(ctx.params.id)
        ? JSON.stringify(this.loadedMap.get(ctx.params.id), null, 2)
        : 'Not Found'
    })

    router.get(`/majsoul_plus/extension/scripts/:id/`, async (ctx, next) => {
      if (!this.loadedMap.has(ctx.params.id)) {
        ctx.res.statusCode = 404
        return
      }

      // 等待所有脚本加载完成
      await Promise.all(this.useScriptPromises)

      const extension = this.loadedMap.get(ctx.params.id)
      const scripts = this.extensionScripts.get(ctx.params.id)

      ctx.res.statusCode = 200
      ctx.res.setHeader('Content-Type', 'application/javascript')
      ctx.body = format(
        `/**
* Extension： ${extension.id}
* Author: ${extension.author}
* Version: ${extension.version}
*/
((context, console, fetchSelf) => {
     ${scripts
       .map(
         script => `  try {
     ${script}
  } catch(e) {
    console.error('Unresolved Error', e);
  }`
       )
       .join('\n')}
})(
  Majsoul_Plus.${extension.id},
  extensionConsole('${extension.id}'),
  extensionFetch('${extension.id}')
);`,
        { parser: 'babel' }
      )
    })

    router.get(`/majsoul_plus/:version/code.js`, async (ctx, next) => {
      const url = ctx.request.originalUrl.replace(/^\/majsoul_plus/, '')
      const code = (
        await getRemoteOrCachedFile(url, false, data =>
          UserConfigs.userData.serverToPlay === 0
            ? Buffer.from(
                data
                  .toString('utf-8')
                  .replace(/\.\.\/region\/region\.txt/g, 'region.txt')
              )
            : data
        )
      ).data.toString('utf-8')
      ctx.res.setHeader('Content-Type', 'application/javascript')
      ctx.body = code.replace('new GameMgr', '()=>1')
    })

    router.get('/majsoul_plus/plugin/console.js', async (ctx, next) => {
      const result = format(
        `
        const extensionConsole = id => {
          return new Proxy(
            {},
            {
              get: (target, name) => {
                return typeof console[name] !== 'function'
                  ? () => undefined
                  : (...args) => {
                      if (args.length === 0) return undefined
                      else if (typeof args[0] === 'string')
                        args[0] = \`[\${id}] \${args[0]}\`
                      else args = [\`[\${id}]\`, ...args]
                      return console[name].apply(this, args)
                    }
              }
            }
          )
        }
      `,
        { parser: 'babel' }
      )
      ctx.res.statusCode = 200
      ctx.res.setHeader('Content-Type', 'application/javascript')
      ctx.body = result
    })

    router.get('/majsoul_plus/plugin/fetch.js', async (ctx, next) => {
      ctx.res.statusCode = 200
      ctx.res.setHeader('Content-Type', 'application/javascript')
      ctx.body = `window.extensionFetch = id => {
  return (input, init) => {
    if (typeof input !== 'string') {
      return
    }
    return fetch(\`majsoul_plus/extension/\${id}/\${input}\`, init)
  }
}`
    })
  }

  changeEnable(event, id: string, enabled: boolean) {
    super.changeEnable(event, id, enabled)
    ResourcePackManager.setLoadedExtensions(this.loadedDetails)
  }

  removePack(event, id: string) {
    super.removePack(event, id)
    ResourcePackManager.setLoadedExtensions(this.loadedDetails)
  }
}
