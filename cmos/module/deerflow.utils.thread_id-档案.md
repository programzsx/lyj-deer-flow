# deerflow.utils.thread_id 档案

## 一、这个模块是干什么的

这个模块做"线程标识符的规范验证"。

DeerFlow的所有数据按线程隔离。对话历史。文件。沙箱目录。

线程id是调用者定义的不透明标识符。不一定是UUID。

但线程id必须对每个持久化和文件系统后端都安全。

这个模块定义id的格式。提供验证和生成。

## 二、模块里的主要成员

- `THREAD_ID_PATTERN`。正则模式字符串。`^[A-Za-z0-9_-]{1,64}$`。1到64个ASCII字母、数字、连字符、下划线。

- `validate_thread_id(thread_id)`。验证线程id。不合法抛ValueError。错误信息说明期望的格式。

- `resolve_thread_id(thread_id)`。验证提供的id。id为None时生成一个UUID。

- `ThreadId`。Pydantic注解类型。StringConstraints加AfterValidator。字符串约束限长度和模式。验证器做完整验证。API层直接用这个注解。请求进来就验证。

## 三、它和谁协作

它依赖标准库re和uuid。依赖pydantic。

它被所有接受thread_id的API和持久化层依赖。

线程id出现在文件路径里。出现在数据库主键里。出现在沙箱目录名里。格式约束保证了这些用途都安全。

## 四、重要性评级

评级是4分。

理由如下。

线程id是隔离的根基。id里混进路径分隔符或特殊字符。文件隔离就破了。

格式约束集中一处。API层、持久化层、文件层共享同一个定义。

Pydantic注解让验证在请求边界自动发生。

扣分原因。它只有37行。一个正则加两个函数。逻辑简单。但它守住的隔离边界很重要。分数给到中游偏下。
