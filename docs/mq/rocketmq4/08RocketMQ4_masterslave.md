---
title: RocketMQ 主从同步
category: RocketMQ
tag:
  - RocketMQ 
  - 消息队列
head:
  - - meta
    - name: keywords
      content: RocketMQ,消息队列,设计,精要,Nameserver,消费者,广播消费,主从同步
  - - meta
    - name: description
      content: 一本RocketMQ电子书，希望对你有帮助！
---

RocketMQ 主从复制是 RocketMQ 高可用机制之一，数据可以从主节点复制到一个或多个从节点。

这篇文章，我们聊聊 RocketMQ 的主从复制，希望大家读完之后，能够理解主从复制的精髓。

![](https://www.javayong.cn/pics/temp//NlcPeBacCl.png)

## 1 同步与异步

在 RocketMQ 的集群模式中，Broker 分为 Master 与 Slave，一个 Master 可以对应多个 Slave，但是一个 Slave 只能对应一个 Master。

每个 Broker 与 Name Server 集群中的所有节点建立长连接，定时注册 Topic 信息到所有 Name Server。

![](https://www.javayong.cn/pics/temp//XYRrSnhfuT-20231117160830289.webp!large)

Master 节点负责接收客户端的写入请求，并将消息持久化到磁盘上。而 Slave 节点则负责从 Master 节点复制消息数据，并保持与 Master 节点的同步。

**1、同步复制**

![](https://www.javayong.cn/pics/temp//9OihpRQCeY.webp!large)

每个 Master 配置一个 Slave ，有多对 Master-Slave ，HA 采用同步双写方式，即只有主备都写成功，才向应用返回成功。

这种模式的优缺点如下：

- 优点：数据与服务都无单点故障，Master宕机情况下，消息无延迟，服务可用性与数据可用性都非常高；

- 缺点：性能比异步复制模式略低（大约低10%左右），发送单个消息的 RT 会略高，且目前版本在主节点宕机后，备机不能自动切换为主机。

**2、异步复制**

![](https://www.javayong.cn/pics/temp//aeuWWwwVF6.webp!large)

每个 Master 配置一个 Slave ，有多对 Master-Slave ，HA 采用异步复制方式，主备有短暂消息延迟（毫秒级），这种模式的优缺点如下：

- 优点：即使磁盘损坏，消息丢失的非常少，且消息实时性不会受影响，同时Master宕机后，消费者仍然可以从Slave消费，而且此过程对应用透明，不需要人工干预，性能同多 Master 模式几乎一样；

- 缺点：Master 宕机，磁盘损坏情况下会丢失少量消息 。

复制流程分为两个部分：**元数据复制**和**消息数据复制**。

- 主从服务器同步主题，消费者进度，延迟消费进度，消费者配置数据 
- 主从服务器同步消息数据

## 2 元数据复制

Slave Broker 定时任务每隔 10 秒会同步元数据，包括**主题**，**消费进度**，**延迟消费进度**，**消费者配置**。

![](https://www.javayong.cn/pics/temp//UlZOjOQHKC.webp!large)

同步主题时, Slave Broker 向 Master Broker 发送 RPC 请求，返回数据后，首先加入本地缓存里，然后持久化到本地。

![](https://www.javayong.cn/pics/temp//%E5%90%8C%E6%AD%A5rpc.webp)

## 3 消息数据复制

下图是 Master 和 Slave 消息数据同步的流程图。

![](https://www.javayong.cn/pics/temp//%E6%B6%88%E6%81%AF%E6%95%B0%E6%8D%AE%E5%A4%8D%E5%88%B6.webp)

**1、Master 启动后监听指定端口；**

Master 启动后创建 AcceptSocketService 服务  ,  用来创建客户端到服务端的 TCP 链接。

![](https://www.javayong.cn/pics/temp//master%E7%9B%91%E5%90%AC%E7%AB%AF%E5%8F%A3.webp)

RocketMQ 抽象了链接对象 HAConnection , HAConnection 会启动两个线程，分别用于读服务和写服务：

- 读服务：处理 Slave 发送的请求 
- 写服务：用于向 Slave 传输数据 

![](https://www.javayong.cn/pics/temp//L9VeTg1Q1b.png)

**2、Slave 启动后，尝试连接 Master ，建立 TCP 连接；**

HAClient 是客户端 Slave 的核心类 ，负责和 Master 创建连接和数据交互。

![](https://www.javayong.cn/pics/temp//FdlRK75VMA.webp!large)

客户端在启动后，首先尝试连接 Master , 查询当前消息存储中最大的物理偏移量 ，并存储在变量 currentReportedOffset 里。

**3、Slave 向 Master 汇报拉取消息偏移量；**

![](https://www.javayong.cn/pics/temp//tT8zDrnRDf.webp!large)

上报进度的数据格式是一个 Long 类型的 Offset ,  8个字节 ,  非常简洁 。

![](https://www.javayong.cn/pics/temp//jTVTgyPKmh.webp!large)

发送到 Socket 缓冲区后 ,  修改最后一次的写时间 lastWriteTimestamp 。

**4、Master 解析请求偏移量，从消息文件中检索该偏移量后的所有消息；**

当 Slave 上报数据到 Master 时，**触发 SelectionKey.OP_READ 事件**，Master 将请求交由 ReadSocketService 服务处理：

![](https://www.javayong.cn/pics/temp//Q1VaKEvY5a.webp!large)

当 Slave Broker 传递了自身 commitlog 的 maxPhyOffset 时，Master 会马上中断 `selector.select(1000) `，执行 `processReadEvent` 方法。

![](https://www.javayong.cn/pics/temp//p6dZ2wKxCi.webp!large)

processReadEvent 方法的核心逻辑是设置 Slave 的当前进度 offset ，然后通知复制线程当前的复制进度。 

写服务 WriteSocketService 从消息文件中检索该偏移量后的所有消息（传输批次数据大小限制），并将消息数据发送给 Slave。

![](https://www.javayong.cn/pics/temp//V6JxwPbZYw.webp!large)

**5、Slave 接收到数据，将消息数据 append 到消息文件 commitlog 里 。**

![](https://www.javayong.cn/pics/temp//zSWojrUdMO.webp!large)

首先 HAClient 类中调用 dispatchReadRequest 方法 ， 解析出消息数据 ；

![](https://www.javayong.cn/pics/temp//hso6cZvs8w.webp!large)

然后将消息数据 append 到本地的消息存储。 

![](https://www.javayong.cn/pics/temp//Lp9XW6snxn.webp!large)

## 4 同步的实现

从数据复制流程图，我们发觉数据复制本身就是一个异步执行的，但是同步是如何实现的呢？

Master Broker 接收到写入消息的请求后 ，调用 Commitlog 的 aysncPutMessage 方法写入消息。

![](https://www.javayong.cn/pics/temp//sBPU66GFD1.webp!large)

这段代码中，当 commitLog 执行完 appendMessage 后， 需要执行**刷盘任务**和**同步复制**两个任务。

但这两个任务并不是同步执行，而是异步的方式，**使用了 CompletableFuture 这个异步神器**。

当 HAConnection 读服务接收到 Slave 的进度反馈，发现消息数据复制成功，则唤醒 future 。

![](https://www.javayong.cn/pics/temp//uATvF8ZCew.webp!large)

最后 Broker 组装响应命令 ，并将响应命令返回给客户端。

## 5 总结

RocketMQ 主从复制的实现思路非常简单，Slave 启动一个线程，不断从 Master 拉取 Commit Log 中的数据，然后在异步 build 出 Consume Queue 数据结构。

核心要点如下：

**1、主从复制包含元数据复制和消息数据复制两个部分；**

**2、元数据复制**

​	  Slave Broker 定时任务每隔 10 秒向 Master Broker 发送 RPC 请求，将元数据同步到缓存后，然后持久化到磁盘里；

**3、消息数据复制**

1. Master 启动监听指定端口

2. Slave  启动 HaClient 服务，和 Master 创建 TCP 链接 

3. Slave 向 Master 上报存储进度 

4. Master 接收进度，消息文件中检索该偏移量后的所有消息，并传输给 Slave 

5. Slave 接收到数据后，将消息数据 append 到本地的消息存储。

**4、同步的实现**

​	当 commitLog 执行完 appendMessage 后， 需要执行**刷盘任务**和**同步复制**两个任务，这里用到了 CompletableFuture 这个异步神器。
​	当 HAConnection 读服务接收到 Slave 的进度反馈，发现消息数据复制成功，则唤醒 future 。最后 Broker 组装响应命令 ，并将响应命令	返回给客户端 。
