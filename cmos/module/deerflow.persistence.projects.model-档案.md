# deerflow.persistence.projects.model-档案

## 一、这个模块是干什么的

这个模块定义Projects功能的ORM模型。

Projects是项目组织功能。

项目把一组线程组织在一起。

项目还带一个文档架。

这个模块定义两个模型。

两个模型是ProjectRow和ProjectDocumentRow。

两个模型对应两张表。

两张表是projects和project_documents。

## 二、模块里的主要成员

### 1、ProjectRow类

ProjectRow对应projects表。

一行代表一个用户拥有的项目。

id是uuid4的hex。

id是唯一的外部身份。

#### （1）身份和展示字段

user_id是拥有者。

user_id有索引。

name是项目名。

name是展示属性。

presentation是展示配置。

JSON类型。

改名只触碰这一行。

改名不影响成员关系。

线程通过threads_meta.project_id引用项目。

#### （2）instructions字段

instructions是用户写的项目上下文。

Text类型。

Phase 1存储它并支持PATCH。

Phase 2注入它。

没有memory_mode、sharing、agent-config列。

这是有意的。

Phase 1和2没有消费者。

#### （3）status字段

status是项目状态。

默认active。

status有索引。

#### （4）时间字段

created_at是创建时间。

updated_at是更新时间。

updated_at带onupdate钩子。

### 2、ProjectDocumentRow类

ProjectDocumentRow对应project_documents表。

一行代表项目架上的一个文档。

#### （1）标识字段

id是主键。

project_id是所属项目。

project_id有索引。

user_id是拥有者。

user_id有索引。

name是文档名。

长度255。

#### （2）存储字段

stored_relpath是服务器生成的相对路径。

路径相对于users/{user_id}/projects/。

路径内嵌sha256和行自己的id。

行之间永不共享文件。

trash后重新上传总是落在新的命名空间。

sha256是内容哈希。

sha256有索引。

size_bytes是文件大小。

#### （3）来源字段

source_thread_id是来源线程。

source_kind是来源种类。

source_name是来源名字。

三个字段记录晋升来源。

三个字段都可空。

#### （4）trash字段

trashed_at是trash时间。

trashed_at有索引。

trash_origin是trash时的快照。

JSON类型。

两个字段实现可恢复的trash层。

每个读查询都过滤trashed_at IS NULL。

被trash的行对索引、工具、列表API都不可见。

#### （5）设计说明

架子没有历史。

这是设计决定。

所以没有mime、is_text、version、deleted_by列。

文本检测是serve时的采样读取。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

projects/sql.py的两个repository用这两个模型读写。

thread_meta/model.py的ThreadMetaRow通过project_id引用ProjectRow。

migrations/versions/0019_projects.py创建projects表。

migrations/versions/0024_project_documents.py创建project_documents表。

## 四、重要性评级

评级是6分。

理由如下。

Projects功能的全部数据结构在这里。

stored_relpath的内容寻址设计在这里被记录。

trash层的设计在这里。

缺列的设计理由也被记录。

扣分的原因是它是纯模型文件。

Projects是组织功能。

不参与运行核心链路。
