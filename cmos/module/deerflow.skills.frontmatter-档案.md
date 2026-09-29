# deerflow.skills.frontmatter-档案

## 一、这个模块是干什么的

这个模块提供SKILL.md文件frontmatter部分的共享解析助手。

一个SKILL.md文件长这样。文件开头是两条"---"夹起来的YAML块。YAML块后面是正文。开头那个YAML块叫frontmatter。

运行时的parser、安装时的校验器、评审核心都用这个模块。frontmatter是唯一的数据模式来源。三处共用一个定义。这样三处就不会漂移。

## 二、模块里的主要成员

### 1、ALLOWED_FRONTMATTER_PROPERTIES

这是一个集合。这个集合列出frontmatter允许的全部属性名。

允许的属性有name、description、license、allowed-tools、argument-hint、required-secrets、secrets-autonomous、metadata、compatibility、version、author。

validation模块用它拒绝不认识的键。

### 2、_FRONTMATTER_RE正则

这个正则匹配frontmatter块。正则容忍文件开头的UTF-8 BOM字符。

BOM是﻿。Windows记事本和PowerShell的Set-Content -Encoding UTF8保存文件时会加BOM。正则把BOM消费掉。这样frontmatter和正文都不会带BOM往下游走。

### 3、SkillMarkdownParts数据类

SkillMarkdownParts装解析结果。用frozen dataclass定义。有三个字段。

- metadata。metadata是解析出来的YAML字典。
- frontmatter_text。frontmatter_text是frontmatter原文。
- body。body是frontmatter之后的正文。

### 4、split_skill_markdown函数

这个函数把SKILL.md内容拆成frontmatter和正文。

成功时返回（parts，None）。失败时返回（None，错误消息）。

失败情况有三种。没有frontmatter。YAML解析失败。frontmatter不是字典。

错误消息故意不带宿主机路径。调用方可以把这个消息直接用在确定性的评审输出里。评审输出要求确定性。带路径会引入环境差异。

函数还做一步规范化。YAML允许非字符串键。下游校验要求字段名是字符串。所以函数把所有键转成字符串。

## 三、它和谁协作

parser用它_FRONTMATTER_RE正则来定位frontmatter。

validation用它来拆分和校验安装内容。

export用它来拆分导出技能的frontmatter。

review目录的评审核心也用它。

它只依赖yaml库。它不依赖其他技能模块。

## 四、重要性评级

评级是6分（满分10分）。

理由：

frontmatter是"一处定义、三处共用"的典型例子。没有它，parser、validation、export会各自实现一份拆分逻辑。三份实现迟早漂移。漂移的结果是安装和运行时对同一个文件判出不同结论。

BOM容忍处理了Windows平台的真实差异。错误消息不带路径保护了评审输出的确定性。

评级不高的原因是它很小。它只有几十行。它做的事情单一。它错了影响面也清楚。
