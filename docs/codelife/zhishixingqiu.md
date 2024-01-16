---
title: 开始搞知识星球了
category: 技术人生
tag:
  - opensource 
head: 
  - - meta
    - name: description
      content: 我决定正式运营自己的知识星球 ：勇哥的Java训练营 ，一个直播、服务型的知识星球。
---

大家好，我是勇哥。

今天，我决定正式运营自己的知识星球 ：**勇哥的Java训练营** ，一个**直播**、**服务**型的知识星球。

## 1 星球定位

知识星球是一个私密交流圈子，主要用途是知识创作者连接铁杆读者/粉丝。相比于微信群，知识星球易于内容沉淀、信息管理更高效。

![](https://javayong.cn/pics/shipinhao/zhishixingqiushouye.png?a=1)

星球的定位**：帮助工程师快速增强实战能力，提升技术认知**。

## 2 星球专栏

2024年星球栏目规划如下图：

![](https://javayong.cn/pics/shipinhao/zhishixingqiucategory.png?a=45)

专栏分为两个部分：

1、**高并发三剑客** : 缓存 、消息队列 、分库分表。

2、**自研中间件项目**： 自研短信平台、自研消息队列、自研任务调度系统。

### 1.1 缓存实战篇

一提到缓存，很多同学会想到使用 Redis ，确实 Redis 是最流程的分布式缓存服务。

缓存的世界很广阔，要满足业务场景，仅仅使用 Redis 是不够用的。

比如如下场景：

1、高并发场景下，使用本地缓存 JDK Map ，或者使用缓存框架提升接口性能 ；

2、网络编程或者文件存储时，使用字节缓冲区 ByteBuffer ；

3、抢红包场景，使用 Redisson 执行 Redis Lua 脚本 ；

因此，我将非常实用的缓存技巧输出成独立的专栏，内容如下图：

![](https://javayong.cn/pics/shipinhao/cacheshizhan.png?a=1)

除了专栏内容之外，为了提高学习效果，勇哥写了两个开源工程用于缓存知识点教学。

**1、缓存使用示例工程**

![](https://javayong.cn/pics/shipinhao/couragecachedemo.png)

**2、自研 Java Redis SDK 工程**

![](https://javayong.cn/pics/shipinhao/platformredis.png)

### 1.2 消息队列篇

消息队列是我非常喜欢的技术，在我的职业生涯里面，接触到了不同类型的消息队列，发生了很多有趣的故事 。

因为我对 RocketMQ 更加熟悉点，所以 RocketMQ 是消息队列专栏的重点。

RocketMQ 4.X 是当前企业应用最广泛的产品， 而 RocketMQ 5.X 有更先进的架构，更贴近云原生，这两个版本都会在专栏中体现。

![](https://javayong.cn/pics/shipinhao/rocketmq4.png)

同样为了提高学习效果，勇哥写了两个样例工程用于消息队列知识点教学。

**1、RocketMQ 使用示例工程**

![](https://javayong.cn/pics/shipinhao/rocketmqlearning.png)

**2、模仿阿里云 ONS 封装 RocketMQ client  SDK**

![](https://javayong.cn/pics/shipinhao/platformrocketmqclient.png)

### 1.3 分库分表篇

很多同学以为分库分表就是将数据分片，其实在真实的业务场景里面，我们还需要考虑如何平滑的扩容或缩容。

因此，我会从 shardingsphere jdbc 做为切入点，并将增量同步利器 Canal 以及全量同步工具 Datax 的知识点串联起来，让大家理解真实环境的分库分表如何操作。 

![](https://javayong.cn/pics/shipinhao/shardingxingqiucategory.png)

下图展示了分库分表的演示项目，我会在此项目的基础上，完善 shardingsphere jdbc 5.X 分库分表样例代码，同时添加增量数据同步的模块。

![](https://javayong.cn/pics/shipinhao/shardingjdbcdemo.png)

### 1.4 自研短信平台

![](https://javayong.cn/pics/shipinhao/xingqiusmscategory.png)

![](https://javayong.cn/pics/shipinhao/platformsms.png)

短信平台是一个教学型的入门级架构项目，初中级工程师可以从中学习到 SPI 机制、线程模型设计、SDK 设计等。

### 1.5 自研消息队列

网上有很多延迟消息的文章，但没有独立的开源项目供大家学习。

我决定开发这个专栏，专栏的设计思路来源于《快手基于 RocketMQ 的在线消息系统建设实践》。

![](https://javayong.cn/pics/shipinhao/smartmq.png)

![](https://javayong.cn/pics/shipinhao/zhishixingqiusmartmq1.png?a=1)

### 1.6 自研任务调度系统

勇哥曾经在2018年参与了一个任务调度系统的研发工作，架构图如下：

![](https://javayong.cn/pics/shipinhao/platformschedulejiagou.webp)

我觉得对于初中级工程师来讲，这个项目有很多启发性的设计，比如通讯框架、名字服务、任务分片等知识点。

所以我决定把这个项目重写一次，并将任务调度相关知识点以专栏的形式呈现给大家，以便大家能形成完整的知识体系。

![](https://javayong.cn/pics/shipinhao/zhishixingqiuschedule.png)

![](https://javayong.cn/pics/shipinhao/jobadd.png)

## 3 星球服务

### 2.1 直播讲解专栏

我一直思考这个问题：怎样才能让大家更有效率的学习 ？

答案其实很简单，就是要做到两点：**内容形式上要更生动**、**更多的知识交流和互动**。

所以我希望做一个**直播**、**服务**型的知识星。

- 知识星球的每一个专栏，我都会通过直播的方式将知识点串联一次。
- 内容形式上，视频比文字的表达力要强很多。我会将专栏内容制作成视频，以更生动形象的方式呈现，与大家分享。

直播主题也可以不限于星球专栏，可以分享架构实战经验、线上问题排查、性能优化案例等。

大家也可以和我进行一对一答疑，我也会尽我所能的去帮助你。 

无论是**直播**，**录播**，还是**一对一答疑**，我都希望可以和大家更直接的交流，一起探索程序员的成长，相互成就。

### 2.2 读书与送书

我非常喜欢读书，不仅仅是技术书籍，也喜欢文学、历史、心理方面的书籍。

![](https://javayong.cn/pics/shipinhao/mybook.png)

我会在这个星球里面和大家交流读书心得，也会不定时地在星球里送书，和大家共建一个积极且健康的学习氛围。

## 4 加入星球

星球是需要付费才能进入的。 **为什么要收费呢？**

1. 研发专栏、直播专栏、录制视频、自研项目都需要极大的精力消耗；
2. 付费这个门槛可以帮我筛选出真正需要帮助的那批人；
3. 合理的收费是对我的正向激励，会激励我提供更优质的服务。

**如何加入星球？**

**步骤1：添加我的微信（zhangyongtaozhe）**

![](https://javayong.cn/pics/shipinhao/weixinhao.png)

**步骤2：微信扫一扫星球优惠券**

![](https://javayong.cn/pics/shipinhao/xingqiucoupon.png?a=1)

---

最后，介绍下我自己：

勇哥，开源爱好者，曾服务于同程艺龙、神州优车、科大讯飞等公司，管理过后端业务线（30 人团队）， 也做过基础架构团队负责人，对高并发解决方案（缓存、消息队列、分库分表）有非常深刻的认知。