# [雀魂文件替换用中转服务器 - 魔改雀魂神器](https://github.com/iamapig120/majsoul-custorm-server)

- 除首次加载较慢，其余均可高速加载
- 轻量级，仅依赖express
- 本地文件不加密

## 如何使用

1. 克隆或下载本仓库
2. npm install
3. 使用 Fiddler 配置一个 AutoResponder 配置
4. 内容设置为 REGEX:http://majsoul.union-game.com/0/*
5. 以及 http://127.0.0.1:8000/0/
6. npm start

打开雀魂，现在随意地替换资源文件吧！