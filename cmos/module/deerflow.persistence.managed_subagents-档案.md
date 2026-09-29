# deerflow.persistence.managed_subagents包档案

## 一、这个模块是干什么的

deerflow.persistence.managed_subagents包是部署级托管子代理持久化的包门面。

源文件是backend/packages/harness/deerflow/persistence/managed_subagents/__init__.py。

它的角色特殊。

它既是门面又是实现体。

docstring一句话说明定位。

定位是部署级的托管子代理持久化。

它定义了模块级状态。

它定义了_file_store_singleton单例缓存。

它定义了make_managed_subagent_store和get_managed_subagent_store两个函数。

托管子代理是部署级预定义的子代理。

与用户自定义代理分属不同的持久化域。

## 二、模块里的主要成员

它从base模块导入ManagedSubagentDefinition、ManagedSubagentExistsError、ManagedSubagentStore。

它从model模块导入ManagedSubagentRow。

ManagedSubagentStore是抽象仓库契约。

ManagedSubagentDefinition是子代理定义。

ManagedSubagentRow是ORM行模型。

ManagedSubagentExistsError是存在冲突错误。

它提供make_managed_subagent_store函数。

函数选择与自定义代理定义相同的持久化后端。

选择逻辑是看config.agent_storage.backend。

db后端要求database.backend是sqlite或postgres。

选择db后端时函数体内懒加载SqlManagedSubagentStore。

它提供get_managed_subagent_store函数。

函数接受可选的config参数。

有config时直接构建。

没有config时从get_app_config解析。

解析异常时回退到file后端。

回退服务于轻量测试上下文。

__all__覆盖了上述全部成员。

## 三、它和谁协作

它向内聚合base、model、sql、file模块。

sql和file两个模块在函数体内懒加载。

它向上被网关和代理组装逻辑消费。

托管子代理在运行时按定义实例化。

它与deerflow.persistence.agents协作。

两个包共用agent_storage.backend配置。

选择逻辑保持一致。

## 四、重要性评级

评级是6分。

理由如下。

它是托管子代理持久化的正式入口。

get_managed_subagent_store是拿托管子代理仓库的必经函数。

它与agents包共用后端选择逻辑。

共用保证两类定义的存储行为一致。

函数体内的懒加载让SQL后端只在需要时导入。

扣分点在于它混合门面与实现。

异常回退逻辑较宽。

回退用BLE001吞掉全部异常。

宽回退有掩蔽配置错误的可能。
