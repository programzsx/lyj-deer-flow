# _AnchorTable档案

源码位置：backend/packages/harness/deerflow/extensions/stack.py

## 一、这个类是干什么的

_AnchorTable是一个延迟加载的锚点表。

_AnchorTable继承dict。它装着语义位置到锚点链的映射。五个语义位置各有自己的锚点。

_AnchorTable延迟加载的原因有两个。

第一。导入这个模块要保持轻量。

第二。锚点表需要导入middleware类。middleware类导入会形成循环。extensions目录不能在模块级导入agents.middlewares。middleware层会调用extensions层。模块级引用会把依赖指反。所以解析推迟到首次使用。首次使用发生在assert_ordering和组合时。那时已经在middleware builder里了。

延迟解析用懒加载实现。_ensure方法在首次访问时填充表。__getitem__、get、__iter__、__len__都触发_ensure。

snapshot方法返回一个已填充的普通dict副本。原因是CPython的dict(subclass)快路径会直接复制底层存储。快路径绕过这个类的懒加载hook。需要副本的调用方必须显式强制解析。

## 二、类的成员

（一）类字段

- _loaded：是否已加载。类级标志。

（二）方法

- _ensure：首次访问时填充表。
- __getitem__：取锚点。先确保已加载。
- get：取锚点带默认值。先确保已加载。
- __iter__：迭代。先确保已加载。
- __len__：长度。先确保已加载。
- snapshot：返回已填充的普通dict副本。

## 三、它和谁协作

（一）内容来源

stack.py的_anchors函数填充表。_anchors从agents.middlewares导入四个middleware类。

（二）使用者

stack.py的_placement_anchors_for_scope消费这个表。subagent scope下会调整MODEL_PHYSICAL锚点。PLACEMENT_ANCHORS是模块级单例。

## 四、重要性评级

评级：3分。

理由：_AnchorTable解决的是依赖方向的延迟加载问题。它避免extensions目录在模块级导入agents.middlewares。它是中间件注入系统的基础设施。但它是内部实现类。给3分。
