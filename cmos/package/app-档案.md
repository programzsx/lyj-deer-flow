# app包档案

源码路径是backend/app/__init__.py。

## 一、这个包是干什么的

app包是整个后端应用层的根包。

app包本身是一个空文件。

app包的__init__.py没有任何代码。

app包的作用是充当一个命名空间的根。

后端代码分成两层。

一层是harness层。

harness层的导入前缀是deerflow.*。

harness层是可发布的智能体框架包。

另一层是app层。

app层的导入前缀是app.*。

app层是未发布的应用代码。

app层包含FastAPI网关API和IM渠道集成。

app包就是这个app层的根。

这个分层有一条严格的依赖规则。

规则是app可以导入deerflow。

规则是deerflow绝对不能导入app。

这条规则由tests/test_harness_boundary.py在CI里强制执行。

## 二、包里的主要成员

app包的直接成员只有一个。

成员是空白的__init__.py。

实际内容全在子包里。

子包有以下几个。

- app.channels是IM渠道集成。
- app.gateway是FastAPI网关API。
- app.mcp_tasks是MCP长任务服务。
- app.scheduler是定时任务服务。
- app.subagent_batches是子智能体批处理服务。

## 三、它和谁协作

app包向下依赖harness层。

app包导入deerflow.*来获得智能体运行时、配置、沙箱、持久化等能力。

app包对外被启动入口引用。

启动入口通过app.gateway.app模块创建FastAPI应用。

app包绝不反向暴露给harness层。

## 重要性评级

评级是9分。

理由如下。

app包是后端应用层的根命名空间。

所有网关代码、渠道代码、后台服务代码都挂在app包下面。

后端四大服务里的Gateway API和IM渠道都由app层承载。

没有app包，整个应用层代码就没有组织结构。

app包本身虽然只是一个空的__init__.py。

但是app包承载的分层架构是整个后端最重要的边界。

删除app包等于删除整个应用层。

所以评级是9分。

不评10分的原因是app包自身没有代码，纯粹是命名空间。
