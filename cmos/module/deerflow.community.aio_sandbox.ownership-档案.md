# deerflow.community.aio_sandbox.ownership 档案

## 一、这个模块是干什么的

这个包是AIO沙箱的跨实例所有权租约。

这个包解决的问题是这样的。

多worker部署时多个Gateway实例共享同一个沙箱容器。

两个实例不能同时拥有一个容器。

所有权租约保证同一时刻只有一个实例持有容器。

持有者定期续租。

持有者崩溃后租约过期。

其他实例可以接管。

这是issue #4206引入的。

租约的存储支持两种后端。

后端是memory和redis。

memory后端是进程内字典。

单实例用。

redis后端是共享的Redis存储。

多实例用。

## 二、模块里的主要成员

### 1、导出的成员

`SandboxOwnershipStore`是所有权存储的抽象。

定义租约的发布、认领、续租、释放接口。

`MemoryOwnershipStore`是内存后端实现。

进程内存储。

`OwnershipBackendError`是后端错误类型。

`RenewOutcome`是续租结果的枚举。

续租可能成功、可能发现已被接管。

`compute_lease_ttl`计算租约TTL。

`generate_owner_id`生成owner标识。

`make_sandbox_ownership_store`是工厂函数。

按配置构造存储实例。

`resolve_ownership_config`解析所有权配置。

### 2、Redis的延迟导入

`RedisOwnershipStore`刻意不在这里导入。

redis是可选extra。

这个包被`aio_sandbox_provider`在构造时导入。

急切导入会让每个AIO沙箱安装都耦合redis包。

即使所有权只用了memory。

redis只在配置`ownership.type == "redis"`时延迟导入。

导入发生在工厂函数内部。

## 三、它和谁协作

### 1、它依赖谁

它依赖包内的base、factory、memory子模块。

redis后端依赖可选的redis包。

### 2、谁调用它

`aio_sandbox_provider`在构造时导入这个包。

提供者按`sandbox.ownership`配置构造存储。

提供者在获取、续租、释放沙箱时调所有权存储。

多worker部署靠租约避免两个实例同时操作一个容器。

## 四、重要性评级

### 1、评级

5分。

### 2、理由

这个包解决的是多worker沙箱共享的所有权问题。

单实例部署不需要它。

memory后端就够了。

多worker部署必须用它。

没有租约。

两个实例会同时操作同一个容器。

一个实例的销毁会打断另一个实例的工作。

它的设计要点是redis延迟导入。

可选依赖不污染默认安装。

这个决定让每个AIO用户不必装redis。

它是AIO沙箱的支撑件。

只在多worker形态下被真正用到。

影响面中等。

所以评5分。
