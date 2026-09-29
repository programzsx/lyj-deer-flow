# deerflow.extensions.policy档案

## 一、这个模块是干什么的

这个模块是宿主策略面向扩展的投影。

宿主对自己施加了很多限制。比如token预算。比如每个运行的子代理数上限。扩展想知道这些限制。这个模块把宿主实际执行的限额投影成公开契约里的`HostPolicySnapshot`。

这个模块是刻意独立的。它不依赖Gateway的路由和服务管道。lead代理构建器和子代理构建器需要这个投影。即使Gateway特有的贡献点没有安装，构建器也照样工作。

## 二、模块里的主要成员

### 1、project_host_policy函数

这是主函数。把宿主的执行限额投影成公开契约。

接收app_config。返回一个`HostPolicySnapshot`。快照里的字段有下面这些。

- `token_budget_enabled`，token预算是否启用。
- `max_input_tokens`，最大输入token。预算未启用时是None。
- `max_output_tokens`，最大输出token。预算未启用时是None。
- `max_total_tokens`，最大总token。预算未启用时是None。
- `budget_warn_fraction`，预算警告阈值。
- `budget_hard_fraction`，预算硬停阈值。
- `max_subagents_per_run`，每个运行的最大子代理数。

### 2、参数的灵活处理

这个函数支持两个可选参数。

- `token_budget_config`，调用方可以直接传预算配置。不传就从app_config读。
- `max_subagents_per_run`，调用方可以直接传子代理上限。默认从app_config的`subagents.max_total_per_run`读。`_UNSET`哨兵区分"没传"和"传了None"。

### 3、防御性的getattr读取

全部字段用`getattr`带默认值读取。宿主配置缺某一项时投影的对应字段是None。这保证投影不会因为宿主配置不完整而崩溃。

## 三、它和谁协作

这个模块依赖`deerflow_extension_api.HostPolicySnapshot`公开契约。

这个模块被`deerflow.extensions.gateway`调用。gateway的start_services用`project_host_policy(app_config)`构造服务拿到的deps快照。

这个模块被lead代理构建器和子代理构建器调用。构建器需要投影。

这个模块读取`deerflow.config`的app_config。读token_budget和subagents配置。

## 四、重要性评级

评级是5分。

理由。这个模块是扩展了解宿主限制的唯一窗口。没有它，扩展要么猜宿主的限制。要么不知道宿主有限制。token预算和子代理上限这两个信息对扩展的行为有意义。

独立性的设计很关键。这个模块不依赖Gateway管道。lead和子代理构建器在没有Gateway贡献点时也能拿到投影。

但它的代码量非常小。逻辑就是一个字段映射函数。没有复杂状态。没有失败处理。它是一个纯粹的转换工具。所以重要性是中等偏下。
