# GrepMatch档案

源码位置：backend/packages/harness/deerflow/sandbox/search.py

## 一、这个类是干什么的

GrepMatch是一条grep搜索结果。

grep在文件里搜文本。每条匹配用一个GrepMatch表示。GrepMatch记录匹配发生在哪个文件、哪一行、那一行的内容。

GrepMatch是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- path：匹配文件路径。
- line_number：匹配行号。1开始。
- line：匹配行的内容。内容经过截断。默认最长200字符。

## 三、它和谁协作

（一）产生者

find_grep_matches函数产生GrepMatch。搜索时按正则匹配行。行内容用truncate_line截断。

（二）消费者

Sandbox.grep返回GrepMatch列表。tools.py的grep工具把结果给模型。view_state的行系统不直接用GrepMatch。

## 四、重要性评级

评级：3分。

理由：GrepMatch是代码搜索结果的标准数据结构。grep工具的输出靠它。它承载行号和行内容。它只是三字段数据类。给3分。
