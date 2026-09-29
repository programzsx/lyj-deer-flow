# _LimitedWriter档案

源码位置：backend/packages/harness/deerflow/skills/export.py

## 一、这个类是干什么的

_LimitedWriter是带上限约束的写入器。

导出要打zip包。zip写入可能很大。恶意技能目录可能让zip膨胀。_LimitedWriter包装底层文件对象。每次写入前检查上限。超出MAX_ZIP_BYTES立即失败。

_LimitedWriter还代理预算检查。每次写入前调用budget.check。

## 二、类的成员

（一）字段

- file：被包装的底层文件对象。
- budget：导出预算。_Budget实例。

（二）方法

- write：写入。先做budget.check。再判断tell加数据长度是否超过MAX_ZIP_BYTES。超限抛413的SkillExportError。不超限才真正写入。
- __getattr__：其余属性代理给底层文件对象。tell、close等方法都走代理。

## 三、它和谁协作

（一）Budget

_LimitedWriter每次写入调用budget.check。取消和超时在写入点也会生效。

（二）导出流程

build_skill_export打zip时用_LimitedWriter包装临时输出文件。zipfile.ZipFile把包装后的对象当文件用。

## 四、重要性评级

评级：3分。

理由：_LimitedWriter是导出的写入护栏。它让zip产物有确定的字节上限。它让取消和超时在写入点生效。它只是一个写入代理。给3分。
