# deerflow.persistence.run包档案

## 一、这个模块是干什么的

deerflow.persistence.run包是运行元数据持久化的包门面。

源文件是backend/packages/harness/deerflow/persistence/run/__init__.py。

它的角色是立即导入式薄门面。

它把运行元数据持久化的ORM模型和SQL仓库一次性导入并暴露。

它没有懒加载。

docstring一句话说明定位。

定位是运行元数据持久化。

持久化包含ORM模型和SQL仓库。

运行元数据是每次代理运行的记录。

记录包括状态、令牌用量、归属。

## 二、模块里的主要成员

它从两个模块导入成员。

model模块提供RunRow。

RunRow是运行的ORM行模型。

sql模块提供RunRepository。

RunRepository是运行仓库。

两个成员在__all__里。

注意docstring之外的细节。

run.model模块还导出RunChangeClockRow。

RunChangeClockRow是运行变更时钟行。

但门面只导出了RunRow。

RunChangeClockRow不在这个门面的__all__里。

调用方需要它时直接从run.model导入。

模型加仓库的成对模式是persistence实体子包的标准样式。

## 三、它和谁协作

它向内聚合model和sql两个模块。

它向上被网关和运行管理器消费。

运行记录的写入和查询走这里。

它与deerflow.runtime.runs协作。

runtime层管运行的生命周期。

持久层管运行的记录。

它还被deerflow.persistence.models引用。

models子包把RunRow和RunChangeClockRow注册进Base.metadata。

## 四、重要性评级

评级是6分。

理由如下。

它是运行元数据持久化的正式入口。

RunRepository是全系统读写运行记录的必经仓库。

它参与models子包的ORM注册链条。

门面漏导出RunChangeClockRow是一个覆盖缺口。

缺口要求调用方知道model模块的内部细节。

扣分点在于覆盖不完整。

内容较少。
