# deerflow.persistence.projects包档案

## 一、这个模块是干什么的

deerflow.persistence.projects包是项目持久化的包门面。

源文件是backend/packages/harness/deerflow/persistence/projects/__init__.py。

它的角色是立即导入式薄门面。

它把项目持久化的ORM模型和SQL仓库一次性导入并暴露。

它没有懒加载。

docstring一句话说明定位。

定位是项目持久化。

持久化包含ORM模型和SQL仓库。

项目是用户组织文档和线程的容器。

## 二、模块里的主要成员

它从两个模块导入成员。

model模块提供ProjectRow、ProjectDocumentRow。

ProjectRow是项目的ORM行模型。

ProjectDocumentRow是项目文档的ORM行模型。

sql模块提供三个成员。

成员是ProjectRepository、ProjectDocumentRepository、ProjectNotAssignableError。

ProjectRepository是项目仓库。

ProjectDocumentRepository是项目文档仓库。

ProjectNotAssignableError表示文档不可归入项目的错误。

六个成员在__all__里。

两个仓库对应两张表。

错误类型是文档归类的防线。

## 三、它和谁协作

它向内聚合model和sql两个模块。

它向上被网关的projects路由消费。

项目的增删改查走这里。

它与deerflow.projects协作。

runtime层的projects包消费项目快照做运行时注入。

持久层管数据。

runtime层管行为。

它还被deerflow.persistence.models引用。

models子包把ProjectRow和ProjectDocumentRow注册进Base.metadata。

## 四、重要性评级

评级是5分。

理由如下。

它是项目持久化的正式入口。

两个仓库加一个错误类型的成套暴露让调用方一次导入即可。

它参与models子包的ORM注册链条。

它与runtime层projects包形成数据与行为的分层。

扣分点在于它内容较少。

复杂度在sql模块里。
