# 模块档案：deerflow.community.image_search.tools

## 一、这个模块是干什么的

这个模块定义一个Agent工具。
工具名是image_search。
它用DuckDuckGo搜索图片。
用途是在图片生成之前搜参考图。
给角色、人像、物体、场景提供视觉参考。
返回的图片URL可以直接用于图片生成。
可以显著提高生成质量。
它不需要API key。
它通过DDGS库调用。
DDGS是聚合多家搜索引擎的Python库。
这个模块支持DDGS的图片搜索过滤器。
过滤器有大小、颜色、类型、布局、许可证。

## 二、模块里的主要成员

（1）image_search_tool
这是唯一的Agent工具。
它是一个异步工具。
参数有query、max_results、size、color、type_image、layout、license_image。
max_results默认5。
size是图片大小过滤。
选项有Small、Medium、Large、Wallpaper。
参考图用Large。
color是颜色过滤。
color表示全彩。
和Monochrome相对。
不是元参数。
type_image是图片类型。
选项有photo、clipart、gif、transparent、line。
参考图用photo。
layout是布局。
选项有Square、Tall、Wide。
license_image是许可证过滤。
在参考图要再分发时使用。
这样结果已经是许可证清理过的。
docstring写得很细。
明确告诉模型什么时候用。
生成角色人像前搜类似的姿势表情。
生成特定物体前搜准确的视觉参考。
生成场景前搜建筑环境参考。

（2）_search_images
这个函数执行实际的图片搜索。
延迟导入ddgs库。
没安装就打错误日志返回空列表。
DDGS超时30秒。
可用的过滤器有条件地加入请求参数。

（3）线程安排
search_with_config把配置加载和DDGS搜索放在同一个工作线程里。
配置加载和DDGS都做阻塞IO。
放同一个线程。
两者都不会卡住Agent的事件循环。
整体用asyncio.to_thread调用。

（4）_coerce_max_results
归一化max_results。
布尔值和非整数浮点数直接判无效。
普通int()会静默截断YAML里的3.5。
还会把true变成1。
无效值打警告并回退默认5。

## 三、它和谁协作

这个模块依赖谁。
依赖ddgs库。
ddgs是可选依赖。
延迟导入。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册成Agent的image_search工具。
它和brave、infoquest的image_search是并列的候选。

## 四、重要性评级

评级：4分。
理由：这是一个不需要API key的图片搜索提供商。开箱即用。它是图片生成工作流的前置参考搜索。docstring对模型的引导写得很细。阻塞IO的线程安排处理正确。但它是可选工具，功能单一。给4分。
