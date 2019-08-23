import * as electron from 'electron'
const fs = electron.remote.require('fs')
const path = electron.remote.require('path')

// tslint:disable-next-line
const __dirname = electron.ipcRenderer.sendSync('sandbox-dirname-request')

// tslint:disable-next-line
const __appdata = electron.ipcRenderer.sendSync('sandbox-appdata-request')

// tslint:disable-next-line
const MajsoulPlus: any = {}

function isSubFolder(parent: string, dir: string): boolean {
  const relative = path.relative(parent, dir)
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
}

function isMajsoulPlusSubFolder(dir: string) {
  return (
    isSubFolder(MajsoulPlus.__dirname, dir) ||
    isSubFolder(MajsoulPlus.__appdata, dir)
  )
}

// Global Path
MajsoulPlus.__dirname = __dirname
MajsoulPlus.__appdata = __appdata
MajsoulPlus.globalPath = {
  LocalDir: '/static',
  ResourcePackDir: 'resourcepack',
  ExtensionDir: 'extension',
  ToolsDir: 'tool'
}

// fs
MajsoulPlus.fs = {}
MajsoulPlus.fs.readFileSync = (dir: string) => {
  if (!isMajsoulPlusSubFolder(path.resolve(dir))) {
    console.error(`invalid dir: ${dir}`)
    throw new Error(`invalid dir: ${dir}`)
  }
  return fs.readFileSync(dir, { encoding: 'utf-8' })
}

MajsoulPlus.fs.writeFile = (dir: string, data, callback) => {
  if (!isMajsoulPlusSubFolder(path.resolve(dir))) {
    console.error(`invalid dir: ${dir}`)
    callback(new Error(`invalid dir: ${dir}`))
    return
  }
  fs.writeFile(dir, data, callback)
}

MajsoulPlus.fs.writeFileSync = (dir: string, data, options) => {
  if (!isMajsoulPlusSubFolder(path.resolve(dir))) {
    console.error(`invalid dir: ${dir}`)
    return
  }
  fs.writeFileSync(dir, data, options)
}

MajsoulPlus.fs.mkdirSync = (dir: string) => {
  if (!isMajsoulPlusSubFolder(path.resolve(dir))) {
    console.error(`invalid dir: ${dir}`)
    throw new Error(`invalid dir: ${dir}`)
    return
  }
  fs.mkdirSync(dir)
}

MajsoulPlus.fs.statSync = (dir: string) => {
  if (!isMajsoulPlusSubFolder(path.resolve(dir))) {
    console.error(`invalid dir: ${dir}`)
    throw new Error(`invalid dir: ${dir}`)
  }
  return fs.statSync(dir)
}

// path
MajsoulPlus.path = path

// export
Object.freeze(MajsoulPlus)
window['MajsoulPlus'] = MajsoulPlus
window['Buffer'] = Buffer
