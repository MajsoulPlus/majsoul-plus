declare namespace MajsoulPlus_Manager {
  export interface CardConstructorOptions {
    name?: string
    author?: string
    description?: string
    preview?: string
    filesDir: string
  }

  export interface CardListConstructorOptions {
    rootDir: string
    config: string
    checkedKeys: string[]
    renderTarget: string
    settingFilePath: string
  }

  /**
   * Majsoul JSON
   */
  export interface VersionJson {
    code: string
    version: string
  }

  export interface ResVersionJson {
    [key: string]: {
      prefix: string
    }
  }

  export interface ConfigJson {
    ip: ConfigJsonItem[]
    goods_sheleve_id: string
  }

  export interface ConfigJsonItem {
    name: string
    region_urls: RegionUrls
  }

  export interface RegionUrls {
    ['mainland']: string
    ['hk']: string
  }

  export interface ServerListJson {
    servers: string[]
  }
}
