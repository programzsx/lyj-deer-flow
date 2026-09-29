# SecretRequirement档案

源码位置：backend/packages/harness/deerflow/skills/types.py

## 一、这个类是干什么的

SecretRequirement是技能声明的一条密钥需求。

技能需要密钥才能调用外部服务。技能在frontmatter里声明自己需要哪些密钥。每条声明变成一个SecretRequirement。

SecretRequirement是frozen dataclass。

name有双重身份。name既是请求context.secrets里的查找键。name也是激活技能时注入沙箱子进程的环境变量名。

## 二、类的成员

（一）字段

- name：密钥名。名字同时用作查找键和环境变量名。
- optional：密钥是否可选。默认False。False表示必须提供。

## 三、它和谁协作

（一）Skill

Skill的required_secrets字段装SecretRequirement元组。

（二）激活流程

技能被激活时。运行时按name查找请求的密钥。找到后注入沙箱子进程的环境变量。optional为True的密钥缺失时不阻塞。

（三）导出

export.py解析frontmatter的required-secrets时构造等价的密钥声明。

## 四、重要性评级

评级：6分。

理由：SecretRequirement是技能密钥注入的声明单元。name的一键双用让声明、查找、注入保持一致。它只是两个字段的frozen dataclass。给6分。
