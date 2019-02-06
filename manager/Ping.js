/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const NetworkUtil = require('./Network')
const tcpPing = require('tcp-ping')

class Ping {
  constructor () {
    this.services = null
    this.currentService = null
    this.serviceList = []
    this.interval = null
  }

  _getRandomUrl (url) {
    return `${url}?randv=${Math.random().toString().substring(2, 17).padStart(16, '0')}`
  }

  _getVersion () {
    const url = this._getRandomUrl('https://majsoul.union-game.com/0/version.json')
    return NetworkUtil.getJson(url)
      .then(res => res.version)
  }

  _getResVersion (version) {
    const originUrl = `https://majsoul.union-game.com/0/resversion${version}.json`
    const url = this._getRandomUrl(originUrl)
    return NetworkUtil.getJson(url)
      .then(res => res.res['config.json'].prefix)
  }

  _getConfig (prefix) {
    const originUrl = `https://majsoul.union-game.com/0/${prefix}/config.json`
    const url = this._getRandomUrl(originUrl)
    return NetworkUtil.getJson(url)
      .then(res => res.ip)
  }

  _saveServices (ips) {
    this.services = ips[0].region_urls
    this.serviceList = Object.keys(this.services)
  }

  _getServices () {
    return this._getVersion()
      .then(this._getResVersion)
      .then(this._getConfig)
      .then(this._saveServices)
  }

  _getService () {
    if (!this.services) return Promise.reject(new Error(new Error('services is null')))
    const choseService = localStorage.getItem('choseService')
    if (choseService) {
      this.currentService = this.serviceList.find(service => service === choseService) || this.serviceList[0]
    }
    return Promise.resolve()
  }

  _getServiceName (service) {
    const map = {
      mainland: '中国大陆',
      hk: '中国香港',
      tw: '中国台湾',
      us: '美国',
      uk: '英国',
      jp: '日本',
      fr: '法国',
      kr: '韩国',
      sg: '新加坡',
      de: '德国',
      ru: '俄罗斯'
    }
    return map[service] || service
  }

  _getChildService () {
    return new Promise((resolve, reject) => {
      if (this.services) {
        const originUrl = `${this.services[this.currentService]}`
        const url = `${this._getRandomUrl(originUrl)}&service=ws-gateway&protocol=ws&ssl=true`
        NetworkUtil.getJson(url)
          .then(res => {
            resolve(res.servers[0])
          })
          .catch(reject)
      } else {
        reject(new Error(new Error('services is not null')))
      }
    })
  }

  _renderError (err) {
    console.error(err)
    const serverTextDom = document.getElementById('serverText')
    serverTextDom.innerText = '加载失败'
  }

  _renderService () {
    const serverTextDom = document.getElementById('serverText')
    const pingInfoDom = document.getElementById('pingInfo')
    const pingTextDom = document.getElementById('pingText')
    pingInfoDom.className = 'offline'
    pingTextDom.innerText = '--'
    serverTextDom.innerText = this._getServiceName(this.currentService)
    return Promise.resolve()
  }

  _renderPing (time) {
    const pingTextDom = document.getElementById('pingText')
    const pingInfoDom = document.getElementById('pingInfo')
    pingTextDom.innerText = time >> 0
    pingInfoDom.className = time < 150 ? 'green' : time < 500 ? 'orange' : 'red'
  }

  _ping (service) {
    return new Promise((resolve, reject) => {
      const address = service.split(':')[0]
      const port = service.split(':')[1]
      tcpPing.ping({
        address,
        port,
        attempts: 3
      }, (err, data) => {
        if (err) {
          console.error(err)
          reject(new Error('tcp-ping error'))
        }
        resolve(data.avg)
      })
    })
  }

  _initPing () {
    this._getServices()
      .then(this._getService)
      .then(this._renderService)
      .then(this._getChildService)
      .then(this.ping)
      .catch(console.error)
  }

  _getNextService () {
    let index = this.serviceList.indexOf(this.currentService)
    index = index > this.serviceList.length ? 0 : index + 1
    this.currentService = this.serviceList[index]
    localStorage.setItem('choseService', this.currentService)
    return Promise.resolve()
  }

  _changeService () {
    this._getNextService()
      .then(this._renderService)
      .then(this._getChildService)
      .then(this.ping)
      .catch(console.error)
  }

  addEventListener () {
    const serverInfoDom = document.getElementById('serverInfo')
    serverInfoDom.addEventListener('click', this._changeService)
  }

  _refresh () {
    this._getService()
      .then(this._renderService)
      .then(this._getChildService)
      .then(this.ping)
      .catch(console.error)
  }

  ping (service) {
    clearInterval(this.interval)
    this.interval = setInterval(() => {
      this._ping(service)
        .then(this._renderPing)
    }, 5000)
  }

  init () {
    this._initPing()
    this.addEventListener()
  }
}

module.exports = new Ping()
