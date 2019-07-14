const { ncp } = require('ncp')
const fs = require('fs')
const path = require('path')

const dest = path.resolve('./dist/')

// 移除包含 exports 的第二行
function simpleBrowserify(dir) {
  fs.readFile(path.resolve(dest, dir), { encoding: 'utf-8' }, function(
    err,
    data
  ) {
    if (err) {
      console.error(err)
      return
    }
    const lines = data.split('\n')
    lines.splice(1, 1)
    fs.writeFile(
      path.resolve(dest, dir),
      lines.join('\n'),
      { encoding: 'utf-8' },
      () => {}
    )
  })
}

// Copy files
function copy(from, to = from, callback = () => {}) {
  ncp(path.resolve('./', from), path.resolve(dest, to), err => {
    if (err) console.error(err)
    else callback()
  })
}

function copyA(from, parent = 'bin', callback = () => {}) {
  copy(from, parent + '/' + from, callback)
}

function copyDesktopCreatorFonts() {
  // 桌布生成工具的字体
  fs.copyFile(
    './assets/manager/SourceHanSansCN-Light.otf',
    './dist/bin/tool/desktopCreator/SourceHanSansCN-Light.otf',
    err => {
      if (err) console.error(err)
    }
  )
  fs.copyFile(
    './assets/manager/SourceHanSansCN-Normal.otf',
    './dist/bin/tool/desktopCreator/SourceHanSansCN-Normal.otf',
    err => {
      if (err) console.error(err)
    }
  )
}

copy('assets', '')
copy('i18n')
copyA('resourcepack')
copyA('extension')
copyA('tool', 'bin', copyDesktopCreatorFonts)
copy('configs-user.json')

simpleBrowserify('windows/sandbox-preload.js')
