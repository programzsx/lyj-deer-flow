# deerflow.config.managed_models-档案

## 一、这个模块是干什么的

这个模块管理管理员维护的模型配置。

这些模型和`config.yaml`里的模型分开。

管理员通过界面添加OpenAI兼容的端点。

这些配置存在一个加密目录里。

目录和密钥都在持久化的运行时家目录下。

写入跨线程和进程串行化。

读者看到原子快照。

这个模块还负责把受管模型合并进有效的AppConfig快照。

## 二、模块里的主要成员

### 1、ManagedModel类

这是受管模型的一条记录。

`name`是唯一名，有模式校验。

`base_url`是端点，校验器强制HTTPS或HTTP。

不允许带凭据、查询串、片段。

`api_key`用SecretStr存，避免明文泄露。

`public()`导出时排除api_key，只给出has_api_key布尔值。

`runtime_config()`转换成`ModelConfig`。

转换时会根据端点推导提供者设置。

### 2、ManagedModelStore类

这个类负责加密目录的读写。

`list()`解密并解析目录。

任何异常都转换成一个不含密钥的ValueError。

`save()`做乐观并发保存。

带`expected_revision`参数。

别人改过就报错，要求先重载。

密钥缺失时会报错，提示从备份恢复。

`_write()`用临时文件加`os.replace()`做原子写入。

### 3、merge_managed_models()

把受管模型合并进AppConfig。

签名检测目录是否变化。

变化了才重新合并。

没启用且不和YAML重名的模型才会合并进来。

合并结果被缓存。

原因是每次调用都解密太贵。

### 4、managed_model_providers.py的配合

`resolve_managed_model_provider()`根据端点推导提供者设置。

只有官方DeepSeek端点启用DeepSeek语义。

第三方代理保持通用OpenAI兼容契约。

判断依据是端点，不是模型名。

## 三、它和谁协作

`app_config.py`的`get_app_config()`每次都调用`merge_managed_models()`。

网关的受管模型路由做增删改查。

`file_signature.py`提供签名检测。

`extensions_config.py`提供跨进程文件锁。

`model_config.py`提供目标类型。

## 四、重要性评级

评级：8分。

理由：这是管理员动态接入模型的唯一通道。加密存储、乐观并发、原子写入都是真实的工程要求。合并缓存与签名检测的配合比较精巧。
