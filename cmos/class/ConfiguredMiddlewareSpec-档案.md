# ConfiguredMiddlewareSpec档案

一、这个类是干什么的

ConfiguredMiddlewareSpec是配置声明的AgentMiddleware规格类。这个类描述一个中间件类加可选的构造参数。中间件用类路径表示。这个类继承自pydantic的BaseModel。extra为forbid。

二、类的成员

（一）字段

- class_path：字符串。必填。别名是class。最小长度1。这个字段是AgentMiddleware的类路径。格式是module.path:ClassName。
- kwargs：字典。默认值是空字典。这个字段是传给中间件构造函数的关键字参数。值必须是JSON类型。YAML日期和时间戳会被转成ISO字符串。

（二）方法

- _strip_class_path：字段校验器。这个方法去掉类路径的空白。空白类路径报错。
- _kwargs_none_is_empty：字段校验器。这个方法把None的kwargs变成空字典。
- _kwargs_are_json_object：字段校验器。这个方法用_coerce_json_kwargs_value转换kwargs值。再做json.dumps验证。

三、它和谁协作

ExtensionsConfig持有这个类。ExtensionsConfig的middlewares字段接受字符串或这个类的实例。扩展加载器用class_path加载中间件。kwargs传给构造函数。

四、重要性评级

评级：5分。

理由：这个类是配置声明中间件的唯一入口。kwargs的JSON校验防止不可序列化的值进入配置。所以重要性中等。
