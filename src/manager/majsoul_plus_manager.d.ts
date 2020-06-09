declare namespace MajsoulPlus_Manager {
  export interface GetDetailMetadataResponse {
    [id: string]: CardMetadataWithEnable
  }

  export interface CardMetadata {
    type: string
    id: string
    version: string
    name?: string
    author?: string | string[]
    description?: string
    preview?: string
  }

  export interface CardMetadataWithEnable {
    enabled: boolean
    sequence: number
    errors: Array<string | string[]>
    metadata: CardMetadata
  }

  // 导出包的信息
  export interface ExportInfo {
    extend: string[]
    typeText: string
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
    region_urls: string[]
  }

  export interface ServerListJson {
    servers: string[]
  }
}
