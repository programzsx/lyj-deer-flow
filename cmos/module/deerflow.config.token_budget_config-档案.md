# deerflow.config.token_budget_config-档案

## 一、这个模块是干什么的

这个模块管理每次运行的令牌预算配置。

一次运行可能消耗大量令牌。

失控的运行会烧掉预算。

这个中间件给每次运行设预算上限。

接近上限时注入软警告。

到达上限时剥掉工具调用，强制代理给出最终答案。

## 二、模块里的主要成员

### 1、TokenBudgetConfig类

`enabled`是开关，默认关闭。

`max_tokens`是输入加输出的总上限，默认20万。

`max_input_tokens`和`max_output_tokens`是可选的单独限制。

`warn_threshold`是软警告的比例，默认0.8。

也就是用到80%时警告。

`hard_stop_threshold`是硬停止的比例，默认1.0。

到达时工具调用被剥掉，强制产出最终答案。

### 2、阈值校验

校验器保证硬停止不能早于警告触发。

`hard_stop_threshold`必须大于等于`warn_threshold`。

否则警告还没发就先停了，没有意义。

## 三、它和谁协作

`app_config.py`的`token_budget`字段是这份配置。

`subagents_config.py`用它构造子代理的默认预算。

令牌预算中间件消费这份配置。

## 四、重要性评级

评级：6分。

理由：令牌预算是成本兜底的重要机制。子代理默认预算基于这个类。校验逻辑简单但关键。
