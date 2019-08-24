import { ipcRenderer, remote, shell } from 'electron'
import i18n from '../../i18n'
const { app } = remote

class AboutPage {
  render = () => {
    const aboutInner = document.querySelector('#about-inner')
    aboutInner.innerHTML = ''
    this.addToUsers()
    this.addGitHubLink()
  }

  private addBlock = ({ title, value }) => {
    const aboutInner = document.querySelector('#about-inner')
    const h3 = document.createElement('h3')
    const info = document.createElement('p')
    if (typeof value === 'string') {
      h3.innerText = title
      info.innerText = value
      aboutInner.append(h3)
      aboutInner.append(info)
    } else {
      h3.innerText = title
      aboutInner.append(h3)
      aboutInner.append(value)
    }
  }

  private addToUsers = () => {
    const title = '致用户'
    const value =
      '  感谢您正在阅读这段文字，我是《雀魂 Plus》开发者之一：Handle。首先，感谢您信赖并使用《雀魂 Plus》，这是我第一个破 10 Star 的项目，同时也是我倾注了大量心血的作品，对于其意外登上一些论坛的置顶，我感到兴奋，但同时更多的是震惊。\n\n' +
      '  相信您和我一样是喜欢着《雀魂》这款游戏才能让您读到这段文字，同样，也相信您了解一款游戏的生存无非能否长期稳定地盈利，《雀魂 Plus》提供的功能最初只是为了方便修改桌布和音乐，但目前的发展情况，但很明显，《雀魂 Plus》的传播已经明显超出了可控范围。试想，如果您是《雀魂》的付费用户，在得知免费玩家可以享受到付费体验，心中会有什么想法？还会继续为《雀魂》付费么？如果大家都在使用修改实现的装扮而不为《雀魂》付费，那么这款游戏的未来会怎样？会继续盈利下去么？相信您您的内心现在已经想到了未来可能发生的事，我们都不希望那样的未来。\n\n' +
      '  作为“始作俑者”，我不希望《雀魂 Plus》被滥用，我希望的是《雀魂 Plus》可以为《雀魂》提供一个PC稳定的游戏环境和体验，在这基础上体验一些《雀魂》尚未实现的、或是其他游戏中存在的优秀功能，并非为了让使用者白嫖《雀魂》，这是一个不健康的发展路径，无论你我，当然不希望《雀魂》会走上《雀龙门》的老路，成为一款冷门游戏，或是成为下一个《X海战记》。《雀魂》当前的付费点主要就是装扮，还望各位手下留情，使用魔改的同时别忘为游戏付费，一款好的游戏值得去为其体验埋单。\n\n' +
      '  《雀魂 Plus》现在的更新重点是作为一个游戏浏览器体验的优化上，对于目前已有的扩展功能将仅做维护，感谢您的理解。相信您在思考后，也会在《雀魂》中“补票”吧。'
    this.addBlock({ title, value })
  }

  private addGitHubLink = () => {
    const title = i18n.text.main.programName()
    const value = this.getGitHubHTML()
    this.addBlock({ title, value })
  }

  private getGitHubHTML = () => {
    const info = document.createElement('p')
    info.innerHTML = `在 PC 上跨平台的雀魂麻将第三方浏览器，提供资源替换和代码注入功能，并对直播环境进行了一定优化。
      <br>
      <br>
      <span>${i18n.text.manager.localVersion()} ${app.getVersion()}</span>
      <a href="https://github.com/MajsoulPlus/majsoul-plus-client">
        <img alt="Github Stars" src="https://img.shields.io/github/stars/MajsoulPlus/majsoul-plus-client.svg?style=social">
      </a>
      <br>
      <br>
      <input type="button" value="${i18n.text.manager.clearCache()}">`
    const alinks = info.querySelectorAll('a')
    this.bindAlink(alinks)
    info
      .querySelector('input[type="button"]')
      .addEventListener('click', evt => {
        evt.preventDefault()
        ipcRenderer.sendSync('clear-cache')
        alert(i18n.text.manager.clearCacheSucceeded())
      })
    return info
  }

  private bindAlink = (alinks: NodeListOf<HTMLAnchorElement>) => {
    const links = Array.from(alinks || [])
    links.forEach(alink => {
      alink.addEventListener('click', (event: Event) => {
        event.preventDefault()
        shell.openExternal(alink.href)
      })
    })
  }
}

export default new AboutPage()
