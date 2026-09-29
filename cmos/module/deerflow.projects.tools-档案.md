# deerflow.projects.tools

## 一、这个模块是干什么的

这个模块提供项目文档架的两个只读工具。

背景是这样的。

代理运行在项目成员线程里。

代理需要读架子上的文档。

系统给代理两个工具。

工具一是list_project_documents，列架子上的文档。

工具二是read_project_document，读一份文档的文本。

这两个工具是只读的。

架子是用户策展的。

代理不能往架子上写东西。

工具怎么知道读哪个项目。

答案是运行开始时固定的项目快照。

固定快照决定了哪个项目。

快照不决定架子上当前有什么。

所以列表和读取查的是实时行。

这一点是关键设计。

一次运行进行中，文档可能被用户删掉。

被删的文档不返回旧内容。

工具报"no longer on the shelf"错误。

这样代理不会拿到过期内容。

缺固定快照或缺session工厂是工具错误。

不是空成功。

## 二、模块里的主要成员

- list_project_documents：列架子上的文档工具。支持offset和limit。默认50条，上限200条。
- read_project_document：读文档文本工具。支持offset和limit。默认8000字符，上限20000字符。
- get_project_document_tools：返回这两个工具的列表。注册是条件性的，只有固定了项目上下文才注册。
- _resolve_pin_and_repo：解析固定快照和仓库。缺pin或缺仓库返回错误字符串。
- _resolve_auto_convert：解析自动转换开关。
- _read_project_document_impl：读取的实现。区分二进制文件、转换被禁用、文档已删、内容缺失四种情况，各自返回不同的提示。
- _list_project_documents_impl：列表的实现。
- _shelf_entry_json：把数据库行转成给模型看的JSON。

## 三、它和谁协作

- 它依赖projects/context读取固定快照。
- 它依赖projects/documents读文件和转换。
- 它依赖runtime/user_context解析用户。
- 它被agents/lead_agent/agent.py注册进工具集。
- 子代理永远拿不到这两个工具。

## 四、重要性评级

评级是5分。

理由是它是代理消费项目文档的唯一通道。

过期内容防护的设计值得强调。

文档被删后工具拒绝服务而不是给旧数据。

但它只覆盖读取，逻辑相对直白。
