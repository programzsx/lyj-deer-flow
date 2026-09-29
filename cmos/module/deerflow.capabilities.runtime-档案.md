# deerflow.capabilities.runtime

## 一、这个模块是干什么的

这个模块是能力插件的运行时引用。

它管两件事。

一件事是稳定的安装id。

一件事是代理工具的选择。

它明确声明自己不是授权系统。

背景是这样的。

每个MCP服务器安装后需要一个稳定id。

稳定id用来选择和引用。

id怎么来的。

配置里有capability元数据时用元数据里的id。

没有时用服务器名的uuid5。

uuid5是确定性的。

同一个名字永远得到同一个id。

既有配置在GET时不改写。

工具选择怎么做的。

代理可以选装哪些MCP插件。

选择按安装id过滤。

有歧义的id会被排除。

歧义是两个服务器映射到同一个id。

禁用的条目也算歧义。

因为启用一个绝不能扩大另一个的选择。

这是安全设计。

## 二、模块里的主要成员

- installation_id(server_name, server)：计算服务器的稳定安装id。有capability元数据用元数据id。没有用uuid5。
- ambiguous_installation_ids(servers)：找出有歧义的id。禁用条目也算。
- filter_mcp_plugins(tools, selected, config)：按选择过滤MCP工具。歧义id从选择里去掉。只保留启用的服务器。
- 它依赖tools/mcp_metadata判断MCP工具和读取服务器来源。

## 三、它和谁协作

- 它被tools/tools.py引用。代理构建工具集时过滤插件。
- 它依赖config/extensions_config读MCP服务器配置。
- 它和capabilities/catalog协作。目录里的id被这里引用。

## 四、重要性评级

评级是4分。

理由是它是插件选择的运行时逻辑。

稳定id的设计让既有配置不用改写。

歧义排除的设计防止选择扩大。

这是可执行面的安全细节。

但模块体量小，逻辑直白。
