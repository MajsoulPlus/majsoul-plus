import { BrowserWindow } from 'electron'
import * as path from 'path'

export let AudioPlayer: BrowserWindow

/**
 * 初始化音频播放器
 */
export function initPlayer() {
  AudioPlayer = new BrowserWindow({
    show: false
  })
  AudioPlayer.loadURL(
    'file://' + path.join(__dirname, '../bin/audio/player.html')
  )
}
/**
 * 退出播放器窗口
 */
export function shutoffPlayer() {
  AudioPlayer.close()
}
