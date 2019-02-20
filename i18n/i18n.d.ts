/// <reference types="node" />

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
}
export = i18n
