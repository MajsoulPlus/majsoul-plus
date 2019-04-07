/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const NetworkUtil = require('./Network')
const { Util } = require('..//utils')
const {
  remote: { app },
  shell
} = require('electron')

const defaultOptions = {
  releaseApi:
    'https://api.github.com/repos/iamapig120/majsoul-plus-client/releases/latest',
  preReleaseApi:
    'https://api.github.com/repos/iamapig120/majsoul-plus-client/releases',
  prerelease: false
}

class Update {
  constructor (options) {
    this.options = { ...defaultOptions, ...options }
    this._getRemoteVersionInfo = this._getRemoteVersionInfo.bind(this)
    this.checkUpdate = this.checkUpdate.bind(this)
  }

  _getLocalVersion () {
    return `v${app.getVersion()}`
  }

  _getRemoteVersionInfo () {
    const checkApi = this.options.prerelease
      ? this.options.preReleaseApi
      : this.options.releaseApi
    return NetworkUtil.getJson(checkApi)
      .then(res => {
        const result = this.options.prerelease ? res[0] : res
        return {
          remoteVersion: result.tag_name,
          body: result.body,
          time: result.published_at,
          url: result.html_url
        }
      })
      .catch(err => {
        console.error(err)
        return {}
      })
  }

  _openDownloadPage () {}

  _renderUpdateHint ({ remoteVersion, localVersion, time, url }) {
    const updateCard = document.getElementById('updateCard')

    const updateCardClose = document.getElementById('updateCard_close')

    const updateCardView = document.getElementById('updateCard_view')

    const localVersionDOM = document.getElementById('localVersion')

    const remoteVersionDOM = document.getElementById('remoteVersion')

    const publishTime = document.getElementById('publishTime')
    updateCard.classList.add('show')
    updateCardClose.addEventListener('click', () => {
      updateCard.classList.remove('show')
    })
    updateCardView.addEventListener('click', () => {
      shell.openExternal(url)
      updateCard.classList.remove('show')
    })
    localVersionDOM.innerText = localVersion
    remoteVersionDOM.innerText = remoteVersion
    publishTime.innerText = new Date(time).toLocaleString()
  }

  async checkUpdate () {
    const localVersion = await this._getLocalVersion()
    const remoteVersionInfo = await this._getRemoteVersionInfo()
    const { remoteVersion, body, time, url } = remoteVersionInfo
    const shouldUpdate = Util.compareVersion(remoteVersion, localVersion)
    if (shouldUpdate) {
      this._renderUpdateHint({ remoteVersion, localVersion, time, body, url })
    }
    // TODO
    // https://github.com/MajsoulPlus/majsoul-plus/blob/abe443fd809f1941b2ddcd2765f6b30bc1e21d12/manager/manager.js#L829
    // 重写 自动更新 内容
  }
}
module.exports = Update
