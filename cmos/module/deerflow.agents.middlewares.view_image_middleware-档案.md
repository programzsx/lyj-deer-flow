# deerflow.agents.middlewares.view_image_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/view_image_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责把用户查看过的图片重新注入模型请求。

视觉模型需要看到图片才能分析图片。

智能体通过view_image工具查看图片。

查看动作只在状态里留下轻量元数据。

元数据包括路径、MIME类型、大小、SHA-256摘要、来源沙箱id。

base64图片数据不会进入检查点状态。

这个中间件在每次模型调用前按需重建图片上下文。

它从沙箱或宿主镜像读取图片字节。

它把图片编码成base64。

它把base64放进一条隐藏的HumanMessage。

这条消息只存在于本次模型请求里。

这条消息永远不会写入检查点。

这样被中断的运行不会把巨大的base64载荷遗留在线程历史里。

只有支持视觉的模型才会装配这个中间件。

## 二、模块里的主要成员

### 1、类ViewImageMiddlewareState

ViewImageMiddlewareState继承ThreadState。

复用线程状态是为了让带reducer的键保留注解。

### 2、类ViewImageMiddleware

ViewImageMiddleware是中间件主体。

它只实现了wrap_model_call和awrap_model_call两个钩子。

它不实现before_model和after_model。

这一点是故意的。

早期的实现用过before_model和after_model对。

那个实现把base64载荷写进了状态。

被中断的运行会把载荷遗留在历史里。

这就是issue #4267的教训。

现在注入只发生在wrap_model_call里。

#### （1）wrap_model_call钩子

wrap_model_call是同步版本。

它调用_inject重建请求。

然后调用handler处理注入后的请求。

注入在当前调用栈内联执行。

没有分离的工作线程。

外层沙箱租约必须等到这个阻塞读返回或抛出才能到达释放边界。

#### （2）awrap_model_call钩子

awrap_model_call是异步版本。

图片读取加base64编码可能很慢。

图片最大20MB。

所以异步版本先做授权检查。

然后用run_sync_lifecycle_operation把阻塞的注入工作派发出去。

派发时不允许取消操作比沙箱客户端操作活得更久。

只有异步版本会传authorization_checked=True。

这个标记避免同步worker里重复做一次同步授权调用。

#### （3）_inject方法

_inject是注入的核心。

它先做消息清理。

清理用_is_image_context_message识别本中间件自己的消息。

识别条件有三个。

条件一是HumanMessage类型。

条件二是消息id以"view-image-context:"前缀开头。

条件三是additional_kwargs里有deerflow_view_image_context标记且为True。

两个标识必须同时满足。

Gateway会从客户端输入里剥离这个标记。

所以这个清理永远不会误删用户写的消息。

清理会清掉"搁浅"的旧图片上下文消息。

早期检查点可能带着一条进入状态但从未被移除的消息。

搁浅消息不清掉就会在之后每次请求里跟着走。

清理后再判断是否该注入。

判断用_should_inject_image_message。

需要授权时先执行sandbox:execute授权检查。

授权被拒绝就不读任何图片。

被拒绝的恢复视图可能早于角色或策略变更。

授权通过后才构建图片内容。

最后返回带一条新建图片上下文消息的请求。

#### （4）图片读取的信任边界

_read_image_as_data_url按viewed_images元数据读取精确的字节。

活沙箱只对同一沙箱代记录的元数据有权威。

如果线程现在指向替换沙箱。

旧图片只能从同步的宿主镜像重建。

重建要求SHA-256精确匹配view_image当时看到的字节。

没有摘要的遗留元数据永远不会授权跨代回退。

遗留检查点无法证明字节来自哪一代沙箱。

这种情况直接返回None。

这个处理防止用新激活的远程文件系统悄悄重解释历史图片上下文。

_read_host_image_as_data_url读取验证过的宿主镜像。

读取前会校验文件存在、大小一致、不超过20MB。

_encode_image_bytes校验字节和记录的元数据。

大小不匹配或超限返回None。

摘要不匹配返回None。

校验通过才编码成data URL。

#### （5）宿主路径绑定

_host_path_matches_request把存储的宿主副本绑定到认证运行的用户和线程。

绑定检查包括以下几项。

image_path必须是允许的虚拟图片路径。

运行时上下文的thread_id和configurable的thread_id必须一致。

ThreadDataMiddleware可能用自定义Paths基础。

自定义基础时root路径必须匹配users/用户/threads/线程/user-data/根名的六段结构。

还要通过validate_local_tool_path校验。

最后要求actual_path解析后等于期望路径。

缺线程身份或不匹配都会跳过宿主读取。

#### （6）注入条件判断

_should_inject_image_message判断是否该追加图片消息。

判断条件如下。

最后一条助手消息必须包含view_image工具调用。

那个消息里的所有工具调用必须都已完成。

已完成指有对应的ToolMessage。

之后不能再有已存在的图片详情消息。

旧检查点的未标记图片消息无法和用户文本区分。

这些消息留在原地但不重复添加。

#### （7）消息构造

_create_image_context_message创建可识别的模型专用消息。

消息id用"view-image-context:"前缀加uuid。

additional_kwargs里有hide_from_ui为True。

有服务端标记键。

还有provenance_kwargs(ContentKind.IMAGE_PAYLOAD, "view_image")来源戳。

provenance戳是AGENTS.md规定的消息来源约定。

_create_image_details_message构建混合内容块。

内容块包含文本描述和image_url图片。

图片读不到时会放一条"(file unavailable or changed)"文本。

### 3、模块级常量

_MAX_IMAGE_BYTES是20MB。

这个上限是工具侧写入上限的纵深防御镜像。

工具在写入时强制这个上限。

中间件在读取时再检查一次。

因为文件可能在查看和注入之间长大。

_IMAGE_CONTEXT_MESSAGE_ID_PREFIX是"view-image-context:"。

_IMAGE_CONTEXT_MESSAGE_MARKER_KEY是"deerflow_view_image_context"。

## 三、它和谁协作

这个中间件位于中间件链的lead-only段。

它依赖以下模块。

依赖ThreadState的viewed_images元数据。

依赖沙箱提供者下载文件。

依赖deerflow.sandbox.overwrite解包沙箱状态。

依赖deerflow.authz.sandbox_authz做sandbox:execute授权。

依赖deerflow.sandbox.lease的run_sync_lifecycle_operation。

依赖deerflow_extension_api的provenance_kwargs来源戳。

依赖tools/builtins/view_image_tool的虚拟路径校验。

它被中间件装配函数按条件配置。

只有视觉模型才会装配它。

它产生的隐藏消息只存在于ModelRequest里。

消费方是模型本身。

## 重要性评级

评级是7分。

理由如下。

视觉支持是这个产品的完整功能特性。

没有这个中间件，view_image工具看到的图片模型根本看不到。

视觉功能等于失效。

这个中间件的信任边界处理非常细致。

消息识别要求双标识。

跨沙箱代恢复要求摘要匹配。

宿主读取要求路径绑定。

授权检查在两条路径都有。

所以评级是7分。

不评更高分的理由是它只服务视觉模型。

非视觉场景完全不依赖它。
