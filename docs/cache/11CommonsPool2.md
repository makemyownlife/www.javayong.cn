---
title: 对象池化框架Commons Pool 2
category: cache
tag:
  - cache 
head:
  - - meta
    - name: keywords
      content: 缓存,Apache Commons Pool 2,设计
  - - meta
    - name: description
      content: 详解 对象池化框架 Apache Commons Pool 2
---


Apache Commons Pool 提供了通用对象池的实现，用于管理和复用对象，以提高系统的性能和资源利用率。

对象池是一种设计模式，它维护一组已经创建的对象，并在需要时将其提供给应用程序，而不是每次需要时都创建新的对象。

![](https://javayong.cn/pics/cache/githubcommonspool.png)

## 1 基础用法

### 1.1 添加依赖

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-pool2</artifactId>
    <version>2.0</version>
</dependency>
```

### 1.2 定义对象工厂

`PooledObjectFactory `是一个池化对象工厂接口，定义了生成对象、激活对象、钝化对象、销毁对象的方法，如下：

```java
public interface PooledObjectFactory<T> {

  /**
   * Creates an instance that can be served by the pool and wrap it in a
   */
  PooledObject<T> makeObject() throws Exception;

  /**
   * Destroys an instance no longer needed by the pool
   */
  void destroyObject(PooledObject<T> p) throws Exception;

  /**
   * Ensures that the instance is safe to be returned by the pool
   */
  boolean validateObject(PooledObject<T> p);

  /**
   * Reinitializes an instance to be returned by the pool
   */
  void activateObject(PooledObject<T> p) throws Exception;
  
  /**
   * Uninitializes an instance to be returned to the idle object pool
   */
  void passivateObject(PooledObject<T> p) throws Exception;
}
```

以下是一个简单的示例：

1. **定义需要池化的对象 MyObject** 

```java
public class MyObject {

    private String uid = UUID.randomUUID().toString();

    private volatile boolean valid = true;

    public void initialize() {
        System.out.println("初始化对象" + uid);
        valid = true;
    }

    public void destroy() {
        System.out.println("销毁对象" + uid);
        valid = false;
    }

    public boolean isValid() {
        return valid;
    }

    public String getUid() {
        return uid;
    }

}
```

2. **定义对象工厂**

```java
public class MyObjectFactory implements PooledObjectFactory<MyObject> {

    @Override
    public PooledObject<MyObject> makeObject() throws Exception {
        // 创建一个新对象
        MyObject object = new MyObject();
        // 初始化对象
        object.initialize();
        return new DefaultPooledObject<>(object);
    }

    @Override
    public void destroyObject(PooledObject<MyObject> p) throws Exception {
        // 销毁对象
        p.getObject().destroy();
    }

    @Override
    public boolean validateObject(PooledObject<MyObject> p) {
        return p.getObject().isValid();
    }

    @Override
    public void activateObject(PooledObject<MyObject> p) throws Exception {
    }

    @Override
    public void passivateObject(PooledObject<MyObject> p) throws Exception {
    }

}
```

### 1.3 配置对象池

 创建 `GenericObjectPool` 对象，并设置相关参数，如最大对象数量、最小空闲对象数量等。

```java
GenericObjectPoolConfig config = new GenericObjectPoolConfig();
config.setMaxTotal(20);
config.setMaxIdle(5);
config.setTestWhileIdle(true);
config.setMinEvictableIdleTimeMillis(60000L);
GenericObjectPool<MyObject> pool = new GenericObjectPool<>(new MyObjectFactory(), config);
```

### 1.4 借用和归还对象

```java
MyObject myObject = null;
try {
    myObject = pool.borrowObject();
    System.out.println("get对象" + myObject.getUid() +  " thread:" + Thread.*currentThread*().getName());
} catch (Exception e) {
    e.printStackTrace();
} finally {
    try {
        if (myObject != null) {
            pool.returnObject(myObject);
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

## 2 Jedis 连接池

Jedis 是一个 Java 语言的 Redis 客户端库。它提供了一组易于使用的 API，可以用来连接和操作 Redis 数据库。

它的内部使用 Commons Pool 来管理 Redis 连接 ，我们使用 jedis 3.3.0 版本写一个简单的示例。

```java
public class JedisMain {
    public static void main(String[] args) throws Exception{
        // 创建连接池配置
        JedisPoolConfig config = new JedisPoolConfig();
        config.setMaxTotal(100);
        config.setMaxIdle(20);
        // 创建连接池
        JedisPool pool = new JedisPool(config, "localhost", 6379);
        // 获取连接
        Jedis jedis = pool.getResource();
        jedis.set("hello" , "张勇");
        // 使用连接
        String value = jedis.get("hello");
        System.out.println(value);
        // 归还连接
        jedis.close();
        // 关闭连接池
        // pool.close();
        Thread.sleep(5000);
    }
}
```

如下图，JedisFactory 实现了对象工厂，实现了**创建对象**、**销毁对象**、**验证对象**、**激活对象**四个方法。 

![](https://javayong.cn/pics/cache/JedisFactory.png)

比如验证对象方法，逻辑是调用 Jedis 的 ping 方法，判断该连接是否存活。 

## 3 原理解析

我们重点解析 **GenericObjectPool** 类的原理。

### 3.1 初始化 

```java
public GenericObjectPool(
            final PooledObjectFactory<T> factory,
            final GenericObjectPoolConfig<T> config) {
     super(config, ONAME_BASE, config.getJmxNamePrefix());
     if (factory == null) {
          jmxUnregister(); // tidy up
          throw new IllegalArgumentException("factory may not be null");
     }
     this.factory = factory;
     idleObjects = new LinkedBlockingDeque<>(config.getFairness());
     setConfig(config);
 }

 private final Map<IdentityWrapper<T>, PooledObject<T>> allObjects =
        new ConcurrentHashMap<>();
```

初始化做两件事情：

1. 初始化 JedisFactory 工厂对象。

2. 对象容器 **idleObjects** , 类型是 **LinkedBlockingDeque** 。

   因此存储容器有两个，所有的对象 allObjects 和空闲对象 idleObjects （可以直接取出使用）。

3. 配置对象池属性 。

### 3.2 创建对象

我们关注 GenericObjectPool 类的 **borrowObject** 方法。

![](https://javayong.cn/pics/cache/borrowObject.png)

逻辑其实很简单 ：

1. 从容器中获取第一个条目对象，若没有获取，则调用工厂对象的创建对象方法，并将该对象加入到全局对象 Map。

2. 创建成功后，调用对象的激活方法，接着验证对象的可靠性，最后将对象返回。

### 3.3 归还连接

![](https://javayong.cn/pics/cache/returnObject.png)

流程如下：

1. 判断返还对象时是否校验，假如校验失败，则销毁该对象，将该对象从存储容器中删除 ；
2. 调用工厂对象的激活对象方法 ；
3. 若空闲对象 Map 元素大小达到最大值，则销毁该对象，将该对象从存储容器中删除 ；
4. 正常将对象放回到空闲对象容器 **idleObjects** 。

---

> 参考资料： 
>
> https://github.com/redis/jedis/wiki/Getting-started
>
> https://github.com/apache/commons-pool











------

如果我的文章对你有所帮助，还请帮忙**点赞、在看、转发**一下，你的支持会激励我输出更高质量的文章，非常感谢！

![](https://www.javayong.cn/pics/temp//vBrZNjbMur.webp!large)