const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d')
const darknessRange = document.getElementById('darknessRange')
const selectImg = document.getElementById('selectImg')
const saveAndInstall = document.getElementById('saveAndInstall')

const canvasPreview = document.createElement('canvas')
canvasPreview.width = canvasPreview.height = 512
const contextPreview = canvasPreview.getContext('2d')

const drawView = event => {
  const file = selectImg.files[0]
  if (typeof file === 'undefined' || file.size <= 0) {
    return
  }
  const fileReader = new FileReader()
  fileReader.readAsDataURL(file)
  fileReader.addEventListener('load', event => {
    const fileBlobUrl = fileReader.result
    const img = new Image()
    img.src = fileBlobUrl
    const imgDesktopBorder = new Image()
    imgDesktopBorder.src = 'desktopBorder.png'
    const imgInner = new Image()
    imgInner.src = 'inner.png'
    Promise.all([
      new Promise(resolve => img.addEventListener('load', resolve)),
      new Promise(resolve =>
        imgDesktopBorder.addEventListener('load', resolve)
      ),
      new Promise(resolve => imgInner.addEventListener('load', resolve))
    ]).then(() => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(
        img,
        (122 / 1024) * canvas.width,
        (122 / 1024) * canvas.height,
        (780 / 1024) * canvas.width,
        (780 / 1024) * canvas.height
      )
      context.fillStyle = `#000000`
      context.globalAlpha = darknessRange.value / 100
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.globalAlpha = 1
      context.drawImage(
        imgInner,
        (122 / 1024) * canvas.width,
        (122 / 1024) * canvas.height,
        (780 / 1024) * canvas.width,
        (780 / 1024) * canvas.height
      )
      context.drawImage(imgDesktopBorder, 0, 0, canvas.width, canvas.height)

      contextPreview.clearRect(0, 0, canvasPreview.width, canvasPreview.height)
      contextPreview.drawImage(
        img,
        0,
        0,
        canvasPreview.width,
        canvasPreview.height
      )
      contextPreview.fillStyle = `#000000`
      contextPreview.globalAlpha = darknessRange.value / 100
      contextPreview.fillRect(0, 0, canvasPreview.width, canvasPreview.height)
      contextPreview.globalAlpha = 1
      contextPreview.drawImage(
        imgInner,
        0,
        0,
        canvasPreview.width,
        canvasPreview.height
      )
    })
  })
}

darknessRange.addEventListener('change', event => {
  const value = darknessRange.value / 100
  let valueText = value.toString(10)
  if (value === 0 || value === 1) {
    valueText += '.00'
  } else {
    valueText = valueText.padEnd(4, '0')
  }
  document.getElementById('darknessRangeText').innerText = valueText
  drawView(event)
})
selectImg.addEventListener('change', drawView)

saveAndInstall.addEventListener('click', event => {
  const fs = MajsoulPlus.fs
  const path = MajsoulPlus.path
  const id = document.getElementById('dirName').value
  const name = document.getElementById('name').value
  const author = document.getElementById('author').value
  const description = document.getElementById('description').value
  const resDir = path.join(
    MajsoulPlus.__appdata,
    MajsoulPlus.globalPath.ExtensionDir
  )
  const stat_dir = (() => {
    try {
      return fs.statSync(resDir)
    } catch (e) {
      return null
    }
  })()
  if (!stat_dir) {
    fs.mkdirSync(resDir)
  }

  const dirPath = path.join(resDir, id)
  if (!id.match(/^[_a-zA-Z0-9]+$/)) {
    alert('扩展 ID 格式只能含有大小写字母、数字和下划线！')
    return
  }
  if (name.length === 0) {
    alert('扩展名称不能为空')
    return
  }
  const stat = (() => {
    try {
      return fs.statSync(dirPath)
    } catch (e) {
      return null
    }
  })()
  if (stat) {
    alert('文件夹名称已存在！')
    return
  }
  fs.mkdirSync(dirPath)
  fs.mkdirSync(path.join(dirPath, '/assets'))
  const respInfo = {
    id: id,
    version: '1.0.0',
    name,
    author,
    description,
    preview: 'assets/preview.jpg',

    resourcepack: [
      {
        from:
          'scene/Assets/Resource/tablecloth/tablecloth_default/Table_Dif.jpg',
        to: 'Table_Dif.jpg',
        'all-servers': true
      },
      {
        from: 'myres2/tablecloth/tablecloth_default/preview.jpg',
        to: 'preview.jpg',
        'all-servers': true
      },
      {
        from: 'extendRes/items/tablecloth_navy.jpg',
        to: 'preview.jpg',
        'all-servers': true
      }
    ]
  }
  fs.writeFileSync(
    path.join(dirPath, 'extension.json'),
    JSON.stringify(respInfo)
  )
  fs.writeFileSync(
    path.join(dirPath, 'script.js'),
    `const intervalId = setInterval(() => {
  if (cfg && cfg.item_definition && cfg.item_definition.item) {
    const item = cfg.item_definition.item.get('305044')
    item.name_chs = '${name}'
    item.desc_chs = '${description}'
    clearInterval(intervalId)
  }
}, 2000)`
  )
  const desktopData = canvas
    .toDataURL('image/jpeg', 1)
    .replace(/^data:image\/\w+;base64,/, '')
  const previewData = canvasPreview
    .toDataURL('image/jpeg')
    .replace(/^data:image\/\w+;base64,/, '')
  Promise.all([
    new Promise(resolve =>
      fs.writeFile(
        path.join(dirPath, '/assets', 'Table_Dif.jpg'),
        Buffer.from(desktopData, 'base64'),
        err => {
          if (err) {
            console.warn(err)
          } else {
            resolve()
          }
        }
      )
    ),
    new Promise(resolve =>
      fs.writeFile(
        path.join(dirPath, 'assets', 'preview.jpg'),
        Buffer.from(previewData, 'base64'),
        err => {
          if (err) {
            console.warn(err)
          } else {
            resolve()
          }
        }
      )
    )
  ]).then(() => {
    alert('已保存！\n请刷新扩展列表后启用')
  })
})
