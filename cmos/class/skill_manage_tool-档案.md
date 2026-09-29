# skill_manage_tool-档案

## 一、这个类是干什么的

skill_manage_tool不是类。

skill_manage_tool是tools/skill_manage_tool.py里的工具函数。

这个工具让代理创建和演进自定义技能。

它管理skills/custom/下的技能。

支持六种操作。

操作是create、patch、edit、delete、write_file、remove_file。

每次写入都经过静态扫描和模型安全扫描。

每次变更都追加历史记录。

这个工具在skill_evolution配置启用时才加入工具集。

这个模块位于backend/packages/harness/deerflow/tools/skill_manage_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、锁机制

锁粒度是(user_id, skill_name)二元组。

这样不同用户的技能操作互不阻塞。

锁存放在WeakValueDictionary里。

### 2、_scan_or_raise函数

这个函数做模型安全扫描。

扫描决定为block时抛错。

可执行内容且决定不是allow时抛错。

扫描时不重复附加追踪。

原因是图根已经附加了追踪。

### 3、_scan_static_candidate_or_raise函数

这个函数做静态扫描。

在临时目录里构造候选技能目录。

写入更新内容后调用enforce_static_scan。

静态扫描阻止时抛带findings的错误。

### 4、_skill_manage_impl函数

这是实现函数。

按action分支处理。

- create创建自定义技能。已存在时报错。先验证markdown内容，再静态扫描，再模型扫描，再写文件，再追加历史，再刷新提示词缓存。
- edit整体编辑SKILL.md。流程同create加记录prev_content。
- patch做find和replace替换。先检查目标存在。expected_count不匹配时报错。
- delete删除技能。带历史元数据。
- write_file写支持文件。路径必须是安全支持路径。scripts/路径标记为executable。可执行内容扫描拒绝非allow。二进制资产没有以前的文本。历史记录用None而不是中止写入。
- remove_file删除支持文件。

每次变更都调用refresh_user_skills_system_prompt_cache_async刷新缓存。

### 5、skill_manage_tool

这是@tool装饰的入口。

同名同步包装在模块末尾挂上。

## 三、它和谁协作

- skills/storage的SkillStorage负责读写技能文件。
- skills/security_scanner和security_static_scanner负责安全扫描。
- lead_agent/prompt负责刷新系统提示缓存。
- runtime用户上下文负责解析user_id。

## 四、重要性评级

评级是7分。

理由如下。

这个工具是技能演进能力的执行者。

代理能通过它创建和修改自己的技能。

每次写入都过两道扫描。静态扫描加模型扫描。

锁粒度按用户和技能避免跨用户阻塞。

二进制资产的历史记录处理有细节。

但它依赖扫描器和存储层。

本身是分支逻辑。

扣掉3分。
