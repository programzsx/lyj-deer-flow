# SkillExportArchive档案

源码位置：backend/packages/harness/deerflow/skills/export.py

## 一、这个类是干什么的

SkillExportArchive是导出产出的归档句柄。

导出成功后产出zip归档。归档在临时文件里。调用方拿到句柄后读内容。读完后关闭。

SkillExportArchive是dataclass。SkillExportArchive装着文件对象和大小。

## 二、类的成员

（一）字段

- file：归档的二进制文件对象。BinaryIO。
- size：归档的字节大小。

（二）方法

- close：关闭底层文件对象。

## 三、它和谁协作

（一）产生者

build_skill_export函数产出SkillExportArchive。流程是这样的。先校验expected_revision。再在临时快照上做捕获。再比对revision。revision一致才打zip包。zip写到临时文件。产出句柄。

（二）预算

写入用_LimitedWriter包装。写入受MAX_ZIP_BYTES上限约束。写入受预算检查约束。

（三）消费者

Gateway导出路由读file和size。把归档作为下载响应返回。读完调用close。

## 四、重要性评级

评级：3分。

理由：SkillExportArchive只是导出产物的句柄。真正的导出逻辑在build_skill_export和_walk里。句柄让路由层可以流式返回归档。它是两字段dataclass。给3分。
