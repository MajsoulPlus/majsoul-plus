const fs = require('fs')
const path = require('path')
const configs = require('../configs')
const { ipcRenderer } = require('electron')

// 注入脚本根文件根目录
const executeRootDir = path.join('./', configs.EXECUTE_DIR)
const executeSettingsFile = path.join(executeRootDir, './active.json')

// Mod文件根目录
const modRootDir = path.join('./', configs.MODS_DIR)
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
  executeLaunched = executeLaunched.filter(element =>
    executesWindowList.includes(`${element.name}|${element.author}`)
  )

  const modsWindowList = modsWindow.map(
    element => `${element.name}|${element.author}`
  )
  modLaunched = modLaunched.filter(element =>
    modsWindowList.includes(`${element.name}|${element.author}`)
  )

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
  executes.forEach((element, index) => {
    const keyString = `${element.name}|${element.author}`

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

    h3.innerText = element.name
    address.innerText = element.author ? element.author : '无名氏'
    p.innerText = element.description ? element.description : '无描述'

    const onchangeFunction = event => {
      if (ableRadio.checked) {
        if (executeLaunchedList.includes(keyString)) {
          return
        } else {
          executeLaunched.push(element)
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
    } else {
      disableRadio.checked = true
    }
  })

  const modLaunchedList = modLaunched.map(
    element => `${element.name}|${element.author}`
  )
  mods.forEach((element, index) => {
    const keyString = `${element.name}|${element.author}`

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

    h3.innerText = element.name
    address.innerText = element.author ? element.author : '无名氏'
    p.innerText = element.description ? element.description : '无描述'

    const onchangeFunction = event => {
      if (ableRadio.checked) {
        if (modLaunchedList.includes(keyString)) {
          return
        } else {
          modLaunched.push(element)
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
        modInfo.filesDir = path.join(modDir, '/files')
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

document.getElementById('refresh').addEventListener('click', refreshFunction)
document.getElementById('launch').addEventListener('click', startGame)

// BUG TODO DOM对象不会被正确加载，但如果打个断点就没问题了
refreshFunction()
