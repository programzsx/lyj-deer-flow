# app.gateway.routers.browser-档案

源码路径是backend/app/gateway/routers/browser.py。

## 一、这个模块是干什么的

browser.py是浏览器会话路由。

DeerFlow有一个智能体浏览器控制能力。

智能体可以操作一个真实的浏览器。

这个模块让前端实时看到浏览器画面。

这个模块还提供导航端点。

这个模块有500多行。

## 二、模块里的主要成员

路由前缀是/api。

### 1、端点列表

- POST "/threads/{thread_id}/browser/navigate"导航浏览器到指定URL。
- WebSocket "/threads/{thread_id}/browser/stream"实时推送浏览器画面。

navigate端点校验线程归属和浏览器开关。

### 2、WebSocket流

browser_stream是实时流端点。

前端连上后持续收到浏览器截图帧。

_authenticate_ws在握手时做认证。

_ws_origin_allowed检查Origin头，防跨站劫持。

_negotiate_browser_frame_format协商帧格式。

帧格式可以是二进制也可以是base64。

## 3、浏览器开关

_browser_tools_enabled检查配置里的浏览器开关。

浏览器能力没配置时端点返回明确错误。

## 三、它和谁协作

上游是前端的浏览器预览面板。

下游是deerflow.community.browser_automation的会话管理器。

线程归属检查依赖ThreadMetaStore。

认证复用Gateway的会话cookie。

## 重要性评级

评级是6分。

理由如下。

浏览器控制是亮点功能。

实时画面直接决定这个功能的体验。

WebSocket认证和Origin检查是安全关键点。

但这个功能是可选的。

没配置浏览器能力时系统完全不受影响。

核心对话路径不依赖这个模块。

所以评级是6分。
