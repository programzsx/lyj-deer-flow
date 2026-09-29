# Handler档案

源码位置：backend/packages/harness/deerflow/integrations/lark_broker.py

## 一、这个类是干什么的

Handler是broker的HTTP请求处理类。

Handler继承BaseHTTPRequestHandler。Handler处理两类请求。GET /v1/health返回健康检查。POST /v1/exec执行一次lark-cli调用。

Handler不是直接定义的。Handler是make_handler工厂在调用时创建的闭包类。每个broker进程用自己的一份BrokerConfig。处理类把那份配置闭包进去。

## 二、类的成员

（一）字段

- timeout：每连接的socket超时。值为30秒。ThreadingHTTPServer是每连接一个线程。没有这个超时，一个声明了大Content-Length却从不发body的客户端会永远占住一个线程。stdlib读这个值来武装socket超时。

（二）方法

- log_message：静默日志。默认的BaseHTTPRequestHandler会每个请求打一条stderr日志。broker选择安静。
- _send_json：发送JSON响应。设置Content-Type和Content-Length。
- do_GET：处理健康检查。路径是/v1/health时返回200加ok。其他路径返回404。
- do_POST：处理执行请求。流程是多步的。先检查路径。再解析Content-Length。长度非法返回400。长度超限（1MB）返回413。再解析JSON请求体。args必须是字符串列表。stdin用base64解码。解析失败返回400。再获取并发信号量。拿不到返回503加broker busy。再调用run_lark_cli。意外异常返回500加结构化错误。成功返回200加退出码和base64编码的输出。finally里释放信号量。

## 三、它和谁协作

（一）产生者

make_handler是产生者。make_handler创建一个有界信号量。上限8并发。信号量闭包进Handler类。有界信号量保证沙箱洪峰不能spawn无界的lark-cli子进程。

（二）消费者

serve是消费者。serve把Handler传给ThreadingHTTPServer。服务器绑定loopback。

run_lark_cli是被调用者。do_POST把解析出的args和stdin交给run_lark_cli。

（三）防炸设计

Handler内置多层防护。请求大小限制防内存耗尽。并发信号量防子进程洪峰。socket超时防线程占住。意外异常返回结构化500而不是裸断连接。原因是shim遇到裸断连接只能报不透明的传输错误。

## 四、重要性评级

评级：5分。

理由：Handler是broker模式的执行入口。沙箱的全部lark-cli命令都经过do_POST。并发上限、请求上限、socket超时、统一错误契约都在这里实现。它是broker安全防线的执行层。给5分。
