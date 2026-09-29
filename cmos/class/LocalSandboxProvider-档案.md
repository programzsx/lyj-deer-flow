# LocalSandboxProvider-档案

## 一、这个类是干什么的

LocalSandboxProvider是sandbox/local/local_sandbox_provider.py里的类。

它继承SandboxProvider。

它是本地文件系统沙箱的提供者。

带按线程的路径作用域。

早期版本返回单个进程级LocalSandbox。

id是字面量"local"。

那个单例无法兑现/mnt/user-data/...契约。

因为对应宿主目录是按线程的。

现在它为每个thread_id产一个新LocalSandbox。

path_mappings包含/mnt/user-data/{workspace,uploads,outputs}和/mnt/acp-workspace的线程级条目。

镜像AioSandboxProvider的bind-mount方式。

uses_thread_data_mounts为True。

这个类位于backend/packages/harness/deerflow/sandbox/local/local_sandbox_provider.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、缓存结构

_thread_sandboxes是LRU缓存。上限默认256。

超出上限时最久未使用的条目被淘汰。

淘汰线程的下次acquire重建沙箱。

只丢失_agent_written_paths反向解析提示。

read_file优雅降级为不反向解析。

_generic_sandbox是legacy单例。

_singleton是模块级别名。兼容旧调用方。

所有缓存变更通过provider级threading.Lock串行。

### 2、supports_agent_skill_isolation

它返回host bash是否禁用。

/mnt/skills投影是逻辑边界。不是宿主文件系统安全边界。

host bash启用时子进程可以不经过PathMapping访问宿主路径。

所以只在host bash禁用时宣称技能隔离。

config读失败时返回False。

避免把宿主进程provider意外变成隔离边界。

### 3、_setup_path_mappings方法

构建静态映射。所有线程共享。

包括public skills目录和config.yaml的自定义挂载。

legacy挂载不放这里。

legacy只对没有per-user自定义技能的用户暴露。

否则用户能读到listing层说不存在的内容。这对应PR#3889。

custom挂载也不放这里。

custom是per-user的。

静态挂载在init时绑定get_effective_user_id是错的。

后续用户的/mnt/skills/custom会解析到init时用户的目录。

保留容器前缀检查拒绝冲突的自定义挂载。

宿主路径不存在时升级到ERROR并给可操作指导。这对应#3244。

Docker部署下路径必须bind-mount进gateway容器。

### 4、_build_thread_path_mappings方法

构建per-thread映射。

包括/mnt/user-data聚合父映射、workspace、uploads、outputs、acp-workspace。

聚合父映射让ls /mnt/user-data和AIO里行为一致。

skills分类挂载在知道user_id后动态构建。

有线程投影根时映射整个skills根。

否则映射public、custom、legacy、integrations四个分类。

全部只读。

### 5、_without_managed_skill_mappings方法

丢弃会和选中托管技能视图重叠的映射。

policy-scoped沙箱先移除整个子树再装一致的根映射。

嵌套自定义挂载不能绕过Agent allowlist。

普通沙箱保留其他操作员挂载。向后兼容。

### 6、acquire方法

thread_id为None时返回legacy单例。

否则返回按线程的沙箱id。格式local:{user_id}:{thread_id}。

每次acquire都做skills projection自愈。

包括缓存命中。

manifest新鲜时约3-4ms。

其他worker改过技能时触发完全重建。约400ms。

映射变化时替换沙箱。

迁移旧的_agent_written_paths。

缓存检查加插入被锁保护。

两个调用者竞争同一线程总看到同一实例。

### 7、get和release和reset

get按sandbox_id查回实例。get提升LRU顺序。

活动线程在负载下不被淘汰。

release是no-op。

保留缓存实例让_agent_written_paths跨轮存活。

reset丢弃全部缓存。配置变更后生效。

## 三、它和谁协作

- SandboxProvider是基类契约。
- LocalSandbox是它创建的实例。
- skills/projection提供技能投影路径。
- SandboxMiddleware有意不调release。允许多轮复用。
- AioSandboxProvider是docker模式的对应实现。

## 四、重要性评级

评级是8分。

理由如下。

这个类是本地模式下所有沙箱的来源。

它把按线程目录挂载成容器路径。

兑现/mnt/user-data契约。

它处理用户级技能隔离。

legacy挂载的暴露边界正确。

policy-scoped沙箱防止嵌套挂载绕过allowlist。

LRU缓存和锁处理并发。

skills projection自愈处理漂移。

这些是本地执行正确性的关键。

扣掉2分。

扣分原因是它做的是装配和缓存。

执行逻辑在LocalSandbox。
