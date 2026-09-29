# deerflow.persistence.managed_subagents.file-档案

## 一、这个模块是干什么的

这个模块是文件后端的托管subagent存储。

存储类叫FileManagedSubagentStore。

托管subagent是管理员定义的worker。

每个定义存成一个JSON文件。

文件放在managed_subagents_dir目录下。

写入用进程级写锁加原子替换。

## 二、模块里的主要成员

### 1、FileManagedSubagentStore类

这个类继承ManagedSubagentStore。

这个类实现全部抽象方法。

#### （1）cache_identity方法

cache_identity返回("file", managed_subagents_dir路径)。

指向同一目录的store实例共享这个身份。

registry快照可以跨实例复用。

#### （2）get方法

get读取定义文件。

文件不存在抛FileNotFoundError。

JSON通过ManagedSubagentDefinition的model_validate_json解析。

#### （3）list方法

list扫描目录下全部json文件。

一个损坏的定义不能挡住整个目录。

损坏的定义记warning并被跳过。

结果按name排序。

#### （4）create方法

create在写锁内检查名字。

名字已存在抛ManagedSubagentExistsError。

然后创建父目录。

再原子写入。

#### （5）update方法

update在写锁内检查文件存在。

不存在抛FileNotFoundError。

然后原子写入。

#### （6）delete方法

delete在写锁内删除文件。

文件不存在返回False。

存在则删除并返回True。

#### （7）signature方法

signature收集每个文件的mtime_ns和size。

构成变更令牌。

令牌给registry做缓存失效。

### 2、_atomic_write方法

这个方法原子写入定义。

payload是definition的JSON加换行。

先写到临时文件。

写完flush。

再fsync。

fsync确保数据真正落盘。

然后os.replace提交。

提交成功后临时文件路径清空。

异常时清理残留的临时文件。

## 三、它和谁协作

### 1、它依赖谁

它依赖managed_subagents/base.py的契约。

它依赖deerflow.config.paths的get_paths。

它依赖tempfile和os的原子写设施。

### 2、谁依赖它

Gateway的托管subagent管理路由通过ManagedSubagentStore接口调用它。

## 四、重要性评级

评级是4分。

理由如下。

托管subagent的文件后端在这里实现。

原子写入和损坏容错都处理了。

写锁保证单进程内写入串行。

扣分的原因是托管subagent是较新的辅助功能。

文件后端是简单场景的选择。

多实例部署用sql后端。

这个模块逻辑量也小。
