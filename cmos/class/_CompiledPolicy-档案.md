# _CompiledPolicy-档案

# 一、这个类是干什么的

_CompiledPolicy定义在`backend/packages/harness/deerflow/authz/rbac.py`。

这个类以单下划线开头。单下划线开头表示这是内部辅助类。

这个类是内部实现细节。外部代码不应该直接使用这个类。

模块docstring说明这个文件是内置RBAC授权提供者。

这个文件从配置读取角色到资源的策略。这个文件在构造时把策略编译成不可变结构。

_CompiledPolicy就是那个"编译产物"。

这个类表示单个（角色，资源类型）组合的、已预校验的策略。

RBAC配置在构造时被一次性校验和编译。

编译产物就是一批_CompiledPolicy对象。

之后每次授权检查直接查编译产物。之后不再重复校验配置。

这样做的好处是检查路径快。

这样做的好处还有坏配置在启动时就暴露。

这个类还实现了"拒绝优先"语义。

拒绝永远赢过允许。一个目标在拒绝列表里就一定不允许。无论允许列表怎么写。

# 二、类的成员（字段、方法，各自做什么）

## （一）字段

- `allowed`：允许集合。类型是`frozenset[str] | object`。这里有一种特殊取值。`allowed`可以是哨兵`_ALL`。`_ALL`表示"允许所有候选"。普通情况是字符串的不可变集合。这个类用`__slots__`限制属性。
- `denied`：拒绝集合。类型是`frozenset[str]`。这是字符串的不可变集合。在这个集合里的目标一定被拒绝。

## （二）方法

- `__init__(*, allowed, denied)`：构造方法。输入是允许集合和拒绝集合。输出是实例。两个集合都要求是不可变集合。
- `is_allowed(target: str) -> bool`：判断单个目标是否允许。输入是目标字符串。输出是布尔值。判断顺序是固定的。第一步先查拒绝集合。目标在拒绝集合里就返回`False`。第二步检查`allowed`是不是`_ALL`哨兵。是`_ALL`就返回`True`。第三步查目标是否在允许集合里。在就允许。不在就拒绝。

`is_allowed`的逻辑体现了"拒绝优先"。

拒绝检查在最前面。

拒绝优先是安全设计的惯例。

# 三、它和谁协作

这个类是RBAC提供者的内部构建块。

协作关系如下。

`RbacAuthorizationProvider`在构造时创建_CompiledPolicy。构造函数遍历配置。每个（角色，资源）组合编译成一个_CompiledPolicy。编译产物存在`self._policies`字典里。字典的键是`（role_name, resource_key）`元组。

`RbacAuthorizationProvider._compile_resource_policy`负责编译。这个静态方法校验`allow`和`deny`配置。校验通过后返回一个_CompiledPolicy。

`RbacAuthorizationProvider.authorize`调用_CompiledPolicy的`is_allowed`。授权检查时先查出策略。查出策略后调用`is_allowed`做最终判断。

`RbacAuthorizationProvider.filter_resources`也调用`is_allowed`。批量过滤逐个候选调用`is_allowed`。

组合关系上，_CompiledPolicy被RbacAuthorizationProvider持有和使用。

_CompiledPolicy自身不依赖任何其他类。这个类只用到了模块级的`_ALL`哨兵。

# 四、重要性评级（1-10分+理由）

评级：6分。

理由如下。

这个类是RBAC判断逻辑的最小单元。

RBAC的核心判断就是`is_allowed`这一个方法。

没有它，RBAC提供者每次检查都要重新解析配置。

没有它，"拒绝优先"语义没有落点。

它让配置校验和运行时判断分离。构造时校验一次。运行时快速查询。

但是这个类是内部辅助类。

外部代码不直接使用它。

删掉它，RBAC提供者会失去编译产物结构。RBAC提供者要重构才能工作。

依赖它的只有`RbacAuthorizationProvider`一个类。

使用面窄。但是它是判断语义的承载者。判断语义是安全核心。

综合来看给6分。

地位重要但范围小。范围小所以不到更高分。语义核心所以不能更低。
