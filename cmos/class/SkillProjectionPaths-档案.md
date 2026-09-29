# SkillProjectionPaths档案

源码位置：backend/packages/harness/deerflow/skills/projection.py

## 一、这个类是干什么的

SkillProjectionPaths是技能投影视图的稳定类别根路径。

技能要投影到沙箱里。沙箱按类别挂载技能。投影路径必须稳定。稳定的意思是路径不随会话变化。沙箱供应商挂载或上传时用这些路径。

SkillProjectionPaths是frozen dataclass。

## 二、类的成员

（一）字段

- public：public类别的根路径。平台内置技能。
- custom：custom类别的根路径。用户自建技能。
- legacy：legacy类别的根路径。迁移前的全局技能。
- integrations：integration类别的根路径。托管第三方技能。

## 三、它和谁协作

（一）产生者

get_skill_projection_paths产出全局投影路径。有user_id时路径按用户隔离。没有user_id时用全局视图目录。get_thread_skill_projection_paths产出单线程的投影路径。线程级投影要求用户隔离的存储。没有user_id直接抛ValueError。

（二）消费者

沙箱供应商按这些路径挂载技能目录。SkillToolPolicyMiddleware用线程级投影构建策略视图。thread_skill_projection_exists用路径判断线程是否进入稳定视图。

（三）锁

projection.py用进程内RLock表保护投影目录。_lock_for按解析后的路径取锁。锁表带全局守卫。

## 四、重要性评级

评级：5分。

理由：SkillProjectionPaths是技能投影的路径契约。路径稳定让挂载和策略视图可预期。它承载了四个类别的根路径。它是纯路径数据类。给5分。
