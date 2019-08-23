import * as path from 'path'
import Listener from './Listener'
import Global from '../global'

interface InputElement {
  input?: HTMLElement
  label?: HTMLElement
}

export default class Card {
  options: MajsoulPlus_Manager.CardMetadata
  protected listener: Listener = new Listener()
  protected dom: HTMLElement
  protected editable = false

  constructor(options: MajsoulPlus_Manager.CardMetadata) {
    this.options = options
    this.dom = this.createDOM()
  }

  protected getPreviewPath(): string {
    return path.join(
      Global.appDataDir,
      this.options.type.toLowerCase(),
      this.options.id,
      this.options.preview
    )
  }

  protected getRandomId(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(
      ''
    )
    const uuid = new Array(36)
    let rnd = 0
    let r: number
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid[i] = '-'
      } else if (i === 14) {
        uuid[i] = '4'
      } else {
        if (rnd <= 0x02) {
          rnd = (0x2000000 + Math.random() * 0x1000000) | 0
        }
        r = rnd & 0xf
        rnd = rnd >> 4
        uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r]
      }
    }
    return `${uuid
      .join('')
      .replace(/-/gm, '')
      .toLowerCase()}`
  }

  protected createInputElements(): InputElement {
    return {}
  }

  protected createNameElement() {
    const h3 = document.createElement('h3')
    h3.innerText = this.options.name
    return h3
  }

  protected createAuthorElement() {
    const address = document.createElement('address')
    address.innerText = this.options.author.toString()
    return address
  }

  protected createPreviewElement() {
    const preview = document.createElement('img')
    preview.src = this.getPreviewPath()
    preview.addEventListener('error', function errFun(event) {
      event.preventDefault()
      preview.src = path.join(__dirname, '../', 'defaultPreview.jpg')
      preview.removeEventListener('error', errFun)
    })
    preview.addEventListener('dragstart', evt => evt.preventDefault())
    return preview
  }

  protected createDescriptionElement() {
    const p = document.createElement('p')
    p.innerText = this.options.description
    return p
  }

  protected createVersionElement() {
    const s = document.createElement('span')
    s.innerText = this.options.version
    return s
  }

  protected createExportButton() {
    const exportButton = document.createElement('button')
    exportButton.className = 'export-btn'
    exportButton.addEventListener('click', evt => {
      this.listener.emit('export', evt)
    })
    return exportButton
  }

  protected createRemoveButton() {
    const removeButton = document.createElement('button')
    removeButton.className = 'remove-btn'
    removeButton.addEventListener('click', evt => {
      this.listener.emit('remove', evt)
    })
    return removeButton
  }

  protected createDOM(): HTMLElement {
    const article = document.createElement('article')
    const preview = this.createPreviewElement()
    if (preview) article.appendChild(preview)

    const h3 = this.createNameElement()
    if (h3) article.appendChild(h3)

    const span = this.createVersionElement()
    if (span) article.append(span)

    const address = this.createAuthorElement()
    if (address) article.appendChild(address)

    const p = this.createDescriptionElement()
    if (p) article.appendChild(p)

    const exportButton = this.createExportButton()
    if (exportButton) article.appendChild(exportButton)

    const removeButton = this.createRemoveButton()
    if (removeButton) article.appendChild(removeButton)

    const { input, label } = this.createInputElements()
    if (input) article.appendChild(input)
    if (label) article.appendChild(label)

    return article
  }

  get DOM() {
    return this.dom
  }

  isEditable = () => {
    return this.editable
  }

  setEditable = (value: boolean) => {
    this.editable = value
    this.dom.className = value ? 'edit' : ''
  }

  on(event: string, handle: Function) {
    this.listener.on(event, handle)
  }

  off(event: string, handle?: Function) {
    this.listener.off(event, handle)
  }

  emit(event: string) {
    this.listener.emit(event)
  }
}
