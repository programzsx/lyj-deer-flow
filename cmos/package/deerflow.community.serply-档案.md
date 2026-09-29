# deerflow.community.serply档案

本文档介绍DeerFlow社区工具包`deerflow.community.serply`。

本文档基于对`backend/packages/harness/deerflow/community/serply/`目录下全部代码的实际阅读。

本文档的读者是想理解这个包代码的开发者。

包目录下有两个代码文件。

一个是`__init__.py`。

一个是`tools.py`。

## 一、这个包是干什么的

这是Serply搜索服务的工具集成。

Serply是一个返回Google实时结果的商业API服务。

Serply的一个API密钥覆盖三个垂直搜索。

第一个是普通网页搜索。

第二个是Google News新闻搜索。

第三个是Google Scholar学术搜索。

用户通过config.yaml里的`vertical`设置切换垂直方向。

一次研究任务想看新闻就切news。想看论文就切scholar。

这个包需要API密钥。API密钥要在https://serply.io注册获取。

这个包只给AI代理提供一个工具。

这个工具是`web_search_tool`。这个工具搜索网页、新闻或学术结果。

## 二、包里的主要成员

### 1、`__init__.py`

这个文件只有3行代码。

这个文件导出一个工具。

导出的工具是`web_search_tool`。

### 2、`web_search_tool`

这是一个LangChain工具。装饰器是`@tool("web_search")`。

这个工具用Serply做Google搜索。

这个工具有2个参数。

一个是`query`。这个参数是搜索关键词。

一个是`max_results`。这个参数默认是5。上限是100。Serply每次请求接受1到100。

这个工具的执行流程是这样的。

第一步读取配置。配置里的`max_results`可以覆盖默认值。

第二步确定垂直方向。`_coerce_vertical`读取配置里的`vertical`设置。非法值回退到默认的search。

第三步规范化查询。查询被截断到500字符。

第四步获取API密钥。密钥优先来自配置。配置没有就用环境变量`SERPLY_API_KEY`。没有密钥就返回结构化错误。

第五步发GET请求。请求发到`https://api.serply.io/v1/{path}/`。路径由垂直方向决定。请求头是`X-Api-Key`。

第六步读取结果字段。结果字段的键由垂直方向决定。

第七步规范化结果并输出JSON。

配置里还能透传两个可选参数。

这两个参数是gl和hl。gl是地区。hl是语言。

### 3、垂直方向映射

垂直方向的映射存在`_VERTICALS`字典里。

映射关系是这样的。

search映射到路径search。结果字段是results。

news映射到路径news。结果字段是entries。

scholar映射到路径scholar。结果字段是articles。

一个配置项`vertical`决定用哪个端点和哪个结果键。

### 4、`_normalize_row`

这是结果规范化函数。

这个函数把Serply的一行结果映射到通用的title、url、content形状。

不同垂直方向的行有不同结构。所以映射逻辑按垂直方向分支。

search分支最简单。content取description字段。

news分支多输出3个字段。

content取summary字段。summary是HTML。所以先经过`_clean_text`清洗。

published输出发布时间。

source输出来源名。来源是嵌套字典里的title。

scholar分支多输出4个字段。

content取description字段。

authors输出作者列表。作者在嵌套的author.authors结构里。

cited_by输出被引次数。被引次数在extras.citations.count里。

pdf_url输出PDF链接。PDF链接在doc.link里。

新闻和学术的额外字段对模型有价值。模型能看到发布时间、来源、作者、被引数、PDF链接。

### 5、`_clean_text`

这是文本清洗函数。

新闻摘要以HTML形式到达。

这个函数去掉HTML标签。

HTML标签用正则`_TAG_RE`匹配。

然后做HTML实体反转义。

最后去掉首尾空白。

### 6、API密钥与请求辅助函数

`_get_api_key(tool_name)`负责拿密钥。

取值顺序是先配置后环境变量。

环境变量是`SERPLY_API_KEY`。

`_coerce_max_results(value)`负责规范化结果数。非法输入用默认值5。结果被夹在1和100之间。

`_coerce_vertical(value)`负责规范化垂直方向。非法值记警告并回退到search。

`_clean_query(query)`负责清洗查询。查询被截断到500字符。

`_missing_key_error`和`_unexpected_format_error`负责生成结构化错误。

`_serply_get(path, api_key, query, params)`负责发GET请求。

这个函数返回`(data, error_json)`元组。

请求头带`X-Api-Key`、`Accept`、`User-Agent`。

超时是30秒。

## 三、它和谁协作

### 1、依赖的外部服务

这个包依赖Serply商业API。

基础地址是`https://api.serply.io/v1`。

三个端点分别是search、news、scholar。

### 2、依赖的内部模块

这个包依赖`deerflow.config.get_app_config`。

这个包依赖第三方库httpx和langchain。

注意这个包没有引用`search_time_range`。这个包不支持time_range参数。

### 3、被谁调用

这个工具注册名是`web_search`。

DeerFlow的代理工具装配层按配置选择搜索提供方。

配置选择serply时这个工具会被加进代理工具集。

AI代理在运行时直接调用这个工具。

垂直方向由配置决定。代理调用时不能切换垂直方向。切换要改配置。

## 四、重要性评级

评级：3分。

理由如下。

这个包是社区贡献的可选搜索提供方。

DeerFlow有多个搜索后端可以互相替代。

所以这个包不是必需组件。

这个包的独特价值是学术搜索。

Serply是少数能直接搜Google Scholar的集成。学术研究场景下这个能力有价值。

但是这个包的使用面比较窄。

垂直方向只能通过配置切换。代理在运行时不能自己选择搜新闻还是搜论文。这限制了灵活性。

这个包不支持时间范围参数。功能上比Brave和DDG少一块。

新闻字段清洗和学术字段抽取的细节处理比较周到。

综合来看。这个包是可替代且使用面较窄的可选组件。评级3分。
