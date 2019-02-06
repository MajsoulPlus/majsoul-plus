/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* eslint-disable */

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
const userConfig = require(configs.USER_CONFIG_PATH)

const userDataPaths = [path.join(__dirname, '../'), app.getPath('userData')]

// 注入脚本根文件根目录
const executeRootDirs = userDataPaths.map(root =>
  path.join(root, configs.EXECUTES_DIR)
)
// const executeSettingsFile = path.join(executeRootDir, './active.json')
const executeSettingsFile = configs.EXECUTES_CONFIG_PATH

// Mod文件根目录
const modRootDirs = userDataPaths.map(root => path.join(root, configs.MODS_DIR))
// const modSettingsFile = path.join(modRootDir, './active.json')
const modSettingsFile = configs.MODS_CONFIG_PATH

// 工具根目录
const toolRootDirs = userDataPaths.map(root =>
  path.join(root, configs.TOOLS_DIR)
)

/**
 * 同步 UserConfig
 */
const syncUserConfig = () => {
  const localUserConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../configs-user.json'))
  )
  Object.entries(localUserConfig).forEach(([keyGroup, value]) => {
    // 如果有新选项，则加载到设置文档中
    if (userConfig[keyGroup] === undefined) {
      userConfig[keyGroup] = value
    }
    Object.entries(value).forEach(([keyConfig, value], index) => {
      if (userConfig[keyGroup][keyConfig] === undefined) {
        userConfig[keyGroup][keyConfig] = value
      }
      value = userConfig[keyGroup][keyConfig]
    })
  })
}
syncUserConfig()

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

  const exportFunction = (info, type) => {
    let extname
    let typeText
    switch (type) {
      case 'execute': {
        extname = 'mspe'
        typeText = '插件'
        break
      }
      case 'mod': {
        extname = 'mspm'
        typeText = '模组'
        break
      }
      case 'tool': {
        extname = 'mspt'
        typeText = '工具'
        break
      }
    }
    const tempZipName = `${info.name}-${
      info.author ? info.author : '无名氏'
    }.${extname}`
    const tempZipPathName = path.join(os.tmpdir(), tempZipName)
    Util.zipDir(info.filesDir, tempZipPathName)
    const userChosenPath = dialog.showSaveDialog({
      title: `导出${typeText}到……`,
      filters: [
        {
          name: `雀魂Plus${typeText}`,
          extensions: [extname]
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
        }
      }
    }
    const onremoveFunction = () => {
      infoCard.DOM.remove()
      Util.removeDir(infoCard.infos.filesDir)
      refreshFunction()
    }
    infoCard.addEventListener('change', onchangeFunction)
    infoCard.addEventListener('export', () =>
      exportFunction(executeInfo, 'execute')
    )
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
        }
      }
    }
    const onremoveFunction = () => {
      infoCard.DOM.remove()
      Util.removeDir(infoCard.infos.filesDir)
      refreshFunction()
    }
    infoCard.addEventListener('change', onchangeFunction)
    infoCard.addEventListener('export', () => exportFunction(modInfo, 'mod'))
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
    const onremoveFunction = () => {
      infoCard.DOM.remove()
      Util.removeDir(infoCard.infos.filesDir)
      refreshFunction()
    }
    infoCard.addEventListener('click', onClickFunction)
    infoCard.addEventListener('export', () => exportFunction(toolInfo, 'tool'))
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
            installDir = userConfig.userData.useAppdataLibrary
              ? modRootDirs[1]
              : modRootDirs[0]
            break
          case '.mspe':
            installDir = userConfig.userData.useAppdataLibrary
              ? executeRootDirs[1]
              : executeRootDirs[0]
            break
          case '.mspt':
            installDir = userConfig.userData.useAppdataLibrary
              ? toolRootDirs[1]
              : toolRootDirs[0]
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
  const executeDirs = [].concat(
    ...executeRootDirs.map(executeRootDir =>
      fs
        .readdirSync(executeRootDir)
        .map(executeDir => path.join(executeRootDir, executeDir))
    )
  )
  // 用于存储注入脚本对象
  const executes = []
  // 遍历所有注入脚本文件夹，寻找 execute.json并加载
  executeDirs.forEach(executeDir => {
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
  const modDirs = [].concat(
    ...modRootDirs.map(modRootDir =>
      fs.readdirSync(modRootDir).map(modDir => path.join(modRootDir, modDir))
    )
  )
  // 用于存储Mod对象
  const mods = []
  // 遍历所有Mod文件夹，寻找 Mod.json并加载
  modDirs.forEach(modDir => {
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
  const toolDirs = [].concat(
    ...toolRootDirs.map(toolRootDir =>
      fs
        .readdirSync(toolRootDir)
        .map(toolDir => path.join(toolRootDir, toolDir))
    )
  )
  // 用于存储 tool 对象
  const tools = []
  // 遍历所有 tool 文件夹，寻找 Tool.json并加载
  toolDirs.forEach(toolDir => {
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
  document.querySelectorAll('.left-panel ul li'),
  node => {
    node.addEventListener('click', () => {
      const sections = document.getElementsByTagName('section')
      Array.prototype.forEach.call(
        sections,
        /**
         * @param {HTMLElement} section
         */
        section => {
          if (section.dataset.name === node.dataset.target) {
            section.classList.add('show')
          } else {
            section.classList.remove('show')
          }
        }
      )
      Array.prototype.forEach.call(
        document.querySelectorAll('.left-panel ul li'),
        node => {
          node.classList.remove('show')
        }
      )
      node.classList.add('show')
    })
  }
)
document.querySelectorAll('.left-panel ul li')[0].click()
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
        reject(new Error('XMLHttpRequest Failed with status: ' + xhr.status))
      }
    })
  })
    .then(
      result =>
        new Promise((resolve, reject) => {
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
              resolve(JSON.parse(xhr.responseText).res['config.json'])
            } else if (
              xhr.readyState === XMLHttpRequest.DONE &&
              xhr.status !== 200
            ) {
              reject(
                new Error('XMLHttpRequest Failed with status: ' + xhr.status)
              )
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
              reject(
                new Error('XMLHttpRequest Failed with status: ' + xhr.status)
              )
            }
          })
        })
    )
    .then(
      result =>
        new Promise(resolve => {
          Object.entries(result.ip[0].region_urls).forEach(kv => {
            serversArray.push(kv)
          })
          // console.log('serversGot')
          resolve()
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
      if (!localStorage.getItem('serverChose')) {
        return serversArray[0]
      } else {
        const serverChose = localStorage.getItem('serverChose')
        let returnFlag = false
        serversArray.forEach((kv, index) => {
          if (kv[0] === serverChose) {
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
  localStorage.setItem('serverChose', serversArray[index][0])
  reStartPing()
})

getServersJson().then(reStartPing, () => {
  serverTextDom.innerText = '加载失败'
})
/* Ping 业务逻辑 End */

/* 检查更新业务逻辑 Start */
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
        const updateMode = Util.compareVersion(versionRemote, versionLocal)
        if (updateMode > 0) {
          resolve({
            version: result.tag_name,
            time: result.published_at,
            body: result.body,
            local: 'v' + app.getVersion(),
            html_url: result.html_url,
            result: result,
            update_mode: updateMode
          })
        } else {
          reject('Need not to update')
        }
      } else if (xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200) {
        reject(new Error('XMLHttpRequest Failed with status: ' + xhr.status))
      }
    })
  })
}
// 立即检查更新
checkUpdate(userConfig.update).then(
  res => {
    if (res.update_mode !== 1) {
      // 隐藏浏览发布页按钮
      document.getElementById('updateCard_view').classList.add('hide')
      document.getElementById('updateCard_autoupdate').classList.remove('hide')
    } else {
      // 隐藏在线更新按钮
      document.getElementById('updateCard_view').classList.remove('hide')
      document.getElementById('updateCard_autoupdate').classList.add('hide')
    }

    // 显示更新面板
    document.getElementById('updateCard').classList.add('show')

    // 下次提醒我
    document
      .getElementById('updateCard_close')
      .addEventListener('click', () => {
        document.getElementById('updateCard').classList.remove('show')
      })

    // 浏览发布页
    document.getElementById('updateCard_view').addEventListener('click', () => {
      shell.openExternal(res.html_url)
      document.getElementById('updateCard').classList.remove('show')
    })

    // 在线更新

    const fileDir = path.join(os.tmpdir(), 'majsoulUpdate.zip')
    const unzipDir = path.join(os.tmpdir(), 'majsoulUpdateTemp')

    document
      .getElementById('updateCard_autoupdate')
      .addEventListener('click', () => {
        document.getElementById('launch').disabled = true
        // 隐藏更新卡片
        document.getElementById('updateCard').classList.remove('show')
        // 显示下载中卡片
        document.getElementById('downloadCard').classList.add('show')
        // 测速器
        let timer
        let speedPreSenc = 0
        /**
         * 转换数字到速度
         * @param {number} speedNum 数字，单元B
         */
        const calcSpeed = speedNum => {
          const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s', 'EB/s']
          let unitsPos = 0
          while (speedNum > 1024) {
            unitsPos++
            speedNum /= 1024
          }
          return `${speedNum.toFixed(2)} ${units[unitsPos]}`
        }
        Util.httpsGetFile(res.result['zipball_url'], 'binary', chuck => {
          speedPreSenc += chuck.length
          if (!timer) {
            timer = setInterval(() => {
              document.getElementById(
                'downloadCardSpeed'
              ).innerText = calcSpeed(speedPreSenc)
              speedPreSenc = 0
            }, 1000)
          }
        })
          .then(result => {
            Util.writeFile(
              path.join(os.tmpdir(), 'majsoulUpdate.zip'),
              result.data
            )
          })
          .then(() => {
            clearInterval(timer)
            document.getElementById('downloadCardTitle').innerText = '下载完毕'
            document.getElementById('downloadCardText').innerText =
              '更新已下载完毕，是否安装并重启？'
            document.getElementById('downloadCard_install').disabled = false
          })
      })

    // 安装按钮
    document
      .getElementById('downloadCard_install')
      .addEventListener('click', () => {
        Util.mkdirs(unzipDir).then(() => {
          try {
            const copyFile = (from, to) => {
              const stat = fs.statSync(from)
              if (stat.isDirectory()) {
                fs.readdirSync(from).forEach(file => {
                  copyFile(path.join(from, file), path.join(to, file))
                })
              } else {
                Util.mkdirsSync(path.dirname(to))
                fs.copyFileSync(from, to)
              }
            }
            fs.statSync(fileDir)
            const admzip = new AdmZip(fileDir)
            admzip.extractAllTo(unzipDir)
            const newVersionRootDir = path.join(
              unzipDir,
              fs.readdirSync(unzipDir)[0]
            )
            const files = fs.readdirSync(newVersionRootDir)
            const rootDir = path.join(__dirname, '../')
            files.forEach(file => {
              copyFile(
                path.join(newVersionRootDir, file),
                path.join(rootDir, file)
              )
            })
            Util.removeDir(unzipDir)
            fs.unlinkSync(fileDir)
            app.relaunch()
            app.exit(0)
          } catch (error) {
            console.error(error)
          }
        })
      })

    // 本地版本号
    document.getElementById('localVersion').innerText = res.local
    // 远程版本号
    document.getElementById('remoteVersion').innerText = res.version
    // 版本发布时间
    document.getElementById('publishTime').innerText = new Date(
      res.time
    ).toLocaleString()
  },
  () => {
    // console.log('rejected')
  }
)

/* 检查更新业务逻辑 End */

/* 设置项业务逻辑 Start */
const getKeyText = key => {
  const lang = {
    window: '窗口(Window)',
    zoomFactor: '资源管理器缩放(Zoom Factor)',
    gameSSAA: '超采样抗锯齿(SSAA)',
    renderingMultiple: '% 渲染比率(Rendering Multiple)',
    isKioskModeOn: '使用原生模式代替默认全屏幕模式(Use Kiosk Fullscreen Mode)',
    update: '更新(Update)',
    prerelease: '获取浏览版(Get Pre-releases)',
    chromium: '核心（需重启软件）(Core - Restart app needed)',
    isHardwareAccelerationDisable:
      '关闭硬件加速(Turn Hardware Acceleration Off)',
    isInProcessGpuOn: '启用进程内GPU处理(Turn in-process-gpu On)',
    isNoBorder: '使用无边框窗口进入游戏(Turn BorderLess On)',
    userData: '用户数据(User Data)',
    isUseDefaultPath: '使用默认用户库目录',
    useAppdataLibrary:
      '使用AppData存储扩展资源(Use AppData dir to storage resources)',
    userLibPath: '用户库目录',
    programName: '雀魂Plus(Majsoul Plus)',
    localVersion: '版本(Version)',
    isManagerHide: '退出游戏后回到管理器界面(Exit back to manager panel)'
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
        case 'string': {
          {
            // TODO 待完成
          }
          break
        }
        default:
          break
      }
    })
  })
}
const aboutPageInit = () => {
  const aboutInner = document.getElementById('aboutInner')
  aboutInner.innerHTML = ''
  /**
   *
   * @param {string} title
   * @param {string | HTMLElement} value
   */
  const addBlock = (title, value) => {
    // 在结尾叠加信息
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
  addBlock(
    '致用户',
    '  感谢您正在阅读这段文字，我是《雀魂 Plus》开发者之一：Handle。首先，感谢您信赖并使用《雀魂 Plus》，这是我第一个破 10 Star 的项目，同时也是我倾注了大量心血的作品，对于其意外登上一些论坛的置顶，我感到兴奋，但同时更多的是震惊。\n\n  相信您和我一样是喜欢着《雀魂》这款游戏才能让您读到这段文字，同样，也相信您了解一款游戏的生存无非能否长期稳定地盈利，《雀魂 Plus》提供的功能最初只是为了方便修改桌布和音乐，但目前的发展情况，但很明显，《雀魂 Plus》的传播已经明显超出了可控范围。试想，如果您是《雀魂》的付费用户，在得知免费玩家可以享受到付费体验，心中会有什么想法？还会继续为《雀魂》付费么？如果大家都在使用修改实现的装扮而不为《雀魂》付费，那么这款游戏的未来会怎样？会继续盈利下去么？相信您您的内心现在已经想到了未来可能发生的事，我们都不希望那样的未来。\n\n  作为“始作俑者”，我不希望《雀魂 Plus》被滥用，我希望的是《雀魂 Plus》可以为《雀魂》提供一个PC稳定的游戏环境和体验，在这基础上体验一些《雀魂》尚未实现的、或是其他游戏中存在的优秀功能，并非为了让使用者白嫖《雀魂》，这是一个不健康的发展路径，无论你我，当然不希望《雀魂》会走上《雀龙门》的老路，成为一款冷门游戏，或是成为下一个《X海战记》。《雀魂》当前的付费点主要就是装扮，还望各位手下留情，使用魔改的同时别忘为游戏付费，一款好的游戏值得去为其体验埋单。\n\n  《雀魂 Plus》现在的更新重点是作为一个游戏客户端体验的优化上，对于目前已有的扩展功能将仅做维护，感谢您的理解。相信您在思考后，也会在《雀魂》中“补票”吧。'
  )
  addBlock(
    getKeyText('programName'),
    (() => {
      const info = document.createElement('p')
      info.innerHTML = `在 PC 上跨平台的雀魂麻将第三方客户端，提供资源替换和代码注入功能，并对直播环境进行了一定优化<br><a href="https://github.com/MajsoulPlus/majsoul-plus-client"><img alt="Github Stars" src="https://img.shields.io/github/stars/MajsoulPlus/majsoul-plus-client.svg?style=social"></a><br>${getKeyText(
        'localVersion'
      )} ${app.getVersion()}`
      ;[...info.getElementsByTagName('a')].forEach(a => {
        a.addEventListener('click', event => {
          event.preventDefault()
          shell.openExternal(a.href)
        })
      })
      return info
    })()
  )
}
userConfigInit()
aboutPageInit()

const saveConfigsBtn = document.getElementById('saveConfigs')
const saveUserConfigs = (alertMsg = true) => {
  try {
    fs.writeFileSync(configs.USER_CONFIG_PATH, JSON.stringify(userConfig))
    ipcRenderer.send('application-message', 'update-user-config')
    if (alertMsg === true) {
      alert('保存成功')
    }
  } catch (error) {
    if (alertMsg === true) {
      alert('保存失败\n' + error)
    }
  }
}
saveConfigsBtn.addEventListener('click', saveUserConfigs)

/* 设置项业务逻辑 End */

/* 春节额外css Start */
/**
 * @type {HTMLLinkElement}
 */
const extraCss = document.getElementById('extraCss')
const isSpringFestival = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  if (year === 2019) {
    if (month === 2) {
      if (day > 3 && day < 12) {
        return true
      }
    }
  }
  return false
}
setTimeout(() => {
  if (isSpringFestival()) {
    extraCss.href = './styles/springfestival/springfestival.css'
  }
}, 0)
/* 春节额外css End */

/**
 * 启动游戏
 */
const startGame = () => {
  saveSettings()
  saveUserConfigs(false)
  ipcRenderer.send('application-message', 'start-game')
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
