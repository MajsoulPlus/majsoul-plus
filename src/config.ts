import * as fs from 'fs'
import { Global } from './global'
import { MajsoulPlus } from './majsoul_plus'
import { fillObject } from './utils'

/**
 * 默认配置
 */
const defaultWindowConfig: MajsoulPlus.UserWindowConfig = {
  OSTheme: 'light',
  gameWindowSize: '',
  zoomFactor: 1,
  renderingMultiple: 100,
  isKioskModeOn: false,
  isNoBorder: false,
  isManagerHide: false
}

const defaultUpdateConfig: MajsoulPlus.UserUpdateConfig = {
  prerelease: false
}

const defaultChromiumConfig: MajsoulPlus.UserChromiumConfig = {
  isHardwareAccelerationDisable: false,
  isInProcessGpuOn: true,
  isIgnoreGpuBlacklist: false,
  proxyUrl: ''
}

const defaultUserDataConfig: MajsoulPlus.UserDataConfig = {
  useHttpServer: false,
  serverToPlay: 0
}

const defaultConfig: MajsoulPlus.UserConfig = {
  chromium: defaultChromiumConfig,
  update: defaultUpdateConfig,
  userData: defaultUserDataConfig,
  window: defaultWindowConfig
}

/**
 * 冻结对象使其不可更改
 */
Object.freeze(defaultWindowConfig)
Object.freeze(defaultUpdateConfig)
Object.freeze(defaultChromiumConfig)
Object.freeze(defaultUserDataConfig)
Object.freeze(defaultConfig)

/**
 * 加载配置文件 json
 */
export function LoadConfigJson(): MajsoulPlus.UserConfig {
  let config: MajsoulPlus.UserConfig
  if (!fs.existsSync(Global.UserConfigPath)) SaveConfigJson(defaultConfig)
  try {
    config = JSON.parse(
      fs.readFileSync(Global.UserConfigPath, {
        encoding: 'utf-8'
      })
    )
  } catch (e) {
    config = {} as MajsoulPlus.UserConfig
  }
  config = fillObject(config, defaultConfig) as MajsoulPlus.UserConfig
  SaveConfigJson(config)
  return config
}

export function SaveConfigJson(config: MajsoulPlus.UserConfig) {
  fs.writeFileSync(Global.UserConfigPath, JSON.stringify(config, null, 2), {
    encoding: 'utf-8'
  })
}

export const UserConfigs: MajsoulPlus.UserConfig = LoadConfigJson()
