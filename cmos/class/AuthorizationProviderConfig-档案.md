# AuthorizationProviderConfig档案

一、这个类是干什么的

AuthorizationProviderConfig是授权提供者的配置类。细粒度资源授权指资源级的权限控制。这个类描述一个授权提供者。提供者用类的导入路径表示。这个类还携带提供者私有的设置。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- use：字符串。必填。这个字段是提供者的类路径。例如deerflow.authz.rbac:RbacAuthorizationProvider。
- config：字典。默认值是空字典。这个字段是提供者私有的设置。以关键字参数传给提供者。

（二）方法

这个类没有自定义方法。这个类只有两个字段。

三、它和谁协作

AuthorizationConfig持有这个类。AuthorizationConfig的provider字段的类型是这个类。授权提供者是策略大脑。提供者在两层强制执行。装配时的能力过滤。运行时的执行拒绝。

四、重要性评级

评级：5分。

理由：这个类是授权机制的挂载点。授权默认关闭。但开启后提供者是策略大脑。所以重要性中等。
