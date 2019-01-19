const os = require('os')
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
  LOCAL_DIR: '/static',
  MODS_DIR: '/mod',
  PLUGINS_DIR: '/plugin',
  TOOLS_DIR: '/tool',
  EXECUTES_DIR: '/execute',
  SCREENSHOTS_DIR: '/screenshots',
  GAME_WINDOW_CONFIG: {
    width: 1280,
    height: 720,
    frame: true,
    resizable: true,
    backgroundColor: '#000000',
    webPreferences: {
      webSecurity: false,
      nodeIntegration: false
      // plugins: true
    },
    autoHideMenuBar: true,
    useContentSize: true,
    icon: getIcon(),
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
  }
}
module.exports = CONFIGS
