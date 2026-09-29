# deerflow.persistence.subagent_batches包档案

## 一、这个模块是干什么的

deerflow.persistence.subagent_batches包是子代理批次持久化的包门面。

源文件是backend/packages/harness/deerflow/persistence/subagent_batches/__init__.py。

它的角色是立即导入式薄门面。

它把子代理批次持久化的ORM模型和SQL仓库一次性导入并暴露。

它没有懒加载。

它没有docstring。

它的价值在__all__清单上。

清单覆盖了两个行模型和一个仓库。

## 二、模块里的主要成员

它从两个模块导入成员。

model模块提供SubagentBatchRow、SubagentBatchItemRow。

SubagentBatchRow是批次级的ORM行模型。

SubagentBatchItemRow是批次内单个子代理条目的行模型。

一行批次对应多行条目。

sql模块提供SubagentBatchRepository。

SubagentBatchRepository是批次仓库。

三个成员在__all__里。

这个包的数据结构是主表加明细表。

主表是批次。

明细表是条目。

## 三、它和谁协作

它向内聚合model和sql两个模块。

它向上被app.subagent_batches服务和网关消费。

子代理批次的写入和查询走这里。

它与deerflow.subagents协作。

harness层执行批次并产出记录。

持久层保存记录。

它还被deerflow.persistence.models引用。

models子包把两个行模型注册进Base.metadata。

## 四、重要性评级

评级是5分。

理由如下。

它是子代理批次持久化的正式入口。

主表加明细表的数据结构在这里成对暴露。

调用方一次导入即可拿到全部三个成员。

它参与models子包的ORM注册链条。

扣分点在于它没有docstring。

内容较少。

复杂度在sql模块里。
