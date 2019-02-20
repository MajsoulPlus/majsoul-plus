/// <reference types="node" />

interface Locale extends Function<string> {

}

class i18n {
  /**
   * 构造函数
   */
  constructor(i18nInitConfigs?: {
  /**
     * 文件夹路径
     */
  directory?: string = './locales'
  /**
     * 语言偏好列表，越靠前越优先
     */
  actives?: string[] = []
  /**
     * 无值时的默认语言
     */
  defaultLocale?: string = 'en-US'
  /**
     * 监听文件修改，自动更新翻译
     */
  autoReload?: boolean = false
  })
  /**
   * 解绑指定DOM元素的所有绑定
   */
  unbindElement(htmlElement: HTMLElement): void
  /**
   * 绑定一条翻译到指定DOM元素的 innerText
   */
  bindElementText (
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
  ) {
    return this._bindElement(locale, htmlElement, 'text', ...args)
  }
}
export = i18n
