import Network from './Network'
import * as tcpPing from 'tcp-ping'
import i18n from '../../i18n'

export const remoteDomains = [
  { id: 0, name: 'zh', domain: 'https://game.maj-soul.com/1' },
  { id: 1, name: 'jp', domain: 'https://game.mahjongsoul.com' },
  { id: 2, name: 'en', domain: 'https://mahjongsoul.game.yo-star.com' }
]

class Ping {
  private server: number
  private services: string[] = []
  private currentService = 0
  private interval = null

  setServer(server: number) {
    this.server = server

    const serverInfoTitleDom = document.querySelector(
      '#serverInfoTitle'
    ) as HTMLElement
    i18n.text['main'][`server${remoteDomains[this.server].name}`].renderAsText(
      serverInfoTitleDom
    )
    this.initPing()
    return this
  }

  initPing = () => {
    this.getServices()
      .then(this.getService)
      .then(this.renderService)
      .then(this.getChildService)
      .then(this.ping)
      .catch(this.renderPingFail)
  }

  init() {
    const serverInfoDom = document.querySelector('#serverInfo')
    serverInfoDom.addEventListener('click', this.changeService)
  }

  getServices() {
    return this.getVersion()
      .then(this.getResVersion)
      .then(this.getConfig)
      .then(this.saveServices)
  }

  private getRandomUrl = (url: string) => {
    return `${url}?randv=${Math.random()
      .toString()
      .substring(2, 17)
      .padStart(16, '0')}`
  }

  private getVersion = async () => {
    const url = this.getRandomUrl(
      `${remoteDomains[this.server].domain}/version.json`
    )
    const res = (await Network.getJson(url)) as MajsoulPlus_Manager.VersionJson
    return res.version
  }

  private getResVersion = async (version: string) => {
    const originUrl = `${
      remoteDomains[this.server].domain
    }/resversion${version}.json`
    const url = this.getRandomUrl(originUrl)
    const res = (await Network.getJson(
      url
    )) as MajsoulPlus_Manager.ResVersionJson
    return res.res['config.json'].prefix
  }

  private getConfig = async (prefix: string) => {
    const originUrl = `${
      remoteDomains[this.server].domain
    }/${prefix}/config.json`
    const url = this.getRandomUrl(originUrl)
    const res = (await Network.getJson(url)) as MajsoulPlus_Manager.ConfigJson
    return res.ip
  }

  private saveServices = (ips: MajsoulPlus_Manager.ConfigJsonItem[]) => {
    this.services = ips[0].region_urls
  }

  private getService = () => {
    if (!this.services) return Promise.reject(new Error('services is null'))
    const choseService =
      Number(window.localStorage.getItem('choseService')) || 0
    if (choseService) {
      this.currentService =
        this.services.length > choseService ? choseService : 0
    } else {
      this.currentService = 0
    }
    return Promise.resolve()
  }

  private getChildService = () => {
    return new Promise((resolve, reject) => {
      if (this.services) {
        const originUrl = `${this.services[this.currentService]}`
        const url = `${this.getRandomUrl(
          originUrl
        )}&service=ws-gateway&protocol=ws&ssl=true`
        Network.getJson(url)
          .then((res: MajsoulPlus_Manager.ServerListJson) => {
            resolve(res.servers[0])
          })
          .catch(reject)
      } else {
        reject(new Error('services is not null'))
      }
    })
  }

  private renderService = () => {
    const serverTextDom = document.querySelector('#serverText') as HTMLElement
    const serverIndex = document.querySelector('#serverIndexNum') as HTMLElement
    const pingInfoDom = document.querySelector('#pingInfo')
    const pingTextDom = document.querySelector('#pingText')
    pingInfoDom.className = 'offline'
    pingTextDom.textContent = '--'
    i18n.unbindElement(serverTextDom)
    i18n.text.main['server'].renderAsText(serverTextDom)
    serverIndex.innerHTML = '&nbsp;' + (this.currentService + 1).toString()
    return Promise.resolve()
  }

  renderPing = (time: number) => {
    const pingTextDom = document.querySelector('#pingText')
    const pingInfoDom = document.querySelector('#pingInfo')
    pingTextDom.textContent = String(time >> 0)
    pingInfoDom.className = time < 150 ? 'green' : time < 500 ? 'orange' : 'red'
  }

  renderPingFail = () => {
    const serverTextDom = document.querySelector('#serverText') as HTMLElement
    i18n.unbindElement(serverTextDom)
    i18n.text.manager.loadFailed.renderAsText(serverTextDom)
  }

  iPing = (service: string) => {
    return new Promise((resolve, reject) => {
      const address = service.split(':')[0]
      const port = Number(service.split(':')[1])
      tcpPing.ping(
        {
          address,
          port,
          attempts: 3
        },
        (err, data) => {
          if (err) {
            console.error(err)
            reject(new Error('tcp-ping error'))
          }
          resolve(data.avg)
        }
      )
    })
  }

  getNextService = () => {
    this.currentService = (this.currentService + 1) % this.services.length
    localStorage.setItem('choseService', this.currentService.toString())
    return Promise.resolve()
  }

  changeService = () => {
    if (this.services.length > 1) {
      this.getNextService()
        .then(this.renderService)
        .then(this.getChildService)
        .then(this.iPing)
        .catch(this.renderPingFail)
    }
  }

  ping = (service: string) => {
    clearInterval(this.interval)
    this.interval = setInterval(() => {
      this.iPing(service).then(this.renderPing)
    }, 10000)
  }
}

export default new Ping()
