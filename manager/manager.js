const fs = require('fs')
const path = require('path')
const configs = require('../configs')
const { ipcRenderer, remote: electronRemote, shell } = require('electron')
const dialog = electronRemote.dialog
const AdmZip = require('adm-zip')
const os = require('os')

// 注入脚本根文件根目录
const executeRootDir = path.join(__dirname, '../', configs.EXECUTE_DIR)
const executeSettingsFile = path.join(executeRootDir, './active.json')

// Mod文件根目录
const modRootDir = path.join(__dirname, '../', configs.MODS_DIR)
const modSettingsFile = path.join(modRootDir, './active.json')

// 工具根目录
const toolsRootDir = path.join(__dirname, '../', configs.TOOLS_DIR)

/**
 * 同步删除文件夹
 * @param {string} dir 要删除的目录
 * @author romin
 * @description 同步删除文件夹，https://juejin.im/post/5ab32b20518825557f00d36c
 */
function removeDir(dir) {
  let files = fs.readdirSync(dir)
  for (var i = 0; i < files.length; i++) {
    let newPath = path.join(dir, files[i])
    let stat = fs.statSync(newPath)
    if (stat.isDirectory()) {
      //如果是文件夹就递归下去
      removeDir(newPath)
    } else {
      //删除文件
      fs.unlinkSync(newPath)
    }
  }
  fs.rmdirSync(dir) //如果文件夹是空的，就将自己删除掉
}

/**
 * 刷新所有模组和插件并重新加载DOM
 * @type {function}
 */
let refreshFunction

/**
 * @type {Array<>}
 */
let executeLaunched = (() => {
  try {
    return JSON.parse(fs.readFileSync(executeSettingsFile).toString('utf-8'))
  } catch (error) {
    console.warn(error)
    return []
  }
})()
/**
 * @type {Array<>}
 */
let modLaunched = (() => {
  try {
    return JSON.parse(fs.readFileSync(modSettingsFile).toString('utf-8'))
  } catch (error) {
    console.warn(error)
    return []
  }
})()

/**
 * @type {Array<>}
 */
let executesWindow

/**
 * @type {Array<>}
 */
let modsWindow

/**
 * @type {Array<>}
 */
let toolsWindow

const infoCardIdMap = {}
/**
 * 信息卡
 */
class InfoCard {
  /**
   * 模组和插件通用的信息卡
   * @param {{name:string,author:string,description:string,preview:string,filesDir:string}} infos
   * @param {boolean} checked
   */
  constructor(infos, checked = false, isButton = false) {
    this.infos = infos
    this.checked = checked
    this.name = infos.name ? infos.name : '未知'
    this.author = infos.author ? infos.author : '无名氏'
    this.description = infos.description ? infos.description : '无描述'
    this.previewSrc = path.join(
      infos.filesDir,
      infos.preview ? infos.preview : 'preview.jpg'
    )
    this._inputType = isButton ? 'button' : 'checkbox'
    /**
     * @type {{[x:string]:Array<>}}
     */
    this._eventListeners = {}
    this.initDOM()
    this.edit = false
  }
  get DOM() {
    return this._dom
  }
  set DOM(value) {
    this._dom = value
  }
  initDOM() {
    const article = document.createElement('article')
    const preview = document.createElement('img')
    const h3 = document.createElement('h3')
    const address = document.createElement('address')
    const p = document.createElement('p')
    const input = document.createElement('input')
    const label = document.createElement('label')
    const exportBtn = document.createElement('button')
    const removeBtn = document.createElement('button')

    preview.src = this.previewSrc
    preview.addEventListener('error', function errFun() {
      preview.src = path.join(__dirname, 'defaultPreview.jpg')
      preview.removeEventListener('error', errFun)
    })
    preview.addEventListener('dragstart', event => {
      event.preventDefault()
    })

    h3.innerText = this.name
    address.innerText = this.author
    p.innerText = this.description

    if (this._inputType === 'checkbox') {
      input.type = 'checkbox'
      input.addEventListener('change', event => {
        if (this._eventListeners['change']) {
          this._eventListeners['change'].forEach(listener => {
            listener.call(this, event)
          })
        }
      })
      input.checked = this.checked
      Object.defineProperty(this, 'checked', {
        get: () => input.checked,
        set: value => (input.checked = value)
      })
    } else if (this._inputType === 'button') {
      input.type = 'button'
      input.addEventListener('click', event => {
        if (this._eventListeners['click']) {
          this._eventListeners['click'].forEach(listener => {
            listener.call(this, event)
          })
        }
      })
    }

    input.id = (function getRandomId() {
      let str = 'infoCard_'
      window.crypto.getRandomValues(new Uint32Array(3)).forEach(value => {
        str += value.toString(32)
      })
      if (infoCardIdMap[str]) {
        return getRandomId()
      }
      infoCardIdMap[str] = true
      return str
    })()
    label.setAttribute('for', input.id)

    exportBtn.className = 'export-btn'
    exportBtn.addEventListener('click', event => {
      if (this._eventListeners['export']) {
        this._eventListeners['export'].forEach(listener => {
          listener.call(this, event)
        })
      }
    })

    removeBtn.className = 'remove-btn'
    removeBtn.addEventListener('click', event => {
      if (this._eventListeners['remove']) {
        this._eventListeners['remove'].forEach(listener => {
          listener.call(this, event)
        })
      }
    })

    article.appendChild(preview)
    article.appendChild(h3)
    article.appendChild(p)

    article.appendChild(address)

    article.appendChild(input)
    article.appendChild(label)

    article.appendChild(exportBtn)
    article.appendChild(removeBtn)

    this.DOM = article
  }
  addEventListener(type, listener) {
    if (!this._eventListeners[type]) {
      this._eventListeners[type] = []
    }
    this._eventListeners[type].push(listener)
  }
  removeEventListener(type, listener) {
    if (!this._eventListeners[type]) {
      return
    }
    this._eventListeners[type].forEach((addedListener, index) => {
      if (addedListener === listener) {
        this._eventListeners[type].splice(index, 1)
        return
      }
    })
  }
  get edit() {
    return this._edit
  }
  set edit(value) {
    this._edit = value
    if (value === true) {
      this.DOM.className = 'edit'
    } else {
      this.DOM.className = ''
    }
  }
}
/**
 * @type {Array<InfoCard>}
 */
let modCards
/**
 * @type {Array<InfoCard>}
 */
let executeCards
/**
 * @type {Array<InfoCard>}
 */
let toolCards

/**
 * 保存设置
 */
const saveSettings = () => {
  const executesWindowList = executesWindow.map(
    element => `${element.name}|${element.author}`
  )
  executeLaunched = executeLaunched.filter(element => {
    return executesWindowList.includes(`${element.name}|${element.author}`)
  })

  const modsWindowList = modsWindow.map(
    element => `${element.name}|${element.author}`
  )
  modLaunched = modLaunched.filter(element => {
    return modsWindowList.includes(`${element.name}|${element.author}`)
  })

  fs.writeFileSync(executeSettingsFile, JSON.stringify(executeLaunched), {
    encoding: 'utf-8'
  })
  fs.writeFileSync(modSettingsFile, JSON.stringify(modLaunched), {
    encoding: 'utf-8'
  })
}
/**
 * 启动游戏
 */
const startGame = () => {
  saveSettings()
  ipcRenderer.send('application-message', 'start-game')
}
/**
 * 刷新所有DOM节点
 * @param {Array<>} executes 插件
 * @param {Array<>} mods 模组
 * @param {Array<>} tools 工具
 */
const reloadDOM = (executes, mods, tools) => {
  const modInfos = document.getElementById('modInfos')
  const executeInfos = document.getElementById('executeInfos')
  const toolInfos = document.getElementById('toolInfos')

  modInfos.innerHTML = ''
  executeInfos.innerHTML = ''
  toolInfos.innerHTML = ''

  // Execute
  const executeLaunchedList = executeLaunched.map(
    element => `${element.name}|${element.author}`
  )
  executeCards = []
  executes.forEach((executeInfo, index) => {
    const keyString = `${executeInfo.name}|${executeInfo.author}`

    const infoCard = new InfoCard(executeInfo)
    executeCards.push(infoCard)

    if (executeLaunchedList.includes(keyString)) {
      infoCard.checked = true
      executeLaunched[executeLaunchedList.indexOf(keyString)].filesDir =
        executeInfo.filesDir
    } else {
      infoCard.checked = false
    }

    const onchangeFunction = event => {
      if (infoCard.checked) {
        if (executeLaunchedList.includes(keyString)) {
          return
        } else {
          executeLaunched.push(executeInfo)
          executeLaunchedList.push(keyString)
        }
      } else {
        if (executeLaunchedList.includes(keyString)) {
          const index = executeLaunchedList.indexOf(keyString)
          executeLaunched.splice(index, 1)
          executeLaunchedList.splice(index, 1)
        } else {
          return
        }
      }
    }
    const onexportFunction = event => {
      const zip = new AdmZip()
      const tempZipName = `${executeInfo.name}-${executeInfo.author}.mspe`
      const tempZipPathName = path.join(os.tmpdir(), tempZipName)
      zip.addLocalFolder(
        executeInfo.filesDir,
        path.basename(executeInfo.filesDir)
      )
      zip.writeZip(tempZipPathName, true)
      const userChosenPath = dialog.showSaveDialog({
        title: '导出插件到……',
        filters: [
          {
            name: '雀魂Plus插件',
            extensions: ['mspe']
          },
          {
            name: '所有文件',
            extensions: ['*']
          }
        ],
        defaultPath: tempZipName
      })
      if (userChosenPath) {
        fs.copyFile(tempZipPathName, userChosenPath, err => {
          if (err) {
            alert('导出失败！\n错误信息如下:\n' + err)
          } else {
            alert('导出成功！')
          }
        })
      }
    }
    const onremoveFunction = event => {
      infoCard.DOM.remove()
      removeDir(infoCard.infos.filesDir)
      refreshFunction()
    }
    infoCard.addEventListener('change', onchangeFunction)
    infoCard.addEventListener('export', onexportFunction)
    infoCard.addEventListener('remove', onremoveFunction)

    executeInfos.appendChild(infoCard.DOM)
  })

  // Mod
  const modLaunchedList = modLaunched.map(
    element => `${element.name}|${element.author}`
  )
  modCards = []
  mods.forEach((modInfo, index) => {
    const keyString = `${modInfo.name}|${modInfo.author}`

    const infoCard = new InfoCard(modInfo)
    modCards.push(infoCard)

    if (modLaunchedList.includes(keyString)) {
      infoCard.checked = true
      modLaunched[modLaunchedList.indexOf(keyString)].filesDir =
        modInfo.filesDir
    } else {
      infoCard.checked = false
    }

    const onchangeFunction = event => {
      if (infoCard.checked) {
        if (modLaunchedList.includes(keyString)) {
          return
        } else {
          modLaunched.push(modInfo)
          modLaunchedList.push(keyString)
        }
      } else {
        if (modLaunchedList.includes(keyString)) {
          const index = modLaunchedList.indexOf(keyString)
          modLaunched.splice(index, 1)
          modLaunchedList.splice(index, 1)
        } else {
          return
        }
      }
    }
    const onexportFunction = event => {
      const zip = new AdmZip()
      const tempZipName = `${modInfo.name}-${modInfo.author}.mspm`
      const tempZipPathName = path.join(os.tmpdir(), tempZipName)
      zip.addLocalFolder(modInfo.filesDir, path.basename(modInfo.filesDir))
      zip.writeZip(tempZipPathName, true)
      const userChosenPath = dialog.showSaveDialog({
        title: '导出Mod到……',
        filters: [
          {
            name: '雀魂Plus Mod',
            extensions: ['mspm']
          },
          {
            name: '所有文件',
            extensions: ['*']
          }
        ],
        defaultPath: tempZipName
      })
      if (userChosenPath) {
        fs.copyFile(tempZipPathName, userChosenPath, err => {
          if (err) {
            alert('导出失败！\n错误信息如下:\n' + err)
          } else {
            alert('导出成功！')
          }
        })
      }
    }
    const onremoveFunction = event => {
      infoCard.DOM.remove()
      removeDir(infoCard.infos.filesDir)
      refreshFunction()
    }
    infoCard.addEventListener('change', onchangeFunction)
    infoCard.addEventListener('export', onexportFunction)
    infoCard.addEventListener('remove', onremoveFunction)

    modInfos.appendChild(infoCard.DOM)
  })

  // Tool
  toolCards = []
  tools.forEach((toolInfo, index) => {
    const infoCard = new InfoCard(toolInfo, false, true)
    toolCards.push(infoCard)

    const onClickFunction = event => {
      ipcRenderer.send('application-message', 'start-tool', toolInfo)
    }
    const onexportFunction = event => {
      const zip = new AdmZip()
      const tempZipName = `${toolInfo.name}-${toolInfo.author}.mspt`
      const tempZipPathName = path.join(os.tmpdir(), tempZipName)
      zip.addLocalFolder(toolInfo.filesDir, path.basename(toolInfo.filesDir))
      zip.writeZip(tempZipPathName, true)
      const userChosenPath = dialog.showSaveDialog({
        title: '导出工具到……',
        filters: [
          {
            name: '雀魂Plus工具',
            extensions: ['mspt']
          },
          {
            name: '所有文件',
            extensions: ['*']
          }
        ],
        defaultPath: tempZipName
      })
      if (userChosenPath) {
        fs.copyFile(tempZipPathName, userChosenPath, err => {
          if (err) {
            alert('导出失败！\n错误信息如下:\n' + err)
          } else {
            alert('导出成功！')
          }
        })
      }
    }
    const onremoveFunction = event => {
      infoCard.DOM.remove()
      removeDir(infoCard.infos.filesDir)
      refreshFunction()
    }
    infoCard.addEventListener('click', onClickFunction)
    infoCard.addEventListener('export', onexportFunction)
    infoCard.addEventListener('remove', onremoveFunction)

    toolInfos.appendChild(infoCard.DOM)
  })
}

// 安装模组 按钮
const installMod = document.getElementById('installMod')
installMod.addEventListener('click', event => {
  const userChosenPath = dialog.showOpenDialog({
    title: '选取Mod资源包……',
    filters: [
      {
        name: '雀魂Plus Mod',
        extensions: ['mspm']
      },
      {
        name: '所有文件',
        extensions: ['*']
      }
    ]
  })
  if (userChosenPath && userChosenPath[0]) {
    userChosenPath.forEach(chosenPath => {
      const unzip = new AdmZip(chosenPath)
      unzip.extractAllToAsync(modRootDir, true, err => {
        if (err) {
          alert('安装失败！\n错误信息如下:\n' + err)
        } else {
          alert('安装成功！')
          refreshFunction()
        }
      })
    })
  }
})

// 安装插件 按钮
const installExecute = document.getElementById('installExecute')
installExecute.addEventListener('click', event => {
  const userChosenPath = dialog.showOpenDialog({
    title: '选取插件资源包……',
    filters: [
      {
        name: '雀魂Plus插件',
        extensions: ['mspe']
      },
      {
        name: '所有文件',
        extensions: ['*']
      }
    ]
  })
  if (userChosenPath && userChosenPath[0]) {
    userChosenPath.forEach(chosenPath => {
      const unzip = new AdmZip(chosenPath)
      unzip.extractAllToAsync(executeRootDir, true, err => {
        if (err) {
          alert('安装失败！\n错误信息如下:\n' + err)
        } else {
          alert('安装成功！')
          refreshFunction()
        }
      })
    })
  }
})

// 安装工具 按钮
const installTool = document.getElementById('installTool')
installTool.addEventListener('click', event => {
  const userChosenPath = dialog.showOpenDialog({
    title: '选取工具资源包……',
    filters: [
      {
        name: '雀魂Plus工具',
        extensions: ['mspt']
      },
      {
        name: '所有文件',
        extensions: ['*']
      }
    ]
  })
  if (userChosenPath && userChosenPath[0]) {
    userChosenPath.forEach(chosenPath => {
      const unzip = new AdmZip(chosenPath)
      unzip.extractAllToAsync(toolsRootDir, true, err => {
        if (err) {
          alert('安装失败！\n错误信息如下:\n' + err)
        } else {
          alert('安装成功！')
          refreshFunction()
        }
      })
    })
  }
})

// 记录编辑状态使用的变量
let executesEditFlag = false
let modsEditFlag = false
let toolsEditFlag = false

const editMod = document.getElementById('editMod')
editMod.addEventListener('click', event => {
  modsEditFlag = !modsEditFlag
  modCards.forEach(card => {
    card.edit = modsEditFlag
  })
})
const editExecute = document.getElementById('editExecute')
editExecute.addEventListener('click', event => {
  executesEditFlag = !executesEditFlag
  executeCards.forEach(card => {
    card.edit = executesEditFlag
  })
})
const editTool = document.getElementById('editTool')
editTool.addEventListener('click', event => {
  toolsEditFlag = !toolsEditFlag
  toolCards.forEach(card => {
    card.edit = toolsEditFlag
  })
})

// 刷新事件
refreshFunction = event => {
  // 清除编辑状态
  executesEditFlag = false
  modsEditFlag = false
  toolsEditFlag = false
  // 所有已在目录中的注入脚本目录
  const executeDirs = fs.readdirSync(executeRootDir)
  // 用于存储注入脚本对象
  const executes = []
  // 遍历所有注入脚本文件夹，寻找 execute.json并加载
  executeDirs.forEach(dir => {
    const executeDir = path.join(executeRootDir, dir)
    const stats = fs.statSync(executeDir)

    if (stats.isDirectory()) {
      try {
        const data = fs.readFileSync(path.join(executeDir, 'execute.json'))
        const executeInfo = JSON.parse(data.toString('utf-8'))
        executeInfo.filesDir = executeDir
        executes.push(executeInfo)
      } catch (error) {
        console.warn(error)
      }
    } else {
      // TODO, 若为 "*.mspe" 则作为 zip 文件解压，然后加载
    }
  })

  // 所有已在目录中的Mod目录
  const modDirs = fs.readdirSync(modRootDir)
  // 用于存储Mod对象
  const mods = []
  // 遍历所有Mod文件夹，寻找 Mod.json并加载
  modDirs.forEach(dir => {
    const modDir = path.join(modRootDir, dir)
    const stats = fs.statSync(modDir)
    if (stats.isDirectory()) {
      try {
        const data = fs.readFileSync(path.join(modDir, 'mod.json'))
        const modInfo = JSON.parse(data.toString('utf-8'))
        modInfo.filesDir = modDir
        mods.push(modInfo)
      } catch (error) {
        console.warn(error)
      }
    } else {
      // TODO, 若为 "*.mspm" 则作为 zip 文件解压，然后加载
    }
  })

  // 所有已在目录中的 tool 目录
  const toolDirs = fs.readdirSync(toolsRootDir)
  // 用于存储 tool 对象
  const tools = []
  // 遍历所有 tool 文件夹，寻找 Tool.json并加载
  toolDirs.forEach(dir => {
    const toolDir = path.join(toolsRootDir, dir)
    const stats = fs.statSync(toolDir)
    if (stats.isDirectory()) {
      try {
        const data = fs.readFileSync(path.join(toolDir, 'tool.json'))
        const toolInfo = JSON.parse(data.toString('utf-8'))
        toolInfo.filesDir = toolDir
        tools.push(toolInfo)
      } catch (error) {
        console.warn(error)
      }
    } else {
      // TODO, 若为 "*.mspt" 则作为 zip 文件解压，然后加载
    }
  })
  executesWindow = executes
  modsWindow = mods
  toolsWindow = tools

  reloadDOM(executes, mods, tools)
}

// 刷新模组 按钮
document.getElementById('refreshMod').addEventListener('click', refreshFunction)
// 刷新插件 按钮
document
  .getElementById('refreshExecute')
  .addEventListener('click', refreshFunction)
// 刷新插件 按钮
document
  .getElementById('refreshTool')
  .addEventListener('click', refreshFunction)

// 启动游戏 按钮
document.getElementById('launch').addEventListener('click', startGame)

// 关闭页面 按钮
const closeBtn = document.getElementById('closeBtn')
if (os.platform() === 'darwin') {
  closeBtn.className = 'close-btn darwin'
  // hack close bar
  const body = document.querySelector('body')
  body.classList.add('darwin')
  const closeButton = document.querySelector('body > .close-btn.darwin')
  body.removeChild(closeButton)
}
closeBtn.addEventListener('click', () => {
  window.close()
})

// 标题配色
window.addEventListener('blur', () => {
  document.body.classList.add('blur')
})
window.addEventListener('focus', () => {
  document.body.classList.remove('blur')
})

refreshFunction()

/* 分页提供业务逻辑 Start */
Array.prototype.forEach.call(
  document.querySelectorAll('.left-pannel ul li'),
  node => {
    node.addEventListener('click', event => {
      const sections = document.getElementsByTagName('section')
      Array.prototype.forEach.call(sections, section => {
        if (section.dataset.name === node.dataset.target) {
          section.className = 'show'
        } else {
          section.className = ''
        }
      })
      Array.prototype.forEach.call(
        document.querySelectorAll('.left-pannel ul li'),
        node => {
          node.className = ''
        }
      )
      node.className = 'active'
    })
  }
)
document.querySelectorAll('.left-pannel ul li')[0].click()
/* 分页提供业务逻辑 End */

/* Ping 业务逻辑 Start */
const getServersJson = () => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(
      'GET',
      `https://majsoul.union-game.com/0/version.json?randv=${Math.random()
        .toString()
        .substring(2, 17)
        .padStart(16, '0')}`
    )
    xhr.send()
    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText))
      } else if (xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200) {
        reject()
      }
    })
  })
    .then(
      result =>
        new Promise((reslove, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open(
            'GET',
            `https://majsoul.union-game.com/0/resversion${
              result.version
            }.json?randv=${Math.random()
              .toString()
              .substring(2, 17)
              .padStart(16, '0')}`
          )
          xhr.send()
          xhr.addEventListener('readystatechange', () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
              reslove(JSON.parse(xhr.responseText).res['config.json'])
            } else if (
              xhr.readyState === XMLHttpRequest.DONE &&
              xhr.status !== 200
            ) {
              reject()
            }
          })
        })
    )
    .then(
      result =>
        new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          const configDir = result.prefix
          xhr.open(
            'GET',
            `https://majsoul.union-game.com/0/${configDir}/config.json?randv=${Math.random()
              .toString()
              .substring(2, 17)
              .padStart(16, '0')}`
          )
          xhr.send()
          xhr.addEventListener('readystatechange', () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
              resolve(JSON.parse(xhr.responseText))
            } else if (
              xhr.readyState === XMLHttpRequest.DONE &&
              xhr.status !== 200
            ) {
              reject()
            }
          })
        })
    )
    .then(
      result =>
        new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open(
            'GET',
            `https://${result.ip[0].url}?randv=${Math.random()
              .toString()
              .substring(2, 17)
              .padStart(16, '0')}&service=ws-gateway&protocol=ws&ssl=true`
          )
          xhr.send()
          xhr.addEventListener('readystatechange', () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
              resolve(JSON.parse(xhr.responseText))
            } else if (
              xhr.readyState === XMLHttpRequest.DONE &&
              xhr.status !== 200
            ) {
              reject()
            }
          })
        })
    )
}
const ping = serversJson => {
  return new Promise((resolve, reject) => {
    let resolved = false
    const serversList = serversJson.servers
    const tcpp = require('tcp-ping')
    const target = serversList[0].substring(0, serversList[0].indexOf(':'))
    const port = serversList[0].substring(serversList[0].indexOf(':') + 1)
    tcpp.ping(
      {
        address: target,
        port: port,
        attempts: 3
      },
      (err, data) => {
        if (err) {
          console.error(err)
        } else {
          if (!resolved) {
            resolved = true
            resolve(data.avg)
          }
        }
      }
    )
  })
}
const refreshPing = serversJson => {
  ping(serversJson).then(result => {
    if (Number.isNaN(result)) {
      document.getElementById('pingInfo').className = 'offline'
      document.getElementById('pingText').innerText = '--'
    } else {
      document.getElementById('pingText').innerText = result >> 0
      document.getElementById('pingInfo').className = (() => {
        if (result < 150) return 'green'
        if (result < 500) return 'orange'
        return 'red'
      })()
    }
  })
}
getServersJson().then(result => {
  refreshPing(result)
  setInterval(() => refreshPing(result), 5000)
})
/* Ping 业务逻辑 End */

/* 检查更新业务逻辑 Start */
const checkUpdate = userConfig => {
  return new Promise((resolve, reject) => {
    const locakPackage = require('../package.json')
    /**
     * @type {Array<>}
     */
    const versionLocal = locakPackage.version.split('.')
    for (let i in versionLocal) {
      versionLocal[i] = parseInt(versionLocal[i], 10)
    }

    const xhr = new XMLHttpRequest()
    xhr.open(
      'GET',
      `https://api.github.com/repos/iamapig120/majsoul-plus-client/releases/latest`
    )
    xhr.send()
    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        const result = JSON.parse(xhr.responseText)
        if (
          // 如果不接受预览版，则跳出
          !(
            result.prerelease === userConfig.prerelease ||
            result.prerelease === false
          )
        ) {
          reject()
          return
        }
        // 远程版本号
        const versionRemote = result.tag_name.split('.')
        versionRemote[0] = versionRemote[0].substring(1)
        for (let i in versionRemote) {
          versionRemote[i] = parseInt(versionRemote[i], 10)
          if (versionRemote[i] > versionLocal[i]) {
            resolve({
              version: result.tag_name,
              time: result.published_at,
              body: result.body,
              local: 'v' + locakPackage.version,
              html_url: result.html_url
            })
          } else if (versionRemote[i] < versionLocal[i]) {
            reject()
            return
          }
        }
        reject()
      } else if (xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200) {
        reject()
      }
    })
  })
}
fs.readFile(path.join(__dirname, '../configs-user.json'), (err, data) => {
  if (err) {
    return
  }
  checkUpdate(JSON.parse(data).update).then(
    res => {
      document.getElementById('updateCard').classList.add('show')
      document
        .getElementById('updateCard_close')
        .addEventListener('click', () => {
          document.getElementById('updateCard').classList.remove('show')
        })
      document
        .getElementById('updateCard_view')
        .addEventListener('click', () => {
          shell.openExternal(res.html_url)
          document.getElementById('updateCard').classList.remove('show')
        })
      document.getElementById('localVersion').innerText = res.local
      document.getElementById('remoteVersion').innerText = res.version
      document.getElementById('publishTime').innerText = new Date(
        res.time
      ).toLocaleString()
    },
    reason => {
      console.log('rejected')
    }
  )
})
/* 检查更新业务逻辑 End */
