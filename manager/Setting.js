const fs = require('fs')
const path = require('path')
const { ipcRenderer } = require('electron')
// const { app } = remote
const configs = require('../configs')
const defaultUserConfig = require(configs.USER_CONFIG_PATH)
const i18n = require('../i18nInstance')

class Settings {
  constructor (options = {}) {
    this.userConfig = options.userConfig || defaultUserConfig
    this._saveConfig = this._saveConfig.bind(this)
    this._renderSection = this._renderSection.bind(this)
    this._renderSections = this._renderSections.bind(this)
    this._renderSectionItem = this._renderSectionItem.bind(this)
    this._renderCheckBoxSectionItem = this._renderCheckBoxSectionItem.bind(this)
    this._renderNumberSectionItem = this._renderNumberSectionItem.bind(this)
    this._handleSaveConfigClick = this._handleSaveConfigClick.bind(this)
    this._addSaveListener = this._addSaveListener.bind(this)
    this.render = this.render.bind(this)
    this.init = this.init.bind(this)
    this.save = this.save.bind(this)
  }

  // static _keyToTitle (key) {
  //   const map = {
  //     window: '窗口',
  //     zoomFactor: '资源管理器缩放(Zoom Factor)',
  //     gameSSAA: '超采样抗锯齿(SSAA)',
  //     renderingMultiple: '% 渲染比率(Rendering Multiple)',
  //     isKioskModeOn:
  //       '使用原生模式代替默认全屏幕模式(Use Kiosk Fullscreen Mode)',
  //     update: '更新',
  //     prerelease: '获取浏览版(Get Pre-releases)',
  //     chromium: '核心（需重启软件）',
  //     isHardwareAccelerationDisable:
  //       '关闭硬件加速(Turn Hardware Acceleration Off)',
  //     isInProcessGpuOn: '启用进程内GPU处理(Turn in-process-gpu On)',
  //     isNoBorder: '使用无边框窗口进入游戏(Turn BorderLess On)',
  //     localVersion: '雀魂Plus 当前版本'
  //   }
  //   return map[key] || key
  // }

  _getUserLocalConfig () {
    const defaultConfigPath = path.join(__dirname, '../configs-user.json')
    const defaultConfigJson = fs.readFileSync(defaultConfigPath)
    return this.userConfig || JSON.parse(defaultConfigJson)
  }

  _renderSection ({ settingInner, section, data }) {
    if (typeof this.userConfig[section] === 'undefined') {
      this.userConfig[section] = data
    }
    const h3 = document.createElement('h3')
    i18n.t.manager[section].renderAsText(h3)
    // const sectionName = Settings._keyToTitle(section)
    // h3.innerText = sectionName
    settingInner.append(h3)
    Object.entries(data).forEach(([item, data], index) => {
      this._renderSectionItem({ settingInner, section, item, data, index })
    })
  }

  _renderCheckBoxSectionItem ({ settingInner, section, item, data, index }) {
    // const itemName = Settings._keyToTitle(item)
    const checkBox = document.createElement('input')
    checkBox.type = 'checkbox'
    checkBox.id = `config${section}${item}${index}`
    const label = document.createElement('label')
    label.setAttribute('for', checkBox.id)
    i18n.t.manager[item].renderAsText(label)
    // label.innerText = itemName
    checkBox.checked = data
    checkBox.addEventListener('change', () => {
      this.userConfig[section][item] = checkBox.checked
    })
    settingInner.append(checkBox)
    settingInner.append(label)
  }

  _renderNumberSectionItem ({ settingInner, section, item, data, index }) {
    // const itemName = Settings._keyToTitle(item)
    const input = document.createElement('input')
    input.type = 'number'
    input.id = `config${section}${item}${index}`
    input.value = data
    const label = document.createElement('label')
    label.setAttribute('for', input.id)
    // label.innerText = itemName
    i18n.t.manager[item].renderAsText(label)
    input.addEventListener('change', () => {
      this.userConfig[section][item] = Number(input.value)
    })
    const br = document.createElement('br')
    settingInner.append(input)
    settingInner.append(label)
    settingInner.append(br)
  }

  _renderFunctionSectionItem ({ settingInner, section, item, data, index }) {
    // TODO 这里将会插入一个按钮，从 item 读取 函数 和 名称
  }

  _renderSectionItem ({ settingInner, section, item, data, index }) {
    if (typeof this.userConfig[section][item] === 'undefined') {
      this.userConfig[section][item] = data
    }
    const processes = {
      boolean: () =>
        this._renderCheckBoxSectionItem({
          settingInner,
          section,
          item,
          data,
          index
        }),
      number: () =>
        this._renderNumberSectionItem({
          settingInner,
          section,
          item,
          data,
          index
        }),
      /**
       * @param {string} data
       */
      string: data => {
        switch (data) {
          case 'function': {
            this._renderFunctionSectionItem({})
            break
          }
          default:
            break
        }
      }
    }
    const type = typeof data
    processes[type] && processes[type].call(data)
  }

  _renderSections () {
    const userLocalConfig = this._getUserLocalConfig()
    const settingInner = document.getElementById('settingInner')
    settingInner.innerHTML = ''
    Object.entries(userLocalConfig).forEach(([section, data]) => {
      this._renderSection({ settingInner, section, data })
    })
  }

  // _renderVersionInfo () {
  //   const settingInner = document.getElementById('settingInner')
  //   const h3 = document.createElement('h3')
  //   h3.innerText = Settings._keyToTitle('localVersion')
  //   const p = document.createElement('p')
  //   p.innerText = app.getVersion()
  //   settingInner.append(h3)
  //   settingInner.append(p)
  // }

  _handleSaveConfigClick () {
    this._saveConfig()
      .then(() => {
        alert(i18n.t.manager.saveSucceeded())
      })
      .catch(err => {
        alert(i18n.t.manager.saveFailed(err))
      })
  }

  _saveConfig () {
    return new Promise((resolve, reject) => {
      try {
        fs.writeFileSync(
          configs.USER_CONFIG_PATH,
          JSON.stringify(this.userConfig)
        )
        ipcRenderer.send('application-message', 'update-user-config')
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  _addSaveListener () {
    const saveBtn = document.getElementById('saveConfigs')
    saveBtn.addEventListener('click', this._handleSaveConfigClick)
  }

  render () {
    this._renderSections()
    // this._renderVersionInfo()
  }

  init () {
    this._addSaveListener()
    this.render()
  }

  save () {
    this._saveConfig()
  }
}

module.exports = Settings
