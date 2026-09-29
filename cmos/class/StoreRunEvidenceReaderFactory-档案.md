# StoreRunEvidenceReaderFactory档案

源码位置：backend/packages/harness/deerflow/extensions/run_evidence.py

## 一、这个类是干什么的

StoreRunEvidenceReaderFactory是运行证据读取器的工厂。

工厂的职责是创建作用域固定的读取器。作用域从宿主认证过的主体固定。主体是ExtensionPrincipal。

工厂的核心原则是拒绝畸形身份而不是规范化授权身份。user_id必须是字符串。user_id必须非空。user_id不能有首尾空白。不满足就抛ValueError。工厂不会去空白、不会补默认值。

这个原则的理由是这样的。授权身份被规范化会放宽边界。比如一个空白user_id被strip成空字符串，然后可能被当成全局。所以拒绝比规范化安全。

## 二、类的成员

（一）字段

- _run_store：运行存储。
- _event_store：事件存储。

（二）方法

- for_principal：从认证主体创建StoreRunEvidenceReader。校验principal和user_id。拒绝畸形身份。

## 三、它和谁协作

（一）使用者

Gateway的路由处理器用这个工厂。用户可见的贡献路由用resolve_run_evidence_reader。factory按认证主体创建reader。

（二）产物

for_principal返回StoreRunEvidenceReader。reader的作用域是principal的user_id。

## 四、重要性评级

评级：5分。

理由：StoreRunEvidenceReaderFactory是运行证据访问的授权入口。它拒绝畸形身份而不是规范化。这个设计保住了授权边界。没有它，扩展可能拿到错误作用域的reader。它逻辑简单但责任重大。给5分。
