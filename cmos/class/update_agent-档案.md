# update_agent-档案

## 一、这个类是干什么的

update_agent不是类。

update_agent是tools/builtins/update_agent_tool.py里的工具函数。

这个工具让自定义代理持久化对自己的SOUL.md和config的更新。

它只在自定义代理的聊天里绑定。

绑定条件是runtime.context里有agent_name。

默认代理看不到这个工具。

bootstrap流程用setup_agent做初始创建。

更新通过配置的agent store写回。

file后端写每用户的config.yaml和SOUL.md。

db后端写共享的agents表。

这样某个用户创建的代理不会被另一个用户看到或修改。

这个模块位于backend/packages/harness/deerflow/tools/builtins/update_agent_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、update_agent工具函数

参数如下。

- soul是可选的完整替换SOUL.md内容。没有patch语义。要从当前SOUL开始应用修改。
- description是可选的新一行描述。
- skills是可选的技能白名单。空列表表示禁用全部技能。省略表示不变。
- tool_groups是可选的工具组白名单。
- model是可选的模型覆盖。必须匹配配置的模型名。

部分更新语义。只更新显式传入的字段。

省略的字段保留现有值。

### 2、防御性检查

工具有多层防御。

第一层是webhook通道拒绝。

lead-agent工厂已经在webhook通道的运行里去掉这个工具。

这个工具内部镜像同一套不受信任通道集合。

github通道在集合里。

原因是自定义工厂重新附加这个工具时不能悄悄暴露webhook上的自变异。

第二层是空字段检查。

所有字段都是None时报错。要求至少传一个字段。不要传"null"、"none"、"undefined"这类字面字符串。

nullish字符串由BeforeValidator归一化成None。

第三层是空soul检查。

空或全空白的soul被拒绝。

setup_agent已经拒绝它。update_agent也必须拒绝。

否则自定义代理会报告成功同时抹掉一个能工作的SOUL.md。

下一轮变成空个性。

第四层是未知模型检查。

在碰文件系统之前拒绝未知模型。

否则运行时悄悄回退到默认模型。

用户在之后的每一轮看到困惑的重复警告。

第五层是legacy布局检查。

要求config.yaml而不是裸目录存在。

每用户代理目录可能只含memory.json。

裸.exists()会漏掉这种情况。

然后静默fork一份新的config.yaml到只有memory的目录。

这对应#3390类bug。

正确行为是要求先跑迁移脚本。

### 3、字段携带与保留

UI拥有的字段不暴露为LLM参数。

包括model_settings、thinking_enabled、reasoning_effort、allowed_subagents。

但工具重写config.yaml时会显式携带它们。

这样代理改描述或技能时不能抹掉模型默认值或服务端强制的子代理策略。

未暴露的顶层AgentConfig字段也被保留。

包括github块和未来字段。

和HTTP的PATCH /api/agents路由用同一个helper。

两个表面保持一致。

操作员手工写的github块不会在代理自更新时悄悄丢失。

### 4、写入原子性

db后端在单个事务里提交config和soul。

部分失败不会让一个更新另一个过期。

file后端stage到临时文件。

然后用两次顺序的os.replace提交。

每个文件是all-or-nothing。

但两个replace之间崩溃会留下新config.yaml配旧SOUL.md。

这是单节点亚毫秒级窗口。

旧的pre-store工具会明确报告部分更新。

走store后丢掉了报告。

这是有意的取舍。

stage-then-replace的安全性保留。

只是诊断信息没了。

## 三、它和谁协作

- persistence/agents的get_agent_store提供存储。
- load_agent_config和preserve_non_managed_fields加载和保留配置字段。
- validate_agent_name验证代理名。
- setup_agent处理bootstrap创建。

## 四、重要性评级

评级是7分。

理由如下。

这个工具是自定义代理自变异的执行者。

它的防御层次很完整。

webhook拒绝、空soul拒绝、未知模型拒绝、legacy布局拒绝。

每层都对应真实issue。

字段保留机制防止自更新抹掉服务端策略。

写入原子性的取舍被明确记录。

扣掉3分。

扣分原因是它服务于代理自演化场景。

不在所有会话的主链路上。
