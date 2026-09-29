# deerflow.capabilities-档案

## 一、这个包是干什么的

这个包是DeerFlow的"能力中心"包。

包名是`deerflow.capabilities`。源码在`backend/packages/harness/deerflow/capabilities/`。

大白话讲。这个包支撑前端的"能力中心"页面。能力中心是用户在`/workspace/capabilities`看到的一个插件目录。这个包提供三样东西。

第一样是插件清单。哪些插件可以装。叫什么名字。怎么配置。有什么功能。

第二样是内置业务工具。钉钉群通知、企业微信群通知、HubSpot CRM。这三个内置插件通过stdio MCP进程提供服务。

第三样是安装身份和工具过滤。每个插件安装有一个稳定ID。agent的工具集按选中的插件过滤。

这个包的docstring说明了定位。它做声明式能力发现。执行留给拥有它的运行时。它不是授权系统。

## 二、包里的主要成员

### 1、__init__.py

它只有一行docstring。它声明这个包的定位。

### 2、catalog.py

这个模块是清单目录。

- `PluginManifest`。Pydantic模型。字段有schema_version、id、version、name、description、setup、category、kind、adapter、source、icon、aliases、auth_methods、contributions、config_schema。extra是forbid。未知字段被拒绝。
- `load_catalog()`。加载清单列表。默认读`builtin.json`。操作员可以提供另一个清单文件。它不加载可执行代码。重复的插件ID被拒绝。

校验器做两件事。`safe_source`要求source必须用HTTPS。`local_icon`要求icon必须是打包的插件资产。icon必须以`/images/plugins/`开头，不能有`..`、`?`、`#`。

category有六种。office、knowledge、research、business、development、custom。kind有三种。mcp、cli、native。

### 3、builtin.json

这是内置清单数据。约21KB。当前包含的插件：

- `lark`。飞书/Lark集成。office类。cli型。OAuth认证。贡献工具和技能。
- `dingtalk`。钉钉群通知。office类。mcp型。api_key认证。business适配器。
- `wecom`。企业微信群通知。office类。mcp型。api_key认证。business适配器。
- `hubspot`。HubSpot CRM。business类。mcp型。api_key认证。business适配器。

每个条目有多语言名称、描述、安装说明。config_schema描述连接配置的字段。

### 4、business.py

这个模块是内置业务工具的实现。通过stdio MCP生命周期服务。

- `CREDENTIALS`。三个provider的凭证环境变量名。钉钉要access_token和sign_secret。企业微信要webhook_key。HubSpot要access_token。
- `connection_config()`。校验凭证。凭证只能包含要求的字段。值必须匹配白名单字符集。凭证放进MCP进程的环境变量。凭证永远不出现在工具参数或发现结果里。
- `is_bundled_connection()`。判断一个MCP连接是不是内置业务连接。解释器、模块、provider、参数、环境变量键必须全部匹配自己的启动器。这是可执行白名单。绝不信任清单元数据来授予执行。
- `BusinessClient`。业务客户端。三个provider共用。
- `build_server()`。构建FastMCP服务器。HubSpot暴露get_companies和create_contact两个工具。钉钉和企业微信暴露send_message一个工具。

安全设计值得注意。

- HTTP请求限制响应大小2MB。
- 请求异常不含原始URL。原始URL带token。异常被换成安全的消息。
- 钉钉签名用HMAC-SHA256。时间戳加换行加secret。
- 工具的docstring提醒。create_contact创建真实联系人。不确定的写入不要自动重试。send_message发送真实通知。不读聊天。

### 5、runtime.py

这个模块是稳定安装引用和agent工具选择。

- `installation_id()`。计算一个MCP server的稳定安装ID。配置里带capability元数据且metadata.id有效就用metadata.id。否则用`uuid5(NAMESPACE_URL, "deerflow:mcp:{server_name}")`。已有配置在GET时被原样采纳，不被改写。
- `ambiguous_installation_ids()`。找出有歧义的安装ID。两个server解析到同一个ID就是歧义。禁用的条目也被计算。启用一个不能扩大另一个的选择。
- `filter_mcp_plugins()`。按选中的安装ID过滤MCP工具。选中的ID减去歧义ID。歧义ID不参与。然后只保留来源server在选中集合里的MCP工具。非MCP工具原样保留。

## 三、它和谁协作

### 1、上游调用方

- `app.gateway.routers.capabilities`。能力中心的REST路由。列清单、查详情。
- `app.gateway.capabilities`。Gateway侧的业务编排。
- `app.gateway.routers.mcp`。MCP配置路由。连接内置业务插件时用`connection_config()`。已保存连接判断用`is_bundled_connection()`。
- `app.gateway.routers.personal_mcp`。个人MCP路由。
- `deerflow.tools.tools`。工具装配时调用`filter_mcp_plugins()`。按用户选中的插件过滤MCP工具。

### 2、下游依赖

- httpx。BusinessClient的HTTP库。
- mcp（FastMCP）。stdio MCP服务器。
- `deerflow.tools.mcp_metadata`。识别MCP工具和读取来源。
- `deerflow.config.extensions_config`。读取已启用的MCP server配置。

### 3、测试

`backend/tests/test_capability_registry.py`、`test_capability_api.py`、`test_business_plugins.py`测试这个包。`docs/capability-center.md`写整体文档。

## 四、重要性评级

评级是6分。

理由如下。

引用数量查证结果。全仓库约13个文件引用`deerflow.capabilities`。其中生产代码6处。Gateway的三个路由文件加capabilities编排加tools.py。测试3个文件。文档2处。

这个包支撑能力中心页面。能力中心是用户安装和配置插件的入口。它也决定agent的工具可见性。`filter_mcp_plugins()`在工具装配路径上。

删除它会怎样。Gateway的capabilities、mcp、personal_mcp三个路由无法导入。能力中心页面不可用。内置业务插件（钉钉、企业微信、HubSpot）不可用。tools.py的工具装配失败。系统无法启动。

为什么是6分不是更高分。它的功能是可选能力的发现和过滤。默认配置里MCP server可能是空的。没有插件时，`filter_mcp_plugins()`在selected为None时直接返回原工具列表。它的存在不影响核心对话能力。

为什么不是更低分。它在工具装配路径上。只要用户选中了插件，每次agent构建都经过它。`is_bundled_connection()`是内置连接执行的安全白名单。删掉这个判断会让任意MCP连接伪装成内置连接。这是一个安全边界。
