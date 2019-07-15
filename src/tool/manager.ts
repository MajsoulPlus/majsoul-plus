import BaseManager from '../BaseManager'
import { MajsoulPlus } from '../majsoul_plus'
import * as schema from './schema.json'

const defaultTool: MajsoulPlus.ToolConfig = {
  id: 'default',
  version: '1.0.0',
  name: '未命名',
  author: '未知作者',
  description: '无描述',
  preview: 'preview.png',
  dependencies: {},

  index: 'index.html',
  windowOptions: {}
}

export default class ToolManager extends BaseManager {
  constructor(configPath: string) {
    super('tool', configPath, defaultTool, schema)
  }

  // 重载使下列函数失效
  loadEnabled() {
    return []
  }
  enableFromConfig() {}
  disable(id: string) {}
  disableAll() {}
  enable(id: string) {}
  save() {}
}
