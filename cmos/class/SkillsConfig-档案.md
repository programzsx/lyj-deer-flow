# SkillsConfig档案

一、这个类是干什么的

SkillsConfig是技能系统的配置类。这个类描述技能存储实现和技能目录。这个类还控制技能发现的延迟方式。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- use：字符串。默认值是deerflow.skills.storage.local_skill_storage:LocalSkillStorage。这个字段是SkillStorage实现的类路径。
- path：字符串或None。默认值是None。这个字段是技能目录路径。不指定时默认是项目根下的skills。回退到遗留的仓库根位置。
- container_path：字符串。默认值是DEFAULT_SKILLS_CONTAINER_PATH。这个字段是技能在沙箱容器里的挂载路径。
- deferred_discovery：布尔值。默认值是False。这个字段启用后技能元数据不注入系统提示。只有技能名出现在skill_index里。LLM按需用describe_skill工具发现细节。

（二）方法

- get_skills_path：这个方法返回解析后的技能目录路径。解析顺序是显式path、DEER_FLOW_SKILLS_PATH环境变量、项目根默认、遗留候选。目录不存在时返回项目根默认。让调用者能报告稳定的位置。
- get_skill_container_path(skill_name, category)：这个方法返回特定技能的完整容器路径。category是public或custom。

三、它和谁协作

AppConfig持有这个类。AppConfig的skills字段是这个类的实例。技能存储工厂用use字段加载存储实现。沙箱挂载用container_path。deferred_discovery影响技能索引的生成。

四、重要性评级

评级：6分。

理由：技能是代理能力的重要来源。目录解析和容器路径决定技能能否被使用。延迟发现影响上下文占用。所以重要性中等偏上。
