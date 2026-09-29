# deerflow.utils.network 档案

## 一、这个模块是干什么的

这个模块提供"线程安全的端口分配"。

系统里有很多组件需要绑定端口。沙箱。本地服务。测试。

并发环境下两个组件抢同一个端口会冲突。

这个模块提供全局的端口分配器。分配时标记保留。释放时解除。

核心设计是原子性。用一把锁保证"检查可用性加标记保留"是一个原子操作。

## 二、模块里的主要成员

- `PortAllocator`。核心类。

  - `_lock`。threading.Lock。保证分配原子。

  - `_reserved_ports`。保留端口集合。

  - `_is_port_available(port)`。检查端口可绑定。先看保留集合。再做真实的bind测试。bind到`0.0.0.0`而不是localhost。原因是要和Docker的行为完全一致。Docker绑定的是`0.0.0.0:PORT`。只检查`127.0.0.1`会在Docker已经占用通配地址时错误地报告端口可用。

  - `allocate(start_port, max_range)`。从start_port开始找可用端口。找到标记保留并返回。范围内找不到抛RuntimeError。默认范围100。

  - `release(port)`。释放端口。

  - `allocate_context(start_port, max_range)`。上下文管理器版本。退出时自动释放。

- `_global_port_allocator`。全局实例。全应用共享。

- `get_free_port(start_port, max_range)`。全局分配入口。并发调用不会返回同一个端口。

- `release_port(port)`。全局释放入口。

## 三、它和谁协作

它只依赖标准库socket和threading。

它被需要动态端口的组件依赖。沙箱、本地测试服务、provisioner等。

它是全局单例模式。所有调用者共享同一个保留集合。

## 四、重要性评级

评级是3分。

理由如下。

它解决端口冲突这个真实但小众的问题。139行。设计简单正确。

bind到`0.0.0.0`的细节和Docker行为对齐。这个细节防止了假可用报告。

线程安全是它的核心承诺。锁的粒度正确。

扣分原因。它是独立的网络工具。不依赖业务语义。使用频率取决于部署形态。出错影响是端口冲突。不是数据损坏。
