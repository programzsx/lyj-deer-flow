# AllowlistProvider-档案

## 一、这个类是干什么的

这个类是最简单的内置门禁提供者。

这个类按名单决定工具能否执行。

名单有两种。

一种是允许名单allowed_tools。

一种是拒绝名单denied_tools。

工具在拒绝名单里就拒绝。

允许名单配置了而工具不在名单里也拒绝。

其余情况放行。

这个类没有任何外部依赖。

这个类随DeerFlow一起发布。

这个类位于backend/packages/harness/deerflow/guardrails/builtin.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、类属性

- name的值是"allowlist"。
- policy_id的值是"deerflow.guardrails.allowlist"。
- policy_version的值是"1.0.0"。

### 2、构造方法

构造方法接受两个关键字参数。

- allowed_tools是允许名单。默认值是None。
- denied_tools是拒绝名单。默认值是None。

这里有一个关键设计。

None和空列表含义不同。

None表示没有配置允许名单，放行所有工具。

空列表表示配置了空名单，拒绝所有工具。

代码特意用`is not None`判断。

代码注释明确说明。

如果用真值测试会把空列表折叠成None。

折叠的结果是本该全拒绝的配置变成全放行。

这是一个fail-open安全漏洞。

所以这里必须区分。

### 3、evaluate方法

evaluate(request)是同步评估方法。

评估顺序如下。

第一步，检查允许名单。

如果允许名单不是None而工具不在名单里，返回拒绝决定，原因代码是"oap.tool_not_allowed"。

第二步，检查拒绝名单。

如果工具在拒绝名单里，返回拒绝决定，原因代码同样是"oap.tool_not_allowed"。

第三步，其余情况返回允许决定，原因代码是"oap.allowed"。

### 4、aevaluate方法

aevaluate(request)是异步评估方法。

这个方法直接调用同步的evaluate。

因为这个类不做网络请求。

评估没有真正的异步开销。

### 5、release_policy_parameters方法

这个方法返回策略参数字典。

字典里有排序后的allowed_tools和denied_tools。

这个字典用于装配身份指纹。

## 三、它和谁协作

- GuardrailProvider是它实现的协议。
- GuardrailMiddleware调用它的evaluate和aevaluate。
- GuardrailsConfig负责选择它作为门禁提供者。

## 四、重要性评级

评级是6分。

理由如下。

这个类是内置的默认门禁实现。

它零依赖，开箱可用。

它的None与空列表区分是一个真实的安全细节。

名单是许多部署最常用的门禁形式。

但它的逻辑很简单。

就是两次集合成员判断。

扣掉4分。
