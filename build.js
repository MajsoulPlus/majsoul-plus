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
function copy(from, to = from) {
  ncp(path.resolve('./', from), path.resolve(dest, to), err =>
    err ? console.error(err) : null
  )
}

copy('assets', '')
copy('manager')
copy('i18n')
copy('execute')
copy('mod')
copy('extension')
copy('tool')
copy('configs-user.json')

simpleBrowserify('windows/sandbox-preload.js')
