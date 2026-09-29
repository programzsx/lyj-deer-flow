# deerflow.persistence.webhook_delivery包档案

## 一、这个模块是干什么的

deerflow.persistence.webhook_delivery包是入站webhook去重表的包门面。

源文件是backend/packages/harness/deerflow/persistence/webhook_delivery/__init__.py。

文件极小。

文件只有一句docstring。

它没有任何导入语句。

它不暴露任何成员。

它的角色是命名空间标记加一行自我说明。

docstring说明了这个包的内容。

内容是共享的入站webhook去重表。

docstring还标注了对应的issue编号。

编号是issue #4120。

## 二、模块里的主要成员

它没有__all__声明。

它没有导入语句。

它没有任何成员。

注意docstring之外的细节。

ORM模型在webhook_delivery.model模块里。

模型是WebhookDeliveryRow。

行数据的写入和读取不在这里。

行数据的读写走裸SQL。

裸SQL在app.channels.dedupe_store里。

实现类是PostgresInboundDedupeStore。

它没有被deerflow.persistence.models的门面导入。

models子包从本包的model模块直接导入WebhookDeliveryRow。

## 三、它和谁协作

它向下包含model模块。

model模块定义WebhookDeliveryRow。

它与app.channels.dedupe_store协作。

dedupe_store用裸SQL读写这张表。

ORM在这里。

读写在那边。

读写不走ORM是有意的选择。

它还被deerflow.persistence.models引用。

models子包把WebhookDeliveryRow注册进Base.metadata。

## 四、重要性评级

评级是4分。

理由如下。

它是webhook去重表ORM模型的正式归属。

docstring指明了裸SQL读写的位置。

这个指明防止调用方误以为这里提供仓库。

它参与models子包的ORM注册链条。

扣分点在于它内容极小。

它不做任何导出。

模型在model模块里，不在门面上。
