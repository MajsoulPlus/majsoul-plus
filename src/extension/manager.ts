import * as fs from 'fs';
import * as compose from 'koa-compose';
import * as path from 'path';
import { Configs } from '../config';
import { appDataDir } from '../global';
import { GameWindow } from '../windows/game';

class MajsoulPlusExtensionManager {
  private loadedExtensions: { [extension: string]: boolean } = {};
  private extensionConfigs: MajsoulPlus.Extension[];
  private extensionMiddlewares: MajsoulPlus.ExtensionMiddleware[];
  readonly version: string = '1.0.0.0';

  use(ext: string) {
    // extension id check
    if (!ext.match(/^[_a-zA-Z]$/)) {
      console.error(`failed to load extension ${ext}: invalid extension id `);
      this.loadedExtensions[ext] = false;
      return this;
    }

    const folder = path.resolve(appDataDir, Configs.EXECUTES_DIR, ext);
    const cfg = path.resolve(folder, 'extension.json');

    if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
      console.error(`failed to load extension ${ext}: not found`);
      this.loadedExtensions[ext] = false;
      return this;
    }

    if (!fs.existsSync(cfg) || !fs.statSync(cfg).isFile()) {
      console.error(
        `failed to load extension ${ext}: extension.json not found`
      );
      this.loadedExtensions[ext] = false;
      return this;
    }

    const extension: MajsoulPlus.Extension = JSON.parse(
      fs.readFileSync(cfg, {
        encoding: 'utf-8'
      })
    );

    // TODO: JSON Schema

    if (this.loadedExtensions[extension.id]) {
      console.error(
        `failed to load extension ${ext}: extension already loaded`
      );
      this.loadedExtensions[ext] = false;
      return this;
    }

    if (extension.dependencies) {
      for (const dep of extension.dependencies) {
        if (
          this.loadedExtensions[dep] === null ||
          this.loadedExtensions[dep] === false
        ) {
          console.error(
            `failed to load extension ${ext}: dependency ${dep} not found`
          );
          this.loadedExtensions[ext] = false;
          return this;
        }
      }
    }

    /**
     * Warnings
     */
    if (extension.id !== ext) {
      console.warn(
        `warning on loading extension ${ext}: folder name & id mismatch`
      );
    }

    if (extension.preview) {
      if (
        !fs.existsSync(extension.preview) ||
        !fs.statSync(extension.preview).isFile()
      ) {
        console.warn(
          `warning on loading extension ${ext}: preview image not found`
        );
      }
    }
    return this;
  }

  useScript(folder: string, extension: MajsoulPlus.Extension) {
    if (!Array.isArray(extension.entry)) {
      extension.entry = [extension.entry];
    }

    if (this.loadedExtensions[extension.id] === undefined) {
      this.loadedExtensions[extension.id] = true;
    }

    const useScript = (entry: string) => {
      if (this.loadedExtensions[extension.id] === false) return;

      const p = path.resolve(appDataDir, Configs.EXECUTES_DIR, folder, entry);
      if (!fs.existsSync(p)) {
        this.loadedExtensions[extension.id] = false;
        console.error(`extension entry ${entry} not found!`);
        return;
      }

      try {
        const script = require(p);
        this.extensionMiddlewares.push(script());
      } catch (e) {
        console.error(`failed to load extension ${extension.name} from: ${p}`);
      }
    };

    extension.entry.forEach(useScript);
    return this;
  }

  inject() {
    const fn = compose(this.extensionMiddlewares);
    // TODO: Implement on('extension-context'), communicate between threads
    GameWindow.webContents.send('extension-context', undefined);
    GameWindow.webContents.send('extension-middlewares', fn);
  }
}

// tslint:disable-next-line
export const ExtensionManager = new MajsoulPlusExtensionManager();
