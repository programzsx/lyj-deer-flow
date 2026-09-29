# finite_float-档案

## 一、这个类是干什么的

finite_float不是类。

finite_float是typesafe/validation.py里的一个模块级函数。

这个函数把配置值验证成有限浮点数。

验证失败时抛ValueError。

错误消息点名出问题的字段。

这个函数存在的目的明确。

坏配置要在提供者构造时失败。

坏配置不要等到第一次工具调用或第一次memory写入才失败。

这个函数位于backend/packages/harness/deerflow/typesafe/validation.py。

## 二、类的成员（字段、方法，各自做什么）

这个函数的签名是finite_float(name, value, *, minimum=None, maximum=None, exclusive=False)。

- name是字段名。错误消息里点名这个字段。
- value是要验证的值。
- minimum是允许的最小值。
- maximum是允许的最大值。
- exclusive为True时minimum是开区间下界。

验证规则如下。

- bool被拒绝。Python的bool是int的子类。YAML很容易把true当成数字。所以bool必须显式拒绝。
- 非数字类型被拒绝。
- NaN和Infinity被拒绝。JSON字面量可以产生NaN。非有限的数参与比较会产生错误决定。
- 越界值被拒绝。

这个模块还提供几个配套函数。

### 1、whole_number函数

这个函数验证整数。

同样拒绝bool和非整数。

检查最小值。

### 2、defaulted_text函数

这个函数在配置存在时返回配置值。

配置为None时返回回退值。

空白文本是配置错误。

### 3、credential_text函数

这个函数验证凭证能作为header值发送。

拒绝首尾空白。

拒绝非打印字符。

拒绝的原因如下。

带空白的密钥能通过旧的非空检查。

然后漏到h11。

h11的LocalProtocolError消息携带整个Bearer头。

Middleware的logger.exception会打印完整cause链。

密钥就泄漏了。

在构造时拒绝把这个泄漏变成构造错误。

内部空格允许。

内部空格在header值里合法且不泄漏。

错误消息绝不回显值本身。

### 4、criteria_entry函数

这个函数在criteria映射里查找条目。

YAML的criteria块把true和false解析成布尔键。

JSON配置里它们保持字符串"true"和"false"。

这个函数两种拼法都查。

## 三、它和谁协作

- TypeSafeClient和TypeSafeConnection在构造时调用这些验证函数。
- TypeSafeGuardrailProvider用finite_float验证threshold，用whole_number验证max_state_chars。
- credential_text被resolve_connection调用。

## 四、重要性评级

评级是6分。

理由如下。

这组验证函数是坏配置的第一道闸。

它们把bool当数字、NaN、凭证泄漏这些YAML和JSON易犯的错误挡在构造时。

credential_text直接防止密钥进日志。

这些都是真实的边界细节。

但每个函数都很短。

逻辑简单。

扣掉4分。
