# LeadAgentAssembly-档案

## 一、这个类是干什么的

LeadAgentAssembly是agents/lead_agent/agent.py里的冻结数据类。

它是编译后的graph加上它是由什么组装的。

字段是graph、descriptor、effective_model。

这个类位于backend/packages/harness/deerflow/agents/lead_agent/agent.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

graph是编译后的LangGraph graph。

descriptor是assembly描述。类型故意宽松。

effective_model是有效模型名。默认None。

### 2、descriptor宽松类型的原因

这个模块在LangGraph Server启动时被导入。

不能把extension contract包拉进那个import路径。

### 3、effective_model的意义

即使没有observer请求descriptor它也可用。

graph-root tracing可以标记选定的默认或fallback模型。

### 4、unwrap_agent_graph函数

它解开一个lead assembly。其他factory结果不动。

Gateway factory返回LeadAgentAssembly(graph, descriptor)。

第三方或测试factory可能仍然返回bare graph。

类型检查结果而不是duck-typing .graph。两个契约都有效。

它住在dataclass旁边。"什么算assembly、哪个属性持有graph"在一个地方回答。

必须在这个模块导入失败时存活的调用者guard import并fallback到结果不动。

### 5、make_lead_agent的关系

make_lead_agent是发布的langgraph.json入口点。

Gateway调用assemble_lead_agent得到assembly。make_lead_agent返回.graph。

### 6、descriptor的内容

assembly_descriptor.py的build_assembly_descriptor记录模型、渲染prompt hash、授权工具和middleware顺序。

### 7、_EnabledSkillsRefreshHandle对照

prompt.py的_EnabledSkillsRefreshHandle是enabled skills缓存刷新的handle。

version、event、error字段。

wait方法等待刷新完成。

worker线程加载skills。版本不匹配时循环。缓存收敛到最新版本。

## 三、它和谁协作

- assemble_lead_agent构建它。
- make_lead_agent返回它的.graph。
- runtime/runs/worker.py的_agent_graph用unwrap_agent_graph解开它。
- assembly_descriptor构建descriptor。

## 四、重要性评级

评级是6分。

理由如下。

这个类是lead agent组装的结果契约。

graph加descriptor加effective_model。

descriptor宽松类型。不在LangGraph Server启动路径拉extension契约。

unwrap_agent_graph类型检查。bare graph和assembly两个契约都有效。

effective_model让tracing标记选定模型。

这些是lead agent组装的核心。

扣掉4分。

扣分原因是它是一个三字段数据类。
