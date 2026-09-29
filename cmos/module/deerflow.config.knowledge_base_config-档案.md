# deerflow.config.knowledge_base_config-档案

## 一、这个模块是干什么的

这个模块管理知识库能力的配置。

DeerFlow支持对接知识库。

比如RAGFlow、LightRAG等知识检索服务。

这个配置是通用的能力开关。

具体用什么知识库服务、检索参数怎么配，都写在工具条目里。

这个模块只管能力开不开。

## 二、模块里的主要成员

### 1、KnowledgeBaseConfig类

只有两个字段。

`enabled`决定知识库能力是否启用，默认关闭。

`scope_selection_enabled`决定自定义代理能否选择知识范围。

两个字段都支持热重载。

配置注释明确说明。

提供者连接和检索选项属于工具条目。

不属于这个通用的能力块。

## 三、它和谁协作

`app_config.py`的`knowledge_base`字段是这份配置。

知识工具的消费点读取这两个开关。

`deerflow.knowledge_scope`处理知识范围的具体语义。

## 四、重要性评级

评级：4分。

理由：知识库能力开关是产品特性入口。但这个模块只有两个字段，结构极薄。具体逻辑都在工具和范围处理模块里。
