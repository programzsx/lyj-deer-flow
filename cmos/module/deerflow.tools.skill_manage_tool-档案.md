# deerflow.tools.skill_manage_tool-档案

## 一、这个模块是干什么的

这个文件提供创建和演进自定义技能的工具。

工具名字是skill_manage。

自定义技能存放在skills/custom/下。

这个工具让模型自己创建和修改技能。

每个修改动作都要先过安全扫描。

扫描通过才能写入。

每次修改都记录历史。

## 二、模块里的主要成员

### 1、skill_manage_tool工具

skill_manage是async工具。

工具接受一个action参数。

动作有六种。

#### （1）create动作

create创建新技能。

技能已存在就报错。

content是必填。

先校验markdown内容。

再在临时目录里做静态扫描。

静态扫描被拦截就直接报错。

再做动态内容扫描。

全部通过才写入并记录历史。

#### （2）edit动作

edit整体重写SKILL.md。

流程和create类似。

先读旧内容。

写入后记录新旧内容到历史。

#### （3）patch动作

patch做查找替换。

find和replace是必填。

目标找不到就报错。

expected_count指定期望的替换次数。

实际次数和期望不符就报错。

替换后再校验和扫描。

#### （4）delete动作

delete删除整个技能。

删除记录历史。

#### （5）write_file动作

write_file写支撑文件。

path和content是必填。

路径要过安全检查。

路径是目录就报错。

scripts/下的文件是可执行内容。

可执行内容要求扫描结果是allow。

二进制资产没有旧文本。

历史记录取None而不是中断写入。

#### （6）remove_file动作

remove_file删除支撑文件。

### 2、安全扫描

_scan_or_raise做动态内容扫描。

decision是block就抛错。

可执行内容要求allow。

_scan_static_candidate_or_raise做静态扫描。

扫描在临时目录里进行。

临时目录复制现有技能再加更新。

静态扫描失败和被拦截有不同的错误处理。

### 3、锁和用户隔离

锁按user_id加skill_name分粒度。

WeakValueDictionary存放锁。

分粒度避免跨用户互相阻塞。

用户id从runtime解析。

每次动作完成后刷新用户的技能提示词缓存。

### 4、只读技能保护

目标技能是内置或共享技能时报错。

只读技能不能被修改。

要定制就创建自己的同名版本。

### 5、同步包装

工具的func被换成同步包装。

同步包装来自make_sync_tool_wrapper。

这样同步agent路径也能调用这个工具。

## 三、它和谁协作

它依赖deerflow.skills的存储和扫描器。

它依赖deerflow.agents.lead_agent.prompt的缓存刷新。

它依赖deerflow.tools.sync的同步包装。

它被tools.py在skill_evolution配置开启时加入工具集。

## 四、重要性评级

评级是6分。

理由是这个文件让模型能自己演进技能。

每次写入都有双重安全扫描。

静态扫描加动态扫描。

扫描挡住了恶意技能内容。

历史记录让修改可追溯。

不评高分的原因是它是可选功能。

skill_evolution不开启时它不在工具集里。
