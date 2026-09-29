# image_search_tool-档案

## 一、这个类是干什么的

image_search_tool不是类。

它是community/image_search/tools.py里的LangChain @tool函数。

image_search/tools.py是用DuckDuckGo的图片搜索工具。

不需要API key。

它在线搜图片。

在图片生成之前使用。

给角色、肖像、物品、场景找参考图。

这个模块位于backend/packages/harness/deerflow/community/image_search/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、image_search_tool

image_search按query搜图。

max_results默认5。

支持六个过滤参数。

size是Small、Medium、Large、Wallpaper。参考图用Large。

color是颜色过滤。color表示全彩。不是meta参数。

匹配计划生成图片的主色。省略则不限制。

type_image是photo、clipart、gif、transparent、line。真实参考用photo。

layout是Square、Tall、Wide。按生成需求选。

license_image是许可过滤。any、Public、Share、ShareCommercially、Modify、ModifyCommercially。

参考图会再分发时使用。

结果已是许可清理过的。

### 2、阻塞IO

配置加载和DDGS都做阻塞IO。

整个搜索setup放在一个worker里。

都不阻塞agent事件循环。

asyncio.to_thread offload。

### 3、结果

结果规整成title、image_url、thumbnail_url。

usage_hint提示先下载再用image_url作参考图。

### 4、_search_images

它用DDGS images API搜索。

异常时日志并返回空。

## 三、它和谁协作

- DDGS是搜索后端。
- get_app_config提供工具配置。
- view_image工具消费图片URL。
- brave和serper的image_search是同功能的其他实现。

## 四、重要性评级

评级是4分。

理由如下。

这个模块是无API key的图片搜索集成。

过滤参数完整。size、color、type、layout、license。

license过滤支持再分发场景。

阻塞IO在worker里。不阻塞事件循环。

这些质量不错。

扣掉6分。

扣分原因是它是可选搜索集成。

没有SSRF检查图片URL。
