# ArtifactEntry档案

## 一、这个类是干什么的

ArtifactEntry是工具产物注册表里的单条记录。

智能体的工具会产出文件、URL、任务id这类结果。
这些结果需要被后续工具调用引用。
ArtifactEntry就是这条引用记录的数据形状。
模块docstring明确指出。
这是来自工具结果的产物引用记录。
关联issue #4676。

这个类解决的核心问题是上下文压缩后的引用存活。

工具结果的完整引用存在状态里。
存在ThreadState.tool_artifacts字段。
引用因此能存活过上下文压缩。
模型只看到短的handle。
真正的引用（路径、URL、任务id）存在这个类里。
工具调用时才解析真实的引用。

这个设计的两个好处如下。

第一。
模型上下文里只出现短handle。
上下文不被长路径和URL占满。

第二。
引用存进状态。
压缩裁掉旧消息后引用还在。
后续工具调用依然能取到产物。

这个类在什么场景被使用。
工具产出结果时捕获中间件写入记录。
后续工具调用时按handle解析。
检查点保存时随线程持久化。

## 二、类的成员（字段、方法，各自做什么）

### （一）字段

- handle：短句柄。类型是str。
模型看到的唯一标识。
去重和查找都按这个字段。
- tool_name：产出产物的工具名。类型是str。
记录是哪个工具产出的。
- tool_call_id：工具调用的id。类型是str。
关联到具体的调用。
- call_index：调用序号。类型是int。
同一个工具多次调用时的顺序标记。
- artifact_type：产物类型。类型是str。
比如文件、URL这类类型。
- display_name：展示名。类型是str。
给用户看的名字。
- real_ref：真实引用。类型是str。
路径、URL或任务id。
工具调用时通过这个字段取到真实产物。
- mime_type：MIME类型。类型是NotRequired[str]。
可选的内容类型标记。
- created_at：创建时间。类型是str。
- consumed_by：消费方列表。类型是NotRequired[list[str]]。
记录哪些环节已经消费了这个产物。

### （二）方法

这个类没有任何方法。
它是纯数据结构。

### （三）配套的reducer

tool_artifacts字段绑定merge_tool_artifacts这个reducer。

合并规则如下。

- 新值是None或空就保留已有值。
- 追加条目。相同handle用最新版本替换。保留首次出现顺序。最新生效。比如消费状态更新。
- 新写入里如果带{"op": "trim_to", "keep": N}指令。
就执行滑动窗口裁剪。
超过N的最旧条目被挤出。
没有指令就纯追加。
- 绝对上限是1000条。
不管有没有指令。
超过1000条就裁掉最旧的。
上限常量是_ARTIFACT_MAX_ENTRIES_CEILING。

### （四）上限的双层设计

模块注释说明了一个重要设计。
操作员配置的cap（tool_artifacts.max_entries）由ArtifactCaptureMiddleware在发出更新时按智能体执行。
reducer自己只施加1000条的绝对上限。
这样同一个进程里的两个智能体可以带不同的cap。
不共享状态。

## 三、它和谁协作

### （一）被组合

- ThreadState的tool_artifacts字段使用这个类。
字段定义是Annotated[list[ArtifactEntry]， merge_tool_artifacts]。

### （二）协作的类和模块

- ArtifactCaptureMiddleware。产物捕获中间件。负责写入记录和发出trim_to指令。
- merge_tool_artifacts函数。负责注册表合并与裁剪。
- ThreadState的tool_artifact_processed字段。用merge_artifacts记录已被处理的handle。
- 工具系统。工具调用时按handle解析real_ref。
- 检查点持久化层。保存注册表。

### （三）数据流向

- 写入方向。工具产出结果时捕获中间件写入记录。
- 更新方向。消费发生时更新consumed_by。
- 解析方向。后续工具调用按handle查real_ref。
- 裁剪方向。trim_to指令或1000条上限触发裁剪。

## 四、重要性评级（1-10分+理由）

评级是6分。

理由如下。

ArtifactEntry解决的是产物引用的持久化问题。
这个问题真实存在。
issue #4676说明了这一点。
没有它。
上下文压缩后工具产物引用丢失。
智能体无法继续引用之前产出的文件和URL。

这个类的设计有价值。
模型只看短handle。
真实引用存状态。
上下文成本和引用存活两个问题同时解决。

reducer的设计也有保证。
最新生效的语义支撑消费状态更新。
trim_to指令把配置cap变成滑动窗口。
1000条绝对上限兜底。

但是要看到范围。
产物捕获是工具运行时的特性。
使用集中在工具链路和捕获中间件。

如果删掉这个类。
tool_artifacts字段失去类型。
产物引用无法跨压缩存活。
工具协作的连续性退化。

依赖它的地方包括ThreadState、ArtifactCaptureMiddleware、merge_tool_artifacts。
范围中等偏上。

综合来看。
这是工具产物链路的关键数据结构。
评级给6分。
