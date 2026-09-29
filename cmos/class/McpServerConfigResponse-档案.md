# McpServerConfigResponse档案

类定义在backend/app/gateway/routers/mcp.py。

## 一、这个类是干什么的

这个类是单个MCP服务器配置的响应体。

DeerFlow通过MCP协议接入外部工具。每个MCP服务器有自己的配置。传输类型、命令、环境变量、OAuth等。

前端调用GET /api/mcp/config接口查看配置。后端用这个类描述每个服务器。这个类是一个Pydantic模型。

这个类是MCP配置的核心模型。其他MCP配置模型都围绕它。

## 二、类的成员

这个类有16个字段。

### 1、enabled

enabled表示这个MCP服务器是否启用。这个字段是布尔类型。默认是true。

### 2、type

type是传输类型。

这个字段是字符串类型。默认是stdio。

合法值有stdio、sse、http。stdio是标准输入输出。sse是服务器推送事件。http是HTTP传输。

### 3、command

command是stdio类型的启动命令。这个字段是字符串类型。默认是None。

### 4、args

args是启动命令的参数。这个字段是字符串列表类型。默认是空列表。

### 5、env

env是MCP服务器的环境变量。这个字段是字典类型。默认是空字典。

### 6、url

url是sse或http类型的服务器地址。这个字段是字符串类型。默认是None。

### 7、headers

headers是发送的HTTP头。这个字段是字典类型。默认是空字典。

### 8、oauth

oauth是OAuth配置。这个字段类型是McpOAuthConfigResponse。默认是None。

### 9、user_auth

user_auth是按用户注入凭证的配置。这个字段类型是McpUserScopedAuthConfigResponse。默认是None。

### 10、headers_from_context

headers_from_context是按请求注入HTTP头的配置。这个字段类型是McpContextHeadersConfigResponse。默认是None。

### 11、description

description是服务器的人类可读描述。这个字段是字符串类型。默认是空字符串。

### 12、routing

routing是工具的软路由提示。这个字段类型是McpRoutingConfig。默认是空对象。

### 13、tools

tools是按工具的配置覆盖。这个字段是字典类型。值类型是McpToolOverride。默认是空字典。

### 14、tool_name_prefix

tool_name_prefix表示发现的工具名是否加服务器名前缀。这个字段是布尔类型。默认是true。

### 15、tool_call_timeout

tool_call_timeout是单个MCP调用的超时秒数。这个字段是浮点数类型。默认是None。

### 16、session_init_timeout

session_init_timeout是服务器启动和任务会话初始化的超时秒数。这个字段是浮点数类型。默认值是DEFAULT_MCP_SESSION_INIT_TIMEOUT。None表示无超时。

默认值和McpServerConfig一致。API创建的服务器省略这个字段时。写入持久配置的默认值和文件创建的一致。

### 17、task_toolsets

task_toolsets是作为持久后台任务管理的工具组。这个字段是列表类型。默认是空列表。

## 三、它和谁协作

这个类被GET /api/mcp/config路由使用。

作为McpConfigResponse的mcp_servers字段值类型。也作为PUT和POST请求的配置载体。

GET时敏感值会被遮蔽。写入时保存原始值。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是7分。

理由如下。

MCP是外部工具接入的核心协议。这个类是MCP服务器配置的完整模型。

这个类承载凭证注入的三种方式。OAuth、按用户、按请求。凭证不进工具schema。

超时和路由配置直接影响工具运行。所以评7分。
