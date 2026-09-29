# ConsoleUsageDay档案

类定义在backend/app/gateway/routers/console.py。

## 一、这个类是干什么的

这个类是单日token用量的模型。

控制台展示token消耗随时间的变化。按天聚合的用量用这个类表示。

前端调用GET /api/console/usage接口。后端返回按天分组的用量。这个类是一个Pydantic模型。

## 二、类的成员

这个类有6个字段。

### 1、date

date是本地日期。

这个字段是字符串类型。格式是YYYY-MM-DD。这个字段必填。

日期按请求里的时区偏移计算。

### 2、total_tokens

total_tokens是当天的token总数。这个字段是整数类型。默认是0。

### 3、input_tokens

input_tokens是当天的输入token数。这个字段是整数类型。默认是0。

### 4、output_tokens

output_tokens是当天的输出token数。这个字段是整数类型。默认是0。

### 5、runs

runs是当天的运行数。这个字段是整数类型。默认是0。

### 6、cost

cost是当天的估算费用。这个字段是浮点数类型。默认是0。

## 三、它和谁协作

这个类被GET /api/console/usage路由使用。

这个类作为ConsoleUsageResponse的days字段元素类型。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是用量曲线的单日数据点。前端画图靠它。

这个类只是数据容器。

所以评3分。
