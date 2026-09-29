# deerflow.runtime.user_context 档案

## 一、这个模块是干什么的

这个模块管理"当前用户是谁"。

DeerFlow的所有用户数据都按用户隔离。文件按用户分桶。数据库按用户过滤。内存按用户存。

那么运行中的代码怎么知道当前用户是谁。

答案是这个模块。

它持有一个ContextVar。网关的认证中间件在认证成功后设置它。仓库方法读它。

它还提供多个解析函数。处理各种边界情况。

核心价值是一句话。

用户身份是授权和隔离的基础。解析身份的顺序必须集中在一处。

## 二、模块里的主要成员

### ContextVar层

- `CurrentUser`。Protocol。任何有`.id: str`属性的对象都满足。定义在这里。persistence层就不用导入具体的User类。

- `set_current_user(user)`和`reset_current_user(token)`。设置和恢复当前用户。返回token供finally块恢复。

- `get_current_user()`。拿当前用户。可以返回None。

- `require_current_user()`。拿当前用户。没有就抛RuntimeError。仓库代码用这个。

### 文件系统隔离层

- `DEFAULT_USER_ID`。值为`default`。未认证时的兜底桶。

- `get_effective_user_id()`。拿当前用户的id字符串。没有就返回default。专为文件路径解析设计。永不抛错。

### 运行配置解析层

- `resolve_config_user_id(config)`。从LangGraph或Gateway的运行配置解析生效用户。优先级是服务端拥有的LangGraph认证字段。然后是运行时context。然后是configurable。最后是ContextVar兜底。

- `resolve_runtime_user_id(runtime)`。工具和中间件拿生效user_id的"单一事实来源"。优先级五层。server_info里的认证用户。LangGraph认证字段。runtime.context的user_id。ContextVar。default兜底。持久化用户状态的工具必须调这个。不能直接调get_effective_user_id。

### 仓库哨兵层

- `AUTO`。单例哨兵。意思是"从contextvar解析"。

- `resolve_user_id(value)`。三态语义。AUTO时从contextvar读。没有用户就报错。显式字符串直接用。显式None表示不加WHERE子句。留给迁移脚本和管理CLI。id会在边界强制转字符串。因为API层User.id可能是UUID。数据库存的是VARCHAR。

## 三、它和谁协作

它被`deerflow.persistence`整个层依赖。仓库方法的user_id参数默认走AUTO。

它被`app.gateway.auth`写。认证中间件设置ContextVar。

它被`utils/file_io.py`、`utils/oneshot_llm.py`依赖。文件路径和LLM调用要用户id。

它被运行时的工具和中间件依赖。通过resolve_runtime_user_id拿身份。

它依赖`config/paths.py`的make_safe_user_id做存储安全id转换。

## 四、重要性评级

评级是8分。

理由如下。

用户隔离是这个系统多租户能力的根基。身份解析错一次。数据就串了。

解析优先级的设计很讲究。服务端拥有的认证字段压过客户端可伪造的字段。这个顺序防止了身份伪造。

三态哨兵语义解决了仓库层的经典难题。AUTO、显式、绕过。三种意图都有明确表达。

它是身份解析的单一事实来源。分散解析会漂移。AGENTS.md也明确要求持久化工具必须调它。

扣2分是因为它是基础设施。业务行为不在这里。
