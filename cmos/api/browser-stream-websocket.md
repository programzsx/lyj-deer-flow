# 实时浏览器画面流

## 接口地址

本接口是WebSocket接口。

不是HTTP请求方法接口。

路径是`/api/threads/{thread_id}/browser/stream`。

网关端口是8001。

完整地址是`ws://localhost:8001/api/threads/{thread_id}/browser/stream`。

路径参数`thread_id`是会话线程ID。

可选查询参数`frame_format`协商帧格式。

取值是`binary`或不传。

传其他值时连接被关闭并返回错误。

## 接口鉴权

WebSocket升级不经过HTTP认证中间件。

本接口在握手后自行解析HttpOnly的`access_token`会话Cookie。

Cookie通过登录接口获得。

未认证时连接被关闭。关闭码是4401。

跨来源的升级被拒绝。关闭码是4403。

本接口需要`threads:write`权限。

权限检查在登录和来源校验之后。

权限解析失败时关闭码是4501。

本接口需要线程属主严格匹配。

NULL属主的历史线程不被共享。

线程不存在或属主不匹配时关闭码是4404。

线程存储不可用时关闭码是4404。

浏览器工具未启用时关闭码是4404。

本接口不支持内部认证token。

## 请求入参

本接口没有HTTP请求体。

WebSocket连接建立后客户端发送输入事件。

客户端到服务器的输入事件包括点击、移动、按下、抬起、滚轮、按键、文本输入、导航。

输入事件是JSON对象。

事件通过`type`字段区分。

连接帧格式有两种。

请求`frame_format=binary`时服务器发送二进制JPEG帧。

传统客户端收到JSON base64帧。

状态和导航元数据始终是JSON。

## 响应出参

服务器到客户端的消息有两类。

第一类是画面帧。

二进制模式直接发送JPEG字节。

传统模式发送JSON对象。

JSON帧对象包含以下字段。

- `type`：消息类型。固定为`frame`。
- `data`：JPEG帧的base64编码。字符串。

第二类是JSON状态和导航元数据。

错误消息包含以下字段。

- `type`：固定为`error`。
- `message`：错误说明。

画面帧队列有上限。

客户端消费不及时时最旧的帧会被丢弃。

画面传输是有损的。

## curl命令

WebSocket接口不能使用curl直接建立会话。

可以使用`websocat`测试。

```bash
websocat "ws://localhost:8001/api/threads/thread_xyz/browser/stream" --header "Cookie: access_token=<token>"
```

请求二进制帧格式。

```bash
websocat "ws://localhost:8001/api/threads/thread_xyz/browser/stream?frame_format=binary" --header "Cookie: access_token=<token>"
```
