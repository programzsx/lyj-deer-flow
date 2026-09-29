# deerflow.config.paths-档案

## 一、这个模块是干什么的

这个模块是DeerFlow所有文件存放路径的总管。

DeerFlow会在磁盘上写很多东西。

比如用户数据、代理定义、记忆文件、技能目录、线程工作区。

这些文件放在哪、叫什么名字，全部由这个模块统一决定。

这个模块还负责路径安全。

用户ID、线程ID、集成ID都会拼进路径。

不安全的字符可能造成目录穿越攻击。

这个模块先校验再拼路径。

这个模块还处理沙箱的虚拟路径。

沙箱里的代理看到的是`/mnt/user-data`这样的虚拟路径。

这个模块负责把虚拟路径翻译成宿主机真实路径。

## 二、模块里的主要成员

### 1、Paths类

`Paths`是集中路径配置的核心类。

`base_dir`是所有应用数据的根目录。

`base_dir`的解析顺序是构造参数、`DEER_FLOW_HOME`环境变量、项目根下的`.deer-flow`目录。

目录布局是按用户隔离的。

每个用户在`users/{user_id}/`下有自己的目录。

用户目录下有`USER.md`、`agents/`、`skills/`、`threads/`、`memory.json`。

线程目录下有`user-data/`，里面有`workspace/`、`uploads/`、`outputs/`。

`user-data/`会被挂载进沙箱，变成`/mnt/user-data/`。

### 2、路径安全校验

`_validate_user_id()`校验用户ID。

用户ID只允许字母、数字、下划线、连字符。

`_validate_integration_id()`额外拒绝`.`和`..`。

`make_safe_user_id()`把外部身份转成安全ID。

不安全的输入会被替换字符并附加SHA256摘要后缀。

摘要保证两个不同输入不共享存储桶。

`_legacy_safe_user_id()`是旧SHA1摘要的兼容实现。

`prepare_user_dir_for_raw_id()`负责把旧桶目录迁移到新格式。

### 3、虚拟路径与真实路径互转

`resolve_virtual_path()`把沙箱虚拟路径解析成宿主机路径。

解析后再做一次包含性检查。

路径逃出线程根目录会被拒绝。

`thread_dir()`和`host_thread_dir()`分别给出容器内视角和宿主机视角。

### 4、Windows路径兼容

`_join_host_path()`在拼路径时保留原生的路径风格。

Docker Desktop在Windows上要求挂载源保持Windows格式。

用`Path(base) / part`可能把路径改成混合分隔符。

这个辅助函数专门解决这个问题。

### 5、目录生命周期

`ensure_thread_dirs()`创建线程的标准目录。

目录权限是0o777。

原因是沙箱容器可能以不同的UID运行。

`delete_thread_dir()`删除线程的全部数据，操作是幂等的。

### 6、单例

`get_paths()`返回全局唯一的`Paths`实例。

## 三、它和谁协作

`agents_config.py`用`get_paths()`定位代理目录。

IM渠道、网关路由、技能存储、记忆模块都用这个模块。

`runtime_paths.py`提供`runtime_home()`，是这个模块的上游。

这个模块被几乎所有需要落盘的代码引用。

## 四、重要性评级

评级：10分。

理由：所有持久化文件的位置都由这个模块决定。路径穿越防护直接关系安全。这个模块出错会导致数据写到错误位置，或者产生安全漏洞。多用户隔离也依赖这个模块。
