# IPC

雀魂 Plus 在主进程和渲染进程之间使用了大量的 IPC 进行数据交换。

## ipcMain

下表列出了主进程接收到的请求：

| ID  | 接收者        | 名称                    | 参数     | 说明                                             |
| --- | ------------- | ----------------------- | -------- | ------------------------------------------------ |
| 01  | ManagerWindow | start-game              | 无       | 启动游戏。                                       |
| 02  | ManagerWindow | start-tool              | `id`     | 启动 `id` 对应的工具。                           |
| 03  | ManagerWindow | close-manager           | 无       | 关闭 Manager 窗口。                              |
| 04  | ManagerWindow | clear-cache             | 无       | 清理缓存（`appDataDir/static/`）                 |
| 05  | ManagerWindow | update-user-config      | `config` | 更新主进程中的 `config` 并保存。                 |
| 06  | GameWindow    | main-loader-ready       | 无       | 游戏宿主窗口已创建并初始化完毕，需要加载端口信息 |
| 07  | sandbox       | sandbox-dirname-request | 无       | 返回当前的 `dirname`。                           |
| 08  | sandbox       | sandbox-appdata-request | 无       | 返回当前的 `appDataDir`                          |
| 09  | screenshot    | save-screenshot         | `buffer` | 对截屏进行保存。                                 |

### 通用请求

对每个雀魂 Plus 功能（资源包、扩展、工具，下表中用 `${name}` 表示），存在一些通用请求。通用请求都由 ManagerWindow 发出，如下表所示：

| ID  | 名称                       | 参数             | 说明                                                 | 返回 / 响应 IPC 名             |
| --- | -------------------------- | ---------------- | ---------------------------------------------------- | ------------------------------ |
| 01  | `get-${name}-details`      | 无               | 获取 `${name}` 的加载情况                            | `get-${name}-details-response` |
| 02  | `change-${name}-enability` | `id`, `enabled`  | 修改 `${name}` 中 `id` 的加载情况为 `enabled`        | `GetDetailMetadataResponse`    |
| 03  | `save-${name}-enabled`     | 无               | 保存 `${name}` 的加载情况                            | 无                             |
| 04  | `import-${name}`           | `filePath`       | 从 `filePath` 加载打包的 `${name}`                   | 无                             |
| 05  | `export-${name}`           | `id`, `filePath` | 对 `id` 指定的 `${name}` 进行打包，保存到 `filePath` | `{ err: string | undefined }`  |
| 06  | `remove-${name}`           | `id`             | 删除 `id` 对应的 `${name}`                           | 无                             |
| 07  | `refresh-${name}`          | 无               | 刷新 `${name}` 列表                                  | `GetDetailMetadataResponse`    |

## ipcRenderer

### GameWindow(mainLoader)

| ID  | 名称             | 参数                  | 说明               |
| --- | ---------------- | --------------------- | ------------------ |
| 01  | load-url         | `url`, `port`, `http` | 加载服务器对应网页 |
| 02  | take-screenshot  | `scaleFactor: number` | 截图               |
| 03  | screenshot-saved | `filePath`            | 表示截图保存成功   |
| 04  | open-devtools    | 无                    | 打开开发者工具     |

### ManagerWindow

| ID  | 名称                           | 参数             | 说明                                     |
| --- | ------------------------------ | ---------------- | ---------------------------------------- |
| 01  | change-config-game-window-size | `gameWindowSize` | 修改 `userConfigs.window.gameWindowSize` |
| 02  | save-config                    | 无               | 保存 Manager 窗口中的各项设定。          |

### AudioPlayer

| ID  | 名称         | 参数        | 说明                             |
| --- | ------------ | ----------- | -------------------------------- |
| 01  | audio-play   | `audioPath` | 播放指定音乐（目前只有截屏声）。 |
| 02  | close-window | 无          | 关闭窗口（暂无调用）。           |
