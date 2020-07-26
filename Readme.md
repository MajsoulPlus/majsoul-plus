![Banner](https://github.com/iamapig120/simpad-ebay-imgs/blob/master/majsoul_plus_banner.png?raw=true)

# 雀魂 Plus

雀魂 Plus 是一款设计用于雀魂麻将的 PC 专用浏览器

浏览 [Wiki](https://github.com/MajsoulPlus/majsoul-plus-client/wiki)

包含以下核心特性：

- 本地缓存机制，可有效提高游戏加载速度
- 适配 OBS 等视频采集软件，方便播主直播使用
- 易于自定义的本地缓存
- 为额外功能提供扩展接口支持

[稳定版： ![VersionLatest](https://img.shields.io/github/release/MajsoulPlus/majsoul-plus-client.svg)
![DownloadsLatest](https://img.shields.io/github/downloads/iamapig120/majsoul-plus-client/latest/total.svg)](https://github.com/iamapig120/majsoul-plus-client/releases/latest)

[开发版： ![VersionLatestPre](https://img.shields.io/github/release-pre/MajsoulPlus/majsoul-plus-client.svg)
![DownloadsLatestPre](https://img.shields.io/github/downloads-pre/MajsoulPlus/majsoul-plus-client/latest/total.svg)](https://github.com/iamapig120/majsoul-plus-client/releases/)

[![Build status](https://ci.appveyor.com/api/projects/status/u1ghm2vx6w5d74wb?svg=true)](https://ci.appveyor.com/project/hyunrealshadow/majsoul-plus)
[![Build Status](https://travis-ci.com/MajsoulPlus/majsoul-plus.svg?branch=master)](https://travis-ci.com/MajsoulPlus/majsoul-plus)
![License AGPL-3.0](https://img.shields.io/github/license/iamapig120/majsoul-plus-client.svg)

**警告：** 在您使用雀魂 Plus 时进行的 **「 不当行为可能会导致账号被封禁」** ，例如使用了影响游戏平衡的第三方插件或功能扩展，因此产生的一切后果，雀魂 Plus 不对此承担任何责任！

## 安装

### 手动下载和安装

1. 访问 [releases 页面](https://github.com/iamapig120/majsoul-plus-client/releases/latest) 下载适用于您计算机系统的版本
2. 解压压缩文件
3. 运行应用程序，启动浏览器

### 社区维护源

| 平台                  | 维护者                                                                       | 安装命令                                                                       |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Homebrew Cask / macOS | [@CaptainYukinoshitaHachiman](https://github.com/CaptainYukinoshitaHachiman) | `brew cask install majsoul-plus`                                               |
| Arch User Repository  | [@BruceZhang1993](https://github.com/BruceZhang1993)                         | (`bin`) [参考 AUR 发布页](https://aur.archlinux.org/packages/majsoul-plus-bin) |
| Arch User Repository  | [@Yesterday17](https://github.com/Yesterday17)                            | (`source`) [参考 AUR 发布页](https://aur.archlinux.org/packages/majsoul-plus/) |

为了防止 `1.x` 用户不慎升级到 `2.x` 后大量模组插件无法使用，`2.x` 版本专门发布了一个 AUR 包。祝您玩的开心！

## 从源码启动

请确保 Git, Node.js 和 yarn 已经被正确安装

1. `git clone git@github.com:MajsoulPlus/majsoul-plus-client.git`
2. `cd majsoul-plus-client`
3. `yarn`
4. `yarn start`

如果你使用的是 ArchLinux 系，注意要在 `yarn start` 之前安装 `gconf` 才能正常运行：

```bash
sudo pacman -S gconf
```

## 快捷键

雀魂 Plus 具有一些快捷键可以极大方便您的操作，具体键位请 [浏览 Wiki](https://github.com/MajsoulPlus/majsoul-plus/wiki/Shortcuts)

## 开发和制作扩展资源

## 制作模组

- 资源包 [浏览 Wiki](https://github.com/MajsoulPlus/majsoul-plus/wiki/v2_resourcepack)
- 扩展 [浏览 Wiki](https://github.com/MajsoulPlus/majsoul-plus/wiki/v2_extension)
- 工具 [浏览 Wiki](https://github.com/MajsoulPlus/majsoul-plus/wiki/v2_tool)

## 协助翻译

雀魂 Plus 正在完善多语言本地化，您可以通过以下方式参与到项目翻译中：

- [Join with ParaTranz](https://paratranz.cn/projects/196): 日本語
- [Join with OneSky](https://osh1flm.oneskyapp.com/admin/project/dashboard/project/329038): English, 正體中文 台灣, 繁體中文 香港, 한국어

### 特别感谢以下译者提供的优秀翻译，谢谢您！

| 语言   | 译者 |
| ------ | ------ |
| 日本語 | [乐乐先生](https://github.com/rakuchan5), [inkuxuan](https://github.com/inkuxuan), [dera0813](https://github.com/dera0813) |
| 한국어 | [rishubil](https://github.com/rishubil), [karaha](https://osh1flm.oneskyapp.com/account/profile/720841) |
| English | [Inku Xuan](https://github.com/inkuxuan), [Lawrence_XS](https://github.com/winooxx) |
| 正體中文 台灣 | [冰鍊](https://github.com/a0193143), [鄢振宇Michael Yan](https://github.com/Michael1015198808), [Davinais](https://github.com/Davinais) |

## 致用户

&emsp;&emsp;感谢您正在阅读这段文字，我是「雀魂 Plus」开发者之一：Handle。首先，感谢您信赖并使用《雀魂 Plus》。

&emsp;&emsp;时光匆匆，距离「雀魂 Plus」项目建立已经经过了一年半的时间了，雀魂也已经运营了两年多的时间了。在这段不长不短的时间里，雀魂在国内外取得了十分优秀的成绩，但也因为特殊原因只能以一种微妙的姿态进行运营。「雀魂 Plus」从来不愿意让这款浏览器软件影响到雀魂官方的运营，一款游戏长久的运营需要玩家和运营共同的多方努力。「雀魂 Plus」在未来一段时间内将会继续专注于客户端游戏体验的改善，请随时向我们[提出功能需求](https://github.com/MajsoulPlus/majsoul-plus/issues/new/choose)！

## 贡献者

[![contributors](https://opencollective.com/majsoul-plus-client/contributors.svg?width=890&button=false)](https://github.com/MajsoulPlus/majsoul-plus-client/graphs/contributors)

## 开源协议

![License AGPL-3.0](https://img.shields.io/github/license/iamapig120/majsoul-plus-client.svg)

注：软件图标、图像、SVG 矢量图形均不遵循以上协议，您不可以将这些内容用于雀魂 Plus 以外的内容

## 参与讨论

使用用户 QQ 群① [660996459](//jq.qq.com/?_wv=1027&k=5PMNS8D)

使用用户 QQ 群② [734630401](//shang.qq.com/wpa/qunwpa?idkey=ec467f8cc72b65de6d5ee8a469b02f861de82671d9047b9bf274522ea3f92e23)


开发相关 QQ 群 [106475557](//jq.qq.com/?_wv=1027&k=5iayYP5)
