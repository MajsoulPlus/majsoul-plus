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
  }

  export interface UserDataConfig {
    useAppdataLibrary: boolean
    useHttpServer: boolean
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
    RemoteDomain: string
    HttpRemoteDomain: string
    ResourcePackConfigPath: string
    ExtensionConfigPath: string
    ExecutesConfigPath: string
    ToolConfigPath: string
    UserConfigPath: string
    LocalCachePath: string

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
    ExecutesDir: string
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
  }

  /**
   * 资源包(Resource Pack)
   */
  export interface ResourcePack extends Metadata {
    dependencies?: { [key: string]: string }
    replace: Array<string | ResourcePackReplaceEntry>
  }

  export interface ResourcePackReplaceEntry {
    from: string | string[]
    to: string
  }

  /**
   * 扩展(Extension)
   */
  export interface Extension extends Metadata {
    dependencies?: { [key: string]: string }
    entry?: string | string[]
    sync?: boolean
    executePreferences?: ExtensionPreferences
  }

  export interface ExtensionPreferences {
    nodeRequire?: boolean
    document?: boolean
    localStorage?: boolean
    XMLHttpRequest?: boolean
    WebSocket?: boolean
    writeableWindowObject?: boolean
  }

  export interface ExtensionLibraries {
    path: Object | undefined
    fs: Object | undefined
  }

  export interface ExtensionContext {
    instance: Extension
    libraries: ExtensionLibraries
    require: (toRequire: string) => Object | undefined
  }

  export type ExtensionMiddleware = (
    context: ExtensionContext,
    next: () => Promise<any>
  ) => any

  export type ComposedExtensionMiddleware = (
    context: ExtensionContext,
    next?: () => Promise<any>
  ) => Promise<void>

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
}
