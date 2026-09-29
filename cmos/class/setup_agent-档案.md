# setup_agent-档案

## 一、这个类是干什么的

setup_agent不是类。

setup_agent是tools/builtins/setup_agent_tool.py里的工具函数。

这个工具设置自定义DeerFlow代理。

它持久化自定义代理的SOUL.md和config.yaml。

这个工具只在bootstrap时绑定。

绑定条件是is_bootstrap为True。

再bootstrap时保留已有owner的display_name。

这个模块位于backend/packages/harness/deerflow/tools/builtins/setup_agent_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、setup_agent工具函数

参数如下。

- soul是完整的SOUL.md内容。定义代理的个性和行为。
- description是代理做什么的一行描述。
- runtime是注入的运行时。
- skills是可选的技能名列表。None表示用所有启用的技能。空列表表示不用技能。

处理流程如下。

第一步拒绝空或全空白的soul。

在碰文件系统之前就拒绝。

没有这个守卫工具会开心地持久化空SOUL.md并报告成功。

这导致前端进入"代理已创建"状态，但代理不可用。

这是issue #3549。

大声失败让模型重试。

还防止全局默认SOUL.md被空内容覆盖。

第二步从runtime上下文取agent_name并验证。

第三步agent_name存在时持久化自定义代理。

自定义代理持久化在当前用户的桶里。

通过配置的store，文件或数据库。

不同用户、不同节点解析到同一个代理。

setup是幂等的。

所以这是upsert。

已存在时保留knowledge_scope和display_name。

第四步agent_name不存在时是默认代理。

默认代理的SOUL.md在全局base目录。

它不是自定义代理记录。

无论agent-storage后端是什么都保持文件方式。

第五步返回Command更新created_agent_name和成功消息。

失败时返回错误ToolMessage。

## 三、它和谁协作

- persistence/agents的get_agent_store提供代理存储。
- validate_agent_name验证代理名。
- get_paths解析全局base目录。
- update_agent是同模块族里的另一个工具，处理普通聊天里的自更新。

## 四、重要性评级

评级是6分。

理由如下。

这个工具是自定义代理创建的入口。

空soul守卫对应真实issue #3549。

大声失败防止不可用的代理悄悄创建。

幂等upsert保留display_name。

但它逻辑简单。

是持久化的薄封装。

扣掉4分。
