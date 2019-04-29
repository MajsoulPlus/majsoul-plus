declare namespace MajsoulPlus_Manager {
  export interface CardConstructorOptions {
    name?: string
    author?: string
    description?: string
    preview?: string
    filesDir: string
  }

  export interface CardListConstructorOptions {
    rootDir: string
    config: string
    checkedKeys: string[]
    renderTarget: string
    settingFilePath: string
  }
}
