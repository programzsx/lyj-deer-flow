# 模块档案：deerflow.community.lightrag.tools

## 一、这个模块是干什么的

这个模块定义只读的Agent工具。
工具名是knowledge_search。
它搜索运营者配置的LightRAG知识库。
返回紧凑的、带引用编号的源chunk。
检索用配置的图加向量模式。
LightRAG没有数据集目录可以限定范围。
部署的单个已索引工作区总是被搜索。
用配置的检索模式。
所以不需要在请求前做绑定解析。
配置存在knowledge_search工具条目上。
用Pydantic模型验证。
验证失败返回稳定错误。

## 二、模块里的主要成员

（1）knowledge_search_tool
这是Agent工具。
用StructuredTool构建。
名字是knowledge_search。
它是一个async函数包装。
底层调用knowledge_search函数。
直接调用knowledge_search()的调用方保留字符串API。
工具的描述说明内部标识永远不会展示给模型。

（2）_LightRAGRetrievalSettings
这是Pydantic设置模型。
存储在knowledge_search工具条目上。
字段有base_url、api_key、mode、timeout、top_k、chunk_top_k、max_chars_per_chunk、max_total_chars。
base_url默认http://localhost:9621。
有验证器拒绝URL里的用户名密码。
api_key用SecretStr。
mode默认mix。
mix和LightRAG API自己的默认一致。
bypass被排除。
timeout默认30秒。
上限600。
top_k默认60。
服务端上限是1000。
和它保持一致。
不发明更紧的客户端上限。

（3）knowledge_search函数
这是实际执行检索的函数。
参数有query、knowledge_scope、runtime。
流程是这样的。
先清理query。
空query直接报错。
解析设置。
没配置返回配置提示。
验证失败返回配置错误提示。
构建客户端。
调用query_data检索。
结果交给format_retrieval_result格式化。
成功路径上API key脱敏是强制的。
chunk和引用标识根本不会进入格式化文本。
异常统一走_tool_error。

（4）错误处理
_tool_error把异常翻译成错误字符串。
API错误返回详细信息。
连接错误返回地址加异常类型。
协议错误返回请求失败。
意外错误返回稳定消息。
API key从所有错误文本里脱敏。

## 三、它和谁协作

这个模块依赖谁。
依赖同目录的client模块和formatting模块。
依赖deerflow.config的get_app_config。
依赖pydantic。

谁调用这个模块。
DeerFlow的工具框架注册knowledge_search工具。
config.yaml的tools列表里配置knowledge_search的LightRAG设置才启用。

## 四、重要性评级

评级：5分。
理由：这是LightRAG知识检索的工具层。设置验证用Pydantic。错误处理带脱敏。安全边界明确。API key不出现在任何模型可见文本里。工具描述引导模型正确引用。它是可选知识集成的入口。给5分。
