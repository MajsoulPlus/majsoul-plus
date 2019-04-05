import { BrowserWindow } from 'electron';
import * as path from 'path';

export let audioPlayer: BrowserWindow;

/**
 * 初始化音频播放器
 */
export function initPlayer() {
  audioPlayer = new BrowserWindow({
    show: false
  });
  audioPlayer.loadURL(
    'file://' + path.join(__dirname, 'bin/audio/player.html')
  );
}
/**
 * 退出播放器窗口
 */
export function shutoffPlayer() {
  audioPlayer.close();
}
