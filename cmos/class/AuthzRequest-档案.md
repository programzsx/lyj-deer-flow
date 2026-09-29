# AuthzRequest-档案

# 一、这个类是干什么的

AuthzRequest定义在`backend/packages/harness/deerflow/authz/provider.py`。

这个类表示"一次授权检查请求"。

授权系统要回答一个问题。

这个问题是"这个操作者能不能对某个资源做某个动作"。

AuthzRequest把这个问题装在一个数据对象里。

模块docstring说明授权提供者在每次授权检查时收到这个上下文。

这个类是授权提供者`authorize`方法的输入。

提供者读这个对象。提供者根据里面的信息给出判断。

这个类是一个dataclass。这个类只装数据。这个类不做判断。

docstring还说明了一个设计决策。

`resource`、`action`、`target`是自由字符串。这三个字段不是枚举。

用自由字符串是为了扩展性。

新增资源类型不需要改协议。

新的提供者可以定义自己的解释方式。

内置RBAC提供者负责解释这些字符串。

# 二、类的成员（字段、方法，各自做什么）

## （一）字段

- `principal`：操作者身份。类型是`Principal`。没有默认值。授权检查必须知道"谁在请求"。
- `resource`：资源类型。类型是`str`。例如`"tool"`、`"model"`、`"skill"`、`"sandbox"`、`"mcp_server"`、`"route"`。
- `action`：对资源的动作。类型是`str`。例如`"call"`、`"list"`、`"use"`、`"activate"`、`"execute"`、`"read"`、`"write"`。
- `target`：资源标识符。类型是`str`。例如工具名、模型名、技能名、`"route:threads:read"`。
- `context`：附加上下文字典。类型是`dict[str, Any]`，默认空字典。这里放`thread_id`、`run_id`、`tool_call_id`、`tool_input`、`is_subagent`等信息。

## （二）方法

这个类没有定义任何方法。

这个类是纯数据类。判断逻辑在提供者里。

# 三、它和谁协作

AuthzRequest是授权判断流程的"问题载体"。

协作关系如下。

`GuardrailAuthorizationAdapter`构建AuthzRequest。适配器把GuardrailRequest的字段映射成AuthzRequest的字段。

`RbacAuthorizationProvider.authorize`接收AuthzRequest。RBAC提供者读取里面的`principal`、`resource`、`target`做判断。

`enforce_plugin_action`等插件授权函数构建AuthzRequest。这些函数把单点检查请求交给提供者。

`AuthorizationProvider`协议的`authorize`和`aauthorize`方法以AuthzRequest为参数。

组合关系上，AuthzRequest持有一个Principal实例。

AuthzRequest自身只依赖Principal。AuthzRequest是被消费的一方。

# 四、重要性评级（1-10分+理由）

评级：7分。

理由如下。

这个类是授权协议的核心输入结构。

没有AuthzRequest，`AuthorizationProvider`协议无法定义授权接口。

所有授权判断都以这个对象为起点。

这个类的设计决定了授权系统的扩展方式。自由字符串字段让新资源类型无需改协议。

删掉它，授权协议就要重新设计。

依赖它的地方包括：RBAC提供者、守卫适配器、插件授权函数、自定义提供者。

评级不是满分，因为这个类只是数据结构。这个类不承载任何决策逻辑。协议真正的核心是`AuthorizationProvider`。所以给7分。
