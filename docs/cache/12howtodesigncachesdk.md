---
title: 如何设计一个Redis客户端SDK
category: cache
tag:
  - cache 
  - Redis
head:
  - - meta
    - name: keywords
      content: 缓存,Redis,SDK
  - - meta
    - name: description
      content: 详解如何设计一个缓存SDK
---

这篇文章，我们聊聊如何设计一个 Redis 客户端 SDK 。

![](https://javayong.cn/pics/cache/platformredisgithub.png)

## 1 SDK 设计思路

SDK 的设计理念核心两点：

1. 提供精简的 API 供开发者使用，方便与用户接入；

2. 屏蔽三方依赖，用户只和对外 API 层交互 。

![](https://javayong.cn/pics/cache/redissdk.png?a=311)

Redis SDK 如上图，分为三层：

1. 最上层为 API ，用户与该层打交道 ，为了方便用户方便接入，设计了`springboot starter`模块。

2. 中间为核心功能层，提供了两类功能：Redis 操作命令（比如 String 相关命令）和增强功能（比如分布式锁）。

3. 最底层是三方依赖，我们有两种选择：自己实现与 Redis 服务端的交互，工作量非常大，另一种是选择选择成熟的 Redis Java 客户端框架 ，再此基础上进行封装，并补充其他的实现。

   笔者选择 Redisson 框架，因为该框架实现了非常高级的功能，比如分布式锁，延迟队列等。

## 2 操作命令封装

封装操作命令时基本原则是：**`尽量不要提供危险的接口供开封者使用，尽量减少开封者的使用心智`**。

比如，`KEYS ` 命令用于查找符合指定模式的所有键。它是一个用于调试目的的命令，但在生产环境中不推荐频繁使用，因为在大型数据库中执行 `KEYS ` 命令可能会导致性能问题。考虑到假如提供给开发者使用会引发，我们并不会封装 `KEYS ` 命令给开发者使用。

![](https://javayong.cn/pics/cache/platformsms.png?1=1)

项目分为四个模块：

1. **客户端模块**：核心模块，封装了 Redis 操作命令（比如 String 相关命令）和增强功能（比如分布式锁）。
2. **springboot starter** :  开发者只需要在 pom.xml **引入 starter 的依赖**定义，在配置文件中**编写约定的配置**。
3. **ID 生成器：** 通过 Redis 改造雪花算法生成唯一编号。
4. **使用示例**：使用简单的 springboot starter 的例子。

本节我们重点讲解**客户端模块**的实现。

```java
//1. 定义配置
SingleConfig config = new SingleConfig();
config.setAddress("redis://127.0.0.1:6379");

//2. 定义Redis操作对象
RedisOperation redisOperation = new RedisOperation(config);

// 3.使用String命令的 setEx 方法
StringCommand stringCommand = redisOperation.getStringCommand();
stringCommand.setEx("hello", "mylife", 109);

// 4.使用Hash命令的hset方法
HashCommand hashCommand = this.redisOperation.getHashCommand();
hashCommand.hset("myhash", "time", "mybatis");
```

首先我们定义一个配置类，例子中是单机配置类 `SingleConfig` ，还有集群配置、主从配置。

![](https://javayong.cn/pics/cache/platformcacheconfig.png)

然后初始化`操作对象` **RedisOperation** , 参数是配置对象。最后获取内置的 **String 命令** 、**Hash 命令**对象，调用该对象的操作方法。

![](https://javayong.cn/pics/cache/redissonoperation.png)

RedisOperation 对象内置了 RedissonClient 对象 ，该对象对用户是不可视的。

```java
public RedisOperation(SingleConfig SingleServerConfig) {
       Config config = ConfigBuilder.buildBySingleServerConfig(SingleServerConfig);
       //默认string编解码
       config.setCodec(new StringCodec());
       this.redissonClient = Redisson.create(config);
}
```

三种根据配置类初始化的构造函数，每个构造函数内会创建初始化 RedissonClient 对象。

然后根据 RedissonClient 对象创建不同的操作命令：

```java
public StringCommand getStringCommand() {
      StringCommand StringCommand = new StringCommandImpl(this.redissonClient);
      return StringCommand;
}
public StringCommand getStringCommand(RedisCodec RedisCodec) {
      StringCommand StringCommand = new StringCommandImpl(this.redissonClient , RedisCodec);
      return StringCommand;
}
public AtomicCommand getAtomicCommand() {
      AtomicCommand AtomicCommand = new AtomicCommandImpl(this.redissonClient);
      return AtomicCommand;
}
public ListCommand getListCommand() {
      ListCommand ListCommand = new ListCommandImpl(this.redissonClient);
      return ListCommand;
}
// 省略其他的命令代码
```

最后，我们看看字符串操作命令 StringComand 如何实现。

**1、核心接口**

```java
public interface StringCommand extends KeyCommand {

    String get(String key);

    void set(String key, String value);

    void setEx(String key, String value, int second);

    boolean setNx(String key, String value);

    boolean setNx(String key, String value, int aliveSecond);

    Map<String, Object> mget(String... keys);

}
```

**2、接口实现类**

```java
public class StringCommandImpl extends KeyCommandImpl implements StringCommand {

    public StringCommandImpl(RedissonClient redissonClient) {
        super(redissonClient);
    }

    public StringCommandImpl(RedissonClient redissonClient, RedisCodec redisCodec) {
        super(redissonClient, redisCodec);
    }

    public String get(final String key) {
        return invokeCommand(new InvokeCommand<String>(RedisCommandType.GET) {
            @Override
            public String exe(RedissonClient redissonClient) {
                RBucket<String> result = getRedissonClient().getBucket(key);
                if (result == null || !result.isExists()) {
                    return null;
                }
                return result.get();
            }
        });
    }

    public void set(final String key, final String value) {
        invokeCommand(new InvokeCommand<String>(RedisCommandType.SET) {
            @Override
            public String exe(RedissonClient redissonClient) {
                RBucket<String> result = getRedissonClient().getBucket(key);
                result.set(value);
                return null;
            }
        });
    }

    public void setEx(final String key, final String value, final int second) {
        invokeCommand(new InvokeCommand<String>(RedisCommandType.SET_EX) {
            @Override
            public String exe(RedissonClient redissonClient) {
                RBucket<String> result = getRedissonClient().getBucket(key);
                result.set(value, second, TimeUnit.SECONDS);
                return null;
            }
        });
    }

    public boolean setNx(final String key, final String value) {
        return invokeCommand(new InvokeCommand<Boolean>(RedisCommandType.SET_NX) {
            @Override
            public Boolean exe(RedissonClient redissonClient) {
                RBucket<String> result = getRedissonClient().getBucket(key);
                return result.trySet(value);
            }
        });
    }

    public boolean setNx(final String key, final String value, final int aliveSecond) {
        return invokeCommand(new InvokeCommand<Boolean>(RedisCommandType.SET_NX) {
            @Override
            public Boolean exe(RedissonClient redissonClient) {
                RBucket<String> result = getRedissonClient().getBucket(key);
                return result.trySet(value, aliveSecond, TimeUnit.SECONDS);
            }
        });
    }

    public Map<String, Object> mget(final String... keys) {
        return invokeCommand(new InvokeCommand<Map<String, Object>>(RedisCommandType.MGET) {
            @Override
            public Map<String, Object> exe(RedissonClient redissonClient) {
                return getRedissonClient().getBuckets().get(keys);
            }
        });
    }

}
```

实现类里面方法实现都比较简单，都是使用 RedissonClient 的 API 方法 ，我们做一层简单的包装。

在包装类内部，我们除了实现基本的 API 调用之外，也可以做访问统计等额外功能。

## 3 实现 springboot starter

### 3.1 启动器

我们都知道，Spring Boot 基于“**约定大于配置**”（Convention over configuration）这一理念来快速地开发、测试、运行和部署 Spring 应用，并能通过简单地与各种启动器（如 spring-boot-web-starter）结合，让应用直接以命令行的方式运行，不需再部署到独立容器中。

Spring Boot starter 构造的启动器使用起来非常方便，开发者只需要在 pom.xml **引入 starter 的依赖**定义，在配置文件中**编写约定的配置**即可。

很多开源组件都会为 Spring 的用户提供一个 spring-boot-starter 封装给开发者，让开发者非常方便集成和使用。

spring-boot-starter 实现流程如下：

**01、定创建starter项目，定义 Spring 自身的依赖包和 Bean 的依赖包 ;**

**02、定义spring.factories 文件**

在 resources 包下创建 META-INF 目录后，新建 spring.factories 文件，并在文件中**定义自动加载类**，文件内容格式：

```yaml
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
xx.xx.xx.xx.xx.MyConfig
```

spring boot 会根据文件中配置的自动化配置类来自动初始化相关的 Bean、Component 或 Service。

**03、配置自动配置类**

编写自动配置类，这些类将在Spring应用程序中自动配置starter。自动配置类应该有一个@Configuration注解，并且应该包含可以覆盖的默认值，以允许用户自定义配置。在自动配置类中，可以使用@ConditionalOnClass、@ConditionalOnMissingBean等条件注解，以便只有在需要的情况下才会配置 starter。

### 3.2 实现方式

![](https://javayong.cn/pics/cache/springbootstarterconfig.png)

首先在 resources 包下创建 META-INF 目录后，新建 spring.factories 文件，并在文件中**定义自动加载类**，文件内容格式：

```yaml
# Auto Configure
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.courage.platform.redis.client.springboot.starter.configuration.RedisClientAutoConfiguration
```

然后定义自动配置类 `RedisClientAutoConfiguration`。

```java
@Configuration
public class RedisClientAutoConfiguration {

    @Configuration
    @ConditionalOnMissingBean(Config.class)
    @ConditionalOnProperty(name = "spring.redis.type", havingValue = "single")
    static class StaticBuildSingleServer {

        @Bean(value = "platformSingleServerConfig")
        @ConfigurationProperties(prefix = "spring.redis.single")
        public SingleConfig getSingleConfig() {
            SingleConfig config = new SingleConfig();
            return config;
        }

        @Bean
        public Config singleServerConfig(SingleConfig singleConfig) {
            return ConfigBuilder.buildBySingleServerConfig(singleConfig);
        }

        @Bean(destroyMethod = "shutdown")
        public RedisOperation redisOperation(Config config) {
            RedisOperation redisOperation = new RedisOperation(config);
            return redisOperation;
        }

    }

    @Configuration
    @ConditionalOnMissingBean(Config.class)
    @ConditionalOnProperty(name = "spring.redis.type", havingValue = "sentinel")
    static class StaticBuildSentinelServer {

        @Bean(value = "platformSentinelServerConfig")
        @ConfigurationProperties(prefix = "spring.redis.sentinel")
        public SentinelConfig getPlatformSentinelServersConfig() {
            SentinelConfig sentinelConfig = new SentinelConfig();
            return sentinelConfig;
        }

        @Bean
        public Config sentinelServerConfig(SentinelConfig sentinelConfig) {
            return ConfigBuilder.buildBySentinelServerConfig(sentinelConfig);
        }

        @Bean(destroyMethod = "shutdown")
        public RedisOperation redisOperation(Config config) {
            RedisOperation redisOperation = new RedisOperation(config);
            return redisOperation;
        }
    }

    @Bean("stringCommand")
    @ConditionalOnBean(RedisOperation.class)
    public StringCommand createStringCommand(RedisOperation redisOperation) {
        return redisOperation.getStringCommand();
    }

    @Bean
    @ConditionalOnBean(RedisOperation.class)
    public ZSetCommand createZSetCommand(RedisOperation redisOperation) {
        return redisOperation.getZSetCommand();
    }

    @Bean
    @ConditionalOnBean(RedisOperation.class)
    public SetCommand createPlatformSetCommand(RedisOperation redisOperation) {
        return redisOperation.getSetCommand();
    }

    @Bean
    @ConditionalOnBean(RedisOperation.class)
    public AtomicCommand createPlatformAtomicCommand(RedisOperation redisOperation) {
        return redisOperation.getAtomicCommand();
    }

    @Bean
    @ConditionalOnBean(RedisOperation.class)
    public HashCommand createHashCommand(RedisOperation redisOperation) {
        return redisOperation.getHashCommand();
    }

    @Bean
    @ConditionalOnBean(RedisOperation.class)
    public ScriptCommand createPlatformScriptCommand(RedisOperation redisOperation) {
        return redisOperation.getScriptCommand();
    }

    @Bean
    @Primary
    @ConditionalOnBean(RedisOperation.class)
    public IdGenerator createIdGenerator(RedisOperation redisOperation) {
        return new IdGenerator(redisOperation);
    }

}
```

该配置类首先会根据配置类创建 RedisOperation 对象 ，然后获取命令对象（比如 StringCommand、HashCommand）注入到 Spring 容器里。

### 3.3 如何使用

![](https://javayong.cn/pics/cache/springbootplatformredisdemo.png)

**1、pom文件添加依赖**

```xml
<dependency>
     <groupId>com.courage</groupId>
     <artifactId>platform-redis-client-springboot-starter</artifactId>
     <version>1.0.0-SNAPSHOT</version>
</dependency>
```

**2、yaml缓存配置**

```yaml
spring:
  redis:
    type: single
    single:
      address: 127.0.0.1:6379
```

**3、使用缓存**

```java
@Autowired
private RedisOperation redisOperation;

@RequestMapping(value = "/hello", method = RequestMethod.GET)
@ResponseBody
public String hellodanbiao() {
     String mylife = redisOperation.getStringCommand().get("hello");
     System.out.println(mylife);
     redisOperation.getStringCommand().set("hello", "zhang勇");
     return "hello-service";
}
```

---

参考资料：

> Redis 集成简介：https://juejin.cn/post/7076244567569203208