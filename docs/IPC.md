# IPC

雀魂 Plus 在主进程和渲染进程之间使用了大量的 IPC 进行数据交换。

## ipcMain

下表列出了主进程接收到的请求：

| ID  | 接收者           | 名称                    | 参数        | 说明                                             |
| --- | ---------------- | ----------------------- | ----------- | ------------------------------------------------ |
| 01  | ExtensionManager | extension-list          | 无          | 返回目前**启用**的扩展列表。(`string[]`)         |
| 02  | ExtensionManager | extension-detail        | 无          | 返回目前加载了的扩展的详细信息。                 |
| 03  | sandbox          | sandbox-dirname-request | 无          | 返回当前的 `dirname`。                           |
| 04  | sandbox          | sandbox-appdata-request | 无          | 返回当前的 `appDataDir`                          |
| 05  | ManagerWindow    | start-game              | 无          | 启动游戏。                                       |
| 06  | screenshot       | take-screenshot         | buffer      | 对截屏进行保存。                                 |
| 07  | ManagerWindow    | start-tool              | config      | 启动 config 对应的工具。                         |
| 08  | ManagerWindow    | close-manager           | 无          | 关闭 Manager 窗口。                              |
| 09  | ManagerWindow    | clear-cache             | 无          | 清理缓存（`appDataDir/static/`）                 |
| 10  | ManagerWindow    | remove-dir              | `dir`       | 删除 `dir` 目录                                  |
| 11  | ManagerWindow    | zip-dir                 | `dir`, `to` | 压缩 `dir` 目录至 `to` 目录                      |
| 12  | ManagerWindow    | update-user-config      | `config`    | 更新主进程中的 `config` 并保存。                 |
| 13  | GameWindow       | main-loader-ready       | 无          | 游戏宿主窗口已创建并初始化完毕，需要加载端口信息 |

## ipcRenderer

### GameWindow

| ID  | 名称             | 参数   | 说明                                  |
| --- | ---------------- | ------ | ------------------------------------- |
| 01  | server-port-load | `port` | 在 `main-loader-ready` 后返回端口信息 |

### ManagerWindow

| ID  | 名称          | 参数                    | 说明                                                                       |
| --- | ------------- | ----------------------- | -------------------------------------------------------------------------- |
| 01  | change-config | `{mainkey, key, value}` | 修改 `options.userConfig` 中参数（目前只用到了修改 GameWindow 窗口大小）。 |
| 02  | save-config   | 无                      | 保存 Manager 窗口中的各项设定。                                            |

### AudioPlayer

| ID  | 名称         | 参数      | 说明                             |
| --- | ------------ | --------- | -------------------------------- |
| 01  | audio-play   | audioPath | 播放指定音乐（目前只有截屏声）。 |
| 02  | close-window | 无        | 关闭窗口（暂无调用）。           |
