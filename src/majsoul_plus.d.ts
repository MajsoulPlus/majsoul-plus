declare namespace MajsoulPlus {
  /**
   * Config
   */
  export interface UserWindowConfig {
    OSTheme: 'light' | 'dark';
    gameWindowSize: string;
    zoomFactor: number;
    renderingMultiple: number;
    isKioskModeOn: boolean;
    isNoBorder: boolean;
    isManagerHide: boolean;
  }

  export interface UserUpdateConfig {
    prerelease: boolean;
  }

  export interface UserChromiumConfig {
    isHardwareAccelerationDisable: boolean;
    isInProcessGpuOn: boolean;
    isIgnoreGpuBlacklist: boolean;
  }

  export interface UserDataConfig {
    useAppdataLibrary: boolean;
  }

  export interface UserConfig {
    window: UserWindowConfig;
    update: UserUpdateConfig;
    chromium: UserChromiumConfig;
    userData: UserDataConfig;
  }

  /**
   * Global
   */
  export interface Global {
    ServerPort: number;
    XOR_KEY: number;
    EXTEND_RES_KEYWORD: string;
    RemoteDomain: string;
    HttpRemoteDomain: string;
    LocalDir: string;
    ModsDir: string;
    ModsConfigPath: string;
    PluginsDir: string;
    ToolsDir: string;
    ExecutesDir: string;
    ExecutesConfigPath: string;
    UserConfigPath: string;

    GameWindowConfig: WindowConfig;
    ManagerWindowConfig: WindowConfig;
    ToolWindowConfig: WindowConfig;
    HttpGetUserAgent: string;
  }

  export interface WindowConfig {
    title?: string;
    icon: string;
    width: number;
    height: number;
    frame: boolean;
    resizable: boolean;
    maximizable?: boolean;
    fullscreenable?: boolean;
    backgroundColor: string;
    webPreferences: WindowWebPreferenceConfig;
    autoHideMenuBar: boolean;
    show?: boolean;
    enableLargerThanScreen?: boolean;
    useContentSize?: boolean;
  }

  export interface WindowWebPreferenceConfig {
    webSecurity: boolean;
    allowRunningInsecureContent?: boolean;
    nodeIntegration?: boolean;
    plugins?: boolean;
  }

  /**
   * Mod
   */
  export interface Mod {
    name: string;
    author: string;
    description: string;
    dir?: string;
    filesDir?: string;
    preview: string;
    replace: Replace[];
    execute: Extension;
  }

  export interface Replace {
    from: string;
    to: string;
  }

  export interface Extension {
    //TODO:
  }
}
