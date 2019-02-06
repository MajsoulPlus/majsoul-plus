const fs = require('fs')
const path = require('path')
const { ipcRenderer, remote } = require('electron')
const { app } = remote
const configs = require('../configs')
const defaultUserConfig = JSON.parse(require(configs.USER_CONFIG_PATH))

class Settings {
  constructor (options = {}) {
    this.userConfig = options.userConfig || defaultUserConfig
  }

  static _keyToTitle (key) {
    const map = {
      window: '窗口',
      zoomFactor: '资源管理器缩放(Zoom Factor)',
      gameSSAA: '超采样抗锯齿(SSAA)',
      renderingMultiple: '% 渲染比率(Rendering Multiple)',
      isKioskModeOn:
        '使用原生模式代替默认全屏幕模式(Use Kiosk Fullscreen Mode)',
      update: '更新',
      prerelease: '获取浏览版(Get Pre-releases)',
      chromium: '核心（需重启软件）',
      isHardwareAccelerationDisable:
        '关闭硬件加速(Turn Hardware Acceleration Off)',
      isInProcessGpuOn: '启用进程内GPU处理(Turn in-process-gpu On)',
      isNoBorder: '使用无边框窗口进入游戏(Turn BorderLess On)',
      localVersion: '雀魂Plus 当前版本'
    }
    return map[key] || key
  }

  _getUserLocalConfig () {
    const configPath = path.join(__dirname, '../configs-user.json')
    const configJson = fs.readFileSync(configPath)
    return JSON.parse(configJson)
  }

  _renderSection ({ settingInner, section, data }) {
    if (typeof this.userConfig[section] === 'undefined') {
      this.userConfig[section] = data
    }
    const sectionName = Settings._keyToTitle(section)
    const h3 = document.createElement('h3')
    h3.innerText = sectionName
    settingInner.append(h3)
    Object.entries(data).forEach(([item, data], index) => {
      this._renderSectionItem({ settingInner, section, item, data, index })
    })
  }

  _renderCheckBoxSectionItem ({ settingInner, section, item, data, index }) {
    const itemName = Settings._keyToTitle(item)
    const checkBox = document.createElement('input')
    checkBox.type = 'checkbox'
    checkBox.id = `config${section}${item}${index}`
    const label = document.createElement('label')
    label.setAttribute('for', checkBox.id)
    label.innerText = itemName
    checkBox.value = data
    checkBox.addEventListener('change', () => {
      this.userConfig[section][item] = checkBox.value
    })
    settingInner.append(checkBox)
    settingInner.append(label)
  }

  _renderNumberSectionItem ({ settingInner, section, item, data, index }) {
    const itemName = Settings._keyToTitle(item)
    const input = document.createElement('input')
    input.type = 'number'
    input.id = `config${section}${item}${index}`
    input.value = data
    const label = document.createElement('label')
    label.setAttribute('for', input.id)
    label.innerText = itemName
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

  _renderVersionInfo () {
    const settingInner = document.getElementById('settingInner')
    const h3 = document.createElement('h3')
    h3.innerText = Settings._keyToTitle('localVersion')
    const p = document.createElement('p')
    p.innerText = app.getVersion()
    settingInner.append(h3)
    settingInner.append(p)
  }

  _saveConfig () {
    try {
      fs.writeFileSync(
        configs.USER_CONFIG_PATH,
        JSON.stringify(this.userConfig)
      )
      ipcRenderer.send('application-message', 'update-user-config')
      alert('保存成功')
    } catch (error) {
      alert(`保存失败\n${error}`)
    }
  }

  _addSaveListener () {
    const saveBtn = document.getElementById('saveConfig')
    saveBtn.addEventListener('click', this._saveConfig)
  }

  render () {
    this._renderSections()
    this._renderVersionInfo()
    this._renderSaveButton()
  }

  init () {
    this._addSaveListener()
    this.render()
  }
}

module.exports = Settings
