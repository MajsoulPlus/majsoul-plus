/// <reference types="node" />

/**
 * 本地化，单条语句实例对象
 */
declare function LocaleObject(...params: string[]): string
/**
 * 本地化，单条语句实例对象
 */
declare interface LocaleObject {
  (...params: string[]): string
  [localeKey: string]: LocaleObject
}

declare class i18n {
  /**
   * 构造函数
   */
  constructor(i18nInitConfigs?: {
  /**
     * 文件夹路径
     */
  directory?: string
  /**
     * 语言偏好列表，越靠前越优先
     */
  actives?: string[]
  /**
     * 无值时的默认语言
     */
  defaultLocale?: string
  /**
     * 监听文件修改，自动更新翻译
     */
  autoReload?: boolean
  })
  /**
   * 解绑指定DOM元素的所有绑定
   */
  unbindElement(htmlElement: HTMLElement): void
  /**
   * 绑定一条翻译到指定DOM元素的 innerText
   */
  bindElementText(
    /**
     * 一个Locale函数对象
     */
    locale: LocaleObject,
    /**
     * HTMLElement
     */
    htmlElement: HTMLElement,
    /**
     * Locale参数
     */
    ...args: string[]
  ): void
  /**
   * 绑定一条翻译到指定DOM元素的 innerHTML
   */
  bindElementHTML(
    /**
     * 一个Locale函数对象
     */
    locale: LocaleObject,
    /**
     * HTMLElement
     */
    htmlElement: HTMLElement,
    /**
     * Locale参数
     */
    ...args: string[]
  ): void
  get text(): LocaleObject
  get t(): LocaleObject
  get _(): LocaleObject
}
export = i18n
