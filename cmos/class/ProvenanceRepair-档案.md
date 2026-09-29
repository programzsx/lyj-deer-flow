# ProvenanceRepair档案

来源文件：`backend/app/gateway/langgraph_studio.py`

## 一、这个类是干什么的

这个类是预运行时持久化修复的摘要类。

这个类是冻结dataclass。

LangGraph Studio的独立部署有一个遗留问题。

旧版本的运行时给系统标记的assistant行留下了`created_by=system`元数据。

runtime 0.30.0会在加载时清掉这些行。

修复必须在runtime加载之前完成。

`repair_persisted_assistant_provenance()`函数执行修复，返回这个类的实例作为摘要。

修复做两件事。

第一件事是把已注册图对应的系统assistant行删掉。

图注册会重新创建这些行。

第二件事是把其他遗留的`created_by=system`标记降级成`created_by=user`。

降级涉及活跃assistant行和版本历史。

这个类的字段就是这两件事的计数。

## 二、类的成员

这个类是`@dataclass(frozen=True)`装饰的冻结数据类。

这个类有四个计数字段。

### 1、字段removed_registered_assistants

`removed_registered_assistants`是被删除的已注册assistant行数量。

这些行会在图注册时重建。

### 2、字段removed_registered_versions

`removed_registered_versions`是被删除的已注册版本行数量。

### 3、字段demoted_assistants

`demoted_assistants`是被降级的assistant行数量。

降级是把`created_by=system`改成`created_by=user`。

### 4、字段demoted_versions

`demoted_versions`是被降级的版本历史行数量。

### 5、属性changed

`changed`是只读属性。

四个计数里任何一个非零，`changed`就为真。

`changed`为假表示这次修复什么都没动。

## 三、它和谁协作

这个类由`repair_persisted_assistant_provenance()`创建并返回。

这个类的计数字段依赖`_demote_system_marker()`和`configured_system_assistant_ids()`的结果。

调用链的上游是LangGraph Studio的自定义应用模块。

修复在运行时lifespan之前执行。

持久化存储是一个文件映射，修复直接读写该映射。

## 四、重要性评级

评级：4分。

理由：这个类是LangGraph Studio独立部署的修复摘要。修复时机必须在runtime加载前，修错了会让系统assistant消失或被错误清掉。这个类让修复结果可观测。但这个类只服务Studio独立部署这一条路径，四个字段都是计数。所以这个类是局部的可观测性数据类。
