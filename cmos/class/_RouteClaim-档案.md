# _RouteClaim档案

源码位置：backend/packages/harness/deerflow/extensions/gateway.py

## 一、这个类是干什么的

_RouteClaim是一条路由声明。

扩展可以贡献HTTP路由。贡献的路由要在Gateway挂载。挂载前要做冲突预检。预检系统把每条路由（宿主的路由和扩展的路由）都投影成一条_RouteClaim。冲突检测在_RouteClaim之间做。

_RouteClaim是不可变的。类声明用了frozen=True。

路由预检的规则是这样的。扩展路由在所有宿主路由之后挂载。宿主handler总是赢。Gateway在宿主路由或扩展路由已覆盖某条贡献路由的同方法路径时，原子地拒绝那条贡献路由。

预检的匹配器是保守的。匹配器证明常见遮蔽的方式有这些。规范化参数名。静态与动态匹配。已知内置转换器的包含关系。支持的复合段。全段path兜底。可归约为同样规则的Mount后代。需要一般正则语言包含关系的情况允许而不是猜测。

任何预检、冲突或包含失败都会回滚整个路由器。回滚不阻止后续路由器挂载。

## 二、类的成员

（一）字段

- path：路由路径。
- matcher：路由的路径匹配模式。由路径正则投影而来。
- methods：HTTP方法集合。
- scopes：作用域集合。websocket或http。Mount两者都有。
- mount_prefix：Mount前缀。默认None。
- standard_convertors：是否全部使用标准转换器。默认True。非标准转换器在保留的安全路径上fail closed。

## 三、它和谁协作

（一）产生者

gateway.py的_route_claim函数产生_RouteClaim。_route_claim从路由对象投影。recompile参数控制是否重新编译路径。

（二）消费者

冲突检测函数消费_RouteClaim。_matcher_covers判断所有者是否覆盖候选。_find_route_clash查找冲突。include_contributed_routers用这些结果决定挂载还是拒绝。

## 四、重要性评级

评级：4分。

理由：_RouteClaim是扩展路由冲突预检的基本单元。预检防止扩展路由遮蔽宿主路由，尤其是认证豁免和CSRF豁免的安全路径。这是安全边界的一部分。但它只是六字段数据类。检测逻辑在外部函数里。给4分。
