# IPC

雀魂 Plus 在主进程和渲染进程之间使用了大量的 IPC 进行数据交换。

## ipcMain

下表列出了主进程接收到的请求：

| ID  | 名称                    | 参数   | 说明                                     |
| --- | ----------------------- | ------ | ---------------------------------------- |
| 01  | extension-list          | 无     | 返回目前**启用**的扩展列表。(`string[]`) |
| 02  | extension-detail        | 无     | 返回目前加载了的扩展的详细信息。         |
| 03  | sandbox-dirname-request | 无     | 返回当前的 `dirname`。                   |
| 04  | sandbox-appdata-request | 无     | 返回当前的 `appDataDir`                  |
| 05  | start-game              | 无     | 启动游戏。                               |
| 06  | take-screenshot         | buffer | 对截屏进行保存。                         |
| 07  | start-tool              | config | 启动 config 对应的工具。                 |
| 08  | close-manage            | 无     | 关闭 Manager 窗口。                      |

## ipcRenderer

### GameWindow

| ID  | 名称 | 参数 | 说明 |
| --- | ---- | ---- | ---- |


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
