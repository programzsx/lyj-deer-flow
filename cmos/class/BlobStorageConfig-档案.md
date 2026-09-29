# BlobStorageConfig档案

一、这个类是干什么的

BlobStorageConfig是blob存储的宿主共享配置类。blob存储是内容寻址存储。这个类只包含宿主共享字段。后端私有字段在各自后端的配置里。后端私有配置通过backend_config字典传递。保持共享schema精简让后端可替换。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示是否启用内容寻址blob存储。默认False是因为还没有生产者被迁移。不设置这个键的部署行为不变。
- backend：字符串。默认值是local_fs。这个字段是blob存储后端选择器。可以是注册的后端名。也可以是BlobStore子类的点分导入路径。工厂在get_blob_store时解析。解析失败报错。blob是持久状态。所以不能静默替换成别的后端。
- backend_config：字典。默认值是空字典。这个字段是后端私有配置。工厂原样传给后端。每个后端自己解释。local_fs读root键。

（二）方法

这个类没有自定义方法。模块级提供了get_blob_storage_config、set_blob_storage_config、load_blob_storage_config_from_dict三个函数。get_blob_storage_config会触发签名校验的热加载。配置文件坏了时保留上一个好的单例。

三、它和谁协作

AppConfig持有这个类。AppConfig的blob_storage字段是这个类的实例。配置加载时load_blob_storage_config_from_dict写入单例。未知顶层键会警告并忽略。blob存储工厂读取这个实例。

四、重要性评级

评级：5分。

理由：blob存储默认关闭。是正在铺开的新能力。共享schema精简让后端可替换。所以重要性中等。
