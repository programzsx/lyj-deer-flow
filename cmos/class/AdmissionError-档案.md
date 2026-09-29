# AdmissionError-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/request_admission.py`。

## 一、这个类是干什么的

AdmissionError是一个异常类。

这个类继承自Python内置的`RuntimeError`。

这个类的职责是表示"本地准入失败"。

先讲什么是"准入"。

DeerFlow调用大模型之前。

系统会先做一次本地限流检查。

这个检查叫"请求准入"。

请求准入由RequestAdmission类负责。

RequestAdmission会控制每分钟最多发多少个请求。

请求太多的时候。

后来的请求要排队。

排队有两种失败情况。

第一种情况是队列满了。

队列长度有上限。

上限由配置项`max_queue_size`决定。

队列满的时候。

新请求进不了队列。

这时候抛出AdmissionError。

第二种情况是等待超时。

排队等待有时间上限。

上限由配置项`max_wait_seconds`决定。

等待超过上限。

请求还没轮到发送。

这时候也抛出AdmissionError。

这个类的docstring写得很清楚。

docstring说"Local admission failed before making an upstream request"。

意思是"本地准入失败发生在向上游发起请求之前"。

这句话强调一个重点。

AdmissionError是在真正调用大模型API之前就发生的错误。

请求根本没有发出去。

这个特点很重要。

AGENTS.md文档里有一条专门的规定。

AGENTS.md说"Local `AdmissionError` is structurally non-retriable in LLM error handling regardless of its message text"。

意思是"在LLM错误处理体系里，本地AdmissionError从结构上讲是不可重试的错误，不管它的报错文本写了什么"。

为什么不可重试。

因为重试也解决不了问题。

队列满了。

重试一次还是满的。

超时了。

重试一次大概率还是超时。

解决办法是降低工作负载。

或者调大队列容量。

或者调大等待时间。

这些问题是配置层面的问题。

不是网络抖动之类可以靠重试扛过去的问题。

所以错误处理中间件看到AdmissionError。

应该直接把错误报给用户。

不应该自动重试。

## 二、类的成员

这个类非常简单。

这个类没有定义任何字段。

这个类没有定义任何方法。

这个类只是继承`RuntimeError`。

然后挂上一个专属的类名和一个docstring。

为什么一个成员都不定义还要单独建一个类。

因为异常类型本身就是信息。

调用方可以用`except AdmissionError`精确捕获这一类错误。

调用方可以只针对这类错误做特殊处理。

如果直接抛`RuntimeError`。

调用方没办法把"准入失败"和其他运行时错误区分开。

### 抛出这个类的位置

这个类在同一个文件里被抛出。

抛出点有两处。

第一处在`RequestAdmission._try_or_enqueue`方法里。

队列满了。

抛出消息是"LLM admission queue is full; reduce workload or increase queue capacity."。

消息意思是"LLM准入队列已满；请降低工作负载或增加队列容量"。

第二处在`RequestAdmission._delay`方法里。

等待超时了。

抛出消息是"LLM admission timed out before dispatch; increase max_wait_seconds or reduce workload."。

消息意思是"LLM准入在分发之前超时；请增大max_wait_seconds或降低工作负载"。

两处消息都给出了可操作的建议。

运维人员看到报错就知道该调哪个配置。

## 三、它和谁协作

### 继承关系

AdmissionError继承自`RuntimeError`。

`RuntimeError`是Python内置异常。

### 谁抛出这个类

`RequestAdmission`类抛出这个类。

具体是`RequestAdmission`的两个私有方法。

这两个方法是`_try_or_enqueue`和`_delay`。

### 谁捕获这个类

调用大模型的代码路径会捕获这个类。

模型工厂`create_chat_model`负责把RequestAdmission挂到每个模型上。

实际执行模型调用的地方会遇到这个异常。

错误处理中间件会判断异常类型。

AGENTS.md把AdmissionError归为"结构性不可重试"错误。

这意味着LLM错误回退逻辑会识别这个类型。

### 相关配置

这个类的触发条件由`deerflow.config.model_config`里的`RequestAdmissionConfig`决定。

相关字段有两个。

一个是`max_queue_size`。

一个是`max_wait_seconds`。

## 四、重要性评级

评级是3分。

理由如下。

第一点。

这个类本身只有一行有效代码。

这个类不承载任何逻辑。

第二点。

这个类的地位取决于RequestAdmission机制是否启用。

`models[].request_admission`是一个可选配置。

用户不配置这个选项。

整个准入机制不生效。

AdmissionError也不会被抛出。

第三点。

但是这个类是不可删除的。

`RequestAdmission`的两个方法依赖这个异常类型。

删掉这个类。

`RequestAdmission`直接报`NameError`。

第四点。

这个异常类型承担了错误分类的职责。

错误处理层靠这个类型区分"本地限流失败"和"上游API失败"。

删掉这个类型。

调用方只能靠解析报错文本来判断。

文本判断是脆弱的。

综合以上。

这是一个小而必要的异常类。

功能单一。

依赖面窄。

评级3分。
