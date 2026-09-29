# constants-档案

## 一、这个类是干什么的

constants不是类。

constants是deerflow包根下的一个模块。

这个模块存放共享的运行时协议常量。

这个模块的定位是依赖-free。

很多下层模块都从这里导入常量。

下层模块不需要初始化deerflow.runtime这个重量级包。

这个模块位于backend/packages/harness/deerflow/constants.py。

## 二、类的成员（字段、方法，各自做什么）

这个模块没有类，只有常量。

常量分组如下。

### 1、技能容器路径

- DEFAULT_SKILLS_CONTAINER_PATH的值是"/mnt/skills"。这是沙箱里技能的默认挂载路径。

### 2、会话读取工具

- CONVERSATION_READER_CONTEXT_KEY的值是"__conversation_reader"。这是主机侧每次运行的能力键。这个键保持无依赖。运行时worker导入这个键时不能初始化tools和subagents包。
- CONVERSATION_TOOL_USE的值是"deerflow.tools.conversation:read_conversation"。这是工具的类路径引用。
- CONVERSATION_TOOL_NAME的值是"read_conversation"。Gateway按这个工具的输出预算条目决定读取器分页大小。

### 3、隐藏目录名

这些常量统一管理"什么目录不算交付物"。

- BROWSER_FRAMES_DIRNAME的值是".browser-frames"。这是浏览器工具逐步截图的隐藏目录。截图是过程帧不是交付物。workspace-changes扫描器排除它。写入方和扫描方都从这里导入，名字不会漂移。
- TOOL_RESULTS_DIRNAME的值是".tool-results"。这是工具输出预算中间件存放超大工具输出的默认目录。这些输出是模型通过read_file读回的过程反馈。扫描器排除它。交付验证也不把它算作产物。
- MCP_INTERNAL_DIRNAME的值是".mcp"。这是stdio MCP运行时拥有的隐藏目录。子进程临时目录在.mcp/tmp。扫描器排除整个保留命名空间。
- MCP_TMP_SUBDIR的值是".mcp/tmp"。这个子目录被钉进stdio MCP环境变量的TMPDIR、TMP、TEMP。钉住临时目录的目的是让工具写到os.tmpdir()的输出落在挂载的用户数据树里。这样sandbox和artifact API才能解析这些输出。不钉的话输出会落在不可达的主机临时路径上。

### 4、MCP会话初始化超时

- DEFAULT_MCP_SESSION_INIT_TIMEOUT的值是60.0秒。这是MCP服务器启动的默认超时。启动包括子进程spawn加initialize加tools/list。卡住的stdio服务器否则会永远阻塞代理构建。在Gateway事件循环上会阻塞整个进程。每个服务器可以用session_init_timeout覆盖。None表示禁用超时。

### 5、MCP任务存储限制

运行时验证器和ORM用同一组常量。目的是SQLite不能接受PostgreSQL以后会在VARCHAR边界拒绝的值。

- MCP_TASK_SERVER_NAME_MAX_LENGTH是128。
- MCP_TASK_REMOTE_ID_MAX_LENGTH是255。
- MCP_TASK_NAME_MAX_LENGTH是255。
- MCP_TASK_RESULT_ARTIFACT_MAX_BYTES是65536。
- MCP_TASK_POLL_AFTER_MAX_SECONDS是86400。

### 6、运行事件信封限制

- RUN_EVENT_TYPE_MAX_LENGTH是32。
- RUN_EVENT_CATEGORY_MAX_LENGTH是16。

### 7、工作区变更事件标识

- WORKSPACE_CHANGES_EVENT_TYPE的值是"workspace_changes"。
- WORKSPACE_CHANGES_EVENT_CATEGORY的值是"workspace"。

工作区变更产生在runtime层之下。所以持久化的事件标识放在这个无依赖模块，而不是runtime事件目录。

## 三、它和谁协作

- workspace_changes扫描器导入隐藏目录常量。
- MCP启动路径导入MCP_TMP_SUBDIR和会话超时常量。
- mcp_tasks的运行时验证器和ORM导入MCP任务限制常量。
- runtime事件层导入运行事件限制常量。

## 四、重要性评级

评级是7分。

理由如下。

这个模块是跨层共享名字的单一事实来源。

隐藏目录名如果两边各自拼字符串就会漂移。

漂移的后果是扫描器漏排或误排。

MCP临时目录钉扎直接影响产物可达性。

SQLite和PostgreSQL的限制一致性问题也靠它兜底。

但它只有常量没有逻辑。

扣掉3分。
