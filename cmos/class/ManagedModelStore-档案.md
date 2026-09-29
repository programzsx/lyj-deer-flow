# ManagedModelStore档案

一、这个类是干什么的

ManagedModelStore是托管模型档案的存储类。这个类不是pydantic模型。这个类管理加密目录的读写。写操作跨线程和进程串行化。读操作看到原子快照。这个类用Fernet加密存储。

二、类的成员

（一）属性

- path：目录文件路径。位于运行时主目录的managed-models/catalog.enc。
- key_path：加密密钥路径。和目录文件同目录的key文件。

（二）方法

- _cipher：这个方法获取Fernet加密器。create为True时密钥不存在就生成新密钥。密钥缺失且不能创建时报错。提示从备份恢复。
- list：这个方法解密目录文件并返回ManagedModel列表。文件不存在返回空列表。解密或校验失败时报错。报错信息不含提供者密钥和解密的校验输入。
- save：这个方法保存一个档案。持有线程锁和文件锁。用expected_revision做乐观并发控制。档案不存在而给了revision时报告不存在。revision不匹配时报告已变化。新档案的revision用uuid生成。整个列表重新加密写回。
- _write：静态方法。这个方法用临时文件加os.replace做原子写入。先fsync再替换。失败时清理临时文件。

三、它和谁协作

ManagedModel是这个类存储的记录类型。merge_managed_models用这个类读取档案。extensions_config的文件锁为这个类提供跨进程串行化。管理员API通过这个类增删改查模型档案。

四、重要性评级

评级：7分。

理由：这个类保管生产模型的加密凭据。乐观并发和原子写入保护数据完整性。密钥丢失意味着档案不可恢复。所以重要性中上。
