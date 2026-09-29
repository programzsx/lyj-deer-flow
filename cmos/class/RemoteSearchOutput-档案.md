# RemoteSearchOutput档案

源码位置：backend/packages/harness/deerflow/sandbox/remote_search.py

## 一、这个类是干什么的

RemoteSearchOutput是远程搜索命令的输出。

远程提供者在沙箱里用grep或find搜索。命令包装成grep ... | head或find ... | head的形式。输出由remote_search_command包装、由parse_remote_search_output解析。解析结果用RemoteSearchOutput表示。

RemoteSearchOutput记录两件事。

第一。text。输出行文本。

第二。truncated。搜索是否产出了超过limit的行。truncated为True时，从text里过滤出的结果可能不完整。

调用方在Python里过滤有界行（忽略目录、glob作用域）。所以返回少于max_results不能证明搜索是完整的。命令放limit加一行过limit。解析器报告这一行是否到达。恰好limit行是完整结果。

RemoteSearchOutput是NamedTuple。

## 二、类的成员

（一）字段

- text：输出行文本。不含状态标记。
- truncated：搜索是否产出了超过limit的行。

## 三、它和谁协作

（一）产生者

remote_search.py的parse_remote_search_output产生RemoteSearchOutput。解析远程搜索命令的stdout。

（二）状态标记

远程搜索命令带__DF_SEARCH_STATUS__状态标记。标记决定成功、根缺失、读错误。标记问题抛FileNotFoundError或OSError。

（三）消费者

Sandbox.grep和Sandbox.glob的远程实现消费RemoteSearchOutput。工具层把结果给模型。

## 四、重要性评级

评级：3分。

理由：RemoteSearchOutput是远程搜索结果的标准载体。truncated标志让工具层能告诉模型结果可能不完整。远程搜索的正确性（pipefail缺失问题、SIGPIPE、状态标记）都围绕这个载体。它只是两字段结构。给3分。
