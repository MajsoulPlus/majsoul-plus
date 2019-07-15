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

| 平台                  | 维护者                                                                       | 安装命令                                                               |
| --------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Homebrew Cask / macOS | [@CaptainYukinoshitaHachiman](https://github.com/CaptainYukinoshitaHachiman) | `brew cask install majsoul-plus`                                       |
| Arch User Repository  | [@BruceZhang1993](https://github.com/BruceZhang1993)                         | [参考 AUR 发布页](https://aur.archlinux.org/packages/majsoul-plus-bin) |

祝您玩的开心！

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

| 语言   | 译者                                       |
| ------ | ------------------------------------------ |
| 日本語 | [@rakuchan5](https://github.com/rakuchan5) |

## 致用户

&emsp;&emsp;感谢您正在阅读这段文字，我是《雀魂 Plus》开发者之一：Handle。首先，感谢您信赖并使用《雀魂 Plus》，这是我第一个破 10 Star 的项目，同时也是我倾注了大量心血的作品，对于其意外登上一些论坛的置顶，我感到兴奋，但同时更多的是震惊。

&emsp;&emsp;相信您和我一样是喜欢着《雀魂》这款游戏才能让您读到这段文字，同样，也相信您了解一款游戏的生存无非能否长期稳定地盈利，《雀魂 Plus》提供的功能最初只是为了方便修改桌布和音乐，但目前的发展情况，但很明显，《雀魂 Plus》的传播已经明显超出了可控范围。试想，如果您是《雀魂》的付费用户，在得知免费玩家可以享受到付费体验，心中会有什么想法？还会继续为《雀魂》付费么？如果大家都在使用修改实现的装扮而不为《雀魂》付费，那么这款游戏的未来会怎样？会继续盈利下去么？相信您您的内心现在已经想到了未来可能发生的事，我们都不希望那样的未来。

&emsp;&emsp;作为“始作俑者”，我不希望《雀魂 Plus》被滥用，我希望的是《雀魂 Plus》可以为《雀魂》提供一个 PC 稳定的游戏环境和体验，在这基础上体验一些《雀魂》尚未实现的、或是其他游戏中存在的优秀功能，并非为了让使用者白嫖《雀魂》，这是一个不健康的发展路径，无论你我，当然不希望《雀魂》会走上《雀龙门》的老路，成为一款冷门游戏，或是成为下一个《X 海战记》。《雀魂》当前的付费点主要就是装扮，还望各位手下留情，使用魔改的同时别忘为游戏付费，一款好的游戏值得去为其体验埋单。

&emsp;&emsp;在版本 v1.9.0 更新后，《雀魂 Plus》将会将更新重点转移到作为一款游戏用浏览器体验的优化上，对于目前已有的扩展功能将仅做维护，感谢您的理解。相信您在思考后，也会在《雀魂》中“补票”吧。

## 贡献者

[![contributors](https://opencollective.com/majsoul-plus-client/contributors.svg?width=890&button=false)](https://github.com/MajsoulPlus/majsoul-plus-client/graphs/contributors)

## 开源协议

![License AGPL-3.0](https://img.shields.io/github/license/iamapig120/majsoul-plus-client.svg)

注：软件图标、图像、SVG 矢量图形均不遵循以上协议，您不可以将这些内容用于雀魂 Plus 以外的内容

## 参与讨论

使用答疑，资源分享，约战交流 QQ 群 [660996459](https://jq.qq.com/?_wv=1027&k=5PMNS8D)

开发问题，技术疑问，批判一番 QQ 群 [106475557](https://jq.qq.com/?_wv=1027&k=5iayYP5)
