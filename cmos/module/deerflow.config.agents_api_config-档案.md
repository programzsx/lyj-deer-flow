# deerflow.config.agents_api_config-档案

## 一、这个模块是干什么的

这个模块管理自定义代理管理API的配置。

DeerFlow允许用户通过HTTP接口管理自定义代理。

接口覆盖代理的SOUL.md、配置、用户画像等路由。

这个配置决定这些HTTP路由是否暴露。

关闭时网关拒绝这些路由的读写访问。

## 二、模块里的主要成员

### 1、AgentsApiConfig类

只有一个字段。

`enabled`决定是否通过HTTP暴露自定义代理管理API，默认关闭。

关闭时网关拒绝自定义代理的SOUL.md、config、USER.md提示管理路由的读写。

### 2、单例函数

`get_agents_api_config()`返回当前配置。

`set_agents_api_config()`设置配置。

`load_agents_api_config_from_dict()`从字典加载。

主配置加载时刷新单例。

## 三、它和谁协作

`app_config.py`的`agents_api`字段是这份配置。

网关的代理管理路由消费这个开关。

## 四、重要性评级

评级：4分。

理由：这是管理API的总闸门，语义清晰。但只有一个布尔字段。关闭是安全侧的默认。
