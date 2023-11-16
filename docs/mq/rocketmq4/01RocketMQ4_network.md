---
title: 网络通讯
category: RocketMQ
tag:
  - 消息队列
  - RocketMQ
---

RocketMQ 的网络通讯模块负责生产者、消费者与 Broker 之间的网络通信。

笔者学习 RocketMQ 也是从通讯模块源码开始的，并且从源码里汲取了很多营养。

![](https://javayong.cn/pics/rocketmq/remotingcode.png?a=2)

## 1 网络协议

客户端和服务端之间完成数据交互，需要约定数据协议。数据协议如下图：

![](https://javayong.cn/pics/rocketmq/remotingprotocol.png)

传输内容分为以下四个部分：

**1、消息长度：**

​	  总长度，四个字节存储，占用一个 int 类型；

**2、序列化类型 & 消息头长度：**

​	  占用一个 int 类型，第一个字节表示序列化类型，后面三个字节表示消息头长度；

**3、消息头数据**：

​	  经过序列化后的消息头数据；

**4、消息主体数据：**

​	  消息主体的二进制字节数据内容。

消息头数据序列化默认是 **JSON 格式** ，示例如下：

![](https://javayong.cn/pics/rocketmq/remotingheaderdemo.png)

![header格式说明](https://javayong.cn/pics/rocketmq/remotingheaderprotocol.png)

网络协议设计的原则是**便于编解码**，这里我们温习下 TCP **粘包**和**拆包**的知识点。

![](https://javayong.cn/pics/rocketmq/tcp.png)

TCP 是面向字节流的协议，它会将应用层发送的数据拆分成 TCP 报文段进行传输，发送端和接收端都会维护一个 buffer ，发送的数据首先会存至缓冲区  buffer ，然后通过网络发送给接收端的 buffer 中。

- **粘包**

如果一次请求发送的数据量比较小，没达到缓冲区大小，TCP 则会将多个请求合并为同一个请求进行发送 。

- **拆包**

如果一次请求发送的数据量比较大，超过了缓冲区大小，TCP 就会将其拆分为多次发送。

Netty 通过以下几种方式来解决粘包问题：

**1、消息定长：FixedLengthFrameDecoder**

发送的消息都是固定长度的，接收方根据固定长度来解析消息，这样可以有效避免粘包和拆包问题。

**2、特定分隔符：DelimiterBasedFrameDecoder**

在消息的末尾添加特定的分隔符，接收方根据分隔符来切分消息。

**3、消息头长度：LenghtFieldBasedFrameDecode**

在消息的头部添加表示消息长度的字段，接收方先读取消息头部的长度字段，然后根据长度字段的值来读取消息内容，从而正确地解析出完整的消息。

RocketMQ 的解码器就是使用了 **LenghtFieldBasedFrameDecode** 。

![](https://javayong.cn/pics/rocketmq/nettydecoder.png)

## 2 通讯方式

客户端通信方式支持**同步 sync** 、**异步 async** 、**单向 oneway** 三种方式 。

![](https://javayong.cn/pics/rocketmq/clientcode.png?a=12)

### 2.1 同步 sync

在同步通信中，客户端发送请求后会一直等待服务器响应，直到接收到响应或者超时。

这意味着：客户端发送线程在发送请求后会被阻塞，直到收到服务器的响应，然后继续执行发送下一个请求。

![](https://javayong.cn/pics/rocketmq/sync.png)

同步请求的流程：

1、客户端连接服务端，创建 channel ；

2、客户端创建 responseFutrue 对象 ，主要由四个部分组成：**响应结果、请求编号、回调函数、CountDownLatch**。然后将  responseFutrue 对象加入到本地缓存 响应表 reponseTable 里 。

![](https://javayong.cn/pics/rocketmq/responseFuture.png)

3、客户端将请求发送到服务端；

4、服务端解析出请求命令 ；

1. 请求命令中包含命令类型、请求编号，服务端根据命令类型选择处理器 ，执行请求命令；
2. 服务端将响应数据返回给客户端；
3. 客户端将响应结果填充到响应表 reponseTable 里，同时因为是同步命令，并调用 countDownLatch 的 countDown 方法 , 这样发送消息线程就不再阻塞（**实现同步请求的精髓**）。

### 2.2 异步 async

异步通信中，客户端发送请求后不会等待服务器的响应，而是继续执行后续代码。客户端会注册一个回调函数或者监听器，用于处理服务器响应。当服务器响应返回时，会触发回调函数的执行。

![](https://javayong.cn/pics/rocketmq/asyn.png)

异步请求的流程 ：

1、客户端连接服务端，创建 channel ；

2、通过信号量 `semaphoreAsync` 限制正在进行的异步请求的最大数量 ;

```java
boolean acquired = this.semaphoreAsync.tryAcquire(timeoutMillis, TimeUnit.MILLISECONDS);
```

3、客户端创建 responseFutrue 对象 ，主要由四个部分组成：**响应结果、请求编号、回调函数、CountDownLatch**。然后将  responseFutrue 对象加入到本地缓存 响应表 reponseTable 里 。

![](https://javayong.cn/pics/rocketmq/responseFuture.png)

4、客户端将请求发送到服务端，客户端异步方法结束 。

5、服务端解析出请求命令 ；

1. 请求命令中包含命令类型、请求编号，服务端根据命令类型选择处理器 ，执行请求命令；
2. 服务端将响应数据返回给客户端；

6、通讯框架收到服务端的响应数据后，通过回调线程执行回调函数。

### 2.3 单向 oneway

单向通信发起调用后，不关心调用结果，不做超时控制，只要请求已经发出，就完成本次调用。

通常用于可以重试，或者定时通知类的场景，调用过程是有可能因为网络问题，机器故障等原因，导致请求失败。业务场景需要能接受这样的异常场景，才可以使用。

![](https://javayong.cn/pics/rocketmq/oneway.png)

> 需要注意的是，单向通信不能保证请求一定能够成功发送到服务器，也无法保证服务器是否正确地接收到了请求。

oneway 请求的流程 :

1、客户端连接服务端，创建 channel ；

2、通过信号量 `semaphoreOneway` 限制正在进行的 oneway 请求的最大数量 ;

```java
boolean acquired = this.semaphoreOneway.tryAcquire(timeoutMillis, TimeUnit.*MILLISECONDS*);
```

3、客户端将请求发送到服务端，客户端 oneway 请求方法结束 。

4、服务端解析出请求命令 , 请求命令中包含命令类型、请求编号，服务端根据命令类型选择处理器 ，执行请求命令 , 并不会将响应数据返回给客户端 ； 

下表展示了**同步**、**异步**、**单向**这三种通讯方式的优劣点：

| **方式** | **发送TPS** | **发送结果反馈** | **可靠性** |
| -------- | ----------- | ---------------- | ---------- |
| 同步     | 快          | 有               | 不丢失     |
| 异步     | 快          | 有               | 不丢失     |
| 单向     | 最快        | 无               | 可能丢失   |

## 3 Reactor多线程设计

RocketMQ 的通信模块采用 Netty 组件作为底层通信库，同样也遵循了 Reactor 多线程模型，同时又在这之上做了一些扩展和优化。

![](https://javayong.cn/pics/rocketmq/reactor.png?a=12)

一个 Reactor 主线程 （ `eventLoopGroupBoss` ）责监听 TCP网络连接请求，建立好连接，创建 SocketChannel , 并注册到 selector 上。 

RocketMQ 源码会自动根据  OS 的类型选择 NIO 和 Epoll ，也可以通过参数配置 ）， 然后监听真正的网络数据。

拿到网络数据后，再丢给 Worker 线程池（eventLoopGroupSelector ），再真正执行业务逻辑之前需要进行 SSL 验证、编解码、空闲检查、网络连接管理，这些工作都交给 defaultEventExecutorGroup 去做。

而业务操作由业务线程池中处理，根据 RemotingCommand 的业务请求编号 requestCode ,  从处理器表 processorTable 这个本地缓存中找到对应的处理器 ， 然后封装成 task 任务后，提交到对应的业务处理器的线程池执行。

从入口到业务逻辑的几个步骤里，线程池一直在增加，这跟每一步步骤逻辑复杂性相关 ，越复杂，需要的并发通道越宽。

RocketMQ 的线程模型如下所示 ：

线程数 | 线程名 | 线程具体说明
 --- | --- | --- 
1 | NettyBoss_%d | Reactor 主线程
N | NettyServerEPOLLSelector_%d_%d | Reactor 线程池
M1 | NettyServerCodecThread_%d | Worker线程池
M2 | RemotingExecutorThread_%d | 业务 processor 处理线程池 

## 4 写到最后

通讯模块核心知识点 ：

1、网络协议设计原则便于编解码，Netty 的 LenghtFieldBasedFrameDecode 解码器非常容易得解决 TCP 粘包和拆包的问题；

2、网络通讯框架支持**同步**、**异步**、**单向**这三种通讯方式 ；

3、理解 Reactor 线程模型很关键 。
