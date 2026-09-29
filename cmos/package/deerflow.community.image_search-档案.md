# deerflow.community.image_search档案

本文档介绍DeerFlow社区工具包`deerflow.community.image_search`。

本文档基于对`backend/packages/harness/deerflow/community/image_search/`目录下全部代码的实际阅读。

本文档的读者是想理解这个包代码的开发者。

包目录下有两个代码文件。

一个是`__init__.py`。

一个是`tools.py`。

## 一、这个包是干什么的

这是DuckDuckGo图片搜索的工具集成。

这个包通过DDGS聚合库调用DuckDuckGo图片搜索。

这个包不需要API密钥。装好`ddgs`库就能用。

这个包只给AI代理提供一个工具。

这个工具是`image_search_tool`。这个工具搜索图片。

这个工具的使用场景是在生成图片之前找参考图。

生成角色肖像前先找相似姿势和表情的参考。

生成特定物品前先找准确的视觉参考。

生成场景前先找建筑或环境参考。

返回的图片URL能作为图片生成的参考图。参考图能明显提高生成质量。

注意和brave、serper包区分。

brave和serper包的`image_search_tool`用商业API搜图。

这个包的`image_search_tool`用DuckDuckGo免费搜图。

## 二、包里的主要成员

### 1、`__init__.py`

这个文件只有3行代码。

这个文件导出一个工具。

导出的工具是`image_search_tool`。

### 2、`image_search_tool`

这是一个LangChain工具。装饰器是`@tool("image_search")`。

这是一个异步工具。

这个工具用DuckDuckGo搜索图片。

这个工具有7个参数。

第一个参数是`query`。这个参数是搜索关键词。关键词要具体。例如"Japanese woman street photography 1990s"。不要只写"woman"。

第二个参数是`max_results`。这个参数是最大结果数。默认是5。

第三个参数是`size`。这个参数是图片尺寸过滤。选项有Small、Medium、Large、Wallpaper。找参考图时用Large。

第四个参数是`color`。这个参数是颜色过滤。选项有color、Monochrome、Red等14种。注意color表示全彩色。color和Monochrome相对。color不是元参数。

第五个参数是`type_image`。这个参数是图片类型过滤。选项有photo、clipart、gif、transparent、line。要真实参考时用photo。

第六个参数是`layout`。这个参数是版式过滤。选项有Square、Tall、Wide。

第七个参数是`license_image`。这个参数是许可证过滤。选项有any、Public、Share、ShareCommercially、Modify、ModifyCommercially。参考图要再分发时用这个参数。过滤后的结果已经处理了许可证问题。

这个工具的执行流程是这样的。

第一步把配置加载和搜索放进工作线程。

`asyncio.to_thread(search_with_config)`负责这一步。

原因是配置加载和DDGS搜索都是阻塞IO。

整个搜索放在一个工作线程里。事件循环就不会被卡住。

第二步读取配置。配置里的`max_results`可以覆盖默认值。

第三步规范化参数并调用`_search_images`。

第四步规范化结果。DDGS返回的每条结果有title、image、thumbnail。这个工具把image改名为image_url。thumbnail改名为thumbnail_url。

第五步输出JSON。输出还带usage_hint。usage_hint提示把image_url用作图片生成的参考图。需要时先下载。

没有结果时返回结构化错误JSON。

### 3、`_search_images`

这是内部搜索执行函数。

这个函数先尝试导入`ddgs`库。

`ddgs`库没装就记日志错误并返回空列表。

导入成功后创建`DDGS(timeout=30)`实例。

基础参数是region、safesearch、max_results。

region默认是wt-wt。safesearch默认是moderate。

5个过滤参数只有非空时才传给DDGS。

这5个参数是size、color、type_image、layout、license_image。

然后调用`ddgs.images`执行搜索。

出错时记日志并返回空列表。

### 4、`_coerce_max_results`

这是参数规范化函数。

布尔值和非整数小数被直接判为非法。

原因是int()会接受布尔值。YAML小数如3.5会被静默截断。

非法输入用默认值5。

## 三、它和谁协作

### 1、依赖的外部服务

这个包依赖DuckDuckGo图片搜索。

搜索请求通过DDGS库发出。

### 2、依赖的内部模块

这个包依赖`deerflow.config.get_app_config`。

这个包依赖第三方库langchain。

这个包延迟导入第三方库ddgs。

注意这个包没有引用`search_time_range`。图片搜索不需要时间范围。

### 3、被谁调用

这个工具注册名是`image_search`。

DeerFlow的代理工具装配层按配置选择图片搜索提供方。

配置选择ddg时这个工具会被加进代理工具集。

AI代理在运行时直接调用这个工具。

图片生成流程会先调用这个工具找参考图。

## 四、重要性评级

评级：3分。

理由如下。

这个包是社区贡献的可选图片搜索提供方。

brave和serper包都提供`image_search_tool`。功能上有替代品。

所以这个包不是必需组件。

但是这个包有独特的价值。

这个包是唯一不需要API密钥的图片搜索集成。

零密钥意味着开箱即用。

这个包的过滤参数最丰富。尺寸、颜色、类型、版式、许可证5个维度都能过滤。许可证过滤对要再分发的场景特别有用。

这个包把阻塞IO放进工作线程。这个处理方式值得同类工具参考。

这个包的URL没有做SSRF过滤。返回的图片URL安全性不如brave和serper包。

综合来看。这个包是可替代但有零密钥优势的可选组件。评级3分。
