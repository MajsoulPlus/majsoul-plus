import * as fs from 'fs';
import { Global } from './global';
import { MajsoulPlus } from './majsoul_plus';
import { fillObject } from './utils-refactor';

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
};

const defaultUpdateConfig: MajsoulPlus.UserUpdateConfig = {
  prerelease: false
};

const defaultChromiumConfig: MajsoulPlus.UserChromiumConfig = {
  isHardwareAccelerationDisable: false,
  isInProcessGpuOn: true,
  isIgnoreGpuBlacklist: false
};

const defaultUserDataConfig: MajsoulPlus.UserDataConfig = {
  useAppdataLibrary: false
};

// tslint:disable-next-line
export const DefaultConfig: MajsoulPlus.UserConfig = {
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
Object.freeze(DefaultConfig);

/**
 * 加载配置文件 json
 */
export function LoadConfigJson(): MajsoulPlus.UserConfig {
  let config: MajsoulPlus.UserConfig;
  try {
    config = JSON.parse(
      fs.readFileSync(Global.UserConfigPath, {
        encoding: 'utf-8'
      })
    );
  } catch (e) {
    config = fillObject({}, DefaultConfig) as MajsoulPlus.UserConfig;
  }
  SaveConfigJson(config);
  return config;
}

export function SaveConfigJson(config: MajsoulPlus.UserConfig) {
  fs.writeFileSync(Global.UserConfigPath, JSON.stringify(config, null, 2), {
    encoding: 'utf-8'
  });
}

// tslint:disable-next-line
export const UserConfigs: MajsoulPlus.UserConfig = LoadConfigJson();
