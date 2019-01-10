/**
 * @type {HTMLCanvasElement}
 */
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
  if (typeof file == 'undefined' || file.size <= 0) {
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
      context.drawImage(img, 122, 122, 780, 780)
      context.fillStyle = `#000000`
      context.globalAlpha = darknessRange.value / 100
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.globalAlpha = 1
      context.drawImage(imgInner, 122, 122, 780, 780)
      context.drawImage(imgDesktopBorder, 0, 0, 1024, 1024)

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
  const fs = require('fs')
  const config = require('../../configs')
  const path = require('path')
  const dirName = document.getElementById('dirName').value
  const name = document.getElementById('name').value
  const author = document.getElementById('author').value
  const description = document.getElementById('description').value
  const dirPath = path.join(__dirname, '../../', config.MODS_DIR, dirName)
  if (dirName.length < 4) {
    alert('文件夹名长度过短')
    return
  }
  if (name.length === 0) {
    alert('Mod名称不能为空')
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
  fs.mkdirSync(path.join(dirPath, '/files'))
  const modInfo = {
    name,
    author,
    description,
    dir: '/files',
    preview: '/files/preview.jpg',
    replace: [
      {
        from:
          '/0/[^/]+/scene/Assets/Resource/tablecloth/tablecloth_default/Table_Dif.jpg',
        to: '/Table_Dif.jpg'
      },
      {
        from: '/0/[^/]+/myres2/tablecloth/tablecloth_default/preview.jpg',
        to: '/preview.jpg'
      }
    ]
  }
  fs.writeFileSync(path.join(dirPath, 'mod.json'), JSON.stringify(modInfo))
  const desktopData = canvas
    .toDataURL('image/jpeg')
    .replace(/^data:image\/\w+;base64,/, '')
  const previewData = canvasPreview
    .toDataURL('image/jpeg')
    .replace(/^data:image\/\w+;base64,/, '')
  Promise.all([
    new Promise(resolve =>
      fs.writeFile(
        path.join(dirPath, '/files', 'Table_Dif.jpg'),
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
        path.join(dirPath, '/files', 'preview.jpg'),
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
    alert('已保存！\n请刷新模组后启用')
  })
})
