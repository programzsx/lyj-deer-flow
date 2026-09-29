# GuardrailsConfig档案

一、这个类是干什么的

GuardrailsConfig是工具调用前授权的配置类。启用后每个工具调用在执行前都要经过配置的提供者。提供者接收工具名、参数和代理的通行证引用。提供者返回允许或拒绝的决定。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示是否启用护栏中间件。
- fail_closed：布尔值。默认值是True。这个字段表示提供者出错时要不要阻止工具调用。True表示阻止。
- passport：字符串或None。默认值是None。这个字段是OAP通行证路径或托管代理ID。
- provider：GuardrailProviderConfig或None。默认值是None。这个字段是护栏提供者的配置。

（二）方法

这个类没有自定义方法。模块级提供了get_guardrails_config、load_guardrails_config_from_dict、reset_guardrails_config三个函数。这三个函数管理模块级单例。

三、它和谁协作

AppConfig持有这个类。AppConfig的guardrails字段是这个类的实例。配置加载时load_guardrails_config_from_dict写入模块级单例。GuardrailProviderConfig是provider字段的类型。护栏中间件读取单例。

四、重要性评级

评级：7分。

理由：护栏是工具执行的安全闸门。fail_closed决定了安全兜底方向。授权决策直接影响工具能否执行。所以重要性中上。
