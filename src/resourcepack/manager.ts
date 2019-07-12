import * as Koa from 'koa'
import * as Router from 'koa-router'
import { MajsoulPlus } from '../majsoul_plus'

class ResourcePackManager {
  private resourcePacks: Map<string, MajsoulPlus.ResourcePack> = new Map()

  use(id: string) {
    //
  }

  async addRouter(server: Koa, router: Router) {
    // 为每一个资源包分配一个路径
    this.resourcePacks.forEach((value, key) => {
      router.get(`${true ? '/0/' : ''}/resourcepack/${key}`, (ctx, next) => {
        //
      })
    })

    // map
    server.use(async (ctx, next) => {
      //
    })
  }
}

export default new ResourcePackManager()
