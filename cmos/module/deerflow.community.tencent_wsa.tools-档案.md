# 模块档案：deerflow.community.tencent_wsa.tools

## 一、这个模块是干什么的

这个模块定义一个Agent工具。
工具名是web_search。
底层是腾讯云网络搜索API。
就是WSA。
它POST到api.wsa.cloud.tencent.com的SearchPro端点。
使用它需要API key。
环境变量是TENCENTCLOUD_WSA_APIKEY。
从config.yaml也可以配置api_key。
这个模块处理腾讯云API的几个特殊行为。
响应包在Response字段里。
错误在Response的Error字段里。
Pages字段可能是JSON字符串数组。
也可能是对象数组。

## 二、模块里的主要成员

（1）web_search_tool
这是唯一的Agent工具。
参数有query和max_results。
max_results默认5。
上限50。
从配置里可覆盖。
强转只接受整数和数字字符串。
无效值打警告并回退默认。
query为空返回错误。
API key从配置或环境变量取。
没有key返回结构化错误。
每个工具名只告警一次。

（2）模式与请求量
_get_mode处理腾讯云的结果模式。
Mode省略时腾讯云默认自然网页结果。
保持那个默认。
不隐式请求VR或混合结果。
mode配置了才传。
mode必须是0、1、2之一。
无效打警告并省略Mode。
_request_count处理腾讯云的Cnt值。
API默认响应大小是10。
Cnt只在支持它的腾讯云套餐上可用。
请求能放进默认响应时就省略Cnt。
放不下时请求最小的支持批次。
按10向上取整。

（3）响应解析
_search发送POST请求。
带Bearer授权。
返回data加error_json元组。
超时30秒。
_get_response提取Response对象。
带出RequestId。
Response里的Error字段是API错误。
错误码提取出来。
带request_id放进错误JSON。
_parse_results解析Pages字段。
Pages为None当无结果。
非列表当格式错误。
字符串元素尝试JSON解析。
解析失败跳过。
对象元素直接用。
这个兼容是为前向兼容API表示变化。
title、url、content从页面数据里取。
content取不到时用passage字段。
date、site、score字段有条件保留。

## 三、它和谁协作

这个模块依赖谁。
依赖httpx发HTTP请求。
依赖langchain的tool装饰器。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册给Agent。
config.yaml的tools列表里配置了才启用。
腾讯云WSA是国内可用的搜索API选择。

## 四、重要性评级

评级：4分。
理由：这是腾讯云搜索API的可选提供商。它对腾讯云API的特殊行为处理细致。Response信封、Pages的双重表示、Cnt的按需请求、Mode的保持默认都有。错误带request_id方便排障。它是可选集成。给4分。
