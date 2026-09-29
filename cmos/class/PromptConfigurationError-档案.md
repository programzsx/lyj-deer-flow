# PromptConfigurationError档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/prompt.py

## 一、这个类是干什么的

这个类是一个异常类。

这个类表示提示词模板的配置错误。配置错误包括三种情况。第一种情况是坏的YAML。第二种情况是缺少键。第三种情况是无效的占位符。

load_prompt和load_prompt_messages函数会抛这个异常。这两个函数加载记忆提示词模板。模板配置坏了就抛这个异常。

这个类继承自ValueError。这个类存在的意义是类型区分。调用方可以区分永久性的配置失败和可恢复的运行时错误。配置失败需要人工修复。运行时错误可以重试。两种失败用不同的异常类型区分。

## 二、类的成员

这个类继承自ValueError。

这个类没有自定义字段和方法。这个类只通过类名承载语义。

异常消息里带着具体信息。消息记录了出错的模板文件路径和占位符错误细节。

## 三、它和谁协作

- load_prompt负责抛出这个异常。load_prompt在YAML解析失败或缺少键时抛出。
- load_prompt_messages负责抛出这个异常。load_prompt_messages在占位符无效时抛出。占位符错误在_render_messages的渲染过程中抛出。
- MemoryUpdater是间接的消费者。更新器通过load_prompt加载提示词模板。配置坏了时更新器的提取写入会失败关闭。
- ValueError是它的父类。

## 四、重要性评级

评级：2分。

理由：这个类是一个类型化的异常标记。这个类没有行为。这个类的价值是让配置失败可以被识别。记忆系统的旧模板导致提取写入失败关闭时，这个异常帮助定位问题。异常类在整个系统里的作用是辅助性的。
