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
    width: 1280 + 16,
    height: 720 + 39,
    frame: true,
    resizable: true,
    backgroundColor: '#000000',
    webPreferences: {
      webSecurity: false,
      nodeIntegration: false
      // plugins: true
    },
    icon: __dirname + '/icon.ico'
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
    icon: __dirname + '/icon.ico'
  }
}
module.exports = CONFIGS
