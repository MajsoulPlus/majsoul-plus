import { ipcRenderer } from 'electron'
import Global from '../global'
import i18n from '../../i18n'
import { MajsoulPlus } from '../../majsoul_plus'
import Ping from '../utils/Ping'

class Setting {
  userConfig: MajsoulPlus.UserConfig = require(Global.UserConfigPath)

  init() {
    this.addSaveListener()
    this.render()
  }

  private render = () => {
    const settingInner = document.querySelector('#setting-inner')
    settingInner.innerHTML = ''
    Object.entries(this.userConfig)
      .filter(([section]) => {
        // 设置不渲染的 section
        return !['localStorage'].includes(section)
      })
      .forEach(([section, data]) => {
        this.renderSection(settingInner, section, data)
      })
  }

  private renderSection = (settingInner: Element, section: string, data) => {
    const header = document.createElement('h3')
    i18n.text.manager[section].renderAsText(header)

    settingInner.append(header)
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

  private renderSectionItem = ({
    settingInner,
    section,
    item,
    data,
    index
  }) => {
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
      string: () => {
        if (item === 'proxyUrl') {
          this.renderTextSectionItem({
            settingInner,
            section,
            item,
            data,
            index
          })
        }
      }
    }
    if (processes[typeof data]) {
      processes[typeof data].call(data)
    }
  }

  private renderCheckBoxSectionItem = ({
    settingInner,
    section,
    item,
    data,
    index
  }) => {
    const checkBox = document.createElement('input')
    checkBox.type = 'checkbox'
    checkBox.id = `config${section}${item}${index}`
    const label = document.createElement('label')
    label.setAttribute('for', checkBox.id)
    i18n.text.manager[item].renderAsText(label)
    checkBox.checked = data
    checkBox.addEventListener('change', () => {
      this.userConfig[section][item] = checkBox.checked
    })
    const div = document.createElement('div')
    div.append(checkBox)
    div.append(label)
    settingInner.append(div)
  }

  private renderNumberSectionItem = ({
    settingInner,
    section,
    item,
    data,
    index
  }) => {
    const input = document.createElement('input')
    input.type = 'number'
    input.id = `config${section}${item}${index}`
    input.value = data
    const label = document.createElement('label')
    label.setAttribute('for', input.id)
    i18n.text.manager[item].renderAsText(label)
    input.addEventListener('change', () => {
      this.userConfig[section][item] = Number(input.value)
    })
    const br = document.createElement('br')
    const div = document.createElement('div')
    div.append(input)
    div.append(label)
    div.append(br)
    settingInner.append(div)
  }

  private renderTextSectionItem({ settingInner, section, item, data, index }) {
    const input = document.createElement('input')
    input.type = 'text'
    input.id = `config${section}${item}${index}`
    input.value = data
    const label = document.createElement('label')
    label.setAttribute('for', input.id)
    i18n.text.manager[item].renderAsText(label)
    input.addEventListener('change', () => {
      this.userConfig[section][item] = input.value
    })
    const br = document.createElement('br')
    const div = document.createElement('div')
    div.append(input)
    div.append(label)
    div.append(br)
    settingInner.append(div)
  }

  private handleSaveConfigClick = () => {
    this.save()
    alert(i18n.text.manager.saveSucceeded())
    Ping.setServer(this.userConfig.userData.serverToPlay)
  }

  private addSaveListener = () => {
    const saveBtn = document.querySelector('#save-configs')
    saveBtn.addEventListener('click', this.handleSaveConfigClick)
  }

  save = () => {
    ipcRenderer.send('update-user-config', this.userConfig)
  }
}

export default new Setting()
