const fs = require('fs')
const path = require('path')
const configs = require('../configs')
const { ipcRenderer, remote: electronRemote, shell } = require('electron')
const dialog = electronRemote.dialog
const AdmZip = require('adm-zip')
const Util = require('../Util')
const os = require('os')

const InfoCard = require('./InfoCard')

const app = electronRemote.app

// 注入脚本根文件根目录
const executeRootDir = path.join(__dirname, '../', configs.EXECUTES_DIR)
// const executeSettingsFile = path.join(executeRootDir, './active.json')
const executeSettingsFile = configs.EXECUTES_CONFIG_PATH

// Mod文件根目录
const modRootDir = path.join(__dirname, '../', configs.MODS_DIR)
// const modSettingsFile = path.join(modRootDir, './active.json')
const modSettingsFile = configs.MODS_CONFIG_PATH

// 工具根目录
const toolsRootDir = path.join(__dirname, '../', configs.TOOLS_DIR)

const userConfig = require(configs.USER_CONFIG_PATH)

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
    // console.warn(error)
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
    // console.warn(error)
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
// let toolsWindow

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
  modLaunched.forEach(modInfo => {
    if (modInfo.execute) {
      modInfo.execute.filesDir = modInfo.filesDir
      executeLaunched.push(modInfo.execute)
    }
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
  executes.forEach(executeInfo => {
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

    const onchangeFunction = () => {
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
    const onexportFunction = () => {
      const zip = new AdmZip()
      const tempZipName = `${executeInfo.name}-${
        executeInfo.author ? executeInfo.author : '无名氏'
      }.mspe`
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
    const onremoveFunction = () => {
      infoCard.DOM.remove()
      Util.removeDir(infoCard.infos.filesDir)
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
  mods.forEach(modInfo => {
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

    const onchangeFunction = () => {
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
    const onexportFunction = () => {
      const zip = new AdmZip()
      const tempZipName = `${modInfo.name}-${
        modInfo.author ? modInfo.author : '无名氏'
      }.mspm`
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
    const onremoveFunction = () => {
      infoCard.DOM.remove()
      Util.removeDir(infoCard.infos.filesDir)
      refreshFunction()
    }
    infoCard.addEventListener('change', onchangeFunction)
    infoCard.addEventListener('export', onexportFunction)
    infoCard.addEventListener('remove', onremoveFunction)

    modInfos.appendChild(infoCard.DOM)
  })

  // Tool
  toolCards = []
  tools.forEach(toolInfo => {
    const infoCard = new InfoCard(toolInfo, false, true)
    toolCards.push(infoCard)

    const onClickFunction = () => {
      ipcRenderer.send('application-message', 'start-tool', toolInfo)
    }
    const onexportFunction = () => {
      const zip = new AdmZip()
      const tempZipName = `${toolInfo.name}-${
        toolInfo.author ? toolInfo.author : '无名氏'
      }.mspt`
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
    const onremoveFunction = () => {
      infoCard.DOM.remove()
      Util.removeDir(infoCard.infos.filesDir)
      refreshFunction()
    }
    infoCard.addEventListener('click', onClickFunction)
    infoCard.addEventListener('export', onexportFunction)
    infoCard.addEventListener('remove', onremoveFunction)

    toolInfos.appendChild(infoCard.DOM)
  })
}

// 安装扩展资源 函数
const installResources = () => {
  dialog.showOpenDialog(
    {
      title: '选取扩展资源包……',
      filters: [
        {
          name: '雀魂Plus扩展',
          extensions: ['mspm', 'mspe', 'mspt']
        }
      ]
    },
    filenameArr => {
      if (filenameArr && filenameArr[0]) {
        const filename = filenameArr[0]
        const unzip = new AdmZip(filename)
        const extname = path.extname(filename)
        let installDir
        switch (extname) {
          case '.mspm':
            installDir = modRootDir
            break
          case '.mspe':
            installDir = executeRootDir
            break
          case '.mspt':
            installDir = toolsRootDir
            break
        }
        unzip.extractAllToAsync(installDir, true, err => {
          if (err) {
            alert('安装失败！\n错误信息如下:\n' + err)
          } else {
            alert('安装成功！')
            refreshFunction()
          }
        })
      }
    }
  )
}

// 安装模组 按钮
const installMod = document.getElementById('installMod')
installMod.addEventListener('click', installResources)

// 安装插件 按钮
const installExecute = document.getElementById('installExecute')
installExecute.addEventListener('click', installResources)

// 安装工具 按钮
const installTool = document.getElementById('installTool')
installTool.addEventListener('click', installResources)

// 记录编辑状态使用的变量
let executesEditFlag = false
let modsEditFlag = false
let toolsEditFlag = false

const editMod = document.getElementById('editMod')
editMod.addEventListener('click', () => {
  modsEditFlag = !modsEditFlag
  modCards.forEach(card => {
    card.edit = modsEditFlag
  })
})
const editExecute = document.getElementById('editExecute')
editExecute.addEventListener('click', () => {
  executesEditFlag = !executesEditFlag
  executeCards.forEach(card => {
    card.edit = executesEditFlag
  })
})
const editTool = document.getElementById('editTool')
editTool.addEventListener('click', () => {
  toolsEditFlag = !toolsEditFlag
  toolCards.forEach(card => {
    card.edit = toolsEditFlag
  })
})

// 刷新事件
refreshFunction = () => {
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
        // console.warn(error)
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
        // console.warn(error)
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
        // console.warn(error)
      }
    } else {
      // TODO, 若为 "*.mspt" 则作为 zip 文件解压，然后加载
    }
  })
  executesWindow = executes
  modsWindow = mods
  // toolsWindow = tools

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
    node.addEventListener('click', () => {
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
// 所有主服务器
const serversArray = []
// 获取主服务器列表
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
        new Promise(reslove => {
          Object.entries(result.ip[0].region_urls).forEach(kv => {
            serversArray.push(kv)
          })
          // console.log('serversGot')
          reslove()
        })
    )
}
const ping = serversJson => {
  return new Promise(resolve => {
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
          // console.error(err)
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
const getServerName = serverKey => {
  switch (serverKey) {
    case 'mainland':
      return '中国大陆'
    case 'hk':
      return '中国香港'
    case 'tw':
      return '中国台湾'
    case 'us':
      return '美国'
    case 'uk':
      return '英国'
    case 'jp':
      return '日本'
    case 'fr':
      return '法国'
    case 'kr':
      return '韩国'
    case 'sg':
      return '新加坡'
    case 'de':
      return '德国'
    case 'ru':
      return '俄罗斯'
  }
  return serverKey
}
const serverTextDom = document.getElementById('serverText')
const serverInfoDom = document.getElementById('serverInfo')
const getChildServer = (serverKey, serverUrl) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(
      'GET',
      `${serverUrl}?randv=${Math.random()
        .toString()
        .substring(2, 17)
        .padStart(16, '0')}&service=ws-gateway&protocol=ws&ssl=true`
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
let interval
const reStartPing = () => {
  // console.log('reStartPing')
  Promise.resolve(
    (() => {
      if (!localStorage.getItem('serverChoosed')) {
        return serversArray[0]
      } else {
        const serverChoosed = localStorage.getItem('serverChoosed')
        let returnFlag = false
        serversArray.forEach((kv, index) => {
          if (kv[0] === serverChoosed) {
            serverInfoDom.dataset.serverIndex = index
            returnFlag = kv
          }
        })
        if (returnFlag) {
          return returnFlag
        }
        return serversArray[0]
      }
    })()
  )
    .then(result => {
      // console.log(result)
      serverTextDom.innerText = getServerName(result[0])
      clearInterval(interval)
      document.getElementById('pingInfo').className = 'offline'
      document.getElementById('pingText').innerText = '--'
      return getChildServer(...result)
    })
    .then(
      result => {
        refreshPing(result)
        interval = setInterval(() => refreshPing(result), 5000)
      },
      () => {}
    )
}
serverInfoDom.addEventListener('click', () => {
  if (serversArray.length === 0) {
    return
  }
  let index = parseInt(serverInfoDom.dataset.serverIndex, 10) + 1
  if (index >= serversArray.length) {
    index = 0
  }
  serverInfoDom.dataset.serverIndex = index
  localStorage.setItem('serverChoosed', serversArray[index][0])
  reStartPing()
})

getServersJson().then(reStartPing, () => {
  serverTextDom.innerText = '加载失败'
})
/* Ping 业务逻辑 End */

/* 检查更新业务逻辑 Start */
/**
 * 判断A标签是否比B标签较新
 * @param {string} taga A标签
 * @param {string} tagb B标签
 */
const isLater = (taga, tagb) => {
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

  let laterFlag = undefined
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
        } else if (parseInt(tagaDevArr[i], 10) < parseInt(tagbDevArr[i], 10)) {
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
const checkUpdate = userConfig => {
  return new Promise((resolve, reject) => {
    /**
     * @type {string}
     */
    const versionLocal = 'v' + app.getVersion()

    const xhr = new XMLHttpRequest()
    if (
      // 判断是否接受浏览版
      !userConfig.prerelease
    ) {
      xhr.open(
        'GET',
        'https://api.github.com/repos/iamapig120/majsoul-plus-client/releases/latest'
      )
    } else {
      xhr.open(
        'GET',
        'https://api.github.com/repos/iamapig120/majsoul-plus-client/releases'
      )
    }
    xhr.send()
    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        let result = JSON.parse(xhr.responseText)
        if (userConfig.prerelease) {
          result = result[0]
        }
        // 远程版本号
        const versionRemote = result.tag_name
        if (isLater(versionRemote, versionLocal)) {
          resolve({
            version: result.tag_name,
            time: result.published_at,
            body: result.body,
            local: 'v' + app.getVersion(),
            html_url: result.html_url
          })
        } else {
          reject()
          return
        }
      } else if (xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200) {
        reject()
      }
    })
  })
}
fs.readFile(configs.USER_CONFIG_PATH, (err, data) => {
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
    () => {
      // console.log('rejected')
    }
  )
})
/* 检查更新业务逻辑 End */

/* 设置项业务逻辑 Start */
const getKeyText = key => {
  const lang = {
    window: '窗口',
    zoomFactor: '资源管理器缩放(Zoom Factor)',
    gameSSAA: '超采样抗锯齿(SSAA)',
    renderingMultiple: '% 渲染比率(Rendering Multiple)',
    isKioskModeOn: '使用原生模式代替默认全屏幕模式(Use Kiosk Fullscreen Mode)',
    update: '更新',
    prerelease: '获取浏览版(Get Pre-releases)',
    chromium: '核心（需重启软件）',
    isHardwareAccelerationDisable:
      '关闭硬件加速(Turn Hardware Acceleration Off)',
    isInProcessGpuOn: '启用进程内GPU处理(Turn in-process-gpu On)',
    loaclVersion: '雀魂Plus 当前版本'
  }
  return lang[key] ? lang[key] : key
}
const userConfigInit = () => {
  const settingInner = document.getElementById('settingInner')
  settingInner.innerHTML = ''
  Object.entries(userConfig).forEach(([keyGroup, value]) => {
    const groupName = getKeyText(keyGroup)
    const h3 = document.createElement('h3')
    h3.innerText = groupName
    settingInner.append(h3)
    Object.entries(value).forEach(([keyConfig, value], index) => {
      switch (typeof value) {
        case 'boolean': {
          const selectName = getKeyText(keyConfig)
          const input = document.createElement('input')
          input.type = 'checkbox'
          const label = document.createElement('label')
          input.id = 'config' + keyGroup + keyConfig + index
          label.setAttribute('for', input.id)
          label.innerText = selectName
          input.checked = value
          input.addEventListener('change', () => {
            userConfig[keyGroup][keyConfig] = input.checked
          })
          settingInner.append(input)
          settingInner.append(label)
          break
        }
        case 'number':
          {
            const inputName = getKeyText(keyConfig)
            const input = document.createElement('input')
            input.type = 'number'
            const label = document.createElement('label')
            input.id = 'config' + keyGroup + keyConfig + index
            label.setAttribute('for', input.id)
            label.innerText = inputName
            input.value = value
            input.addEventListener('change', () => {
              userConfig[keyGroup][keyConfig] = parseFloat(input.value)
            })
            const br = document.createElement('br')
            settingInner.append(input)
            settingInner.append(label)
            settingInner.append(br)
          }
          break
        default:
          break
      }
    })
  })
  const versionH3 = document.createElement('h3')
  versionH3.innerText = getKeyText('loaclVersion')
  const versionInfo = document.createElement('p')
  versionInfo.innerText = app.getVersion()
  settingInner.append(versionH3)
  settingInner.append(versionInfo)
}
userConfigInit()

const saveConfigsBtn = document.getElementById('saveConfigs')
saveConfigsBtn.addEventListener('click', () => {
  try {
    fs.writeFileSync(configs.USER_CONFIG_PATH, JSON.stringify(userConfig))
    ipcRenderer.send('application-message', 'update-user-config')
    alert('保存成功')
  } catch (error) {
    alert('保存失败\n' + error)
  }
})

/* 设置项业务逻辑 End */
