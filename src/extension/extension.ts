export const defaultExtensionPermission: MajsoulPlus.ExtensionPreferences = {
  nodeRequire: false,
  document: false,
  localStorage: false,
  XMLHttpRequest: false,
  WebSocket: false,
  writeableWindowObject: false
};

export const defaultExtension: MajsoulPlus.Extension = {
  name: '',
  author: '',
  description: '',
  preview: 'preview.png',
  entry: 'script.js',
  sync: false,
  executePreferences: defaultExtensionPermission
};

Object.freeze(defaultExtension);
Object.freeze(defaultExtensionPermission);

export function LoadExtension() {
  // TODO: Load from config file
  // TODO: Config file should only save extension folder name
  //       Detailed setting should be read from dedicated files
  // TODO: Tool to convert old files, but not written in new code
}
