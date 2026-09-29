# deerflow.workspace_changes.api

## 一、这个模块是干什么的

这个模块把工作区变更变成对外响应。

背景是这样的。

一次运行会改工作区文件。

变更被记录成持久化事件。

用户想看"这次运行改了什么"。

回答就从这个模块来。

它从事件存储里找最新的一条工作区变更事件。

最多找10条里的一条。

找到后把payload提取出来。

提取优先从事件metadata里取。

metadata没有再从content里取。

然后按调用方的需要裁剪。

不要文件列表就清空文件。

要文件列表但不要diff就把diff清掉。

找不到事件就返回一个"不可用"的空响应。

## 二、模块里的主要成员

- get_workspace_changes_response(event_store, thread_id, run_id, ...)：核心函数。返回变更响应字典。
- 参数include_files控制要不要文件列表。
- 参数include_diff控制要不要diff内容。
- 响应里有available字段。True表示找到了变更事件。False表示没有。
- 响应里还有version、summary、files、limits字段。
- _extract_workspace_changes_payload：从事件里提取payload。优先metadata键，其次content。
- _without_diff：把单个文件条目的diff清空。
- _empty_response：构造不可用的空响应。
- EMPTY_SUMMARY：空汇总的常量。

## 三、它和谁协作

- 它依赖event_store的list_events方法查询事件。
- 它依赖workspace_changes/types的事件类型常量。
- 它被app/gateway/routers/thread_runs.py调用。路由把它暴露成HTTP接口。

## 四、重要性评级

评级是4分。

理由是它是工作区变更功能的对外查询出口。

没有它，用户看不到运行改了什么。

但它的逻辑是薄薄的一层读取和裁剪。

出错的影响限于接口返回空响应。
