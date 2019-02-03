const panel = require('./Panel')
const ping = require('./Ping')
const Update = require('./Update')
const Setting = require('./Setting')

const fs = require('fs')
const {ipcRenderer} = require('electron')

const update = new Update()
const setting = new Setting()

class Manager {
  constructor () {}

  _saveSettings () {}

  init () {
    update.checkUpdate()
    ping.init()
    panel.init()
    setting.init()
  }

  gameStart () {
    this._saveSettings()
    ipcRenderer.send('application-message', 'start-game')
  }
}

const manager = new Manager
manager.init()
