import { Network } from './Network'
import * as tcpPing from 'tcp-ping'
import { i18n } from '../../i18nInstance'

export class Ping {
  server: string
  services: MajsoulPlus_Manager.RegionUrls
  currentService = null
  serviceList = []
  interval = null

  constructor(server: 'zh' | 'jp' | 'en') {
    this.server = server
  }

  private getRandomUrl(url: string) {
    return `${url}?randv=${Math.random()
      .toString()
      .substring(2, 17)
      .padStart(16, '0')}`
  }

  getVersion = async () => {
    const url = this.getRandomUrl(
      'https://majsoul.union-game.com/0/version.json'
    )
    const res = (await Network.getJson(url)) as MajsoulPlus_Manager.VersionJson
    return res.version
  }

  getResVersion = async (version: string) => {
    const originUrl = `https://majsoul.union-game.com/0/resversion${version}.json`
    const url = this.getRandomUrl(originUrl)
    const res = (await Network.getJson(
      url
    )) as MajsoulPlus_Manager.ResVersionJson
    return res.res['config.json'].prefix
  }

  getConfig = async (prefix: string) => {
    const originUrl = `https://majsoul.union-game.com/0/${prefix}/config.json`
    const url = this.getRandomUrl(originUrl)
    const res = (await Network.getJson(url)) as MajsoulPlus_Manager.ConfigJson
    return res.ip
  }

  saveServices = (ips: MajsoulPlus_Manager.ConfigJsonItem[]) => {
    this.services = ips[0].region_urls
    this.serviceList = Object.keys(this.services)
  }

  getServices = () => {
    return this.getVersion()
      .then(this.getResVersion)
      .then(this.getConfig)
      .then(this.saveServices)
  }

  getService = () => {
    if (!this.services) return Promise.reject(new Error('services is null'))
    const choseService = window.localStorage.getItem('choseService')
    if (choseService) {
      this.currentService =
        this.serviceList.find(service => service === choseService) ||
        this.serviceList[0]
    } else {
      this.currentService = this.serviceList[0]
    }
    return Promise.resolve()
  }

  getServiceName = (service: string) => {
    // FIXME: 日服/国际服后 mainland 意义发生改变
    // 日服也使用 mainland
    return i18n.text.servers[service]
  }

  getChildService = () => {
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

  // 这个函数没有被使用
  renderError = (err: Error) => {
    console.error(err)
    const serverTextDom = document.querySelector('#serverText')
    serverTextDom.innerText = '加载失败'
  }

  renderService = () => {
    const serverTextDom = document.querySelector('#serverText')
    const pingInfoDom = document.querySelector('#pingInfo')
    const pingTextDom = document.querySelector('#pingText')
    pingInfoDom.className = 'offline'
    pingTextDom.innerText = '--'
    i18n.unbindElement(serverTextDom)
    this.getServiceName(this.currentService).renderAsText(serverTextDom)
    return Promise.resolve()
  }

  renderPing = (time: number) => {
    const pingTextDom = document.querySelector('#pingText')
    const pingInfoDom = document.querySelector('#pingInfo')
    pingTextDom.innerText = String(time >> 0)
    pingInfoDom.className = time < 150 ? 'green' : time < 500 ? 'orange' : 'red'
  }

  renderPingFail = () => {
    const serverTextDom = document.querySelector('#serverText')
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

  initPing = () => {
    this.getServices()
      .then(this.getService)
      .then(this.renderService)
      .then(this.getChildService)
      .then(this.ping)
      .catch(this.renderPingFail)
  }

  getNextService = () => {
    let index = this.serviceList.indexOf(this.currentService)
    index = index + 1 >= this.serviceList.length ? 0 : index + 1
    this.currentService = this.serviceList[index]
    localStorage.setItem('choseService', this.currentService)
    return Promise.resolve()
  }

  changeService = () => {
    this.getNextService()
      .then(this.renderService)
      .then(this.getChildService)
      .then(this.iPing)
      .catch(this.renderPingFail)
  }

  addEventListener = () => {
    const serverInfoDom = document.querySelector('#serverInfo')
    serverInfoDom.addEventListener('click', this.changeService)
  }

  refresh = () => {
    this.getService()
      .then(this.renderService)
      .then(this.getChildService)
      .then(this.iPing)
      .catch(console.error)
  }

  ping = (service: string) => {
    clearInterval(this.interval)
    this.interval = setInterval(() => {
      this.iPing(service).then(this.renderPing)
    }, 5000)
  }

  init = () => {
    this.initPing()
    this.addEventListener()
  }
}
