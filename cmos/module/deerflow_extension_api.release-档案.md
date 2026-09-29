# deerflow_extension_api.release 档案

## 一、这个模块是干什么的

这个模块解决"行为参数的声明与哈希"。

两次运行"同一个agent"。什么才算同一个。前提是中间件链执行了同样的限额、同样的提示词、同样的阈值。

从外面重建这些信息意味着读私有属性。猜哪些属性影响行为。

这个猜测会静默腐烂。中间件加字段。猜测就错了。

这个模块的办法是。每个中间件自己声明自己的行为参数。

声明就是契约。声明背后的属性随便改。

`canonical_json`也在这里。不在宿主里。

原因是。哈希只有在双方算得完全一样时才可比较。而其中一方是按不同节奏发布的扩展。

## 二、模块里的主要成员

- `ReleasePolicyProvider`。Protocol。`release_policy_parameters()`。返回这个组件的行为参数。值必须可JSON序列化。长文本要哈希而不是内嵌。声明是身份。不是提示词的拷贝。

- `canonical_json(value)`。确定性JSON。键排序。无多余空白。不可序列化的值抛TypeError。不强制转repr。因为repr会让两个结构不同的声明碰撞到同一个地址相关的字符串。

- `canonical_hash(value)`。canonical_json的sha256。

- `_unwrap_release_policy_source(middleware)`。返回拥有行为的对象。不是隔离包装器。扩展贡献会包在隔离包装器里。包装器的动态子类在进程里共享一个类名。描述包装器会把所有贡献的中间件坍缩成一个不可区分的空声明。用`inner`属性鸭子类型。不导入包装器类型。

- `collect_release_policies(middlewares)`。收集组装栈里的每个声明。按类名做键。

  - 声明抛异常的中间件记录成`{"error": "<Type>"}`。不丢弃。组装失败的描述和没话说的组装是两个不同的事实。

  - 同一个类的两个实例得到不同的键。`Name`、`Name#2`。第二个实例不会静默覆盖第一个。栈里合法跑两个相同中间件时。不能丢一个实例的声明。

## 三、它和谁协作

它是本包的独立模块。只依赖标准库hashlib、json、logging。

它被同包的`assembly.py`依赖。assembly描述符的fingerprint用canonical_hash。

宿主的中间件实现ReleasePolicyProvider。声明自己的行为参数。

assembly收集和哈希这些声明。

## 四、重要性评级

评级是4分。

理由如下。

规范哈希是agent可观察性的技术基础。两个哈希可比的前提是双方算法完全一致。这个模块守住一致性。

设计细节很讲究。包装器解包。错误记录而不是丢弃。同名实例去重。

它是assembly模块的地基。assembly的指纹靠它。

扣分原因。它是支撑性的小工具。直接使用场景是扩展可观察性。核心运行路径不依赖它。
