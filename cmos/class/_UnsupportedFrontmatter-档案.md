# _UnsupportedFrontmatter档案

源码位置：backend/packages/harness/deerflow/skills/export.py

## 一、这个类是干什么的

_UnsupportedFrontmatter是一个内部异常。

导出要校验SKILL.md的frontmatter。frontmatter是YAML。YAML有别名和合并键。别名和合并键的结构复杂性超出导出支持范围。_guard_frontmatter检查YAML事件流时发现不支持的结构就抛这个异常。

_UnsupportedFrontmatter继承ValueError。_UnsupportedFrontmatter只携带常量公开消息和错误码。_UnsupportedFrontmatter不带解析器异常。异常文本可能含内部信息。公开消息是写死的常量。

## 二、类的成员

（一）字段

- code：错误码。默认是skill_export_yaml_complexity。别名场景换成skill_export_yaml_alias。

## 三、它和谁协作

（一）抛出者

_guard_frontmatter用yaml.parse加SafeLoader逐事件检查。事件数超过MAX_YAML_EVENTS抛它。发现AliasEvent抛它。嵌套深度超过MAX_YAML_DEPTH抛它。

（二）消费者

_manifest捕获它。捕获后错误码和消息进blockers。blockers让导出判定为不可导出。不支持的frontmatter成为明确的blocker而不是含糊的失败。

## 四、重要性评级

评级：3分。

理由：_UnsupportedFrontmatter是frontmatter校验的失败分类。它把YAML复杂性、别名、深嵌套三种不支持变成明确的blocker。常量消息防止解析器异常泄露。给3分。
