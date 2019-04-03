import {
  app as electronApp,
  BrowserWindow,
  clipboard,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  MenuItem,
  nativeImage
} from "electron";
import * as express from "express";
import * as fs from "fs";
import * as https from "https";
import * as os from "os";
import * as path from "path";
import { Configs } from "./config";
import { Util } from "./utils";

const server = express();

// const i18n = require('./i18nInstance')
import { AddressInfo } from "net";
import { I18n } from "./i18n";
const i18n = new I18n({
  autoReload: process.env.NODE_ENV === "development",
  actives: [electronApp.getLocale()]
});

let userConfigs;
try {
  userConfigs = JSON.parse(
    fs.readFileSync(Configs.USER_CONFIG_PATH, { encoding: "utf-8" })
  );
} catch (error) {
  userConfigs = {};
}

// 同步 configs-user.json
function jsonKeyUpdate(ja, jb) {
  Object.keys(ja).forEach((key) => {
    if (typeof ja[key] === "object" && typeof jb[key] === "object") {
      jsonKeyUpdate(ja[key], jb[key]);
    }
    if (jb[key] === undefined) {
      delete ja[key];
    }
  });
  Object.keys(jb).forEach((key) => {
    if (ja[key] === undefined) {
      ja[key] = jb[key];
    }
  });
}

jsonKeyUpdate(userConfigs, require(path.join(__dirname, "configs-user.json")));
fs.writeFileSync(Configs.USER_CONFIG_PATH, JSON.stringify(userConfigs));

const userDataDir = electronApp.getPath("userData");
const paths = [Configs.EXECUTES_DIR, Configs.MODS_DIR, Configs.TOOLS_DIR];
paths
  .map((dir) => path.join(userDataDir, dir))
  .forEach((dir) => !fs.existsSync(dir) && fs.mkdirSync(dir));

if (userConfigs.chromium.isInProcessGpuOn) {
  const osplatform = os.platform();
  switch (osplatform) {
    case "darwin":
    case "win32":
      electronApp.commandLine.appendSwitch("in-process-gpu");
      break;
    case "aix":
    case "android":
    case "cygwin":
    case "freebsd":
    case "openbsd":
    case "sunos":
    default:
      break;
  }
}
if (userConfigs.chromium.isIgnoreGpuBlacklist) {
  electronApp.commandLine.appendSwitch("ignore-gpu-blacklist");
}

const sererHttps = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, "certificate/key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "certificate/cert.crt"))
  },
  server
);

if (
  (() => {
    try {
      if (userConfigs.chromium["isHardwareAccelerationDisable"] === true) {
        return true;
      }
    } catch (err) {
      return false;
    }
    return false;
  })()
) {
  electronApp.disableHardwareAcceleration();
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

server.get("*", Util.processRequest);

electronApp.commandLine.appendSwitch("ignore-certificate-errors");
electronApp.commandLine.appendSwitch(
  "autoplay-policy",
  "no-user-gesture-required"
);

// 当所有窗口被关闭了，退出。
electronApp.on("window-all-closed", () => {
  // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前
  // 应用会保持活动状态
  // if (process.platform !== 'darwin') {
  electronApp.quit();
  // }
});

// 阻止证书验证
electronApp.on(
  "certificate-error",
  (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true); // eslint-disable-line standard/no-callback-literal
  }
);

// 设置一个菜单
const gameWindowMenu: Menu = new Menu();
gameWindowMenu.append(
  new MenuItem({
    label: "游戏",
    role: "services",
    submenu: [
      {
        label: "截图",
        accelerator: "F12",
        click: (menuItem, browserWindow) => {
          Util.takeScreenshot(browserWindow.webContents);
        }
      },
      {
        label: "截图",
        accelerator: "CmdOrCtrl+P",
        enabled: true,
        visible: false,
        click: (menuItem, browserWindow) => {
          Util.takeScreenshot(browserWindow.webContents);
        }
      },
      {
        label: "重新载入",
        accelerator: "CmdOrCtrl+R",
        click: (menuItem, browserWindow) => {
          browserWindow.reload();
        }
      },
      {
        label: "退出游戏",
        accelerator: "Alt+F4",
        click: (menuItem, browserWindow) => {
          browserWindow.close();
        }
      }
    ]
  })
);
gameWindowMenu.append(
  new MenuItem({
    label: "窗口",
    role: "window",
    submenu: [
      {
        label: "置顶",
        accelerator: "CmdOrCtrl+T",
        click: (menuItem, browserWindow) => {
          browserWindow.setAlwaysOnTop(!browserWindow.isAlwaysOnTop());
        }
      },
      {
        label: "全屏",
        accelerator: "F11",
        click: (menuItem, browserWindow) => {
          if (!userConfigs.window.isKioskModeOn) {
            browserWindow.setFullScreen(!browserWindow.isFullScreen());
          } else {
            browserWindow.setKiosk(!browserWindow.isKiosk());
          }
        }
      },
      {
        label: "全屏",
        accelerator: "F5",
        enabled: true,
        visible: false,
        click: (menuItem, browserWindow) => {
          if (!userConfigs.window.isKioskModeOn) {
            browserWindow.setFullScreen(!browserWindow.isFullScreen());
          } else {
            browserWindow.setKiosk(!browserWindow.isKiosk());
          }
        }
      },
      {
        label: "退出全屏",
        accelerator: "Esc",
        click: (menuItem, browserWindow) => {
          if (browserWindow.isFullScreen()) {
            browserWindow.setFullScreen(false);
            return;
          }
          if (browserWindow.isKiosk()) {
            browserWindow.setKiosk(false);
          }
        }
      }
    ]
  })
);
gameWindowMenu.append(
  new MenuItem({
    label: "编辑",
    role: "editMenu"
  })
);
gameWindowMenu.append(
  new MenuItem({
    label: "更多",
    submenu: [
      {
        label: "开发者工具",
        accelerator: "CmdOrCtrl+I",
        click: (menuItem, browserWindow) => {
          browserWindow.webContents.openDevTools({ mode: "detach" });
          browserWindow.webContents.send("open-devtools");
        }
      }
    ]
  })
);

const windowControl = {
  windowMap: { toolsMap: {} },
  _getGameWindowTitle: () => {
    // 彩蛋标题
    const titles = [
      {
        text: i18n.text.main.programName(),
        weight: 200
      },
      {
        text: i18n.text.main.nya(),
        weight: 1
      }
    ];
    const sumWeight = titles.reduce((last, value) => last + value.weight, 0);
    let randomResult = Math.random() * sumWeight;

    const index = titles.reduce((last: number | null, value, i) => {
      if (Number.isInteger(last)) {
        return last;
      }
      if ((randomResult -= value.weight) <= 0) {
        return i;
      }
      return null;
    }, null);
    return titles[index].text;
  },

  _getExecuteScripts: () => {
    let executeScripts;
    try {
      const data = fs.readFileSync(Configs.EXECUTES_CONFIG_PATH);
      executeScripts = JSON.parse(data.toString("utf-8"));
    } catch (error) {
      console.error(error);
      executeScripts = [];
    }
    try {
      const data = fs.readFileSync(Configs.MODS_CONFIG_PATH);
      const mods = JSON.parse(data.toString("utf-8"));
      mods.forEach((mod) => {
        if (mod.execute) {
          mod.execute.filesDir = mod.filesDir;
          executeScripts.push(mod.execute);
        }
      });
    } catch (error) {
      console.error(error);
    }
    return executeScripts;
  },

  electronReady: () => {
    return new Promise((resolve) => electronApp.once("ready", resolve));
  },

  initLocalMirrorServer: (serverHttps: https.Server, port: number) => {
    return new Promise((resolve) => {
      serverHttps.listen(port);
      serverHttps.on("listening", resolve);
      serverHttps.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.warn(i18n.text.main.portInUse());
          serverHttps.close();
          serverHttps.listen(0);
        }
      });
    });
  },
  initManagerWindow: (managerWindowConfig) => {
    const config = {
      ...managerWindowConfig
    };
    // hack macOS config
    if (process.platform === "darwin") {
      config.frame = false;
      config.titleBarStyle = "hidden";
      if (parseInt(process.versions.electron.split(".")[0], 10) > 2) {
        config.vibrancy = "light";
        config.backgroundColor = "rgba(0,0,0,0)";
      }
    }

    config.width *= userConfigs.window.zoomFactor;
    config.height *= userConfigs.window.zoomFactor;

    const managerWindow = new BrowserWindow(config);

    managerWindow.once("ready-to-show", () => {
      managerWindow.webContents.setZoomFactor(userConfigs.window.zoomFactor);
      managerWindow.show();
    });

    managerWindow.on("page-title-updated", (evt) => evt.preventDefault());
    managerWindow.once("close", (evt) => {
      evt.preventDefault();
      managerWindow.hide();
      evt.sender.send("saveConfig");
    });
    managerWindow.loadURL(
      "file://" + path.join(__dirname, "manager/index.html")
    );

    // Add environment config to open developer tools
    if (process.env.NODE_ENV === "development") {
      managerWindow.webContents.openDevTools({ mode: "detach" });
    }

    windowControl.windowMap["manager"] = managerWindow;
  },

  initGameWindow: (gameWindowConfig) => {
    const config = {
      ...gameWindowConfig,
      title: windowControl._getGameWindowTitle(),
      frame: !userConfigs.window.isNoBorder
    };
    // TODO: wait new setting system
    if (userConfigs["window"]["gameWindowSize"] !== "") {
      const windowSize = userConfigs["window"]["gameWindowSize"]
        .split(",")
        .map((value) => parseInt(value));
      config.width = windowSize[0];
      config.height = windowSize[1];
    }
    const gameWindow = new BrowserWindow(config);
    gameWindow.on("page-title-updated", (event) => event.preventDefault());
    gameWindow.on("resize", () => {
      userConfigs["window"]["gameWindowSize"] = gameWindow.getSize().toString();
      const obj = {
        mainKey: "window",
        key: "gameWindowSize",
        value: userConfigs["window"]["gameWindowSize"]
      };
      windowControl.windowMap["manager"].send(
        "changeConfig",
        JSON.stringify(obj)
      );
      gameWindow.webContents.send("window-resize", gameWindow.getBounds());
    });
    gameWindow.on("move", () => {
      gameWindow.webContents.send("window-resize", gameWindow.getBounds());
    });
    gameWindow.on("moved", () => {
      gameWindow.webContents.send("window-resize", gameWindow.getBounds());
    });
    gameWindow.on("closed", () => {
      Util.shutoffPlayer();
      sererHttps.close();
      if (userConfigs.window.isManagerHide) {
        const managerWindow = windowControl.windowMap["manager"];
        if (managerWindow) {
          managerWindow.show();
        }
      }
    });
    Util.initPlayer();
    // 如果重复启动游戏，则重新加载模组
    Util.loadMods();
    gameWindow.webContents.on("crashed", () =>
      console.warn(i18n.text.main.webContentsCrashed())
    );
    gameWindow.once("ready-to-show", () => {
      gameWindow.webContents.setZoomFactor(1);
      gameWindow.show();
      gameWindow.webContents.send("window-resize", gameWindow.getBounds());
    });
    gameWindow.webContents.on("console-message", (
      evt,
      level,
      msg /*, line, sourceId  */
    ) => {
      if (level !== "log") {
        console.warn(i18n.text.main.consoleMessage() + msg);
      }
    });
    // 载入本地启动器
    gameWindow.loadURL("file://" + path.join(__dirname, "bin/main/index.html"));

    // Add environment config to open developer tools
    if (process.env.NODE_ENV === "development") {
      gameWindow.webContents.openDevTools({ mode: "detach" });
    }

    Menu.setApplicationMenu(gameWindowMenu);

    windowControl.windowMap["game"] = gameWindow;
  },

  closeManagerWindow: () => {
    const managerWindow = windowControl.windowMap["manager"];
    if (managerWindow) {
      managerWindow.close();
    }
  },

  hideManagerWindow: () => {
    const managerWindow: Electron.BrowserWindow =
      windowControl.windowMap["manager"];
    if (managerWindow) {
      managerWindow.hide();
    }
  },

  addAppListener: () => {
    ipcMain.on("application-message", (evt, ...args) => {
      if (args && args.length > 0) {
        switch (args[0]) {
          case "start-game": {
            windowControl
              .initLocalMirrorServer(sererHttps, Configs.SERVER_PORT)
              .then(() => {
                windowControl.initGameWindow(Configs.GAME_WINDOW_CONFIG);
                if (userConfigs.window.isManagerHide) {
                  windowControl.hideManagerWindow();
                } else {
                  windowControl.closeManagerWindow();
                }
              });
            break;
          }
          case "start-tool": {
            const toolInfo = args[1];
            if (!toolInfo.windowOptions) {
              toolInfo.windowOption = {};
            }
            const toolConfig = {
              ...Configs.TOOL_WINDOW_CONFIG,
              ...toolInfo.windowOptions
            };
            const indexPage = toolInfo.index ? toolInfo.index : "index.html";
            toolConfig.parent = windowControl.windowMap["manager"];

            const toolWindow = new BrowserWindow(toolConfig);

            windowControl.windowMap.toolsMap[toolInfo.filesDir] = toolWindow;

            if (process.env.NODE_ENV === "development") {
              toolWindow.webContents.openDevTools({
                mode: "detach"
              });
            }

            toolWindow.loadURL(
              "file://" + path.join(toolInfo.filesDir, indexPage)
            );
            break;
          }
          case "update-user-config": {
            userConfigs = JSON.parse(
              fs.readFileSync(Configs.USER_CONFIG_PATH, { encoding: "utf-8" })
            );
            windowControl.windowMap["manager"].setContentSize(
              Configs.MANAGER_WINDOW_CONFIG.width *
                userConfigs.window.zoomFactor,
              Configs.MANAGER_WINDOW_CONFIG.height *
                userConfigs.window.zoomFactor
            );
            windowControl.windowMap["manager"].webContents.setZoomFactor(
              userConfigs.window.zoomFactor
            );
            break;
          }
          case "take-screenshot": {
            const buffer: Buffer = args[1];
            const filePath = path.join(
              electronApp.getPath("pictures"),
              electronApp.getName(),
              Date.now() + ".png"
            );
            Util.writeFile(filePath, buffer).then(() => {
              windowControl.windowMap["game"].webContents.send(
                "screenshot-saved",
                filePath
              );
            });
            clipboard.writeImage(nativeImage.createFromBuffer(buffer));
            break;
          }
          case "close-ready": {
            windowControl.windowMap["manager"].close();
            break;
          }
          default:
            break;
        }
      }
    });
    ipcMain.on("main-loader-message", (evt, ...args) => {
      if (args && args.length > 0) {
        switch (args[0]) {
          case "main-loader-ready": {
            windowControl.windowMap["game"].webContents.send(
              "server-port-load",
              (sererHttps.address() as AddressInfo).port
            );
            break;
          }
          case "server-port-loaded": {
            const executeScripts = windowControl._getExecuteScripts();
            windowControl.windowMap["game"].webContents.send(
              "executes-load",
              executeScripts
            );
            break;
          }
          case "executes-loaded": {
            const clipboardText = clipboard.readText();
            if (
              clipboardText &&
              clipboardText.includes(Configs.REMOTE_DOMAIN)
            ) {
              windowControl.windowMap["game"].webContents.send(
                "load-url",
                new RegExp(
                  Configs.REMOTE_DOMAIN.replace(/\./g, "\\.") +
                    "[-A-Za-z0-9+&@#/%?=~_|!:,.;]*"
                ).exec(clipboardText)[0]
              );
            } else if (
              clipboardText &&
              clipboardText.includes(Configs.HTTP_REMOTE_DOMAIN)
            ) {
              windowControl.windowMap["game"].webContents.send(
                "load-url",
                new RegExp(
                  Configs.HTTP_REMOTE_DOMAIN.replace(/\./g, "\\.") +
                    "[-A-Za-z0-9+&@#/%?=~_|!:,.;]*"
                ).exec(clipboardText)[0]
              );
            } else {
              windowControl.windowMap["game"].webContents.send(
                "load-url",
                `https://localhost:${
                  (sererHttps.address() as AddressInfo).port
                }/0/`
              );
            }
            break;
          }
          case "open-file-dialog": {
            dialog.showOpenDialog(
              {
                properties: ["openFile", "openDirectory"]
              },
              (files) => {
                if (files) {
                  evt.sender.send("selected-directory", files);
                }
              }
            );
            break;
          }
          default:
            break;
        }
      }
    });
  },

  addAccelerator() {
    const addBossKey = () => {
      const windowsStatus = {
        gameWindowVisible: false,
        gameWindowMuted: false,
        managerWindowVisible: false,
        managerWindowMuted: false,
        bosskeyActive: false
      };
      globalShortcut.register("Alt+X", () => {
        const gameWindow: Electron.BrowserWindow =
          windowControl.windowMap["game"];
        const managerWindow: Electron.BrowserWindow =
          windowControl.windowMap["manager"];

        if (windowsStatus.bosskeyActive) {
          // 如果老板键已经被按下
          windowsStatus.bosskeyActive = false;

          if (managerWindow) {
            if (windowsStatus.managerWindowVisible) {
              managerWindow.show();
            }
            managerWindow.webContents.setAudioMuted(
              windowsStatus.managerWindowMuted
            );
          }
          if (gameWindow) {
            if (windowsStatus.gameWindowVisible) {
              gameWindow.show();
            }
            gameWindow.webContents.setAudioMuted(windowsStatus.gameWindowMuted);
          }
        } else {
          // 备份窗口信息并隐藏窗口
          windowsStatus.bosskeyActive = true;

          if (managerWindow) {
            windowsStatus.managerWindowVisible = managerWindow.isVisible();
            windowsStatus.managerWindowMuted = managerWindow.webContents.isAudioMuted();

            managerWindow.hide();
            managerWindow.webContents.setAudioMuted(true);
          }
          if (gameWindow) {
            windowsStatus.gameWindowVisible = gameWindow.isVisible();
            windowsStatus.gameWindowMuted = gameWindow.webContents.isAudioMuted();

            gameWindow.hide();
            gameWindow.webContents.setAudioMuted(true);
          }
        }
      });
    };
    addBossKey();
  },

  start: () => {
    windowControl.electronReady().then(() => {
      Menu.setApplicationMenu(null);

      windowControl.addAccelerator();
      windowControl.addAppListener();
      windowControl.initManagerWindow({ ...Configs.MANAGER_WINDOW_CONFIG });
    });
  }
};
windowControl.start();

process.on("uncaughtException", (err) => {
  console.error(err);
});
