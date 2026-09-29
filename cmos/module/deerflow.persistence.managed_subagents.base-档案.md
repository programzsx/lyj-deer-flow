# deerflow.persistence.managed_subagents.base-档案

## 一、这个模块是干什么的

这个模块定义部署级托管subagent的存储契约。

托管subagent是管理员定义的worker。

worker的定义存在config.yaml之外。

config.yaml是主应用配置。

托管subagent的定义由管理员通过API管理。

管理员不想改配置文件。

这个模块定义三样东西。

第一样是ManagedSubagentDefinition模型。

第二样是ManagedSubagentStore抽象类。

第三样是ManagedSubagentExistsError异常。

## 二、模块里的主要成员

### 1、ManagedSubagentDefinition类

这是pydantic模型。

这个模型描述一个托管subagent的定义。

model_config是extra="forbid"。

多余的字段会被拒绝。

#### （1）name字段

name是自然键。

name必须匹配[A-Za-z0-9-]+。

name被规范化成小写。

规范化用normalize_managed_subagent_name。

#### （2）display_name字段

display_name是显示名。

可为None。

字符串会被strip。

strip后为空则变None。

#### （3）description字段和system_prompt字段

description是描述。

system_prompt是系统提示词。

两个都不能为空。

空白会被strip。

strip后为空就报错。

#### （4）tools字段和skills字段

tools是工具名列表。

skills是技能名列表。

都可为None。

列表条目会被strip。

空条目报错。

重复条目被去重。

#### （5）model字段

model是模型选择。

默认inherit。

inherit表示跟随主配置。

#### （6）max_turns字段和timeout_seconds字段

max_turns是最大轮数。

默认50。

最小1。

timeout_seconds是超时秒数。

默认900。

最小1。

#### （7）enabled字段

enabled控制是否启用。

默认True。

#### （8）disallowed_tools字段

disallowed_tools是被禁止的工具。

默认值是REQUIRED_DISALLOWED_TOOLS排序后的列表。

REQUIRED_DISALLOWED_TOOLS是必需禁止集。

集合内容是task、ask_clarification、present_files。

模型校验器强制这个边界。

worker不能委派任务。

worker不能向用户提问。

worker不能展示文件。

托管subagent是worker。

worker的工具边界被强制。

调用方传了额外禁止项也会被合并进必需禁止集。

### 2、normalize_managed_subagent_name函数

这个函数校验并规范化自然键。

不合法的名字抛ValueError。

合法的名字被转成小写。

### 3、ManagedSubagentStore抽象类

这个类定义存储接口。

#### （1）get方法

get返回一个定义。

不存在抛FileNotFoundError。

#### （2）list方法

list返回全部定义。

包括禁用的定义。

#### （3）create方法

create创建一个定义。

名字已被占用抛ManagedSubagentExistsError。

#### （4）update方法

update整体替换一个已存在的定义。

不存在抛FileNotFoundError。

#### （5）delete方法

delete删除一个定义。

返回是否存在过。

#### （6）signature方法

signature返回适合缓存失效的不透明令牌。

#### （7）cache_identity方法

cache_identity返回后端目录的进程本地身份。

指向同一份数据的无状态store应该覆盖这个方法。

覆盖后registry快照可以跨实例复用。

默认实现返回id(self)。

## 三、它和谁协作

### 1、它依赖谁

它依赖pydantic的BaseModel和校验设施。

### 2、谁依赖它

managed_subagents/file.py的FileManagedSubagentStore实现这个接口。

managed_subagents/sql.py的SqlManagedSubagentStore实现这个接口。

两个实现都用normalize_managed_subagent_name。

## 四、重要性评级

评级是6分。

理由如下。

托管subagent的契约集中在这里。

worker工具边界在这里被强制。

名称规范和定义校验都在这里。

扣分的原因是它是较新的功能。

真正的存储行为在实现文件里。

它也不被核心运行链路依赖。
