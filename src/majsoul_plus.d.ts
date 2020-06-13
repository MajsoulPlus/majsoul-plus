import { BrowserWindowConstructorOptions } from 'electron'

declare namespace MajsoulPlus {
  /**
   * Config
   */
  export interface UserWindowConfig {
    OSTheme: 'light' | 'dark'
    gameWindowSize: string
    zoomFactor: number
    renderingMultiple: number
    isKioskModeOn: boolean
    isNoBorder: boolean
    isManagerHide: boolean
  }

  export interface UserUpdateConfig {
    prerelease: boolean
  }

  export interface UserChromiumConfig {
    isHardwareAccelerationDisable: boolean
    isInProcessGpuOn: boolean
    isIgnoreGpuBlacklist: boolean
    proxyUrl: string
  }

  export interface UserDataConfig {
    useHttpServer: boolean
    serverToPlay: number
  }

  export interface UserConfig {
    window: UserWindowConfig
    update: UserUpdateConfig
    chromium: UserChromiumConfig
    userData: UserDataConfig
  }

  /**
   * Global
   */
  export interface Global {
    version: string
    ServerPort: number
    XOR_KEY: number
    EXTEND_RES_KEYWORD: string
    ResourcePackConfigPath: string
    ExtensionConfigPath: string
    ToolConfigPath: string
    UserConfigPath: string
    LocalCachePath: string
    ResourceFolderPath: string
    ExtensionFolderPath: string
    ToolFolderPath: string

    GameWindowConfig: BrowserWindowConstructorOptions
    ManagerWindowConfig: BrowserWindowConstructorOptions
    ToolWindowConfig: BrowserWindowConstructorOptions
    HttpGetUserAgent: string
  }

  export interface WindowWebPreferenceConfig {
    webSecurity: boolean
    allowRunningInsecureContent?: boolean
    nodeIntegration?: boolean
    plugins?: boolean
  }

  export interface GlobalPath {
    LocalDir: string
    ResourcePackDir: string
    ExtensionDir: string
    ToolsDir: string
  }

  /**
   * Common Metadata
   */
  export interface Metadata {
    id: string
    version: string
    name?: string
    author?: string | string[]
    description?: string
    preview?: string
    dependencies?: { [key: string]: string }
  }

  /**
   * 资源包(Resource Pack)
   */
  export interface ResourcePack extends Metadata {
    replace: Array<string | ResourcePackReplaceEntry>
  }

  export interface ResourcePackReplaceEntry {
    from: string | string[]
    to: string
    'all-servers': boolean
    replace: boolean
  }

  /**
   * 扩展(Extension)
   */
  export interface Extension extends Metadata {
    entry?: string | string[]
    loadBeforeGame?: boolean
    applyServer?: number[]
    resourcepack?: Array<string | ResourcePackReplaceEntry>
  }

  /**
   * 工具(Tools)
   */
  export interface ToolConfig extends Metadata {
    index?: string
    windowOptions: BrowserWindowConstructorOptions
  }

  export interface WindowStatus {
    visible: boolean
    muted: boolean
  }

  export interface ResourceMap {
    res: { [key: string]: { prefix: string } }
  }
}
