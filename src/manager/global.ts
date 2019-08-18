import * as path from 'path'
import { ipcRenderer } from 'electron'

export default {
  appDataDir: ipcRenderer.sendSync('sandbox-appdata-request'),
  UserConfigPath: path.join(
    ipcRenderer.sendSync('sandbox-appdata-request'),
    'user-config.json'
  ),
  ResourcePackDir: path.join(
    ipcRenderer.sendSync('sandbox-appdata-request'),
    'resourcepack'
  ),
  ExtensionDir: path.join(
    ipcRenderer.sendSync('sandbox-appdata-request'),
    'extension'
  ),
  ToolsDir: path.join(ipcRenderer.sendSync('sandbox-appdata-request'), 'tool')
}
