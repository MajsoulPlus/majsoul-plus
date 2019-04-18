import * as fs from 'fs'
import { Global } from '../global'
import { MajsoulPlus } from '../majsoul_plus'

/**
 * 加载 Mod
 * @param mods 保存 Mod 的数组
 */
export function loadMods(mods: MajsoulPlus.Mod[]) {
  // Mod文件根目录
  // const modRootDir = path.join(__dirname, Configs.MODS_DIR)
  // 所有已在目录中的Mod目录
  // const modDirs = fs.readdirSync(modRootDir)
  try {
    const data = fs.readFileSync(Global.ModsConfigPath, {
      encoding: 'utf-8'
    })
    Array.prototype.push.apply(mods, JSON.parse(data))
  } catch (error) {
    console.error(error)
  }
}

// tslint:disable-next-line
export const Mods: MajsoulPlus.Mod[] = [];
