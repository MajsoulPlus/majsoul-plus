import * as fs from 'fs';
import { ServerOptions } from 'https';
import * as Koa from 'koa';
import * as path from 'path';
import { MajsoulPlus } from './majsoul_plus';
import { loadMods, Mods } from './mod/mods';
import { getLocalURI, isEncryptRes, isPath } from './utils-refactor';

/**
 * 获取文件的路由函数
 */
// TODO: Simplify this function
export function processRequest(mods: MajsoulPlus.Mod[]) {
  return (ctx: Koa.Context, next: Function) => {
    if (mods.length === 0) {
      loadMods(mods);
    }
    const originalUrl = ctx.request.originalUrl;
    const encrypt = isEncryptRes(originalUrl);
    const isRoutePath = isPath(originalUrl);
    const localURI = getLocalURI(originalUrl, isRoutePath);

    let promise: Promise<Function> = Promise.reject();

    for (const mod of mods) {
      promise = promise.then(
        data => data,
        () => {
          const modDir = mod.dir;
          let promiseMod: Promise<Function> = Promise.reject();

          // 平滑升级至 mod.dir
          if (mod.dir === undefined && mod.filesDir) {
            mod.dir = mod.filesDir;
            mod.filesDir = undefined;
          }

          if (mod.replace && mod.replace.length > 0) {
            mod.replace.forEach(replaceInfo => {
              const regExp = new RegExp(replaceInfo.from);
              if (!regExp.test(originalUrl)) {
                return;
              }
              const localURI = this.getLocalURI(
                originalUrl.replace(regExp, replaceInfo.to),
                isRoutePath,
                path.join(mod.dir, modDir || '/files')
              );
              promiseMod = promiseMod.then(
                data => data,
                () => this.readFile(localURI)
              );
            });
          }
          const localURI = this.getLocalURI(
            originalUrl,
            isRoutePath,
            path.join(mod.dir, modDir || '/files')
          );
          promiseMod = promiseMod.then(
            data => data,
            () => this.readFile(localURI)
          );
          return promiseMod;
        }
      );
    }
  };
}

// tslint:disable-next-line
export const Server = new Koa().use(processRequest(Mods));

// tslint:disable-next-line
export const serverOptions: ServerOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificate/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificate/cert.crt'))
};

Object.freeze(serverOptions);
