# deerflow.agents.task_continuity包档案

## 一、这个模块是干什么的

deerflow.agents.task_continuity包是父任务连续性的子包入口。

源文件是backend/packages/harness/deerflow/agents/task_continuity/__init__.py。

文件极小。

文件只有一句docstring。

docstring说明这个包的定位。

定位是有边界的父任务连续性。

边界是与长期用户记忆独立。

它不做任何导入。

它不暴露任何成员。

它的角色是命名空间标记加一行自我说明。

父任务连续性是代理在子代理批次结束后延续父任务状态的能力。

这个能力独立于长期记忆系统。

两者各管各的数据。

## 二、模块里的主要成员

它没有__all__声明。

它没有导入语句。

它没有任何成员。

目录内的实际成员有三个模块。

archive模块负责归档。

state模块负责状态。

tools模块负责工具。

调用方直接按模块路径导入。

没有从这个__init__.py导入的用法。

## 三、它和谁协作

它向上被deerflow.agents包内的组装逻辑消费。

它向下包含archive、state、tools三个模块。

它向外的边界是deerflow.agents.memory包。

docstring明确声明两个包独立。

连续性数据不进长期记忆。

长期记忆不掺连续性。

这个边界是刻意的架构安排。

## 四、重要性评级

评级是4分。

理由如下。

它本身零逻辑。

它的价值在结构和那一句自我说明。

那一句docstring划清了连续性和记忆的边界。

边界声明是有架构价值的。

扣分点在于它不做聚合。

调用方必须深入子模块。

文件很小。
