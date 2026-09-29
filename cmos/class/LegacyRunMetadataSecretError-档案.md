# LegacyRunMetadataSecretError档案

源码位置：`backend/packages/harness/deerflow/runtime/secret_context.py`

## 一、这个类是干什么的

这个类是一个异常类。

这个类继承`ValueError`。

这个类表示"运行把请求凭据放进了持久化元数据"。

背景是issue #3861。

历史上有的调用方把凭据放在run的metadata里。

metadata会持久化。

凭据会落库。

这是安全问题。

现在凭据有专门的通道。

调用方在`config.context.secrets`里传请求级凭据。

凭据不进prompt、不进工具参数、不进命令字符串。

只在技能的沙箱子进程里注入环境变量。

运行准入时会检查metadata。

`validate_run_metadata_secrets`看到metadata里有`auth_token`这个旧键。

就抛出这个异常。

错误消息告诉调用方。

`auth_token`不允许了。

请改用`config.context.secrets`传凭据。

这个异常把旧写法显式拒绝。

而不是静默忽略。

## 二、类的成员

### （一）字段

这个类没有自己的字段。

它继承`ValueError`的全部行为。

异常消息通过标准的`args`传递。

### （二）方法

这个类没有自己的方法。

它只是继承异常类的行为。

定义这个类的意义在于类型本身。

调用方可以精确捕获这一种失败。

## 三、它和谁协作

这个类和`validate_run_metadata_secrets`协作。

校验函数在run准入时看到旧的`auth_token`键。

抛出这个异常。

这个类和run准入流程协作。

Gateway的run准入调用校验函数。

异常向上传播。

请求被拒绝。

这个类和新的凭据通道协作。

错误消息指引用户改用`config.context.secrets`。

`extract_request_secrets`是新通道的读取函数。

## 四、重要性评级

评级：2分（满分10分）。

理由：

- 这个类是异常类。
- 没有任何逻辑。
- 异常类评2到3分。
- 它承载的语义是安全防护。
- 旧写法会把凭据持久化落库。
- 这个异常把不安全的写法显式拒绝。
- 防止凭据泄漏。
- 但异常类本身代码量几乎为零。
- 真正的校验逻辑在`validate_run_metadata_secrets`里。
- 评2分。
