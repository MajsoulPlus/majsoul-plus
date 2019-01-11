# [雀魂 Plus - 雀魂麻将第三方桌面客户端](https://github.com/iamapig120/majsoul-plus-client)

在 PC 上跨平台的雀魂麻将第三方客户端，提供资源替换和代码注入功能

[![Build status](https://ci.appveyor.com/api/projects/status/cx2hgugjts6ed932/branch/master?svg=true)](https://ci.appveyor.com/project/hyunrealshadow/majsoul-plus-client/branch/master)
[![Build Status](https://travis-ci.com/MajsoulPlus/majsoul-plus-client.svg?branch=master)](https://travis-ci.com/MajsoulPlus/majsoul-plus-client)
![DownloadsLatest](https://img.shields.io/github/downloads/iamapig120/majsoul-plus-client/latest/total.svg)
![DownloadsTotal](https://img.shields.io/github/downloads/iamapig120/majsoul-plus-client/total.svg)
![License](https://img.shields.io/github/license/iamapig120/majsoul-plus-client.svg)

## 特性

- 除首次加载较慢，其余均可高速加载
- 轻量级，仅依赖 express 、 electron 以及 AdmZip
- 桌面端跨平台
- 本地文件不加密
- 支持魔改模组和代码执行

## 如何使用

1. 访问 <a href="https://github.com/iamapig120/majsoul-plus-client/releases">releases 页面</a> 下载最新版本
2. 解压
3. 运行

在客户端中玩的开心！

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
  ]
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

## 贡献者


[<img src="https://avatars0.githubusercontent.com/u/16359124?s=64" width="64" height="64" alt="Handle"/>](https://github.com/iamapig120)
[<img src="https://avatars0.githubusercontent.com/u/30466105?s=64" width="64" height="64" alt="aoarashi1988"/>](https://github.com/aoarashi1988)
[<img src="https://avatars0.githubusercontent.com/u/36305150?s=64" width="64" height="64" alt="UnrealShadow"/>](https://github.com/hyunrealshadow)
