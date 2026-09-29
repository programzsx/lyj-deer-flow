# deerflow.skills.projection-档案

## 一、这个模块是干什么的

这个模块把启用的技能物化到沙箱可见的文件系统视图里。

沙箱里的agent需要读技能文件。但沙箱不应该直接挂宿主机的技能源目录。直接挂有两个问题。第一个问题是沙箱可以改写源文件。第二个问题是被动技能也会全部暴露。

projection按三个层级物化视图。全局公共视图。按用户的视图。按线程的策略视图。

视图只包含启用的技能。策略视图只包含agent允许清单里的技能。

## 二、模块里的主要成员

### 1、路径函数

get_skill_projection_paths返回一个scope的四个类别根路径。四个类别是public、custom、legacy、integrations。用户级存储时四个类别都是按用户的路径。非用户级存储时custom、legacy、integrations挂在共享视图目录下。

get_thread_skill_projection_paths返回一个线程的策略视图路径。要求用户级存储。非用户级存储抛ValueError。

thread_skill_projection_exists判断线程是否已经有稳定的策略视图。

### 2、锁机制

_projection_lock是核心锁上下文管理器。

锁有进程内和跨进程两层。进程内用RLock。按锁文件路径缓存。跨进程用fcntl.flock。Windows回退到msvcrt.locking。

锁文件是类别根旁边的隐藏文件。名字是".<类别名>.projection.lock"。

skill_projection_read_lock是有界的非变更锁获取。带超时和取消检查。导出用这把锁。和存储变更互斥。获取分两步。先拿进程锁。再拿文件锁。都是非阻塞轮询加超时。

### 3、_copy_into_view函数

这个函数用shutil.copy2复制文件。

注释很关键。永远复制。不用硬链接。硬链接共享源inode。沙箱里通过投影视图的bash写入会改到规范技能文件。隔离必须靠复制本身。PathMapping.read_only只对write_file和update_file生效。不对execute_command生效。所以复制是唯一可靠的隔离手段。

操作权衡是O(总字节)的IO和按用户加按线程的存储倍增。优先选择写隔离而不是零拷贝硬链接。

### 4、_validate_projected_skill_symlinks函数

这个函数拒绝逃逸策略范围的软链接。

绝对链接被拒绝。绝对链接会一直指向规范宿主树。

解析后逃出技能包的相对链接被拒绝。逃逸链接可能暴露被清单省略的技能。

包内相对链接保留。支持文件引用仍然可用。相对链接解析在复制的投影内部。

### 5、_stage_skill和_sync_staged_category函数

_stage_skill把一个技能复制到暂存目录。排除嵌套技能根。嵌套技能根是包边界。

_sync_staged_category把暂存目录同步到真实根。同步顺序讲究。先删掉多余的（按路径深度从深到浅）。再建目录。最后用replace原子替换文件。

### 6、签名机制

这是新鲜度检查的核心。

_source_signature计算源侧签名。public范围哈希公共技能树加extensions配置。user范围哈希用户自定义、legacy、集成三棵树加extensions配置加用户技能状态。CUSTOM、LEGACY、INTEGRATION的可见性是按用户状态和全局默认的交集。所以两份配置都在签名里。

_update_tree_digest哈希目录元数据。inode、模式、大小、修改时间。不哈希文件内容。权衡是每次沙箱获取都跑。O(文件数)但不读文件。代价是保持inode加大小的外部编辑不可见。运行时写入不受影响。变更路径在锁下重建。原子rename总是换inode。

用户自定义根的包目录软链接会被跟随。外部目标树的变化能让投影失效。嵌套和不相关的软链接保持边界标记身份。

### 7、manifest机制

manifest是一个JSON文件。装版本号、源签名、视图签名。

manifest路径是scope根下的.projection-manifest.json。

写入是原子的。mkstemp临时文件加replace。

### 8、重建函数

_rebuild_public_locked重建公共视图。最多重试2次。源签名前后一致才写manifest。不一致重试。技能反复变化抛RuntimeError。失败时清空scope。

_rebuild_user_locked重建custom、legacy、integrations三个类别。同样重试2次。

_rebuild_thread_locked重建线程视图。关键设计是先清空后重建。四个类别先全部清掉。再放新策略的内容。注释解释了原因。并发读者可能短暂看到更少的技能。但绝不会看到被新策略撤销的技能。这是失败关闭。类别根的inode保持稳定。这对live bind mount很重要。

线程视图的技能用storage.load_skills的有效目录。这做了和提示发现一样的名字遮蔽解析。自定义或集成技能遮蔽内置技能时。只暴露一份。不会同时暴露两份。

线程视图要求软链接边界校验。enforce_symlink_boundary=True。

### 9、对外入口

ensure_thread_skill_projection保证一次运行的策略视图。allowed_skills为None且视图不存在时返回None。保持共享投影。线程一旦有策略视图。后续不限策略的运行会重建为全量启用技能。防止切换agent后线程意外受限。

ensure_skill_projections修复过期的scope。新鲜的scope保持inode不动。公共视图先检查。用户视图后检查。

rebuild_skill_projections强制重建。存储写入、归档安装、删除、开关触发共享scope的跨进程锁重建。

ensure_public_skill_projection在Gateway启动时只保证公共视图。用户视图由沙箱获取时懒修复。否则启动时间随租户数增长。启动失败时清空公共视图。等下次获取自愈。

skill_projection_mutation跨源变更持有scope锁。变更前删manifest。删除指定包或按名字删除包。变更后重建。失败时清空scope。轻量测试替身直接yield跳过。

公共投影开关的锁顺序。先拿公共投影锁。再拿extensions_config_write_lock。这样一个worker的关键段内MCP写入不能交错。

## 三、它和谁协作

SkillStorage的变更操作（安装、删除、开关）通过skill_projection_mutation触发重建。

沙箱提供方在获取沙箱时调用ensure_thread_skill_projection。把视图目录挂进沙箱。

E2B提供方在创建沙箱时上传投影。

Gateway启动调用ensure_public_skill_projection。

export用skill_projection_read_lock。

它依赖parser的parse_skill_file。依赖types的Skill和SkillCategory。依赖extensions_config读取启用状态。依赖config.paths的路径定义。

## 四、重要性评级

评级是9分（满分10分）。

理由：

projection是技能安全模型的文件系统基石。它实现了三重隔离。沙箱写不进源文件。靠复制而非硬链接。策略清单决定暴露哪些技能。靠先清后建。软链接逃逸被拒绝。靠边界校验。

签名加manifest的新鲜度机制设计周密。manifest前后读两次防半写状态。并发场景考虑充分。锁的两层实现兼容POSIX和Windows。

先清后建的失败关闭设计体现了安全优先的思维。宁可短暂少给。绝不多给。启动时懒修复用户视图的权衡也合理。启动时间不随租户数增长。

它是核心运行路径。直接影响每次沙箱获取。复杂度高。防御密度高。

给9分。不给满分是因为它的正确性极度依赖大量文件系统不变量。manifest一致性、inode稳定性、签名窗口。维护成本高。理解成本也高。
