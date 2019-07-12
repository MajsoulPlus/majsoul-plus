import * as Koa from 'koa'
import * as Router from 'koa-router'
import { MajsoulPlus } from '../majsoul_plus'
import { getRemoteSource } from '../utils/main'
import { encodeData } from '../utils'

class ResourcePackManager {
  private resourcePacks: Map<string, MajsoulPlus.ResourcePack> = new Map()

  use(id: string) {
    //
  }

  register(server: Koa, router: Router) {
    // 为每一个资源包分配一个路径
    this.resourcePacks.forEach((value, key) => {
      router.get(
        // TODO: 兼容非国服 将此处 true 改为判断是否国服
        `${true ? '/0' : ''}/resourcepack/${key}`,
        async (ctx, next) => {
          await next()
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
