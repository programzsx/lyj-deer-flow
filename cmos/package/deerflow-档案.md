# deerflow-档案

## 一、这个包是干什么的

这个包是DeerFlow后端的"智能体框架"总包。

包名是`deerflow`。源码在`backend/packages/harness/deerflow/`。

这个包对应一个可独立发布的Python发行包。发行包名字叫`deerflow-harness`。

`__init__.py`文件本身是空的。空的`__init__.py`表示这个目录是一个普通包。

这个包承载整个智能体运行框架。智能体编排、工具系统、沙箱执行、模型工厂、MCP集成、技能系统、配置系统，全部装在这个包里。

这个包是分层设计中的"框架层"。

分层规则很严格。

框架层叫harness。应用层叫app。

app层导入deerflow。deerflow绝不导入app。

这条规则由`tests/test_harness_boundary.py`在CI里强制执行。

这样设计的目的很明确。框架可以独立发布。应用可以自由使用框架。框架不反向依赖任何具体应用。

## 二、包里的主要成员

包根目录下的`__init__.py`是空文件。真正的成员是各子包和顶层模块。

### 1、子包成员

- `agents/`。智能体系统。包含主智能体工厂、系统提示词、中间件链、记忆系统、线程状态。
- `sandbox/`。沙箱执行系统。提供bash、文件读写、字符串替换等工具。沙箱分本地provider和远程provider。
- `subagents/`。子智能体委派系统。包含内置子智能体、后台执行器、注册表。
- `tools/`。内置工具集。例如`present_files`、`ask_clarification`、`view_image`。
- `mcp/`。MCP协议集成。管理MCP服务器连接、工具发现、持久任务。
- `skills/`。技能系统。负责技能发现、加载、解析。
- `models/`。模型工厂。支持思考模式与视觉模式。
- `config/`。配置系统。应用配置、模型配置、沙箱配置、工具配置都在这里。
- `community/`。社区工具。搜索、抓取、图片搜索、各类沙箱。
- `extensions/`。Python插件加载器。负责插件注册、位置安排、隔离。
- `runtime/`。运行时。运行管理器、事件流、检查点。
- `persistence/`。持久化。数据库模型与仓库。
- `storage/`。存储契约。
- `authz/`。授权。主体识别、工具过滤、授权提供者。
- `guardrails/`。护栏。
- `tui/`。终端界面。
- `tracing/`。链路追踪。对接Langfuse、LangSmith。
- `utils/`。通用工具函数。
- `integrations/`。一方集成安装器。例如Lark CLI技能包。
- `reflection/`。动态模块加载。提供`resolve_variable`、`resolve_class`。

### 2、顶层模块成员

- `client.py`。内嵌Python客户端`DeerFlowClient`。这个文件很大，约8.5万字节。它提供不经过HTTP的进程内访问能力。
- `constants.py`。运行时协议常量。技能容器路径、MCP内部目录名、任务长度上限都定义在这里。
- `trace_context.py`。请求级追踪ID。`X-Trace-Id`头的唯一来源是这里的ContextVar。
- `logging_config.py`。日志配置。
- `knowledge_scope.py`。知识范围控制。
- `mcp_scope.py`。MCP范围控制。
- `checkpoint_patches.py`。检查点补丁。

### 3、客户端的角色

`client.py`里的`DeerFlowClient`值得单独说明。

它让使用者在自己的Python进程里直接使用智能体能力。使用者不需要启动Gateway进程。

它提供`chat()`同步对话。它提供`stream()`流式对话。

它还提供一组与Gateway等价的方法。模型列表、MCP配置、技能管理、目标管理、记忆管理、文件上传、工件读取，都有对应方法。

它通过`create_agent()`加`build_middlewares()`懒创建图。它按用户ID缓存图。

## 三、它和谁协作

### 1、上游

app层是它的上游使用者。

`app/gateway/`是FastAPI网关。网关导入deerflow来构建和运行智能体。

`app/channels/`是IM渠道集成。飞书、Slack、Telegram、Discord、钉钉都通过网关进入同一个智能体。

### 2、下游

它依赖外部框架。

它依赖langchain和langgraph。智能体的图编译、中间件机制都来自这两者。

它依赖pydantic做配置校验。

### 3、内部协作

`deerflow.agents`是核心消费路径。网关运行器`runtime/runs/worker.py`调用主智能体工厂来取得图。

记忆系统通过`manager.py`的契约对接各个后端。

配置系统是几乎所有子包的公共依赖。

### 4、测试

测试覆盖非常广。`tests/test_client.py`离线测试客户端。`tests/test_harness_boundary.py`守住分层边界。`tests/test_trace_*.py`测试追踪。各子包有自己的测试文件。

## 四、重要性评级

评级是9分。

理由如下。

这个包是整个后端的地基。网关、渠道、客户端全部建立在它之上。

它被71个以上的Python文件直接导入。没有它，后端无法启动。

删除它会怎样。删除它等于删除整个智能体框架。所有功能立即瘫痪。

为什么不是10分。包根的`__init__.py`本身是空文件。空文件没有可删除的实质内容。而且框架内各子包相对独立，个别子包可以单独替换。所以给9分。
