# app.gateway.github包档案

## 一、这个模块是干什么的

app.gateway.github包是GitHub webhook分发器的子包入口。

源文件是backend/app/gateway/github/__init__.py。

它的角色很特殊。

它不是普通门面。

它的核心动作只有一个副作用导入。

它把run_policy模块导入一次。

这个导入触发GitHub渠道的ChannelRunPolicy注册。

注册发生在这个包被导入的那一刻。

docstring完整说明了子包的架构。

子包把入站webhook到自定义代理再到写回的流水线拆成小模块。

每个模块单一职责。

每个模块可以独立测试。

## 二、模块里的主要成员

docstring列出了八个成员模块。

identity模块负责机器人循环防护和确定性线程id。

triggers模块负责判断事件是否触发代理的纯逻辑。

prompts模块负责把payload转成用户提示串。

registry模块负责扫描自定义代理并按仓库和事件建立索引。

app_auth模块负责GitHub App的JWT和安装令牌签发。

writeback模块负责把评论POST回GitHub。

run_policy模块负责注册进ChannelManager的渠道运行策略。

dispatcher模块负责编排上述全部并创建langgraph运行。

这个__init__.py本身只导入run_policy。

导入带有noqa: F401标记。

这个标记表明导入是为副作用，不是为使用。

副作用导入有一个明确收益。

收益是直接构建ChannelManager的测试也能自动继承注册。

## 三、它和谁协作

它向内聚合八个单职责模块。

它向外只有一个消费者。

消费者是app.gateway.routers.github_webhooks路由。

docstring明确声明了这个唯一消费关系。

它还与app.channels.manager协作。

run_policy把渠道运行策略注册进ChannelManager。

ChannelManager在首次投递时找到这个策略。

## 四、重要性评级

评级是6分。

理由如下。

它是GitHub集成流水线的组织中心。

八个模块的分工说明全在docstring里。

这份docstring本身就是一份架构文档。

副作用导入的设计很关键。

没有它，策略注册时机不可控。

扣分点在于它不做任何常规导出。

调用方总是深入子模块取东西。

门面本身只完成注册这一件事。
