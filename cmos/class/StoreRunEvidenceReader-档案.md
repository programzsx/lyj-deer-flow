# StoreRunEvidenceReader档案

源码位置：backend/packages/harness/deerflow/extensions/run_evidence.py

## 一、这个类是干什么的

StoreRunEvidenceReader是运行证据读取器。

扩展可以读运行历史。这个能力通过公开的只读运行证据契约提供。StoreRunEvidenceReader是这个契约的宿主适配器。StoreRunEvidenceReader用固定的所有者作用域读配置好的存储。

StoreRunEvidenceReader提供三个读操作。

第一个是list_changed_runs。列出有变化的运行。用不透明的、作用域绑定的游标翻页。游标编码了change_seq、run_id和作用域指纹。已返回过的运行可能重放。未返回过的运行不会跳过。

第二个是get_run_status。查一次运行的状态。运行不存在或不是普通run时返回None。

第三个是list_run_events。列出一次运行的事件。事件保留事件存储的线程作用域after_seq语义。

读取的作用域在构造时固定。作用域是user_id。user_id为None表示全局可见。生产Gateway注入一个app级reader。user_id为None。生产Gateway故意给可信运维扩展全局跨用户可见性。因为服务没有请求主体。

内容是深拷贝快照。DTO字段是frozen的。但嵌套容器本地可变。深拷贝保证可变性不触及宿主存储。

元数据有脱敏。元数据只去掉auth_token键。事件内容原样返回。状态来自权威的run store。

## 二、类的成员

（一）字段

- _run_store：运行存储。
- _event_store：事件存储。
- _user_id：作用域用户id。None表示全局。

（二）方法

- list_changed_runs：列出有变化的运行。带游标翻页。
- get_run_status：查一次运行的状态。
- list_run_events：列出一次运行的事件。带after_seq翻页。
- _validate_limit：校验limit。范围1到2000。

## 三、它和谁协作

（一）创建者

StoreRunEvidenceReaderFactory的for_principal方法创建reader。作用域从宿主认证过的主体固定。

（二）存储

reader读run_store和event_store。这两个存储是Gateway的运行/事件存储。

（三）脱敏

元数据用redact_metadata_secrets脱敏。

## 四、重要性评级

评级：7分。

理由：StoreRunEvidenceReader是扩展读取运行数据的唯一窗口。作用域绑定防止扩展越权读别人的数据。游标绑作用域指纹，游标不能跨reader使用。深拷贝和脱敏保护了宿主存储和敏感信息。这是extensions的核心类。给7分。
