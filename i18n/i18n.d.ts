/// <reference types="node" />

/**
 * 本地化，单条语句翻译对象
 * @param params 格式化参数，会自动替换文本中的 $1、$2
 */
declare function Locale(
  /**
   * 若干个字符串，依次填充到 $1、$2
   */
  ...params: string[]
): string
/**
 * 本地化，单条语句翻译对象
 */
declare interface Locale {
  /**
   * 格式化该键对应的翻译文本并返回
   */
  (
    /**
     * 若干个字符串，依次填充到 $1、$2
     */
    ...params: string[]
  ): string
  /**
   * 文本的键
   */
  [localeKey: string]: Locale
  /**
   * 绑定该条翻译到指定DOM元素的 innerText
   * @param htmlElement 要绑定的 HTMLElement 元素
   * @param params 格式化参数，会自动替换文本中的 $1、$2
   */
  renderAsText(
    /**
     * 必须是标准的 HTMLElement DOM 元素
     */
    htmlElement: HTMLElement,
    /**
     * 若干个字符串，依次填充到 $1、$2
     */
    ...params: string[]
  ): void
  /**
   * 绑定该条翻译到指定DOM元素的 innerHTML
   * @param htmlElement 要绑定的 HTMLElement 元素
   * @param params 格式化参数，会自动替换文本中的 $1、$2
   */
  renderAsHTML(
    /**
     * 必须是标准的 HTMLElement DOM 元素
     */
    htmlElement: HTMLElement,
    /**
     * 若干个字符串，依次填充到 $1、$2
     */
    ...params: string[]
  ): void
}

/**
 * 本地化，根级翻译文本对象
 */
declare interface LocaleMain {
  /**
   * 翻译文本的键
   */
  [localeKey: string]: Locale
}

declare class i18n {
  /**
   * 构造函数
   */
  constructor(i18nInitConfigs?: {
  /**
     * 翻译文件所在的文件夹路径
     */
  directory?: string
  /**
     * 语言偏好列表，越靠前越优先
     */
  actives?: string[]
  /**
     * 在找不到翻译文本时的默认语言
     */
  defaultLocale?: string
  /**
     * 是否监听文件修改，以自动更新翻译
     */
  autoReload?: boolean
  })
  /**
   * 解绑指定DOM元素的所有绑定的翻译
   * @param htmlElement 要解绑的 HTMLElement
   */
  unbindElement(
    /**
     * @param htmlElement 必须是标准的 HTMLElement DOM 元素
     */
    htmlElement: HTMLElement
  ): void
  /**
   * 绑定一条翻译到指定DOM元素的 innerText
   * @param locale 一个要绑定的单条语句翻译对象
   * @param htmlElement 要绑定的 HTMLElement
   * @param params 格式化参数，会自动替换文本中的 $1、$2
   */
  bindElementText(
    /**
     * 这个对象必须是一个 Locale 类型函数对象
     */
    locale: Locale,
    /**
     * 必须是标准的 HTMLElement DOM 元素
     */
    htmlElement: HTMLElement,
    /**
     * 若干个字符串，依次填充到 $1、$2
     */
    ...params: string[]
  ): void
  /**
   * 绑定一条翻译到指定DOM元素的 innerHTML
   * @param locale 一个要绑定的单条语句翻译对象
   * @param htmlElement 要绑定的 HTMLElement
   * @param params 格式化参数，会自动替换文本中的 $1、$2
   */
  bindElementHTML(
    /**
     * 这个对象必须是一个 Locale 类型函数对象
     */
    locale: Locale,
    /**
     * 必须是标准的 HTMLElement DOM 元素
     */
    htmlElement: HTMLElement,
    /**
     * 若干个字符串，依次填充到 $1、$2
     */
    ...params: string[]
  ): void
  /**
   * 根级翻译文本对象
   */
  get text(): LocaleMain
  /**
   * 根级翻译文本对象
   */
  get t(): LocaleMain
  /**
   * 根级翻译文本对象
   */
  get _(): LocaleMain
}
export = i18n
