import * as fs from 'fs';
import * as compose from 'koa-compose';
import * as path from 'path';
import { Configs } from '../config';
import { appDataDir, Global, GlobalPath } from '../global';
import { MajsoulPlus } from '../majsoul_plus';
import { GameWindow } from '../windows/game';
import { Version } from '../utils/version';
import { fillObject } from '../utils-refactor';
import { defaultExtension } from './extension';

class MajsoulPlusExtensionManager {
  private loadedExtensions: { [extension: string]: Version } = {};
  private extensionConfigs: MajsoulPlus.Extension[];
  private extensionMiddlewares: MajsoulPlus.ExtensionMiddleware[] = [];
  readonly version: string = '1.0.0';

  constructor() {
    this.loadedExtensions['majsoul_plus'] = Version.parse(Global.version);
  }

  use(ext: string) {
    // extension id check
    if (!ext.match(/^[_a-zA-Z]+$/)) {
      console.error(`failed to load extension ${ext}: invalid extension id `);
      return this;
    }

    const folder = path.resolve(appDataDir, GlobalPath.ExtensionDir, ext);
    const cfg = path.resolve(folder, 'extension.json');

    // folder
    if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
      console.error(`failed to load extension ${ext}: ${folder} not found`);
      return this;
    }

    // configuration file
    if (!fs.existsSync(cfg) || !fs.statSync(cfg).isFile()) {
      console.error(`failed to load extension ${ext}: ${cfg} not found`);
      return this;
    }

    // get extension
    const extension: MajsoulPlus.Extension = JSON.parse(
      fs.readFileSync(cfg, {
        encoding: 'utf-8'
      })
    );

    // fill default value
    fillObject(extension, defaultExtension);

    // TODO: JSON Schema

    // id uniqueness check
    if (this.loadedExtensions[extension.id]) {
      console.error(
        `failed to load extension ${ext}: extension already loaded`
      );
      return this;
    }

    if (extension.dependencies) {
      let version: Version;
      for (const dep in extension.dependencies) {
        // dependency not found
        if (this.loadedExtensions[dep] === undefined) {
          console.error(
            `failed to load extension ${ext}: dependency ${dep} not found`
          );
          return this;
        } else {
          // parse version
          try {
            version = Version.parse(extension.dependencies[dep]);
          } catch (e) {
            console.error(`failed to load extension ${ext}: ${e}`);
            return this;
          }
          // dependency version mismatch
          if (!version.match(this.loadedExtensions[dep])) {
            console.error(
              `failed to load extension ${ext}: the version of ${dep} loaded is ${
                this.loadedExtensions[dep]
              }, but required ${extension.dependencies[dep]}`
            );
            return this;
          }
        }
      }
    }

    /**
     * Warnings
     */
    // extension id & folder name mismatch
    if (extension.id !== ext) {
      console.warn(
        `warning on loading extension ${ext}: folder name & id mismatch`
      );
    }

    // preview image not found
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

    // all error checks are ok
    this.useScript(ext, extension);
    return this;
  }

  useScript(folder: string, extension: MajsoulPlus.Extension) {
    if (!Array.isArray(extension.entry)) {
      extension.entry = [extension.entry];
    }

    let err = false;

    const useScript = (entry: string) => {
      if (err) return;

      const p = path.resolve(
        appDataDir,
        GlobalPath.ExtensionDir,
        folder,
        entry
      );
      if (!fs.existsSync(p)) {
        console.error(`extension entry ${entry} not found!`);
        return;
      }

      try {
        const script = require(p);
        this.extensionMiddlewares.push(script());
      } catch (e) {
        console.error(
          `failed to load extension ${extension.name} from ${p}: ${e}`
        );
        err = true;
      }
    };

    extension.entry.forEach(useScript);
    if (!err) {
      try {
        this.loadedExtensions[extension.id] = Version.parse(extension.version);
      } catch (e) {
        console.error(`failed to load extension ${extension.name}: ${e}`);
      }
    }
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
