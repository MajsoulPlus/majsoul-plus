# [雀魂 Plus - 雀魂麻将第三方桌面客户端](https://github.com/iamapig120/majsoul-plus-client)

在 PC 上跨平台的雀魂麻将第三方客户端，提供资源替换和代码注入功能

<a href="https://github.com/iamapig120/majsoul-plus-client/releases/latest">稳定版： ![VersionLatest](https://img.shields.io/github/release/MajsoulPlus/majsoul-plus-client.svg)
![DownloadsLatest](https://img.shields.io/github/downloads/iamapig120/majsoul-plus-client/latest/total.svg)</a> 

<a href="https://github.com/iamapig120/majsoul-plus-client/releases/">开发板： ![VersionLatestPre](https://img.shields.io/github/release-pre/MajsoulPlus/majsoul-plus-client.svg)
![DownloadsLatestPre](https://img.shields.io/github/downloads-pre/MajsoulPlus/majsoul-plus-client/latest/total.svg)</a>

[![Build status](https://ci.appveyor.com/api/projects/status/cx2hgugjts6ed932/branch/master?svg=true)](https://ci.appveyor.com/project/hyunrealshadow/majsoul-plus-client/branch/master)
[![Build Status](https://travis-ci.com/MajsoulPlus/majsoul-plus-client.svg?branch=master)](https://travis-ci.com/MajsoulPlus/majsoul-plus-client)
![License](https://img.shields.io/github/license/iamapig120/majsoul-plus-client.svg)

## 特性

- 除首次加载较慢，其余均可高速加载
- 可使用如OBS等视频采集软件采集画面
- Windows、Mac OS、Linux，桌面端跨平台
- 支持替换游戏静态资源以及对游戏注入代码

## 如何使用

1. 访问 <a href="https://github.com/iamapig120/majsoul-plus-client/releases/latest">releases 页面</a> 下载最新版本
2. 解压
3. 运行

在客户端中玩的开心！


## 从源码启动

请确保 Git, node.js 和 NPM 已经被正确安装

1. ```git clone git@github.com:MajsoulPlus/majsoul-plus-client.git```
2. ```cd majsoul-plus-client```
3. ```npm i```
4. ```npm start```

## 自制模组

雀魂 Plus 支持使用自制模组进行游戏，仓库中的`./mod/mallard`路径已经包含了一个示例模组，用于将默认千织替换为绿头鸭。
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
  "//注释":"可选，一个内置在模组内的插件，其定义请参考下方插件部分",
  "execute":{}
}
```

## 自制插件

雀魂 Plus 支持使用自制插件进行游戏，仓库中的`./execute/reportVoice`路径已经包含了一个示例插件，这个插件可以将游戏中的语音报番在本地解锁。
您可以参照这个插件进行修改和编辑

一个插件由一个`execute.json`文件和一个或多个 JavaScript 文件组成，插件会在游戏尝试加载前或游戏代码加载完成后在游戏所在窗口的全局下被执行，以下为`execute.json`的一个示例：

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

## 支持的快捷键

以下所有快捷键均在开始载入游戏后才生效

- 截图    `F12 / Cmd+P (Mac OS) / Ctrl+P (Windows / Linux)`
- 全屏    `F5 / F11`
- 退出全屏    `Esc`
- 退出程序    `Alt+F4`
- 开发者工具    `Cmd+I (Mac OS) / Ctrl+I (Windows / Linux)`

截取的图片会自动保存至`用户>图片>Majsoul Plus`路径下

## 需要你的帮助

雀魂 Plus 正筹备支持多语言的本地化特性，但是文本的翻译需要你来协助！如果您方便帮助，请加Q群 660996459 ，或是发邮件给 mail#bysb.net （请将 # 替换为 @）

## 贡献者


[<img src="https://avatars0.githubusercontent.com/u/16359124?s=64" width="64" height="64" alt="Handle"/>](https://github.com/iamapig120)
[<img src="https://avatars0.githubusercontent.com/u/30466105?s=64" width="64" height="64" alt="aoarashi1988"/>](https://github.com/aoarashi1988)
[<img src="https://avatars0.githubusercontent.com/u/36305150?s=64" width="64" height="64" alt="UnrealShadow"/>](https://github.com/hyunrealshadow)
