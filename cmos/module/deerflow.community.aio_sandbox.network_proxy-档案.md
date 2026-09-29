# deerflow.community.aio_sandbox.network_proxy

## 一、这个模块是干什么的

这个模块是受限沙箱的HTTP策略代理。

背景是这样的。

受限沙箱的网络是隔离的。

沙箱不能直接出站。

出站必须经过一个代理。

这个模块就是那个代理。

它是一个独立的HTTP和HTTPS代理程序。

它被拷贝进一个小的sidecar容器里作为脚本运行。

它支持什么。

支持HTTP的绝对形式请求。

支持HTTPS的CONNECT。

其他协议在沙箱的内部网络上不可用。

它的策略逻辑是这样的。

每个请求先过策略判断。

策略允许就转发。

策略拒绝就记一条拒绝事件。

拒绝事件可以被发现和审批。

HTTPS的CONNECT只能看到加密流量。

它从TLS握手里读出目标域名。

不解析加密内容。

它的策略数据存在SQLite里。

这是sidecar本地的库。

## 二、模块里的主要成员

- handle_proxy：代理请求的主处理。区分HTTP和CONNECT。
- handle_relay：中继端口的处理。给API中继用。
- serve、main：入口。启动asyncio服务。
- policy_allows(host, port)：判断目标是否被策略允许。
- record_denial：记录一条拒绝事件。
- pending_events：列出未消费的拒绝事件。
- deny_pending_events：批量拒绝未消费的事件。
- decide(request_id, decision, ttl)：审批一个待决请求。
- resolve_public：DNS解析。只解析公网地址。
- _is_granted：判断是否有临时授权。
- _static_rules：静态策略规则。
- _relay：中继转发。
- _read_tls_client_hello：从TLS握手里读SNI域名。
- _parse_http_header_fields、_http_request_body_framing：解析HTTP请求。
- _copy_exact_request_bytes、_copy_chunked_request_body：精确复制请求体。
- domain_matches、address_is_public、normalize_host：地址和域名的匹配辅助。
- RELAY_AUTH_HEADER、RELAY_TOKEN_ENV：中继令牌的认证约定。

## 三、它和谁协作

- 它被community/aio_sandbox/local_backend.py拷贝进sidecar并启动。
- 它的拒绝事件被local_backend和提供者消费。消费后走审批流程。
- 它和沙箱、外部网络通信。

## 四、重要性评级

评级是7分。

理由是它是受限沙箱网络隔离的执行者。

沙箱的网络边界完全依赖它的策略判断。

TLS的SNI读取和精确的请求字节复制是难写对的部分。

审批流程支撑了临时授权。

但它是sidecar脚本，不在Gateway进程内。
