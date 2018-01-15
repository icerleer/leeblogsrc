---
title: Electron 开发镜像配置
date: 2016/11/01 23:17:55
updated: 2016/11/01 23:17:55
subtitle: electron 开发时, 如果你在国内, 你会痛苦的要死, 因为开发下载很慢或者无法下载
categories:
- 技术
tag:
- electron
- mirror
cover: http://oys481nr9.bkt.clouddn.com/electron_mirror.jpg
---
 
electron 开发时, 如果你在国内, 你会痛苦的要死, 因为开发下载很慢或者无法下载, 还好有可爱的NPM 淘宝镜像


## 以下两个方案


### 1. 以下添加以下设置

```brash
# 注册模块镜像
npm set registry https://registry.npm.taobao.org 
# node-gyp 编译依赖的 node 源码镜像
npm set disturl https://npm.taobao.org/dist

## 以下选择添加
# chromedriver 二进制包镜像
npm set chromedriver_cdnurl http://cdn.npm.taobao.org/dist/chromedriver 
# operadriver 二进制包镜像
npm set operadriver_cdnurl http://cdn.npm.taobao.org/dist/operadriver
# phantomjs 二进制包镜像
npm set phantomjs_cdnurl http://cdn.npm.taobao.org/dist/phantomjs 
# node-sass 二进制包镜像
npm set sass_binary_site http://cdn.npm.taobao.org/dist/node-sass 
# electron 二进制包镜像
npm set electron_mirror http://cdn.npm.taobao.org/dist/electron/
# 清空缓存
npm cache clean 
```

### 更方便的设置
```brash
npm config set registry https://registry.npm.taobao.org  
npm config set disturl https://npm.taobao.org/dist
npm config set NVM_NODEJS_ORG_MIRROR http://npm.taobao.org/mirrors/node  
npm config set NVM_IOJS_ORG_MIRROR http://npm.taobao.org/mirrors/iojs  
npm config set PHANTOMJS_CDNURL https://npm.taobao.org/dist/phantomjs  
npm config set ELECTRON_MIRROR http://npm.taobao.org/mirrors/electron/  
npm config set SASS_BINARY_SITE http://npm.taobao.org/mirrors/node-sass  
npm config set SQLITE3_BINARY_SITE http://npm.taobao.org/mirrors/sqlite3  
npm config set PYTHON_MIRROR http://npm.taobao.org/mirrors/python  
```

### 2. 安装 CNPM 
```brash
npm install -g cnpm --registry=https://registry.npm.taobao.org
```