# Resolution档案

源码位置：backend/packages/harness/deerflow/tui/command_registry.py

## 一、这个类是干什么的

Resolution是一个分类结果类。

用户提交一行输入。resolve函数对这行输入做分类。分类结果用一个Resolution对象表示。

Resolution有四种可能。

第一种是builtin。这行输入是一条内置命令。比如/help。

第二种是skill。这行输入是一次技能激活。比如/翻译 一段话。

第三种是unknown。这行输入以斜杠开头但匹配不到命令。

第四种是message。这行输入是普通消息文本。

Resolution是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- kind：分类结果。取值是builtin、skill、unknown、message四选一。
- name：命令名。默认是空字符串。message类型时为空。
- args：命令参数。默认是空字符串。
- text：原始输入文本。message类型时携带全文。

（二）分类逻辑

resolve的判断顺序是这样的。不以斜杠开头，就是message。斜杠后的名字匹配内置命令表，就是builtin。名字匹配技能名列表且通过parse_slash_skill_reference校验，就是skill。其他情况是unknown。

## 三、它和谁协作

（一）产生者

command_registry.py的resolve函数产生Resolution。

（二）消费者

app.py的_handle_submit消费Resolution。kind为builtin走内置命令处理。kind为unknown显示未知命令提示。message和skill都发给Agent处理。

（三）依赖

resolve对skill类结果会调用deerflow.skills.slash的parse_slash_skill_reference做校验。

## 四、重要性评级

评级：3分。

理由：Resolution是输入分发的枢纽。用户敲的每一行都要经过分类。分错类命令就执行错。但Resolution本身只是结果数据。分类逻辑在resolve函数里。给3分。
