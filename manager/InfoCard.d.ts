/// <reference types="node" />

export = class InfoCard {
  /**
   * 模组和插件通用的信息卡
   * @param {{name:string,author:string,description:string,preview:string,filesDir:string}} infos
   * @param {boolean} checked
   */
  constructor(
    infos: {
    name: string
    author: string
    description: string
    preview: string
    filesDir: string
    },
    checked?: boolean,
    isButton?: boolean
  )
  get DOM(): HTMLElement
  set DOM(value: HTMLElement): HTMLElement
  initDOM(): void
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
  get edit(): boolean
  set edit(value: boolean): boolean
  infos: {
    name: string
    author: string
    description: string
    preview: string
    filesDir: string
  }
  checked: boolean
  name: string
  description: string
  previewSrc: string
  private _inputType: string
  private _eventListeners: { [x: string]: Array<EventListener> }
  private _dom: HTMLElement
  private _edit: boolean
}
