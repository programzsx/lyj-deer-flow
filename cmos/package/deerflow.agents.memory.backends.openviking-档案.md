# deerflow.agents.memory.backends.openviking-档案

## 一、这个包是干什么的

这个包是DeerFlow的"OpenViking记忆后端"包。

包名是`deerflow.agents.memory.backends.openviking`。源码在`backend/packages/harness/deerflow/agents/memory/backends/openviking/`。

大白话讲。记忆系统的契约允许换后端。这个包把记忆存到OpenViking服务里。OpenViking是一个独立的记忆服务。

这个后端基于官方维护的`langchain-openviking`集成包构建。它不自写HTTP客户端。它不自管消息转换。职责分工写得很清楚。

DeerFlow继续决定什么时候捕获、什么时候召回。捕获时机、召回查询、转录游标归DeerFlow管。官方适配器管SDK传输、消息转换、批处理、会话提交、重试和检索行为。

这个后端是"单用户"设计。一个API密钥绑定一个配置好的DeerFlow所有者。另一个所有者的请求在访问远端之前就被拒绝。一个凭据绝不跨用户共享。

它只支持`mode: middleware`。配置成`mode: tool`会在构建时直接报错。注释说明要显式的模型工具就用OpenViking MCP。

## 二、包里的主要成员

### 1、__init__.py

它只做一件事。从`openviking_manager`导入`OpenVikingMemoryManager`，暴露`MANAGER_CLASS = OpenVikingMemoryManager`。

### 2、openviking_manager.py

这个模块是后端管理器。`OpenVikingMemoryManager`类继承`MemoryManager`。

`supports_search = True`。它重写了`search()`。

构造过程。`model_post_init`先解析配置。然后加载官方集成包。集成包提供四个组件。

- `OpenVikingSessionRecorder`。会话记录器。拥有一个带恢复能力的SDK客户端。
- `OpenVikingRetriever`。检索器。检索器借用记录器的同一个客户端句柄。所以这个后端只有一个连接池、一个所有者。
- `OpenVikingCommitPolicy`。提交策略。这里用`mode="always"`。
- `use_actor_peer`。actor peer上下文。每个请求作用域切换actor身份。

一个安全细节。构造记录器时传空的`extra_headers`映射。注释说明这是为了禁用SDK的`ovcli.conf`头部回退。防止配置文件给传输层加多余的头部。

核心方法：

- `add()`、`add_nowait()`。写入对话。两者都走`_write_conversation()`。注释解释了原因。这个后端提交每一次接受的捕获，所以`add_nowait`不需要单独的模式。这样保持了DeerFlow已有的压缩前行为。
- `get_context()`。读注入文本。用固定的`injection_query`查用户画像、偏好、实体、目标等。检索器复制一份再改目标URI。传了`thread_id`就把搜索模式改成`search`并限定会话。结果格式化成注入文本。按`max_injection_chars`截断，截断时保留至少16个字符。
- `search()`。查询感知的搜索。用`find`模式。支持可选的`category`过滤。
- `warm()`。启动健康检查。`startup_policy: fail_fast`时不健康就抛错。否则记警告，记忆降级运行。
- `shutdown_flush()`。停止新工作，等活跃操作排空，然后关闭拥有的资源。超时返回`False`。

写入路径的恢复设计是这个模块的核心。

每个DeerFlow线程映射到一个稳定的OpenViking会话。游标状态存成JSON文件，路径在`{storage_path}/openviking/sessions/`下面。游标只存消息签名的哈希，不存消息内容。存储用临时文件加`os.replace`的原子替换。

写入时先加载游标。如果上一次提交还挂着（`commit_pending`），先重试flush。flush失败就保留游标不推进。然后用签名前缀匹配算出还没提交的消息。追加式提交（前缀匹配成功）只发新消息。前缀匹配失败就用已提交签名集合过滤。全失败时游标不推进，下次重试。

部分写入错误单独处理。SDK抛`OpenVikingPartialWriteError`时，从错误里读出已消费的消息数。已确认的进度保存进游标。注释说明"已确认的进度被保留"。

生命周期管理很细。`_begin_operation()`和`_end_operation()`用条件变量计数活跃操作。关闭请求发出后，等最后一个操作结束才真正关闭资源。关闭是幂等的。已关闭后新写入直接忽略并记警告。

每个会话有独立的`RLock`。锁存在弱值字典里，会话不再使用时锁可以被回收。

身份解析是fail closed的。`_resolve_scope()`检查请求的user_id。和配置的`owner_user_id`不一致就抛`MemoryManagerError`。错误信息明确说明"拒绝在用户之间共享一个凭据"。user_id缺失时用`"default"`兜底。

错误策略：

- 读失败。`read_failure_policy: fail_open`（默认）记警告后返回空。`raise`抛`MemoryReadError`。
- 写失败。`write_failure_policy: log_and_drop`（默认）记错误日志。`raise`抛`MemoryManagerError`。

`read_failures_are_fatal_for_config()`向宿主声明读失败策略。

`_load_official_integration()`做两重版本检查。集成包缺了就报错，要求`langchain-openviking==0.1.0`。SDK缺请求级actor peer支持也报错，要求`openviking-sdk>=0.1.6,<0.2`。

### 3、config.py

这个模块定义OpenViking配置。`OpenVikingConfig`。

- `base_url`。服务地址。默认`http://127.0.0.1:1933`。
- `api_key_env`。存API密钥的环境变量名。默认`OPENVIKING_API_KEY`。密钥本身从环境变量读，不放在配置文件里。
- `owner_user_id`。绑定的DeerFlow所有者。必须非空。
- `default_peer_id`。默认peer。默认`deerflow`。
- `retrieval`子映射。`top_k`、`score_threshold`、`max_injection_chars`、`content_mode`、`injection_query`。
- `failure_policy`子映射。`read`和`write`两套策略。
- `startup_policy`。`fail_fast`或`warn`。
- `max_seen_message_ids`。游标里保留的已见签名上限。默认512。
- `allow_insecure_http`。允许明文HTTP。

校验规则很严格。

有两个"不再支持"的守卫。配了`auth_mode`或`account`会被拒绝。错误信息说明可信模式已不被这个后端支持，要用USER API密钥加`owner_user_id`。配了七个旧的自定义HTTP客户端字段（连接超时、重试、连接池等）也会被拒绝。这些字段已经移交给官方适配器管。

`default_peer_id`有格式守卫。必须匹配`^[a-z0-9][a-z0-9_-]{0,63}$`。不能用保留前缀`df-agent-`开头。原因在session.py里，生成的命名空间是保留的，防止别名碰撞。

明文HTTP只允许三个主机名。`127.0.0.1`、`localhost`、`openviking`。其他主机要用HTTPS，或者显式设`allow_insecure_http=true`。

布尔值读取器`_boolean`接受大小写不敏感的词表。`true`、`1`、`yes`、`on`开启。`false`、`0`、`no`、`off`关闭。其他值报错。拼错一个词不会静默开启明文选项。

数值读取器`_number`把"有键无值"当作未设置。`timeout_seconds:`后面什么都不写，保持默认30秒。`_optional_float`处理`score_threshold`。这里`None`是有意义的价值，表示"不设阈值"，所以保持`None`而不是退回默认。

配置错误在构造时就快速失败。所有范围检查（top_k在1到100、注入字符在256到100000、签名上限在16到10000等）都在`_validate()`里完成。

### 4、session.py

这个模块是稳定的会话身份和转录游标帮助函数。全部是模块级函数。

- `_canonical_peer_id()`。把DeerFlow的大小写不敏感agent名映射到互不重叠的peer ID。agent名清洗成小写。合法、不等于默认peer、不带保留前缀的直接用。否则用SHA-256的32位十六进制哈希加`df-agent-`前缀。注释解释了原因。生成的命名空间是保留的，所以兼容名字、默认peer、哈希回退互相不能别名。128位摘要也避免了清洗或截断agent名造成的碰撞。保留名`__default__`直接报错。
- `_session_id()`。从一个DeerFlow线程派生一个稳定的OpenViking会话。用SHA-256哈希命名空间、所有者、peer、线程ID。会话ID是`df_`加48位哈希。
- `_memory_target_uris()`。返回请求的记忆根URI。两个。自己的`viking://user/memories`和当前peer的`viking://user/peers/{peer}/memories`。
- `_captureable_messages()`。把DeerFlow独有的注入上下文消息丢掉，再交给OpenViking。`hide_from_ui`的消息默认跳过。宿主的`should_keep_hidden_message`钩子说保留就保留。
- `_message_signature()`。哈希消息的稳定语义。包含ID、角色、内容、工具调用、工具状态。不保留转录内容。签名是游标去重的基础。
- `_matching_prefix_count()`。找出已提交的前缀长度。优先用前缀计数加序列摘要验证。验证失败返回`None`（表示前缀不可信，要走集合过滤）。旧格式用滑动窗口在签名列表里找已提交序列。这样压缩之后也能找回前缀。
- `_advanced_cursor()`。推进已确认的捕获进度。保留最近的签名（截到`max_seen`）。前缀计数和摘要一起存。绝不持久化消息内容。

## 三、它和谁协作

### 1、上游

- `deerflow.agents.memory.manager`。契约与工厂。工厂扫描到`MANAGER_CLASS`。
- `MemoryMiddleware`。被动写入时调用`add()`和`add_nowait()`。
- `lead_agent/prompt.py`。调用`get_context()`注入用户记忆。
- `memory_search`工具。调用`search()`。
- 宿主钩子。`should_keep_hidden_message`通过`from_config`注入。

### 2、下游

- OpenViking服务本身。通过官方`langchain-openviking`包对接。底层是`openviking-sdk`。
- 本地文件系统。游标状态存在`{storage_path}/openviking/sessions/`下面。

### 3、可移植性

这个后端遵守可移植性黄金规则。它唯一的`from deerflow`导入是契约那一行。

```python
from deerflow.agents.memory.manager import MemoryManager, MemoryManagerError, MemoryReadError
```

其他一切都从`backend_config`和环境变量来。

### 4、测试

两个测试文件测试它。

- `backend/tests/test_openviking_memory_backend.py`。离线测试。导入`OpenVikingConfig`和`openviking_manager`。
- `backend/tests/blocking_io/test_openviking_memory_backend.py`。阻塞I/O测试。测试文件操作相关的路径。

## 四、重要性评级

评级是3分。

理由如下。

这个包是可选后端。默认后端是DeerMem。不配置`manager_class: openviking`时，这个包完全不参与运行。

它的代码量在五个远程后端里是最大的。四个代码文件。管理器约630行，游标和身份帮助约180行。

它被引用的地方极少。用Grep在全仓库搜`deerflow.agents.memory.backends.openviking`。排除清单文件后，只有两个测试文件引用它。运行时引用靠工厂的文件夹扫描机制，代码里没有别的模块直接导入它。配置示例`config.example.yaml`里有它的参考配置条目。

删除它会怎样。默认配置下什么都不会变。只有显式配置`manager_class: openviking`的部署会启动失败。改回deermem就恢复。

为什么是3分不是更低分。它是五个后端里实现最精细的。游标恢复、部分写入确认、原子替换、会话锁、生命周期排空、哈希防碰撞peer ID，这些设计都有明确的理由。它是"单用户凭据绑定"这个安全模型的完整实现。

为什么不是更高分。它不在核心路径上。不配置就不运行。它依赖外部的OpenViking服务和非默认的依赖包。它服务的是"想用OpenViking存记忆"这个小众需求。
