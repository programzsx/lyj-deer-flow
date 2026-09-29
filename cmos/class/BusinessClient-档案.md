# BusinessClient-档案

## 一、这个类是干什么的

BusinessClient是capabilities/business.py里的类。

它是内置业务工具的客户端。

通过现有stdio MCP生命周期服务。

这些客户端独立实现文档化的提供者API。

支持三个提供者。

钉钉、企业微信、HubSpot。

凭证保持在MCP进程环境里。

永远不出现在工具参数或发现结果里。

这个类位于backend/packages/harness/deerflow/capabilities/business.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、BusinessClient本身

构造方法验证凭证。保存provider、credentials、可选http客户端。

### 2、connection_config模块函数

构建stdio连接配置。

凭证字段必须精确匹配。

多给或少给都拒绝。

凭证值必须是1到4096字符的安全字符集。

### 3、is_busted_connection检查

is_busted_connection是allowlist的窄例外。包括编辑和开关。

永远不信任catalog元数据来授权执行。

解释器、模块、provider、标志、允许的env键必须全部匹配自己的启动器。

### 4、_request方法

_request是统一HTTP请求。

不跟随重定向。超时20秒。

非2xx抛ValueError并提示检查凭证、权限、限制。

响应体上限2MiB。

JSON必须是字典。

httpx.RequestError包含带token的webhook URL。

所以转成不含URL的ValueError。

网络失败时提示投递可能未知。重试前先检查。

### 5、send_message方法

只支持钉钉和企业微信。

文本限制2048字节。markdown是4096。钉钉是2048。

标题限制100字符。

钉钉用HMAC-SHA256签名。

时间戳加秘密签名。

企业微信用webhook key。

errcode非0时抛错误。code类型不对时报unknown。

### 6、HubSpot方法

get_companies读公司分页。

limit限制1到100。

create_contact创建联系人。

email正则验证。上限254字符。

字段上限1000字符。

### 7、build_server和main

build_server构建FastMCP服务器。

工具带ToolAnnotations标注只读或破坏性。

工具描述要求不自动重试不确定的投递或写入。

main是CLI入口。按provider启动MCP服务器。

## 三、它和谁协作

- MCP stdio生命周期托管这些工具。
- httpx做HTTP请求。
- mcp_metadata的is_mcp_tool和get_mcp_source识别MCP工具来源。
- capabilities/runtime.py按安装选择过滤工具。

## 四、重要性评级

评级是5分。

理由如下。

这个类是内置业务通知和CRM集成的实现。

安全设计很仔细。

凭证只在MCP进程env。不在参数里。

请求错误转成不含token URL的消息。

is_busted_connection不信任catalog元数据授权。

响应体上限防炸内存。

不确定投递不自动重试。

这些质量高。

扣掉5分。

扣分原因是它是可选集成的客户端。

不在核心执行路径上。
