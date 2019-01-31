const os = require('os')
const fs = require('fs')
const electron = require('electron')
const path = require('path')

let app = electron.app
if (!app) {
  app = electron.remote.app
}

const getIcon = () => {
  switch (os.platform()) {
    case 'win32':
      return __dirname + '/bin/icons/icon.ico'
    case 'darwin':
      return __dirname + '/bin/icons/icon.icns'
    case 'linux':
    default:
      return __dirname + '/bin/icons/icon.png'
  }
}
const CONFIGS = {
  SERVER_PORT: 8887,
  // PIPE_PORT: 8888,
  XOR_KEY: 73,
  EXTEND_RES_KEYWORD: 'extendRes',
  REMOTE_DOMAIN: 'https://majsoul.union-game.com/',
  HTTP_REMOTE_DOMAIN: 'http://majsoul.union-game.com/',
  LOCAL_DIR: '/static',
  MODS_DIR: '/mod',
  MODS_CONFIG_PATH: path.join(app.getPath('userData'), 'modsEnabled.json'),
  PLUGINS_DIR: '/plugin',
  TOOLS_DIR: '/tool',
  EXECUTES_DIR: '/execute',
  EXECUTES_CONFIG_PATH: path.join(
    app.getPath('userData'),
    'executesEnabled.json'
  ),
  USER_CONFIG_PATH: path.join(app.getPath('userData'), 'configs-user.json'),
  GAME_WINDOW_CONFIG: {
    width: 1280,
    height: 720,
    frame: true,
    resizable: true,
    backgroundColor: '#000000',
    webPreferences: {
      webSecurity: false
      // nodeIntegration: false
      // plugins: true
    },
    autoHideMenuBar: true,
    useContentSize: true,
    icon: getIcon(),
    show: false,
    enableLargerThanScreen: true
  },
  MANAGER_WINDOW_CONFIG: {
    width: 1280, // + 16,
    height: 720, // + 39,
    frame: false,
    resizable: false,
    backgroundColor: '#FFFFFF',
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    title: '雀魂Plus',
    autoHideMenuBar: true,
    icon: getIcon(),
    maximizable: false,
    fullscreenable: false,
    show: false
  },
  TOOL_WINDOW_CONFIG: {
    width: 960, // + 16,
    height: 540, // + 39,
    frame: true,
    resizable: false,
    backgroundColor: '#FFFFFF',
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    autoHideMenuBar: true,
    icon: getIcon(),
    maximizable: false,
    fullscreenable: false,
    useContentSize: true
  },
  HTTP_GET_USER_AGENT: `Mozilla/5.0 (${os.type()} ${os.release()}; ${os.arch()}) MajsoulPlus/${app.getVersion()} Chrome/${
    process.versions.chrome
  }`
}
try {
  fs.statSync(CONFIGS.EXECUTES_CONFIG_PATH)
} catch (error) {
  fs.copyFileSync(
    path.join(__dirname, CONFIGS.EXECUTES_DIR, 'active.json'),
    CONFIGS.EXECUTES_CONFIG_PATH
  )
}
try {
  fs.statSync(CONFIGS.MODS_CONFIG_PATH)
} catch (error) {
  fs.copyFileSync(
    path.join(__dirname, CONFIGS.MODS_DIR, 'active.json'),
    CONFIGS.MODS_CONFIG_PATH
  )
}
try {
  fs.statSync(CONFIGS.USER_CONFIG_PATH)
} catch (error) {
  fs.copyFileSync(
    path.join(__dirname, 'configs-user.json'),
    CONFIGS.USER_CONFIG_PATH
  )
}
module.exports = CONFIGS
