# _Redactor档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/pii_redaction_middleware.py`

## 一、这个类是干什么的

_Redactor负责对一段文本执行整套PII脱敏。

它按固定顺序应用所有激活的检测器。
每个检测器扫一遍文本。
命中的内容被替换成占位符。

占位符是从原始值推导出来的。
推导用的是部署级密钥加HMAC。
128位摘要再映射成字母。

占位符是纯函数的结果。
同一个原始值永远得到同一个占位符。
所以同一个身份在不同轮次、压缩之后、入队之后都保持稳定。
而且不存任何映射表。
占位符无法离线反推回原文。

_Redactor是无状态的。可以放心共享。

## 二、类的成员

### （一）字段

- `detectors`：激活的检测器序列。
- `token_key`：占位符派生用的密钥。

### （二）方法

- `redact`：对一段文本执行全部检测和替换，返回脱敏后的文本。
- `_replacer`：为某个检测器生成替换函数。

## 三、它和谁协作

- PiiRedactionMiddleware的`_redact_tool_message`和用户消息脱敏路径创建并使用它。
- 它消费_Detector序列。
- 一个_Redactor实例覆盖一次结果的全部ToolMessage，保证占位符编号连续。

## 四、重要性评级

评级：6/10。

理由：_Redactor是脱敏的执行核心。占位符的确定性设计直接影响跨轮次身份稳定性和防反推能力。它的逻辑清晰且自成一体。但它只是中间件的一个执行件。所以给6分。