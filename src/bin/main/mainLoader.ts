import { ipcRenderer, screen as electronScreen } from "electron";
import * as fs from "fs";
import * as path from "path";
import { Configs } from "../../config";
import { i18n } from "../../i18nInstance";

const userConfigs = require(Configs.USER_CONFIG_PATH);

const mainWindow: Electron.WebviewTag = document.querySelector("#mainWindow");
const mainWindowBox: HTMLDivElement = document.querySelector("#mainWindowBox");

const scalePercent = userConfigs.window.renderingMultiple;

let webContents: Electron.webContents;

let executeScriptsCodes: string[] = [];

let serverPort: number;

let clientRect: DOMRect;

const prebuildExecuteCode = (executeScriptInfo) => {
  const executePreferences = executeScriptInfo.executePreferences
    ? executeScriptInfo.executePreferences
    : {};
  let codeEntry = executeScriptInfo.entry;
  if (!codeEntry) {
    codeEntry = "script.js";
  }
  let code = "";
  if (Array.isArray(codeEntry)) {
    codeEntry.forEach((entry) => {
      code +=
        "\n" +
        fs
          .readFileSync(path.join(executeScriptInfo.filesDir, entry))
          .toString("utf-8");
    });
  } else {
    code = fs
      .readFileSync(path.join(executeScriptInfo.filesDir, codeEntry))
      .toString("utf-8");
  }
  const sanboxCode = `const sandbox = new Proxy({}, {
    get(target, prop) {
      const eventHandlers = []
      if (target.hasOwnProperty(prop)) {
        return target[prop]
      }
      if (prop === "window") {
        return sandbox
      }
      if (prop === "global") {
        return sandbox
      }
      if (prop === "open") {
        return window.open.bind(window)
      }
      if (prop === "setTimeout") {
        return (fun, ...props)=>{return setTimeout(fun.bind(sandbox), ...props)}
      }
      if (prop === "clearTimeout") {
        return (...props)=>{return clearTimeout(...props).bind(window)}
      }
      if (prop === "setInterval") {
        return (fun, ...props)=>{return setInterval(fun.bind(sandbox), ...props)}
      }
      if (prop === "clearInterval") {
        return (...props)=>{return clearInterval(...props).bind(window)}
      }
      if (prop === "requestAnimationFrame") {
        return (fun, ...props)=>{return requestAnimationFrame(fun.bind(sandbox), ...props)}
      }
      if (prop === "cancelAnimationFrame") {
        return (...props)=>{return cancelAnimationFrame(...props).bind(window)}
      }
      if (prop === "addEventListener") {
        return (evt, fun, ...props)=>{
          const bindFun = fun.bind(sandbox)
          eventHandlers.push({
            unbind: fun,
            bind: bindFun
          })
          window.addEventListener(evt, bindFun, ...props)
        }
      }
      if (prop === "removeEventListener") {
        return (evt, fun, ...props)=>{
          let flag = false
          eventHandlers.some((element,index,arr)=>{
            const found = element.unbind === fun
            if(found){
              flag = window.removeEventListener(evt, bindFun, ...props)
              arr.splice(index,1)
              return true
            }else{
              return false
            }
          })
        }
      }
      if (prop === "require" && ${!!executePreferences.nodeRequire} === false) {
        return undefined
      }
      if (prop === "document" && ${!!executePreferences.document} === false) {
        return undefined
      }
      if (prop === "localStorage" && ${!!executePreferences.localStorage} === false) {
        return undefined
      }
      if (prop === "XMLHttpRequest" && ${!!executePreferences.XMLHttpRequest} === false) {
        return undefined
      }
      if (prop === "WebSocket" && ${!!executePreferences.WebSocket} === false) {
        return undefined
      }
      if (prop === Symbol.unscopables) {
        return undefined
      }
      return window[prop]
    },
    has() { return true },
    set(target, prop, value) {
      target[prop] = value
      if (${!!executePreferences.writeableWindowObject} === true) {
        window[prop] = target[prop]
      }
      return target[prop]
    }
  })`;
  if (!executeScriptInfo.sync) {
    code = `(()=>{
      let __raf;
      ${sanboxCode}
      const __rafFun=()=>{
        if(window.game) {
              with (sandbox) {
              ${code}
            }
          } else
          {__raf=requestAnimationFrame(__rafFun)
          }
        }
      __raf=requestAnimationFrame(__rafFun)
      })()`;
  } else {
    code = `(()=>{
      ${sanboxCode}
      with (sandbox) {${code}}
    })()`;
  }
  return code;
};

// Sanbox from https://zhuanlan.zhihu.com/p/58602800
const sandbox = new Proxy(
  {},
  {
    get(target, prop) {
      if (target.hasOwnProperty(prop)) {
        return target[prop];
      }
      if (prop === "window") {
        return sandbox;
      }
      if (prop === "global") {
        return sandbox;
      }
      if (prop === "require" && false === false) {
        return undefined;
      }
      if (prop === "document" && false === false) {
        return undefined;
      }
      if (prop === "localStorage" && false === false) {
        return undefined;
      }
      if (prop === "XMLHttpRequest" && false === false) {
        return undefined;
      }
      if (prop === "WebSocket" && false === false) {
        return undefined;
      }
      if (prop === Symbol.unscopables) {
        return undefined;
      }
      return window[prop];
    },
    has() {
      return true;
    },
    set(target, prop, value) {
      target[prop] = value;

      // FIXME: Useless true === true
      // if (true === true) {
      window[prop] = target[prop];
      // }
      return true;
    }
  }
);

let screenshotCounter = 0;
let screenshotTimer;
const showScreenshotLabel = (src) => {
  const screenshotImage: HTMLImageElement = document.querySelector(
    "#screenshotImage"
  );
  const screenshotText = document.getElementById("screenshotText");
  const screenshotLabel = document.getElementById("screenshotLabel");
  screenshotImage.src = src;
  screenshotText.innerText = screenshotCounter++
    ? i18n.text.main.screenshotsSaved(screenshotCounter)
    : i18n.text.main.screenshotSaved();
  screenshotLabel.classList.remove("hide");
  screenshotLabel.classList.add("show");
  clearTimeout(screenshotTimer);
  screenshotTimer = setTimeout(() => {
    screenshotLabel.classList.remove("show");
    clearTimeout(screenshotTimer);
    screenshotTimer = setTimeout(() => {
      screenshotLabel.classList.add("hide");
      screenshotCounter = 0;
    }, 300);
  }, 8000);
};

ipcRenderer.on("window-resize", (event, ...args) => {
  clientRect = args[0];
});

ipcRenderer.on("take-screenshot", () => {
  if (webContents) {
    // 回调函数
    const callbackFunction = (image: Electron.NativeImage) => {
      ipcRenderer.send("application-message", "take-screenshot", image.toPNG());
    };
    const rect = clientRect;
    const display = electronScreen.getDisplayMatching({
      x: Math.floor(rect.x),
      y: Math.floor(rect.y),
      width: Math.floor(rect.width),
      height: Math.floor(rect.height)
    });
    webContents.capturePage(
      {
        x: 0,
        y: 0,
        width: Math.floor(mainWindow.clientWidth * display.scaleFactor),
        height: Math.floor(mainWindow.clientHeight * display.scaleFactor)
      },
      callbackFunction
    );
  }
});

ipcRenderer.on("screenshot-saved", (event, ...args) => {
  const src = args[0];
  showScreenshotLabel("file://" + src);
});

ipcRenderer.on("open-devtools", () => {
  if (webContents) {
    // webContents.openDevTools({ mode: "detach" })
    mainWindow.openDevTools();
  }
});

const testRedirectGameWindow = (url) => {
  return (
    url.startsWith(Configs.REMOTE_DOMAIN) ||
    url.startsWith(Configs.HTTP_REMOTE_DOMAIN)
  );
};

const testIsLocalGameWindow = (url) => {
  return url.startsWith("https://localhost:");
};
const getLocalUrlWithParams = (url) => {
  if (url.includes("?")) {
    return `https://localhost:${serverPort}/0/${url.substring(
      url.indexOf("?")
    )}`;
  }
  return `https://localhost:${serverPort}/0/`;
};
const redirectGameWindow = (url, gameWindow) => {
  const localUrl = getLocalUrlWithParams(url);
  console.warn("Redirect Target:" + localUrl);
  gameWindow.loadURL(localUrl);
};

ipcRenderer.on("server-port-load", (event, ...args) => {
  console.warn("server-port-load");
  serverPort = args[0];
  ipcRenderer.send("main-loader-message", "server-port-loaded");
});

ipcRenderer.on("executes-load", (event, ...args) => {
  console.warn("executes-load");
  const executeScripts = args[0];
  executeScriptsCodes = [];
  executeScripts.forEach((executeScript) => {
    const code = prebuildExecuteCode(executeScript);
    executeScriptsCodes.push(code);
  });
  ipcRenderer.send("main-loader-message", "executes-loaded");
});

const scaleWindow = (percent = scalePercent) => {
  mainWindowBox.style.width = `${percent}vw`;
  mainWindowBox.style.height = `${percent}vh`;
  mainWindowBox.style.transform = `scale(${100 / percent}) translate(${(100 -
    percent) /
    2}%, ${(100 - percent) / 2}%)`;
};

mainWindow.addEventListener("dom-ready", () => {
  if (!webContents) {
    webContents = mainWindow.getWebContents();
    webContents.setZoomFactor(1);
    ipcRenderer.send("main-loader-message", "main-loader-ready");

    webContents.on("dom-ready", () => {
      executeScriptsCodes.forEach((executeScriptCode) => {
        webContents.executeJavaScript(executeScriptCode);
      });
    });

    webContents.on("will-navigate", (evt, url) => {
      if (testRedirectGameWindow(url)) {
        evt.preventDefault();
        redirectGameWindow(url, mainWindow);
      }
    });

    if (process.env.NODE_ENV === "development") {
      // webContents.openDevTools({ mode: "detach" })
      mainWindow.openDevTools();
    }
  }

  if (testIsLocalGameWindow(mainWindow.src)) {
    scaleWindow(scalePercent);
    mainWindow.insertCSS("body{overflow:hidden;}");
  } else {
    scaleWindow(100);
  }
});

ipcRenderer.on("load-url", (event, ...args) => {
  const url = args[0];
  console.warn("LoadURL", url);
  if (testRedirectGameWindow(url)) {
    redirectGameWindow(url, mainWindow);
  } else {
    mainWindow.loadURL(url);
  }
  mainWindowBox.style.width = "100vw";
  mainWindowBox.style.height = "100vh";
  mainWindowBox.style.transform = "none";
});
