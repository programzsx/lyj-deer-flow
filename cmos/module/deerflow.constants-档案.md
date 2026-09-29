# deerflow.constants-档案

## 一、这个模块是干什么的

这个文件是共享的运行时协议常量集合。

这个文件只放常量。

这个文件不放任何逻辑。

这些常量被多个模块共同引用。

常量集中在一个地方，名字就不会在模块之间漂移。

## 二、模块里的主要成员

### 1、技能容器路径

DEFAULT_SKILLS_CONTAINER_PATH是技能容器的默认挂载路径。

默认值是/mnt/skills。

### 2、会话阅读工具常量

CONVERSATION_READER_CONTEXT_KEY是宿主阅读能力的context键。

键值是__conversation_reader。

CONVERSATION_TOOL_USE是阅读工具的配置use值。

CONVERSATION_TOOL_NAME是阅读工具的名字。

Gateway按这个工具的输出预算来定阅读页的大小。

### 3、浏览器帧目录名

BROWSER_FRAMES_DIRNAME是浏览器工具逐步截图的隐藏目录名。

目录名是.browser-frames。

这些截图是临时的进度画面，不是交付物。

工作区变更扫描器会排除这个目录。

### 4、工具结果目录名

TOOL_RESULTS_DIRNAME是超长工具输出的持久化目录名。

目录名是.tool-results。

模型通过read_file读回这些内容。

这个目录同样被工作区变更扫描器排除。

### 5、MCP内部目录常量

MCP_INTERNAL_DIRNAME是stdio MCP运行时的隐藏目录名。

目录名是.mcp。

MCP_TMP_SUBDIR是子进程临时目录。

值是.mcp/tmp。

这个临时目录被固定到MCP环境变量里。

工具写临时文件时会落在用户数据树内。

这样沙箱和产物API就能解析这些输出。

### 6、MCP会话和任务限制常量

DEFAULT_MCP_SESSION_INIT_TIMEOUT是MCP服务器启动的默认超时。

值是60秒。

没有这个超时，一个卡住的stdio服务器会永久阻塞agent构建。

MCP_TASK开头的一组常量是MCP任务的存储和协议限制。

这些限制同时被运行时校验器和ORM使用。

这样SQLite不会接受PostgreSQL后来会拒绝的值。

### 7、运行事件限制常量

RUN_EVENT_TYPE_MAX_LENGTH和RUN_EVENT_CATEGORY_MAX_LENGTH是运行事件信封的字段长度限制。

WORKSPACE_CHANGES_EVENT_TYPE和WORKSPACE_CHANGES_EVENT_CATEGORY是工作区变更事件的标识。

这个模块不依赖任何重量级模块。

低层不需要初始化deerflow.runtime就能校验存储约束。

## 三、它和谁协作

它被MCP启动路径、工作区变更扫描器、浏览器工具、运行时校验器、ORM引用。

这些模块通过导入常量保持名字一致。

写入方和过滤方共享同一个名字来源。

## 四、重要性评级

评级是5分。

理由是这个文件是多模块共享名字的单一来源。

常量漂移会造成隐蔽的不一致bug。

比如扫描器和写入方对隐藏目录名不一致。

不评高分的原因是它只有常量，没有行为。

任何单独一个常量丢了，影响都局限在相关模块。
