import * as fs from 'fs';
import * as compose from 'koa-compose';
import * as path from 'path';
import { Configs } from '../config';
import { appDataDir } from '../global';
import { GameWindow } from '../windows/game';

class MajsoulPlusExtensionManager {
  private extensionConfigs: MajsoulPlus.Extension[];
  private extensionScripts: MajsoulPlus.ExtensionMiddleware[];
  readonly version: string = '1.0.0.0';

  use(folder: string, extension: MajsoulPlus.Extension) {
    if (!Array.isArray(extension.entry)) {
      extension.entry = [extension.entry];
    }

    const useScript = (entry: string) => {
      const p = path.resolve(appDataDir, Configs.EXECUTES_DIR, folder, entry);
      if (!fs.existsSync(p)) {
        console.error(`extension entry ${entry} not found!`);
        return;
      }

      try {
        const script = require(p);
        this.extensionScripts.push(script);
      } catch (e) {
        console.error(`failed to load extension ${extension.name} from: ${p}`);
      }
    };
    extension.entry.forEach(useScript);
    return this;
  }

  inject() {
    compose(this.extensionScripts);
    // TODO: Implement on('extension-load'), communicate between threads
    GameWindow.webContents.send('extension-load', this.extensionScripts);
  }
}

// tslint:disable-next-line
export const ExtensionManager = new MajsoulPlusExtensionManager();
