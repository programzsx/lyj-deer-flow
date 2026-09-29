# BackendAction档案

一、这个类是干什么的

BackendAction是后端动作的数据类。一个受信任的插件包贡献后端动作。动作在网关进程里执行。这个类是frozen dataclass。

二、类的成员

（一）字段

- name：字符串。这个字段是动作的名字。
- handler：异步可调用。这个字段是动作的处理函数。签名是接收参数映射和ActionContext。返回Awaitable。

（二）方法

这个类没有自定义方法。handler字段承载实际行为。

三、它和谁协作

PluginContribution的backend字段是这个类的元组。ActionContext是handler的第二个参数。宿主在调用时构造ActionContext传给handler。

四、重要性评级

评级：4分。

理由：这个类是扩展后端能力的挂载点。只有两个字段。行为在handler里。所以重要性偏低。
