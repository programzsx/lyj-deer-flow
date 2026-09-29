# LarkIntegrationStatusResponse档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是Lark集成完整状态的响应体。

Lark和飞书集成需要了解很多状态。技能包是否安装。CLI是否可用。授权是否完成。沙箱运行时是否就绪。

前端调用GET /api/integrations/lark/status接口。后端用这个类返回完整状态。这个类是一个Pydantic模型。

这个类是Lark集成状态的主模型。这个类聚合了CLI探测和授权探测。

## 二、类的成员

这个类有17个字段。

### 1、installed

installed表示托管的Lark技能包是否已安装。这个字段是布尔类型。这个字段必填。

### 2、version

version是已安装的Lark CLI技能包版本。这个字段是字符串类型。这个字段必填。

### 3、manifest_version

manifest_version是已安装的清单版本。这个字段是字符串类型。默认是None。

### 4、latest_available_version

latest_available_version是GitHub上最新的可用版本。这个字段是字符串类型。默认是None。

### 5、runtime_version_mismatch

runtime_version_mismatch表示技能包版本和运行时CLI版本是否不一致。这个字段是布尔类型。默认是false。

### 6、app_configured

app_configured表示lark-cli是否配置了app_id和app_secret。这个字段是布尔类型。这个字段必填。

### 7、app_id

app_id是配置的Lark应用编号。这个字段是字符串类型。默认是None。

### 8、app_brand

app_brand是配置的Lark品牌。值是feishu或lark。这个字段是字符串类型。默认是None。

### 9、skills_expected

skills_expected是官方技能包应有的技能数。这个字段是整数类型。这个字段必填。

### 10、skills_installed和installed_skills

skills_installed是已安装的托管Lark技能数。installed_skills是已安装技能的名称列表。

### 11、enabled_skills

enabled_skills是当前用户启用的Lark技能列表。这个字段是字符串列表类型。默认是空列表。

### 12、install_path

install_path是托管技能包的宿主机路径。这个字段是字符串类型。这个字段必填。

宿主机路径是管理员信息。非管理员返回空字符串。

### 13、cli

cli是CLI探测结果。这个字段类型是LarkCliProbeResponse。这个字段必填。

### 14、auth

auth是授权探测结果。这个字段类型是LarkAuthProbeResponse。这个字段必填。

### 15、sandbox_runtime_mode

sandbox_runtime_mode是沙箱内lark-cli的配置方式。

这个字段是字符串类型。默认是none。

值可以是none、gateway-download、init-container、broker。

### 16、sandbox_runtime_ready和sandbox_runtime_detail

sandbox_runtime_ready表示沙箱运行时是否在聊天时就绪。sandbox_runtime_detail是未就绪的原因说明。

这两个字段分别是布尔和字符串类型。

## 三、它和谁协作

这个类被GET /api/integrations/lark/status路由使用。

也作为安装和授权完成响应的status字段。

由_status_to_response函数从LarkIntegrationStatus状态对象转换而来。非管理员遮蔽宿主机路径。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

这个类是Lark集成诊断的完整视图。集成问题排查全靠它。

sandbox_runtime_ready字段回答了聊天时CLI是否真的可用。

宿主机路径按权限遮蔽。这是安全设计。

所以评5分。
