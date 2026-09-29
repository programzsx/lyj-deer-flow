# BlobRef-档案

## 一、这个类是干什么的

BlobRef是storage/contract.py里的pydantic模型。

它是对blob字节的内容寻址引用。

它寻址内容。不是位置。

这是整个抽象的要点。

多gateway部署时服务器本地文件路径只在写入它的实例上有意义。

内容digest处处有意义。

每个能到达后端存储的实例解析到同样的字节。

这个类位于backend/packages/harness/deerflow/storage/contract.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

sha256是blob内容的小写hex SHA-256。64字符。

size是内容长度。字节。ge=0。

kind是内容类别。例如viewed-image、tool-output。

content_type是MIME类型。生产者知道时才填。默认None。

model_config是frozen。

### 2、sha256验证器

_sha256_is_hex64把值strip、lower。

长度必须64。必须匹配[0-9a-f]{64}。

### 3、kind验证器

_kind_is_safe调用validate_blob_kind。

kind也是local_fs后端的文件系统路径段。

所以语法刻意窄。小写、数字、连字符。1到64字符。没有前导或尾随连字符。

这在契约层排除遍历、分隔符、NTFS/APFS大小写意外。

### 4、matches方法

返回data是否真的是这个blob的内容。

先比长度。再比sha256。

### 5、为什么sha256是地址

写入是幂等的。放同样的字节两次得到同样的ref。

去重是免费的。

## 三、它和谁协作

- BlobStore的put_bytes返回它。get_bytes消费它。
- ViewedImageData.actual_path和ToolOutputBudgetMiddleware外置的工具结果是生产者。
- LocalFsBlobStore用它做分片布局。
- kind界定垃圾回收。retention sweep可以推理一个kind。

## 四、重要性评级

评级是7分。

理由如下。

这个类是blob存储的地址契约。

sha256是地址。写入幂等。去重免费。

matches允许读时验证。不信任后端。

kind语法窄。在契约层排除路径遍历。

冻结模型保证引用不被改。

这些是内容寻址存储正确性的核心。

扣掉3分。

扣分原因是它是数据契约类。自身逻辑量小。
