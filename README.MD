![Banner](https://github.com/iamapig120/simpad-ebay-imgs/blob/master/majsoul_plus_banner.png?raw=true)

# 雀魂 Plus

雀魂 Plus 是一款设计用于雀魂麻将的 PC 专用浏览器

浏览 [Wiki](https://github.com/MajsoulPlus/majsoul-plus-client/wiki)

包含以下核心特性：

- 本地缓存机制，可有效提高游戏加载速度
- 适配 OBS 等视频采集软件，方便播主直播使用
- 易于自定义的本地缓存
- 为额外功能提供插件接口支持

[稳定版： ![VersionLatest](https://img.shields.io/github/release/MajsoulPlus/majsoul-plus-client.svg)
![DownloadsLatest](https://img.shields.io/github/downloads/iamapig120/majsoul-plus-client/latest/total.svg)](https://github.com/iamapig120/majsoul-plus-client/releases/latest)

[开发版： ![VersionLatestPre](https://img.shields.io/github/release-pre/MajsoulPlus/majsoul-plus-client.svg)
![DownloadsLatestPre](https://img.shields.io/github/downloads-pre/MajsoulPlus/majsoul-plus-client/latest/total.svg)](https://github.com/iamapig120/majsoul-plus-client/releases/)

[![Build status](https://ci.appveyor.com/api/projects/status/urk43pwjb60ckvh5?svg=true)](https://ci.appveyor.com/project/iamapig120/majsoul-plus/branch/master)
[![Build Status](https://travis-ci.com/MajsoulPlus/majsoul-plus.svg?branch=master)](https://travis-ci.com/MajsoulPlus/majsoul-plus)
![License AGPL-3.0](https://img.shields.io/github/license/iamapig120/majsoul-plus-client.svg)

## 致用户

&emsp;&emsp;感谢您正在阅读这段文字，我是《雀魂 Plus》开发者之一：Handle。首先，感谢您信赖并使用《雀魂 Plus》，这是我第一个破 10 Star 的项目，同时也是我倾注了大量心血的作品，对于其意外登上一些论坛的置顶，我感到兴奋，但同时更多的是震惊。

&emsp;&emsp;相信您和我一样是喜欢着《雀魂》这款游戏才能让您读到这段文字，同样，也相信您了解一款游戏的生存无非能否长期稳定地盈利，《雀魂 Plus》提供的功能最初只是为了方便修改桌布和音乐，但目前的发展情况，但很明显，《雀魂 Plus》的传播已经明显超出了可控范围。试想，如果您是《雀魂》的付费用户，在得知免费玩家可以享受到付费体验，心中会有什么想法？还会继续为《雀魂》付费么？如果大家都在使用修改实现的装扮而不为《雀魂》付费，那么这款游戏的未来会怎样？会继续盈利下去么？相信您您的内心现在已经想到了未来可能发生的事，我们都不希望那样的未来。

&emsp;&emsp;作为“始作俑者”，我不希望《雀魂 Plus》被滥用，我希望的是《雀魂 Plus》可以为《雀魂》提供一个 PC 稳定的游戏环境和体验，在这基础上体验一些《雀魂》尚未实现的、或是其他游戏中存在的优秀功能，并非为了让使用者白嫖《雀魂》，这是一个不健康的发展路径，无论你我，当然不希望《雀魂》会走上《雀龙门》的老路，成为一款冷门游戏，或是成为下一个《X 海战记》。《雀魂》当前的付费点主要就是装扮，还望各位手下留情，使用魔改的同时别忘为游戏付费，一款好的游戏值得去为其体验埋单。

&emsp;&emsp;在版本 v1.9.0 更新后，《雀魂 Plus》将会将更新重点转移到作为一款游戏用浏览器体验的优化上，对于目前已有的扩展功能将仅做维护，感谢您的理解。相信您在思考后，也会在《雀魂》中“补票”吧。

## 安装

### 手动下载和安装

1. 访问 [releases 页面](https://github.com/iamapig120/majsoul-plus-client/releases/latest) 下载适用于您计算机系统的版本
2. 解压压缩文件
3. 运行应用程序，启动浏览器

### 社区维护源

| 平台                  | 维护者                      | 安装命令                         |
| --------------------- | --------------------------- | -------------------------------- |
| Homebrew Cask / macOS | @CaptainYukinoshitaHachiman | `brew cask install majsoul-plus` |

祝您玩的开心！

## 快捷键

请参阅 [Wiki 文档](https://github.com/MajsoulPlus/majsoul-plus/wiki/Shortcuts)

## 从源码启动

请确保 Git, node.js 和 NPM 已经被正确安装

1. `git clone git@github.com:MajsoulPlus/majsoul-plus-client.git`
2. `cd majsoul-plus-client`
3. `npm install`
4. `npm start`

## 制作模组

雀魂 Plus 支持使用自定义模组进行游戏，仓库中的`./mod/mallard`路径已经包含了一个示例模组，用于将默认千织替换为绿头鸭。
您可以参照这个模组进行修改和编辑

一个模组由一个`mod.json`文件和若干资源文件组成，模组会在游戏尝试加载资源时优先于官方资源被加载，以下为`mod.json`的一个示例：

```json
{
  "name": "默认桌布替换为示例桌布",
  "author": "Handle",
  "description": "将默认桌布替换为第一届Sim杯日式麻将比赛桌布，\n仅用于本届比赛使用。",
  "//注释": "可选，设置Mod静态资源相对路径，默认值为 /files",
  "dir": "/files",
  "//注释": "可选，设置Mod预览图的相对路径，默认值为 preview.jpg",
  "//注释": "可选，用于替换原始资源路径 replace 属性可以支持多组正则表达式",
  "preview": "preview.jpg",
  "replace": [
    {
      "//注释": "将会作为正则表达式处理",
      "from": "/0/[^/]+/scene/Assets/Resource/tablecloth/tablecloth_default/Table_Dif\\.jpg",
      "//注释": "匹配目标，可以使用形如 $1, $2 的占位符",
      "to": "/0/v0.4.1.w/scene/Assets/Resource/tablecloth/tablecloth_default/Table_Dif\\.jpg"
    },
    {
      "from": "/0/[^/]+/myres2/tablecloth/tablecloth_default/preview\\.jpg",
      "to": "/0/v0.4.1.w/myres2/tablecloth/tablecloth_default/preview\\.jpg"
    }
  ],
  "//注释": "可选，一个内置在模组内的插件，其定义请参考下方插件部分",
  "execute": {}
}
```

## 开发插件

雀魂 Plus 支持使用额外的插件进行游戏，仓库中的`./execute/reportVoice`路径已经包含了一个示例插件，这个插件可以将游戏中的语音报番在本地解锁。
您可以参照这个插件进行修改和编辑

一个插件由一个`execute.json`文件和一个或多个 JavaScript 文件组成，插件会在游戏尝试加载前或游戏代码加载完成后在游戏所在窗口的全局上下文中的匿名函数内被执行，以下为`execute.json`的一个示例：

```json
{
  "name": "强制开启报番型、主菜单交互语音",
  "author": "aoarashi1988",
  "description": "可以强制在本地打开报番型、主菜单交互语音。\naoarashi1988原作，Handle修改。",
  "//注释": "可选，设置插件预览图的相对路径，默认值为 preview.jpg",
  "preview": "preview.jpg",
  "//注释": "可选（不低于1.2.6），必填（低于1.2.6），要注入的 JavaScript 代码文件",
  "entry": "script.js",
  "//注释": "可选，设置代码执行时机，默认值为 false，即游戏代码加载完成后执行，若为 true 则会在游戏加载前执行要注入的代码",
  "sync": false
}
```

## 开发工具

雀魂 Plus 支持使用额外的工具增强功能，仓库中的`./tool/desktopCreator`路径已经包含了一个示例工具，这个工具可以轻松生成一个桌布模组，替换默认桌布。
您可以参照这个工具进行修改和编辑

一个插件由一个`tool.json`文件和若干 Electron 的 BrowserWindow 所需文件组成，工具会在资源管理器加载时同步读取并展现，以下为`tool.json`的一个示例：

```json
{
  "name": "桌布制作工具",
  "author": "Handle",
  "description": "简单几步生成桌布Mod，桌布随心换",
  "//注释": "定义了 浏览器调用 Electron 的 BrowserWindow 时，要加载的入口页面",
  "index": "index.html",
  "//注释": "一个标准的 BrowserWindow 选项，详情请参考 https://electronjs.org/docs/api/browser-window#new-browserwindowoptions",
  "windowOptions": {
    "width": 640,
    "height": 360
  }
}
```

## 协助翻译

雀魂 Plus 正筹备支持多语言的本地化特性，您可以通过以下方式参与到项目翻译中：

- [Join with ParaTranz](https://paratranz.cn/projects/196): 日本語
- [Join with OneSky](https://osh1flm.oneskyapp.com/admin/project/dashboard/project/329038): English, 正體中文 台灣, 繁體中文 香港, 한국어

## 贡献者

[![contributors](https://opencollective.com/majsoul-plus-client/contributors.svg?width=890&button=false)](https://github.com/MajsoulPlus/majsoul-plus-client/graphs/contributors)

## 开源协议

![License AGPL-3.0](https://img.shields.io/github/license/iamapig120/majsoul-plus-client.svg)

注：软件图标、图像、SVG 矢量图形均不遵循以上协议，您不可以将这些内容用于雀魂 Plus 以外的内容
