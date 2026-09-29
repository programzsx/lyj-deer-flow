# TokenBudgetConfig档案

一、这个类是干什么的

TokenBudgetConfig是单次运行token预算的配置类。这个类控制每次运行最多消耗多少token。这个类还控制警告阈值和硬停止阈值。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示是否启用单次运行的token预算控制。
- max_tokens：整数。默认值是200000。最小值是1000。这个字段是每次运行允许的总token上限。包含输入和输出。
- max_input_tokens：整数或None。默认值是None。这个字段是单独的输入token上限。
- max_output_tokens：整数或None。默认值是None。这个字段是单独的输出token上限。
- warn_threshold：浮点数。默认值是0.8。取值范围是0到1。这个字段是软警告的触发比例。0.8表示到达80%时警告。
- hard_stop_threshold：浮点数。默认值是1.0。取值范围是0到1。这个字段是硬停止的触发比例。到达这个比例时工具调用被剥离。代理被强制产出最终答案。

（二）方法

- validate_thresholds：模型校验器。这个方法确保硬停止不能先于警告触发。如果hard_stop_threshold小于warn_threshold就报错。

三、它和谁协作

AppConfig持有这个类。AppConfig的token_budget字段是这个类的实例。SubagentsAppConfig也持有这个类。子代理的默认预算由default_subagent_token_budget构造。SubagentOverrideConfig的token_budget字段允许按子代理覆盖预算。

四、重要性评级

评级：7分。

理由：这个类是成本兜底机制。没有预算控制，失控的运行会烧掉大量token。硬停止阈值保护系统不被 DoS。所以重要性中上。
