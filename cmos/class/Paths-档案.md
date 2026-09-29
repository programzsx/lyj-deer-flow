# Paths档案

一、这个类是干什么的

Paths是DeerFlow应用数据的集中路径配置类。这个类不是pydantic模型。这个类管理所有应用数据的目录布局。包括记忆文件、代理目录、用户目录、线程目录、技能目录和项目目录。这个类还负责沙箱虚拟路径和宿主真实路径的转换。

二、类的成员

（一）方法

目录定位方法：
- host_base_dir：属性。宿主可见的基础目录。Docker挂载源用这个。
- base_dir：属性。所有应用数据的根目录。优先级是构造参数、DEER_FLOW_HOME环境变量、项目回退。
- thread_dir：这个方法返回线程的宿主路径。带user_id时在用户目录下。
- sandbox_work_dir、sandbox_uploads_dir、sandbox_outputs_dir：这三个方法返回工作区、上传和输出目录的宿主路径。
- user_dir：这个方法返回特定用户的目录。校验user_id的合法性。
- user_md_file、user_memory_file、user_agents_dir、user_skills_dir：这些方法返回用户画像、记忆、代理和技能目录。
- managed_subagents_dir：属性。部署级托管子代理定义目录。
- agent_dir、agent_memory_file：这两个方法是遗留的无隔离代理目录。
- integration_skills_dir：这个方法返回全局安装的托管集成技能目录。
- user_projects_dir、user_project_dir、project_documents_dir：这三个方法返回项目书架目录。
- skills_view_dir、public_skills_view_dir：这两个方法返回沙箱可见的技能投影目录。

挂载源方法：
- host_thread_dir、host_sandbox_work_dir、host_sandbox_uploads_dir、host_sandbox_outputs_dir、host_acp_workspace_dir：这些方法返回挂载源的宿主路径。保留Windows路径语法。

路径转换和安全方法：
- resolve_virtual_path：这个方法把沙箱虚拟路径解析成宿主真实路径。要求段边界匹配。拒绝路径穿越。
- project_document_path：这个方法把书架存储的相对路径解析成绝对路径。逃离根的相对路径被拒绝。
- ensure_thread_dirs：这个方法创建线程的标准沙箱目录。目录模式是0o777。让沙箱容器能写入。
- delete_thread_dir：这个方法删除线程的所有持久数据。幂等。
- prepare_user_dir_for_raw_id：这个方法返回安全用户ID并迁移遗留的不安全ID目录。旧版用SHA-1。新版用SHA-256。

模块级还有get_paths和resolve_path两个函数。get_paths返回全局Paths单例。resolve_path把相对路径解析成绝对路径。

三、它和谁协作

这个类是单例。get_paths被多处调用。thread_data_middleware和uploads_middleware构造这个类的实例。MCP工具用这个类准备工作区。项目文档模块用这个类定位书架文件。runtime_home为基础目录提供默认值。validate_thread_id提供线程ID校验。

四、重要性评级

评级：8分。

理由：这个类是所有文件系统布局的唯一权威。代理数据、用户数据、沙箱挂载都经过它。路径穿越防护在这个类里。它出错会导致数据错位或安全问题。所以重要性高。
