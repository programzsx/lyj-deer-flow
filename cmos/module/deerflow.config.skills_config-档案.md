# deerflow.config.skills_config-档案

## 一、这个模块是干什么的

这个模块管理技能系统的配置。

技能是可复用的能力包。

每个技能是一个目录，里面有技能文件。

这个模块决定技能存放在哪。

决定技能在沙箱容器里挂载到哪。

决定技能是否延迟发现。

延迟发现时技能详情不进系统提示，模型按需查询。

## 二、模块里的主要成员

### 1、SkillsConfig类

`use`是技能存储实现的类路径。

默认是本地文件存储。

`path`是技能目录。

不设置时用项目根下的`skills`目录。

`container_path`是技能在沙箱容器里的挂载路径。

这个字段是启动专用的。

原因是沙箱提供者在启动时捕获挂载根。

`deferred_discovery`决定是否延迟发现。

开启后系统提示里只有技能名索引。

模型通过describe_skill工具按需查详情。

### 2、get_skills_path()

解析技能目录路径。

解析顺序是显式path字段、`DEER_FLOW_SKILLS_PATH`环境变量、项目根默认、遗留仓库根候选。

前三四名都不存在时返回项目根默认。

这样调用方总能拿到一个稳定的"无技能"位置，不会报错。

### 3、遗留位置兼容

`_legacy_skills_candidates()`返回源码树的技能位置。

服务于monorepo兼容。

### 4、get_skill_container_path()

给出具体技能的完整容器路径。

路径格式是容器路径加类别加技能名。

类别分public和custom。

## 三、它和谁协作

`app_config.py`的`skills`字段是这份配置。

`runtime_paths.py`提供项目根。

`deerflow.constants`提供默认容器路径。

技能存储和沙箱提供者消费这份配置。

`reload_boundary.py`提供container_path的启动专用描述。

## 四、重要性评级

评级：7分。

理由：技能是产品的主要扩展机制。路径解析的多级顺序保证兼容性。延迟发现是上下文预算的重要手段。
