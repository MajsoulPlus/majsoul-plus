import { BrowserWindow } from 'electron';
import { Configs } from '../config';

// tslint:disable-next-line
export const GameWindow = new BrowserWindow(Configs.GAME_WINDOW_CONFIG);
