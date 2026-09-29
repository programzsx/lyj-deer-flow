# _ModelPricing档案

类定义在backend/app/gateway/routers/console.py。

## 一、这个类是干什么的

这个类是单个模型定价的内部结构。

控制台要估算运行费用。费用需要每个模型的价格。价格来自config.yaml的models配置里的pricing块。

这个类记录一个模型的价格信息。这个类是一个NamedTuple。这个类不是Pydantic模型。

这是一个私有类。类名以下划线开头。这个类只在console.py内部使用。

## 二、类的成员

这个类有4个字段。

### 1、input_per_million

input_per_million是每百万输入token的价格。这个字段是浮点数类型。

### 2、output_per_million

output_per_million是每百万输出token的价格。这个字段是浮点数类型。

### 3、currency

currency是货币单位。这个字段是字符串类型。

所有定价的模型必须用一种货币。混合货币会禁用费用报告。

### 4、input_cache_hit_per_million

input_cache_hit_per_million是提示缓存命中的输入价格。

这个字段是浮点数类型。默认是None。

None表示缓存命中按完整输入价格计费。这是一个保守的上限。运营商没配置命中价格时用这个规则。

## 三、它和谁协作

这个类在控制台的费用计算中使用。

由_build_pricing_map函数从配置收集。条目按配置名称和供应商模型编号两种键索引。因为token用量记录的是供应商报告的模型名。

ModelConfig允许额外字段。运营商可以不加schema直接写pricing块。

## 四、重要性评级

评分是4分。

理由如下。

费用估算是控制台的重要功能。这个类是定价数据的核心结构。

缓存命中价格支持缓存感知计费。计费更准确。

这个类是内部结构。所以评4分。
