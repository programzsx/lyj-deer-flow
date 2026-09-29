# 0006_agents档案

## 一、这个迁移是干什么的

创建`agents`表。用户可以创建自定义的Agent。每个Agent有名字、配置和"灵魂"（soul，即人格prompt）。

## 二、做了什么schema变更

- 创建`agents`表。id、user_id、name、config（JSON）、soul（Text）、创建更新时间。
- 唯一约束`uq_agents_user_name`。同一用户的Agent名不重复。
- 索引`ix_agents_user_id`。

## 三、涉及哪些表

只涉及`agents`表。

## 四、重要细节

幂等。表已存在时直接返回。

soul列没有服务器默认值。这匹配ORM的Python侧`default=""`。存储层总是提供soul。这让create_all和迁移字节一致。有一个测试对比两者。

## 五、重要性评级

评级是6分。

理由。agents表是自定义Agent功能的存储基础。uq_agents_user_name防止同用户同名Agent。变更本身是标准建表。
