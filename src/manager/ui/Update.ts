import Network from '../utils/Network'
import { remote, shell } from 'electron'
import { gt } from 'semver'

class Update {
  static readonly release =
    'https://api.github.com/repos/iamapig120/majsoul-plus-client/releases/latest'
  static readonly preRelease =
    'https://api.github.com/repos/iamapig120/majsoul-plus-client/releases'

  private usePreRelease: boolean

  setUsePrerelease(prerelease: boolean) {
    this.usePreRelease = prerelease
    return this
  }

  private getLocalVersion() {
    return `v${remote.app.getVersion()}`
  }

  private async getRemoteVersionInfo() {
    const api = this.usePreRelease ? Update.preRelease : Update.release
    const res = await Network.getJson(api)
    try {
      const result = this.usePreRelease ? res[0] : res
      return {
        remoteVersion: result.tag_name,
        body: result.body,
        time: result.published_at,
        url: result.html_url
      }
    } catch (e) {
      console.error(e)
      return {}
    }
  }

  _openDownloadPage() {}

  _renderUpdateHint({ remoteVersion, localVersion, time, url }) {
    const updateCard = document.getElementById('update-card')

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

  async checkUpdate() {
    const localVersion = await this.getLocalVersion()
    const remoteVersionInfo = await this.getRemoteVersionInfo()
    const { remoteVersion, time, url } = remoteVersionInfo
    if (gt(remoteVersion, localVersion)) {
      this._renderUpdateHint({ remoteVersion, localVersion, time, url })
    }
    // TODO: 在线更新
  }
}

export default new Update()
