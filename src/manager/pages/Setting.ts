import { ipcRenderer } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { Global } from '../../global'
import i18n from '../../i18n'
import { MajsoulPlus } from '../../majsoul_plus'

class Setting {
  userConfig: MajsoulPlus.UserConfig = require(Global.UserConfigPath)

  private getUserLocalConfig() {
    const defaultConfigPath = path.join(__dirname, '../../configs-user.json')
    const defaultConfigJson = fs.readFileSync(defaultConfigPath, {
      encoding: 'utf-8'
    })

    // TODO: JSON schema
    return this.userConfig || JSON.parse(defaultConfigJson)
  }

  private renderSection = ({ settingInner, section, data }) => {
    if (typeof this.userConfig[section] === 'undefined') {
      this.userConfig[section] = data
    }
    const h3 = document.createElement('h3')
    i18n.text.manager[section].renderAsText(h3)
    // const sectionName = Settings._keyToTitle(section)
    // h3.innerText = sectionName
    settingInner.append(h3)
    Object.entries(data).forEach(([item, data], index) => {
      this.renderSectionItem({
        settingInner,
        section,
        item,
        data,
        index
      })
    })
  }

  private renderCheckBoxSectionItem = ({
    settingInner,
    section,
    item,
    data,
    index
  }) => {
    // const itemName = Settings._keyToTitle(item)
    const checkBox = document.createElement('input')
    checkBox.type = 'checkbox'
    checkBox.id = `config${section}${item}${index}`
    const label = document.createElement('label')
    label.setAttribute('for', checkBox.id)
    i18n.text.manager[item].renderAsText(label)
    // label.innerText = itemName
    checkBox.checked = data
    checkBox.addEventListener('change', () => {
      this.userConfig[section][item] = checkBox.checked
    })
    settingInner.append(checkBox)
    settingInner.append(label)
  }

  private renderNumberSectionItem = ({
    settingInner,
    section,
    item,
    data,
    index
  }) => {
    // const itemName = Settings._keyToTitle(item)
    const input = document.createElement('input')
    input.type = 'number'
    input.id = `config${section}${item}${index}`
    input.value = data
    const label = document.createElement('label')
    label.setAttribute('for', input.id)
    // label.innerText = itemName
    i18n.text.manager[item].renderAsText(label)
    input.addEventListener('change', () => {
      this.userConfig[section][item] = Number(input.value)
    })
    const br = document.createElement('br')
    settingInner.append(input)
    settingInner.append(label)
    settingInner.append(br)
  }

  private renderFunctionSectionItem({
    settingInner,
    section,
    item,
    data,
    index
  }) {
    // TODO 这里将会插入一个按钮，从 item 读取 函数 和 名称
  }

  private renderSectionItem = ({
    settingInner,
    section,
    item,
    data,
    index
  }) => {
    if (typeof this.userConfig[section][item] === 'undefined') {
      this.userConfig[section][item] = data
    }
    const processes = {
      boolean: () =>
        this.renderCheckBoxSectionItem({
          settingInner,
          section,
          item,
          data,
          index
        }),
      number: () =>
        this.renderNumberSectionItem({
          settingInner,
          section,
          item,
          data,
          index
        }),
      string: (data: string) => {
        switch (data) {
          case 'function': {
            // TODO:
            // this.renderFunctionSectionItem({})
            break
          }
          default:
            break
        }
      }
    }
    if (processes[typeof data]) {
      processes[typeof data].call(data)
    }
  }

  private renderSections = () => {
    const userLocalConfig = this.getUserLocalConfig()
    const settingInner = document.querySelector('#settingInner')
    settingInner.innerHTML = ''
    Object.entries(userLocalConfig).forEach(([section, data]) => {
      this.renderSection({ settingInner, section, data })
    })
  }

  private handleSaveConfigClick = () => {
    this.saveConfig()
      .then(() => {
        alert(i18n.text.manager.saveSucceeded())
      })
      .catch(err => {
        alert(i18n.text.manager.saveFailed(err))
      })
  }

  private saveConfig = () => {
    return new Promise((resolve, reject) => {
      try {
        ipcRenderer.send('update-user-config', Global.UserConfigPath)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  private addSaveListener = () => {
    const saveBtn = document.querySelector('#saveConfigs')
    saveBtn.addEventListener('click', this.handleSaveConfigClick)
  }

  render = () => {
    this.renderSections()
    // this._renderVersionInfo()
  }

  init = () => {
    this.addSaveListener()
    this.render()
  }

  save = () => {
    this.saveConfig()
  }
}

export default new Setting()
