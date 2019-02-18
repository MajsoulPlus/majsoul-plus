/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const NetworkUtil = require('./Network')
const {
  remote: { app },
  shell
} = require('electron')

const i18n = require('../i18nInstance')

const defaultOptions = {
  releaseApi:
    'https://api.github.com/repos/iamapig120/majsoul-plus-client/releases/latest',
  preReleaseApi:
    'https://api.github.com/repos/iamapig120/majsoul-plus-client/releases',
  usePreRelease: false
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
    const checkApi = this.options.usePreRelease
      ? this.options.preReleaseApi
      : this.options.releaseApi
    return NetworkUtil.getJson(checkApi)
      .then(res => {
        const result = this.options.usePreRelease ? res[0] : res
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

  compareVersion (taga, tagb) {
    if (taga && tagb) {
      let tagaArr = taga.substring(1).split('-')
      let tagbArr = tagb.substring(1).split('-')
      let tagaDev = false
      let tagbDev = false
      if (tagaArr.length > 1) {
        tagaDev = true
      }
      if (tagbArr.length > 1) {
        tagbDev = true
      }
      let tagaMain = tagaArr[0].split('.')
      let tagbMain = tagbArr[0].split('.')

      let laterFlag
      for (let i = 0; i < 3; i++) {
        if (parseInt(tagaMain[i], 10) > parseInt(tagbMain[i], 10)) {
          laterFlag = true
          break
        } else if (parseInt(tagaMain[i], 10) < parseInt(tagbMain[i], 10)) {
          laterFlag = false
          break
        }
      }

      if (typeof laterFlag === 'boolean') {
        return laterFlag
      }
      if (laterFlag === undefined) {
        if (tagbDev && !tagaDev) {
          return true
        } else if (tagaDev && !tagbDev) {
          return false
        } else if (tagaDev && tagbDev) {
          const tagaDevArr = tagaArr[1].split('.')
          const tagbDevArr = tagbArr[1].split('.')
          const devStrToNum = devStr => {
            switch (devStr) {
              case 'alpha':
                return 1
              case 'beta':
                return 2
              case 'rc':
                return 3
              default:
                return 0
            }
          }
          tagaDevArr[0] = devStrToNum(tagaDevArr[0])
          tagbDevArr[0] = devStrToNum(tagbDevArr[0])
          for (let i = 0; i < 2; i++) {
            if (parseInt(tagaDevArr[i], 10) > parseInt(tagbDevArr[i], 10)) {
              laterFlag = true
              break
            } else if (
              parseInt(tagaDevArr[i], 10) < parseInt(tagbDevArr[i], 10)
            ) {
              laterFlag = false
              break
            }
          }
          if (laterFlag === undefined) {
            return false
          }
          return laterFlag
        } else {
          return false
        }
      }
    }
    return false
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
    const shouldUpdate = this.compareVersion(remoteVersion, localVersion)
    shouldUpdate &&
      this._renderUpdateHint({ remoteVersion, localVersion, time, body, url })
  }
}
module.exports = Update
