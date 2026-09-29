# NamedTool档案

源码位置：backend/packages/harness/deerflow/skills/tool_policy.py

## 一、这个类是干什么的

NamedTool是带名字工具的结构声明。

NamedTool是Protocol。NamedTool只声明一个属性。属性是name。

技能可以声明allowed-tools白名单。过滤工具时只需要读工具的名字。NamedTool声明了这个最小要求。任何有name属性的对象都满足这个协议。

## 二、类的成员

（一）协议属性

- name：工具名。字符串。

NamedTool没有方法。NamedTool没有实现。Protocol只做结构声明。

## 三、它和谁协作

（一）过滤函数

filter_tools_by_skill_allowed_tools用NamedTool做泛型约束。泛型参数ToolT必须满足NamedTool。过滤时按tool.name判断保留还是剔除。

（二）使用者

agent的工具列表传入过滤函数。工具类型各不相同。Protocol让过滤函数不需要依赖具体的工具类。

## 四、重要性评级

评级：2分。

理由：NamedTool只是一个单属性协议。它的作用是让工具过滤不依赖具体工具类。实现是零。给2分。
