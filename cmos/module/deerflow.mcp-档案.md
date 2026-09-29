# deerflow.mcp包档案

## 一、这个模块是干什么的

deerflow.mcp包是MCP集成的包门面。

源文件是backend/packages/harness/deerflow/mcp/__init__.py。

它的角色是立即导入式门面。

它把MCP集成的公共API一次性导入并暴露。

它没有懒加载。

docstring一句话说明定位。

定位是使用langchain-mcp-adapters的MCP集成。

MCP是Model Context Protocol。

这个包把MCP服务器上的工具接进代理可用工具集。

## 二、模块里的主要成员

它从三个模块导入成员。

cache模块提供get_cached_mcp_tools、initialize_mcp_tools、reset_mcp_tools_cache。

client模块提供build_server_params、build_servers_config。

tools模块提供get_mcp_tools。

get_mcp_tools是获取MCP工具的主入口。

initialize_mcp_tools负责初始化工具缓存。

get_cached_mcp_tools读取缓存。

reset_mcp_tools_cache重置缓存。

build_server_params构建单服务器参数。

build_servers_config构建多服务器配置。

全部六个成员在__all__里。

## 三、它和谁协作

它向内聚合cache、client、tools三个模块。

它向外被代理组装逻辑消费。

组装逻辑在构建工具集时调用get_mcp_tools。

它向下依赖langchain-mcp-adapters库。

库负责真正的MCP协议通信。

它下面挂着tasks子包。

tasks子包提供MCP任务驱动器。

tasks子包不经过这个门面暴露。

调用方直接导入deerflow.mcp.tasks。

它还与deerflow.config协作。

MCP服务器配置来自配置文件。

## 四、重要性评级

评级是6分。

理由如下。

它是MCP工具接入的正式入口。

get_mcp_tools是代理拿MCP工具的唯一入口函数。

缓存三件套让工具获取有初始化、读缓存、重置的完整生命周期。

扣分点在于它不做懒加载。

导入它要连带MCP适配器库。

对网关进程这个代价必然要付。

tasks子包不被它暴露，门面覆盖不完整。
