# StaticScannerError档案

源码位置：backend/packages/harness/deerflow/skills/skillscan/models.py

## 一、这个类是干什么的

StaticScannerError是SkillScan无法评估输入时的错误。

扫描的输入可能是坏zip。输入可能是不可读文件。扫描在包边界无法评估输入时抛这个错误。无法评估不等于通过。无法评估也不等于阻断。错误让调用方明确知道扫描本身失败了。

StaticScannerError继承RuntimeError。

## 二、类的成员

StaticScannerError没有自定义字段。StaticScannerError只继承RuntimeError的行为。

## 三、它和谁协作

（一）抛出者

orchestrator的scan_archive_preflight在zip损坏或不可读时抛出。scan_skill_dir在输入不是目录时抛出。

（二）消费者

安装路径捕获它。捕获后转换成明确的扫描失败。失败不静默。

## 四、重要性评级

评级：3分。

理由：StaticScannerError是扫描边界的失败信号。它把"扫描无法评估"和"扫描通过"区分开。这是fail-closed设计的组成部分。它是一个空异常类。给3分。
