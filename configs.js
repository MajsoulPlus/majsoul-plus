const os = require('os')
const getIcon = () => {
  switch (os.platform()) {
    case 'win32':
      return __dirname + '/icons/icon.ico'
    case 'darwin':
      return __dirname + '/icons/icon.icns'
    case 'linux':
    default:
      return __dirname + '/icons/icon.png'
  }
}
const CONFIGS = {
  SERVER_PORT: 8887,
  // PIPE_PORT: 8888,
  XOR_KEY: 73,
  EXTEND_RES_KEYWORD: 'extendRes',
  REMOTE_DOMAIN: 'https://majsoul.union-game.com',
  LOCAL_DIR: '/static',
  MODS_DIR: '/mod',
  PLUGINS_DIR: '/plugins',
  EXECUTE_DIR: '/execute',
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
    icon: getIcon()
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
    title: '雀魂Plus - 扩展资源管理器',
    autoHideMenuBar: true,
    icon: getIcon(),
    maximizable: false,
    fullscreenable: false
  }
}
module.exports = CONFIGS
