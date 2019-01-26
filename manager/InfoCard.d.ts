/// <reference types="node" />

export class InfoCard {
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
}
