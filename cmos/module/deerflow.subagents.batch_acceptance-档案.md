# deerflow.subagents.batch_acceptance-档案

## 一、这个模块是干什么的

这个模块为持久批处理项运行验收检查。批处理项没有父工具运行时。

普通task委派的验收检查在task工具里做。task工具有完整的父运行时。持久批处理项可能在另一个worker上恢复执行。没有父工具运行时可言。

这个模块重建检查需要的运行时环境。授权。沙箱租约。线程数据。然后调用同一个验收检查函数。

## 二、模块里的主要成员

### 1、_thread_data函数

这个函数构建线程数据字典。

从get_paths()取三个路径。workspace_path。uploads_path。outputs_path。三个路径都按thread_id和user_id构建。

这个字典就是验收检查需要的thread_data。

### 2、check_batch_acceptance函数

这是主函数。异步的。

函数先走run_sync_lifecycle_operation规范化标准。没有可用标准返回None。

然后从batch字典取thread_id、user_id、execution_spec。

构建授权上下文。上下文从spec里取user_role、oauth_provider、oauth_id、channel_user_id、is_internal、authz_attributes。加上thread_id和user_id。

构建runtime。SimpleNamespace带state、context、config。state带thread_data。config带configurable.thread_id。

关键分支。标准里有文件类标准时。检查需要读沙箱文件。文件检查用授权的、所有者范围的共享线程沙箱持有者。所以要先授权。再拿沙箱提供者。再获取沙箱客户端租约。租约的前缀是batch-acceptance。runtime的state里放sandbox_id。上下文里放租约所有者。

标准里没有文件类标准时。检查只做证据或语法判断。不需要沙箱。

最后在run_sync_lifecycle_operation里调用check_acceptance_criteria。阻塞读在释放租约前排干。包括关机时。

finally里释放租约。

## 三、它和谁协作

batch_service在批处理项完成后调用check_batch_acceptance。

acceptance_checks的check_acceptance_criteria和normalize_acceptance_criteria被复用。parse_file_criterion用来判断是否需要沙箱。

它依赖authz的沙箱授权。依赖sandbox的租约管理。依赖sandbox_provider。

它和普通task的验收检查共享同一个check_acceptance_criteria。但重建了自己的运行时环境。

## 四、重要性评级

评级是4分（满分10分）。

理由：

这个模块是批处理项验收的运行时重建层。批处理项没有父工具运行时。它重建了授权、租约、线程数据。

它复用同一个验收检查函数。和普通task的验收标准一致。不漂移。

租约管理细。检查前拿租约。检查后排干再释放。取消和关机时也排干。

它很小。58行。它只是粘合层。给4分。
