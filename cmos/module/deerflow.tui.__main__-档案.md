# deerflow.tui.__main__-档案

## 一、这个模块是干什么的

这个文件让python -m deerflow.tui能启动工作台。

这个文件只有6行。

它把python -m调用转发到cli.main。

## 二、模块里的主要成员

### 1、main转发

这个文件从.cli导入main。

模块作为脚本运行时调用main。

main的返回值转成SystemExit。

## 三、它和谁协作

它依赖deerflow.tui.cli的main。

它被python -m deerflow.tui调用。

## 四、重要性评级

评级是2分。

理由是这个文件提供了python -m的调用方式。

这是Python包的惯例入口。

不评高分的原因是它只有转发。

全部能力在cli里。
