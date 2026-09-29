# Fact档案

类定义在backend/app/gateway/routers/memory.py。

## 一、这个类是干什么的

这个类是记忆事实的模型。

记忆系统会把了解到的事实单独存下来。例如用户喜欢TypeScript。例如用户在做某个项目。

每条事实有内容、分类、置信度等信息。这个类表示一条事实。这个类是一个Pydantic模型。

这个类是记忆系统里字段最多的模型。这个类承载事实的完整视图。

## 二、类的成员

这个类有16个字段。

### 1、id

id是事实的唯一编号。这个字段是字符串类型。这个字段必填。

### 2、content

content是事实内容。这个字段是字符串类型。这个字段必填。

### 3、category

category是事实分类。这个字段是字符串类型。默认是context。

### 4、categoryExtension

categoryExtension是扩展分类。这个字段是字符串类型。默认是None。

category是other时用这个字段补充分类。

### 5、topics

topics是检索导向的主题标签。这个字段是字符串列表类型。默认是None。

### 6、confidence

confidence是置信度。这个字段是浮点数类型。取值0到1。默认是0.5。

### 7、createdAt

createdAt是创建时间。这个字段是字符串类型。默认是空字符串。

### 8、source

source是来源字符串。这个字段是字符串类型。默认是unknown。

这个字段有一个校验器。校验器保持HTTP契约稳定。存储层的结构化来源元数据转换成字符串返回。conversation来源转换成对话编号。

### 9、sourceError

sourceError是可选的错误描述。描述之前的错误做法。这个字段是字符串类型。默认是None。

### 10、schemaVersion

schemaVersion是单条事实的模式版本。这个字段是整数类型。默认是None。

### 11、status

status是事实的生命周期状态。这个字段是字符串类型。默认是None。

### 12、scope

scope是标准的用户和Agent范围。这个字段是字典类型。默认是None。

### 13、revision

revision是事实的乐观并发版本号。这个字段是整数类型。默认是None。

### 14、updatedAt

updatedAt是最后更新时间。这个字段是字符串类型。默认是None。

### 15、consolidatedAt

consolidatedAt是事实被合并的时间。这个字段是字符串类型。默认是None。

### 16、consolidatedFrom

consolidatedFrom是被合并前的来源事实编号列表。这个字段是字符串列表类型。默认是None。

## 三、它和谁协作

这个类作为MemoryResponse的facts字段元素类型。

这个类也用于POST /api/memory/import导入记忆。

这个类的source校验器保持HTTP契约稳定。Markdown存储层的富元数据在HTTP层转换成字符串。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是6分。

理由如下。

事实是DeerMem记忆系统的核心数据单元。Agent的长期记忆就是由事实组成的。

这个类承载事实的完整生命周期信息。创建、更新、合并、置信度都在这里。

source校验器的设计保证了存储演进时HTTP契约不变。所以评6分。
