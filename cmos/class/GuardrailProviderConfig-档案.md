# GuardrailProviderConfig档案

一、这个类是干什么的

GuardrailProviderConfig是护栏提供者的配置类。护栏指工具调用前的授权。这个类描述一个提供者。提供者用类的导入路径表示。这个类还携带提供者私有的设置。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- use：字符串。必填。这个字段是提供者的类路径。例如deerflow.guardrails.builtin:AllowlistProvider。
- config：字典。默认值是空字典。这个字段是提供者私有的设置。这些设置以关键字参数传给提供者。

（二）方法

这个类没有自定义方法。这个类只有两个字段。

三、它和谁协作

GuardrailsConfig持有这个类。GuardrailsConfig的provider字段的类型是这个类。护栏中间件用use字段加载提供者。提供者接收工具名、参数和代理通行证。提供者返回允许或拒绝的决定。

四、重要性评级

评级：5分。

理由：这个类是护栏机制的挂载点。护栏默认关闭。但开启后提供者是授权决策的大脑。所以重要性中等。
