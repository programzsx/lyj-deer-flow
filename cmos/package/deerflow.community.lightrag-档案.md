# deerflow.community.lightrag档案

本文档介绍deerflow.community.lightrag包。

本文档基于对`backend/packages/harness/deerflow/community/lightrag/`目录的实际代码阅读。

本文档的读者是想理解这个包的开发者。

## 一、这个包是干什么的

这个包是LightRAG的工具集成。

LightRAG是一个开源的图检索增强知识库服务。

用户可以自己部署一套LightRAG服务器。

用户把私有文档灌进LightRAG。

LightRAG会对文档建索引。

索引分两种。

一种是向量索引。

一种是知识图谱索引。

这个包让DeerFlow的AI代理能够去搜索这套LightRAG知识库。

AI代理调用`knowledge_search`工具。

工具向LightRAG服务器发一次HTTP请求。

LightRAG返回相关的文本块。

工具把文本块格式化成带编号的引用文本。

文本回到AI代理手里。

AI代理就能基于用户的私有文档回答问题。

这个包是只读的。

这个包只做检索。

这个包不写入、不删除LightRAG里的任何数据。

## 二、包里的主要成员

包里有4个Python文件。

`__init__.py`是空的。

其余3个文件各管一件事。

### 1、client.py里的LightRAGClient

`LightRAGClient`是最小化的异步HTTP客户端。

客户端基于httpx实现。

客户端故意不持有缓存。

客户端不持有任何持久状态。

客户端每次方法调用都新开一个HTTP会话。

调用者不需要管理客户端生命周期。

客户端的核心方法是`query_data`。

`query_data`向`POST /query/data`端点发请求。

`/query/data`是LightRAG的结构化检索端点。

这个端点不做LLM生成。

这个端点只返回实体、关系、文本块和引用。

返回结果正好是只读检索工具需要的形状。

`query_data`支持5种检索模式。

5种模式是naive、local、global、hybrid、mix。

模式默认是mix。

mix也是LightRAG API自己的默认值。

### 2、client.py里的错误类

client.py定义了4个错误类。

4个错误类构成一个继承树。

- `LightRAGError`是基类。
- `LightRAGAPIError`表示LightRAG拒绝了请求。
- `LightRAGConnectionError`表示连不上LightRAG或者请求超时。
- `LightRAGProtocolError`表示LightRAG返回了无效的响应。

错误信息会做脱敏处理。

`_redact`方法会把错误文本里的API密钥替换成`[REDACTED]`。

这样密钥不会泄漏到日志或者模型上下文里。

客户端还处理了版本兼容问题。

LightRAG的`/query/data`端点是v1.4.8引入的。

v1.4.9才引入status/data信封和引用字段。

所以404错误会提示用户检查base_url或者升级到v1.4.9以上。

旧版响应格式也会被识别出来。

旧版会得到明确的升级提示。

### 3、formatting.py里的format_retrieval_result

`format_retrieval_result`把检索结果格式化成紧凑的引用文本。

输入是LightRAG返回的结构化数据。

输出是人类可读的文本。

每条文本块变成`[编号] 文档名\n内容`的形式。

实体和关系被故意丢掉。

丢掉的原因有两个。

一个是文本块已经是查询模式排过序的相关内容。

一个是保持输出紧凑。

紧凑的输出保留了和RAGFlow provider共享的引用形状。

格式化有三个限制参数。

- `max_chars_per_chunk`限制单块最多800字符。
- `max_total_chars`限制全文最多8000字符。
- 超长会被截断，并加上`… (response truncated)`标记。

内部的ID不会被输出。

`chunk_id`和`reference_id`不会出现在文本里。

引用用的是操作员可读的`file_path`。

最后还有一行`Matched documents`汇总。

汇总列出每篇命中的文档和命中块数。

### 4、tools.py里的knowledge_search工具

`knowledge_search_tool`是暴露给AI代理的LangChain工具。

工具名叫`knowledge_search`。

工具的入口是`_knowledge_search_entrypoint`。

入口只是转发给`knowledge_search`函数。

`knowledge_search`的工作流程是这样的。

第一步是检查query。

空查询直接报错。

第二步是读配置。

配置来自`config.yaml`的`knowledge_search`工具条目。

配置用`_LightRAGRetrievalSettings`校验。

第三步是构建客户端。

第四步是调用`query_data`。

第五步是格式化结果。

第六步是脱敏后返回。

`_LightRAGRetrievalSettings`是pydantic模型。

模型定义了这些配置项。

- `base_url`是LightRAG服务器地址，默认`http://localhost:9621`。
- `api_key`是API密钥，可选，用SecretStr保护。
- `mode`是检索模式，默认mix。
- `timeout`是超时，默认30秒，最大600秒。
- `top_k`是返回块数上限，默认60，最大1000。
- `chunk_top_k`是块级检索数，可选。
- `max_chars_per_chunk`和`max_total_chars`是格式化限制。

配置校验有一条安全规则。

`base_url`不允许包含用户名密码。

这条规则在`_reject_url_userinfo`校验器里。

LightRAG可以无认证运行。

所以缺失api_key是合法的。

空白api_key会被当成未配置。

`bypass`模式被故意排除。

bypass会跳过索引直接问LLM。

这会让检索工具失去意义。

工具的错误处理按错误类型分类。

API错误返回具体原因。

连接错误返回服务器地址。

协议错误返回通用提示。

所有错误信息都先脱敏。

## 三、它和谁协作

这个包依赖这些外部事物。

- 依赖一台用户自己部署的LightRAG服务器（默认`http://localhost:9621`）。
- 依赖`deerflow.config`的`get_app_config`读取工具配置。
- 依赖httpx做HTTP请求。
- 依赖langchain_core的StructuredTool注册成Agent工具。

这个包被这些地方调用。

AI代理在对话中调用`knowledge_search`工具。

工具注册入口是`knowledge_search_tool`。

`__init__.py`虽然是空的，但包内模块通过相对导入互相协作。

注意LightRAG和RAGFlow是两个独立的知识库集成。

两者共享相同的引用输出形状。

用户只能选择其中一个作为knowledge_search的实现。

## 四、重要性评级

评级：6分。

理由是这样的。

这个包是私有知识库检索的入口。

私有文档问答是AI代理的重要场景。

这个包让DeerFlow具备了访问用户私有知识的能力。

这个包的工程质量不错。

错误处理分类清晰。

有API密钥脱敏。

有版本兼容处理。

有引用格式的输出规范。

但是这个包是可选依赖。

用户必须自己部署LightRAG服务器。

用户必须自己配置`config.yaml`。

不配置这个包，DeerFlow照常运行。

所以这个包是中等偏上重要。

综合评级是6分。
