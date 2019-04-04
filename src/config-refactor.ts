import * as fs from 'fs';

import { fillObject } from './utils-refactor';
import { majsoulPlusGlobal } from './global';

/**
 * 默认配置
 */
const defaultWindowConfig: MajsoulPlus.WindowConfig = {
  OSTheme: 'light',
  gameWindowSize: '',
  zoomFactor: 1,
  renderingMultiple: 100,
  isKioskModeOn: false,
  isNoBorder: false,
  isManagerHide: false
};

const defaultUpdateConfig: MajsoulPlus.UpdateConfig = {
  prerelease: false
};

const defaultChromiumConfig: MajsoulPlus.ChromiumConfig = {
  isHardwareAccelerationDisable: false,
  isInProcessGpuOn: true,
  isIgnoreGpuBlacklist: false
};

const defaultUserDataConfig: MajsoulPlus.UserDataConfig = {
  useAppdataLibrary: false
};

export const defaultConfig: MajsoulPlus.Config = {
  window: defaultWindowConfig,
  update: defaultUpdateConfig,
  chromium: defaultChromiumConfig,
  userData: defaultUserDataConfig
};

/**
 * 冻结对象使其不可更改
 */
Object.freeze(defaultWindowConfig);
Object.freeze(defaultUpdateConfig);
Object.freeze(defaultChromiumConfig);
Object.freeze(defaultUserDataConfig);
Object.freeze(defaultConfig);

/**
 * 加载配置文件 json
 */
export function LoadConfigJson(): MajsoulPlus.Config {
  let config: MajsoulPlus.Config;
  try {
    config = JSON.parse(
      fs.readFileSync(majsoulPlusGlobal.USER_CONFIG_PATH, {
        encoding: 'utf-8'
      })
    );
  } catch (e) {
    config = fillObject({}, defaultConfig) as MajsoulPlus.Config;
  }
  return config;
}
