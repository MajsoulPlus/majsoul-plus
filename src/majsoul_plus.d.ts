declare namespace MajsoulPlus {
  /**
   * Config
   */
  export interface WindowConfig {
    OSTheme: 'light' | 'dark';
    gameWindowSize: string;
    zoomFactor: number;
    renderingMultiple: number;
    isKioskModeOn: boolean;
    isNoBorder: boolean;
    isManagerHide: boolean;
  }

  export interface UpdateConfig {
    prerelease: boolean;
  }

  export interface ChromiumConfig {
    isHardwareAccelerationDisable: boolean;
    isInProcessGpuOn: boolean;
    isIgnoreGpuBlacklist: boolean;
  }

  export interface UserDataConfig {
    useAppdataLibrary: boolean;
  }

  export interface Config {
    window: WindowConfig;
    update: UpdateConfig;
    chromium: ChromiumConfig;
    userData: UserDataConfig;
  }

  /**
   * Global
   */
  export interface Global {
    SERVER_PORT: number;
    XOR_KEY: number;
    EXTEND_RES_KEYWORD: string;
    REMOTE_DOMAIN: string;
    HTTP_REMOTE_DOMAIN: string;
    LOCAL_DIR: string;
    MODS_DIR: string;
    MODS_CONFIG_PATH: string;
    PLUGINS_DIR: string;
    TOOLS_DIR: string;
    EXECUTES_DIR: string;
    EXECUTES_CONFIG_PATH: string;
    USER_CONFIG_PATH: string;
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
