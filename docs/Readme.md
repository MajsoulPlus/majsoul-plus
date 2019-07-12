# 雀魂 Plus 设计文档

这里是雀魂 Plus 的设计文档，通过阅读这里的内容，你可以简要地了解雀魂 Plus 的设计思路，运行流程，以及决定是否加入雀魂 Plus 的维护之中。

## 加载流程

下面简单通过顺序的形式介绍雀魂 Plus 的加载流程

0. 执行之前  
   在这一步初始化了很多顺序无关的内容，比如：

   - appDataDir：用户保存所有内容的路径
   - UserConfigs：加载用户设置
   - i18n：初始化 i18n 实例
   - httpsServer：创建默认的服务器
   - manager：资源包、扩展的 Manager 实例构造
   - default：各项默认配置的初始化，以及对需要的变量进行 `Object.freeze`

1. 加载全局变量  
   此处加载的全局变量包括“资源包路径”，“扩展路径”和“工具路径”。在加载全局变量的过程中，如果对应的目录不存在，则会将雀魂 Plus 自带的资源包、扩展和工具复制到对应的目录下。
1. 加载资源包  
   此处会对对应目录下启用的资源包进行加载。注：此步骤应该移动到启动游戏时进行。
1. 加载扩展
   此处会对对应目录下启用的扩展进行加载。注：此步骤应该移动到启动游戏时进行。
1. 针对操作系统禁用/启用进程内 GPU 处理  
   当用户设置中启用 `isInProcessGpuOn` 后，对 `Windows` 和 `macOS` 进行 `in-process-gpu` 参数附加。
1. 忽略 GPU 黑名单  
   当用户设置中启用 `isIgnoreGpuBlacklist` 后，进行 `ignore-gpu-blacklist` 参数附加，忽略 GPU 黑名单。
1. 禁用硬件加速  
   当用户设置中启用 `isHardwareAccelerationDisable` 后，禁用硬件加速。
1. `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'`
1. // 忽略证书错误
1. 允许自动播放音视频  
   允许在后台不经用户手动授权播放截图的背景音。
1. 当全部窗口退出后，结束进程
1. 阻止证书验证
1. 在 `ready` 后进行的操作

## IPC

见 [IPC.md](IPC.md)
