const path = require('path')
const AdmZip = require('adm-zip')

exports.default = function(buildResult) {
  buildResult.artifactPaths.forEach(file => {
    if (path.extname(file) === '.zip') {
      const zip = new AdmZip(file)
      zip.addFile('data/', Buffer.from(''))
      zip.writeZip(file)
    }
  })
}
