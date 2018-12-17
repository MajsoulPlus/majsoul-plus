const fs = require('fs')
const path = require('path')
const configs = require('../configs')
const { ipcRenderer, remote: electronRemote } = require('electron')
const dialog = electronRemote.dialog
const AdmZip = require('adm-zip')
const os = require('os')

// 注入脚本根文件根目录
const executeRootDir = path.join(__dirname, '../', configs.EXECUTE_DIR)
const executeSettingsFile = path.join(executeRootDir, './active.json')

// Mod文件根目录
const modRootDir = path.join(__dirname, '../', configs.MODS_DIR)
const modSettingsFile = path.join(modRootDir, './active.json')

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
const startGame = () => {
  saveSettings()
  ipcRenderer.send('application-message', 'start-game')
}
const reloadDOM = (executes, mods) => {
  const modInfos = document.getElementById('modInfos')
  const executeInfos = document.getElementById('executeInfos')
  modInfos.innerHTML = ''
  executeInfos.innerHTML = ''

  const executeLaunchedList = executeLaunched.map(
    element => `${element.name}|${element.author}`
  )
  executes.forEach((executeInfo, index) => {
    const keyString = `${executeInfo.name}|${executeInfo.author}`

    const article = document.createElement('article')
    const h3 = document.createElement('h3')
    const address = document.createElement('address')
    const p = document.createElement('p')
    const disableRadio = document.createElement('input')
    const disableLabel = document.createElement('label')
    const ableRadio = document.createElement('input')
    const ableLabel = document.createElement('label')
    const exportBtn = document.createElement('button')
    const removeBtn = document.createElement('button')

    h3.innerText = executeInfo.name
    address.innerText = executeInfo.author ? executeInfo.author : '无名氏'
    p.innerText = executeInfo.description ? executeInfo.description : '无描述'

    const onchangeFunction = event => {
      if (ableRadio.checked) {
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
    disableRadio.addEventListener('change', onchangeFunction)
    disableRadio.name = `execute${index}`
    disableRadio.id = `execute${index}_disableLabel`
    disableRadio.type = 'radio'
    ableRadio.addEventListener('change', onchangeFunction)
    ableRadio.name = `execute${index}`
    ableRadio.id = `execute${index}_able`
    ableRadio.type = 'radio'

    disableLabel.innerHTML = '禁用'
    disableLabel.setAttribute('for', `execute${index}_disableLabel`)
    ableLabel.innerText = '启用'
    ableLabel.setAttribute('for', `execute${index}_able`)

    exportBtn.innerHTML = '导出'
    exportBtn.addEventListener('click', event => {
      const zip = new AdmZip()
      const tempZipName = path.basename(executeInfo.filesDir) + '.mspe'
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
    })

    removeBtn.innerHTML = '删除'

    article.appendChild(h3)
    article.appendChild(address)
    article.appendChild(p)

    article.appendChild(disableRadio)
    article.appendChild(disableLabel)
    article.appendChild(ableRadio)
    article.appendChild(ableLabel)

    article.appendChild(exportBtn)
    article.appendChild(removeBtn)

    executeInfos.appendChild(article)

    if (executeLaunchedList.includes(keyString)) {
      ableRadio.checked = true
      executeLaunched[executeLaunchedList.indexOf(keyString)].filesDir =
        executeInfo.filesDir
    } else {
      disableRadio.checked = true
    }
  })

  const modLaunchedList = modLaunched.map(
    element => `${element.name}|${element.author}`
  )
  mods.forEach((modInfo, index) => {
    const keyString = `${modInfo.name}|${modInfo.author}`

    const article = document.createElement('article')
    const h3 = document.createElement('h3')
    const address = document.createElement('address')
    const p = document.createElement('p')
    const disableRadio = document.createElement('input')
    const disableLabel = document.createElement('label')
    const ableRadio = document.createElement('input')
    const ableLabel = document.createElement('label')
    const exportBtn = document.createElement('button')
    const removeBtn = document.createElement('button')

    h3.innerText = modInfo.name
    address.innerText = modInfo.author ? modInfo.author : '无名氏'
    p.innerText = modInfo.description ? modInfo.description : '无描述'

    const onchangeFunction = event => {
      if (ableRadio.checked) {
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
    disableRadio.addEventListener('change', onchangeFunction)
    disableRadio.name = `mod${index}`
    disableRadio.id = `mod${index}_disableLabel`
    disableRadio.type = 'radio'
    ableRadio.addEventListener('change', onchangeFunction)
    ableRadio.name = `mod${index}`
    ableRadio.id = `mod${index}_able`
    ableRadio.type = 'radio'

    disableLabel.innerHTML = '禁用'
    disableLabel.setAttribute('for', `mod${index}_disableLabel`)
    ableLabel.innerText = '启用'
    ableLabel.setAttribute('for', `mod${index}_able`)

    exportBtn.innerHTML = '导出'
    exportBtn.addEventListener('click', event => {
      const zip = new AdmZip()
      const tempZipName = path.basename(modInfo.filesDir) + '.mspm'
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
    })

    removeBtn.innerHTML = '删除'

    article.appendChild(h3)
    article.appendChild(address)
    article.appendChild(p)

    article.appendChild(disableRadio)
    article.appendChild(disableLabel)
    article.appendChild(ableRadio)
    article.appendChild(ableLabel)

    article.appendChild(exportBtn)
    article.appendChild(removeBtn)

    modInfos.appendChild(article)

    if (modLaunchedList.includes(keyString)) {
      ableRadio.checked = true
      modLaunched[modLaunchedList.indexOf(keyString)].filesDir =
        modInfo.filesDir
    } else {
      disableRadio.checked = true
    }
  })
}
const refreshFunction = event => {
  // 所有已在目录中的注入脚本目录
  const executeDirs = fs.readdirSync(executeRootDir)
  // 用于存储注入脚本对象
  const executes = []
  // 遍历所有注入脚本文件夹，寻找execute.json并加载
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
      // TODO, 若为 "*.exec" 则作为 zip 文件解压，然后加载
    }
  })

  // 所有已在目录中的Mod目录
  const modDirs = fs.readdirSync(modRootDir)
  // 用于存储Mod对象
  const mods = []
  // 遍历所有Mod文件夹，寻找Mod.json并加载
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
      // TODO, 若为 "*.mod" 则作为 zip 文件解压，然后加载
    }
  })
  executesWindow = executes
  modsWindow = mods

  reloadDOM(executes, mods)
}

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
    const unzip = new AdmZip(userChosenPath[0])
    unzip.extractAllToAsync(modRootDir, true, err => {
      if (err) {
        alert('安装失败！\n错误信息如下:\n' + err)
      } else {
        alert('安装成功！')
      }
    })
  }
})
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
    const unzip = new AdmZip(userChosenPath[0])
    unzip.extractAllToAsync(executeRootDir, true, err => {
      if (err) {
        alert('安装失败！\n错误信息如下:\n' + err)
      } else {
        alert('安装成功！')
      }
    })
  }
})

document.getElementById('refresh').addEventListener('click', refreshFunction)
document.getElementById('launch').addEventListener('click', startGame)

refreshFunction()
