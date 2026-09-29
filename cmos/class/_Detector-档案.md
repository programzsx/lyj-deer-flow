# _Detector档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/pii_redaction_middleware.py`

## 一、这个类是干什么的

_Detector是一个PII检测器定义。

PII脱敏中间件要在文本里找个人身份信息。
每种身份信息有自己的识别方式。
_Detector把一种识别方式打包成一个对象。

识别由两部分组成。

第一部分是正则模式。模式负责找到候选文本。

第二部分是可选的校验器。有些号码格式自带校验位。比如信用卡号用Luhn算法。中国居民身份证和巴西CPF用模11校验。校验器负责确认候选是真的号码。这样能大幅减少误报。

## 二、类的成员

### （一）字段

- `name`：检测器名字。
- `pattern`：编译好的正则表达式。
- `validator`：可选的校验函数，输入候选字符串，返回是否通过。

### （二）方法

_Detector没有定义自己的方法。
它是一个纯数据定义。

## 三、它和谁协作

- PiiRedactionMiddleware构造一组_Detector。
- _Redactor按固定顺序应用这些检测器。

## 四、重要性评级

评级：3/10。

理由：_Detector是检测规则的数据载体。识别逻辑分散在模式和校验函数里。它自身没有行为。但它是脱敏能力的最小单元。所以给偏低的分数。