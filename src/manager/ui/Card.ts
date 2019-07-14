import * as path from 'path'
import i18n from '../../i18n'
import { Listener } from './Listener'

interface InputElement {
  input?: HTMLElement
  label?: HTMLElement
}

const defaultOptions = {
  name: '未知',
  author: i18n.text.manager.missingAuthor(),
  description: '无描述',
  preview: 'preview.jpg'
}

export class Card {
  options: MajsoulPlus_Manager.CardMetadata
  protected listener: Listener
  protected dom: HTMLElement
  protected editable: boolean

  constructor(options: MajsoulPlus_Manager.CardMetadata) {
    this.options = { ...defaultOptions, ...options }
    this.listener = new Listener()
    this.dom = this.createDOM()
    this.editable = false
  }

  protected getPreviewPath(): string {
    return path.join('filesDir', this.options.preview)
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

  protected createH3Element() {
    const h3 = document.createElement('h3')
    h3.innerText = this.options.name
    return h3
  }

  protected createAddressElement() {
    const address = document.createElement('address')
    address.innerText = this.options.author.toString()
    return address
  }

  protected createPreviewElement() {
    const preview = document.createElement('img')
    preview.src = this.getPreviewPath()
    preview.addEventListener('error', function errFun() {
      preview.src = path.join(__dirname, '../', 'defaultPreview.jpg')
      preview.removeEventListener('error', errFun)
    })
    preview.addEventListener('dragstart', evt => evt.preventDefault())
    return preview
  }

  protected createPElement() {
    const p = document.createElement('p')
    p.innerText = this.options.description
    return p
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

    const h3 = this.createH3Element()
    if (h3) article.appendChild(h3)

    const address = this.createAddressElement()
    if (address) article.appendChild(address)

    const p = this.createPElement()
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
