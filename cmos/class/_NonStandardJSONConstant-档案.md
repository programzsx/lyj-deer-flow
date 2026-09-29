# _NonStandardJSONConstant档案

源码位置：backend/packages/harness/deerflow/subagents/acceptance_checks.py

## 一、这个类是干什么的

_NonStandardJSONConstant是一个内部异常类。

_NonStandardJSONConstant继承ValueError。

_NonStandardJSONConstant用于区分非标准JSON常量和解析器资源限制。

具体场景是这样的。json-valid叶子检查一个文件是不是合法JSON。JSON标准不允许NaN、Infinity这些常量。json.loads的parse_constant钩子遇到这些常量时抛异常。异常用_NonStandardJSONConstant。

区分的意义是这样的。json.loads也可能因为别的原因抛ValueError。原因是解析器资源限制。资源限制要保持UNVERIFIED。非标准常量是明确的语法错误。语法错误可以判checked为True。

_reject_json_constant函数抛这个异常。检查代码捕获UnicodeDecodeError、json.JSONDecodeError、_NonStandardJSONConstant三种。

## 二、类的成员

_NonStandardJSONConstant没有自定义字段。_NonStandardJSONConstant没有自定义方法。

## 三、它和谁协作

（一）抛出者

_reject_json_constant函数抛它。函数作为json.loads的parse_constant钩子。

（二）消费者

_check_json_file捕获它。捕获后叶子判为语法错误。

## 四、重要性评级

评级：2分。

理由：_NonStandardJSONConstant只是一个内部的异常分类标记。它的存在让JSON检查能区分"语法错误"和"资源限制"。没有它两种失败会混在一起。它是一个空异常类。给2分。
