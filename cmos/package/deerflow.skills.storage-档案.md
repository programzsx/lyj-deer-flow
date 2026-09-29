# deerflow.skills.storage-档案

## 一、这个包是干什么的

这个包是技能存储层。

技能要放在磁盘上。
技能要被读取、写入、删除。
技能要按用户隔离。

这个包定义技能存储的抽象。
这个包提供本地文件系统实现。
这个包提供按用户隔离的实现。
这个包管理存储实例的单例和缓存。

技能存放在几类位置。

- 全局public技能。在`deer-flow/skills/public/`。只读。
- 用户自定义技能。在`{DEER_FLOW_HOME}/users/{user_id}/skills/custom/`。读写。
- 全局托管集成技能。在`{DEER_FLOW_HOME}/integrations/skills/{provider}/`。只读。
- legacy技能。迁移前的全局自定义技能。只读展示。

这个包是技能系统里被引用最多的子包之一。
几乎所有技能消费者都从这里取存储实例。

## 二、包里的主要成员

### （一）模块__init__.py——单例和工厂

#### 1、get_or_new_skill_storage函数

这个函数返回一个`SkillStorage`实例。
它有两种行为。

创建新实例的情况。
调用方提供skills_path时创建新实例。
skills_path覆盖host_path。
调用方提供app_config时创建新实例。
按app_config构造，尊重每请求的配置。
不污染进程级单例。

返回单例的情况。
skills_path和app_config都没给时返回单例。
单例第一次调用时创建。
之后复用。

单例用于读取public技能。
public技能是全局只读的。
用户级操作用另一个函数。

它处理手工注入的单例。
测试可能直接注入实例。
注入时没有config身份。
这种情况跳过get_app_config。
避免要求磁盘上有config.yaml。

它处理配置身份变化。
单例记录它由哪个AppConfig构建。
配置身份变了就重建。
`_skill_storage_lock`保护单例。
双重检查保证竞态下只建一个。
构造在锁内进行。
SkillStorage没有清理钩子。
孤儿的输家实例无法清理。
所以构造在锁内。

#### 2、get_or_new_user_skill_storage函数

这个函数返回按用户隔离的`SkillStorage`。
它返回`UserScopedSkillStorage`。
自定义技能路径重定向到用户目录。
public技能仍然从全局根读取。

user_id先经过`make_safe_user_id`规范化。
外部身份可能含特殊字符。
例如IM通道id。
规范化后安全地进目录名。

实例按规范化的user_id和AppConfig身份缓存。
用`OrderedDict`做真LRU缓存。
每次访问move_to_end。
缓存上限64个。
超出就淘汰最久未用的。
上限是慷慨的。
真实部署很少在同一进程里有超过几个并发用户。

#### 3、user_should_see_legacy_skills函数

这个函数判断发现层是否暴露LEGACY技能。
沙箱挂载不能比技能发现更宽松。
这个辅助函数集中这个契约。
本地、AIO、远程提供者都遵守同一规则。

#### 4、reset函数

`reset_skill_storage`清空全部缓存实例。
用于测试和热重载。

`reset_user_skill_storage`按用户清缓存。
user_id也经过规范化。
不规范化的话，IM通道id清不掉自己的缓存。

### （二）模块skill_storage.py——抽象基类

`SkillStorage`是抽象基类。
它定义技能存储的标准操作。
它是模板方法式的基类。

模块里有共享辅助。

#### 1、walk_skill_directories函数

这个函数遍历技能目录。
它跟随目录链接。
但它会剪除指回当前祖先的链接。
防止循环遍历。

它只跟踪当前分支的祖先。
两个独立别名指向同一个外部技能树时。
两个别名都保持可发现。

它保持os.walk的可变目录列表。
调用方保留命名空间、隐藏目录和包边界规则。

目录中途消失或链接变化时。
清空该目录的子目录列表继续。

#### 2、read_text_or_none函数

这个函数读UTF-8文本。
非文本返回None。
仅用于历史记录。
技能的支持文件可能是二进制。
安装器拒绝可执行二进制。
但不拒绝图片等资产。
记录"没有前文"不能中断正在记录的变更。

#### 3、技能名校验

`_SKILL_NAME_PATTERN`要求技能名是小写字母数字加连字符。
例如my-skill。
不允许大写、下划线、空格。

### （三）模块local_skill_storage.py——本地实现

`LocalSkillStorage`实现`SkillStorage`。
它用本地文件系统存储技能。

布局有三层。

- `<root>/public/<name>/SKILL.md`。public技能。
- `<root>/custom/<name>/SKILL.md`。自定义技能。
- `<root>/custom/.history/<name>.jsonl`。变更历史。

它支持两种构造。

host_path给了就用它。
从config读则用`get_app_config`。

host_path没给时。
从config解析skills路径。

host_path构造也保留app_config原样。
可能是None。
急切调用get_app_config会破坏无配置的环境。
例如CI。
`skill_scan.enabled`杀开关在扫描时才懒解析。
同时拾取热重载的配置。

它实现技能的读写操作。

- 列出技能。扫描public、custom目录。
- 读取SKILL.md。解析frontmatter。
- 写入技能。创建目录。写SKILL.md。让路径对沙箱可读。
- 删除技能。删除目录。追加历史。
- 启停技能。修改extensions_config.json。
- 追加历史。jsonl格式。记录action、file_path、前后内容。

临时目录清理有超时。
5秒。
文件系统慢时，例如NFS。
不会让安装结果卡在finally块里。

### （四）模块user_scoped_skill_storage.py——按用户隔离

`UserScopedSkillStorage`继承`LocalSkillStorage`。
它隔离自定义技能。

布局有五层。

- `<host_root>/public/<name>/SKILL.md`。全局public。只读。
- `<user_custom_root>/<name>/SKILL.md`。按用户。读写。
- `<integrations_root>/<provider>/<name>/SKILL.md`。全局集成。只读。
- `<user_custom_root>/.history/<name>.jsonl`。按用户历史。
- `<user_skills_root>/_skill_states.json`。按用户启用状态。
- `<global_custom_root>/<name>/SKILL.md`。legacy回退。只读。

回退规则是核心设计。
用户还没有自定义技能时。
全局`skills/custom/`的技能作为LEGACY暴露。
LEGACY技能只读。
不能被用户编辑或删除。
这保持迁移期间的向后兼容。
不泄露对legacy技能的可变访问。

影子挂载语义。
用户创建第一个自定义技能后。
按用户目录存在了。
全局自定义回退不再生效。
LEGACY技能从该用户的列表消失。
这是故意的。

启用状态按用户存储。
CUSTOM和LEGACY技能的启停状态存`_skill_states.json`。
key是技能名。
PUBLIC技能的状态仍是全局的，存extensions_config.json。
防止两个用户拥有同名自定义技能时互相影响。

## 三、它和谁协作

上游是全部技能消费者。

- Gateway的技能路由。列出、安装、启停技能。
- `DeerFlowClient`。同样的技能操作。
- 沙箱提供者。acquire时调用`user_should_see_legacy_skills`决定挂载。
- 投影模块。读取技能存储决定投影内容。
- installer和export。通过存储实例读写技能。

下游是文件系统。
技能目录就是磁盘目录。

它和配置系统协作。
`config.skills`提供技能路径。
`make_safe_user_id`规范化user_id。

它是skills包里被引用最多的子包。
约46个文件直接引用这个包。

## 四、重要性评级

评级：9分。

理由如下。

这个包是技能数据的存取层。
没有它，技能无处存放、无处读取。
约46个文件直接引用这个包。
是本批23个包里引用量最高的之一。

它是核心路径。
每次智能体组装都读技能。
技能投影依赖存储实例。
沙箱挂载依赖可见性判断。
安装、导出、启停都经过它。

它承载了用户隔离语义。
按用户隔离是安全边界。
自定义技能不能跨用户泄露。
legacy技能不能被误编辑。
这些语义都在这里。

它是本地实现。
技能存储没有远程后端。
本地文件系统是唯一实现。
删除它，技能功能完全瘫痪。
skillscan、review、投影都失去数据来源。

所以给9分。
不给10分是因为它不直接承载智能体执行主路径。
运行可以在没有技能的情况下继续。
