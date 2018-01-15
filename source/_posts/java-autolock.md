---
title: java 实现自动锁
date: 2017/09/01 21:22:05
updated: 2017/09/01 21:22:05
subtitle: 利用java7+ 的 try-with-resource 特性, 实现自动锁
categories:
- 技术
tag:
- java
cover: http://oys481nr9.bkt.clouddn.com/JavaAutoock_cover.jpg
---
 - 了解自动锁

很早就受不了 java 锁的机制了,每次都需要在 finally 去解锁, 不仅代码不美观,而且很麻烦

我想能不能实现加锁之后自动解锁, 如果是C++ 可以利用析构函数实现, 但java就.......

想了想好像可以利用java7 的 try-with-resource 特性, 对象只需要实现 AutoCloseable 接口

```java
class AutoLock implements AutoCloseable
{
	// other function start
	
	// ........
	
	// other function end

	// I like this feature
	@Override
    public void close() throws Exception
    {
        unLock();
    }
}
```

- 实现自动锁

我了解如何利用java特性写一个自动锁那么, 下面我们开始真正的实现

```java
// 自动锁实现类
public static class AutoLock implements AutoCloseable
{
    // 重入锁对象
    private ReentrantLock reentrantLock = new ReentrantLock();

    /**
     * 自动锁 加锁
     * @return 返回自动锁本身
     */
    public AutoLock lock()
    {
        // 加锁
        reentrantLock.lock();
        return this;
    }

	public static AutoLock getAutoLock()
	{
		return new AutoLock().lock();
	}

    /**
     * 自动锁解锁
     * @return 返回自动锁本身
     */
    private AutoLock unLock()
    {
        // 解锁
        if (null != reentrantLock && reentrantLock.isLocked())
        {
            reentrantLock.unlock();           
        }
        return this;
    }

    @Override
    public void close() throws Exception
    {
        unLock();
    }
}
```

```java
// 简单, 调用示例

public void testAutoLock() throws Exception
{
	try(AutoLock autoLock = new AutoLock())
	{
		autoLock.lock()
		// do some thing.....
	}
	
	// 不用再解锁了, 不用再解锁了, 不用再解锁了!!!
}

```

```java
// 更方便的调用示例

public void testAutoLock() throws Exception
{
	// 使用静态方法
	try(AutoLock autoLock = AutoLock.getAutoLock())
	{
		// do some thing.....
	}
	
	// 不用再解锁了, 不用再解锁了, 不用再解锁了!!!
}
```

 - 自动锁的使用场景

前面两种调用方式, 只是打个比方, 但是很多时候,我们的需求并不是 每次都需要 new ReentrantLock(), 这样并没有什么N用的, 因为每次新的"重入锁"实例, 起不到防止重入的目的, 那我们改变一下方式, 我们做两个地方的改变, 我们修改reentrantLock 成员不做初始化new, 而是通过参数传入Lock 抽象接口对象
```java
// 自动锁实现类
public class AutoLock implements AutoCloseable
{
    // *重入锁对象 (改变1)*
    private Lock autoLock = null

	// *重写构造函数(改变2)*
	private AutoLock(Lock autoLock)
	{
		this.autoLock = autoLock;
	}

    /**
     * 自动锁 加锁
     * @return 返回自动锁本身
     */
    public AutoLock lock()
    {
        // *加锁(改变3)*
        if (null != reentrantLock)
        {
	        reentrantLock.lock();
        }
        return this;
    }

	// *获取自动锁对象 (改变4)*
	public static AutoLock getAutoLock(Lock autoLock)
	{
		return new AutoLock(autoLock).lock();
	}

    /**
     * 自动锁解锁
     * @return 返回自动锁本身
     */
    private AutoLock unLock()
    {
        // 解锁
        if (null != autoLock)
        {
            autoLock.unlock();
        }
        return this;
    }

    @Override
    public void close() throws Exception
    {
        unLock();
    }
}
```
至于为什么传入的是 Lock 抽象接口, 因为很所时候,我们可能自定义一个锁对象, 或者以后JDK可能提供的其他锁, 我们来看看调用示例吧
```java

public class TestService()
{
	private Lock reentrantLock = new ReentrantLock();
	
	// 假设线程A调用此方法
	pubilc void testAutoLockA() throws Exception
	{
		try(AutoLock autoLock = AutoLock.getAutoLock(reentrantLock))
		{
			// do some thing....
		}
	}
	
	// 假设线程B调用此方法
	public void testAutoKLockB() throws Exception
	{
		try(AutoLock autoLock = AutoLock.getAutoLock(reentrantLock))
		{
			// do some thing....
		}
	}
}

```

至此我们就实现了,我们假设的常用场景

 - 更高级的用法
 
 如果我要更细粒度的锁, 不是在对象的成员中存在锁对象,怎么办.
 我写一个方法, 希望可以帮助大家, 抛砖引玉, 如果可以提供更好的方式请求留言

```java
/**
 * Description: TestLock
 * Created by: IcerLeer
 * Created on: 2017-08-31 17:42
 */
public class LockUtils
{
    // 自动锁缓存队列, 实现不可重入
    private static ConcurrentHashMap<String, AutoLock> lockMap = new ConcurrentHashMap<>();

    /**
     * 获取自动锁
     * @param strKey 自动锁关键字
     * @return 返回自动锁对象
     */
    public static AutoLock getAutoLock(String strKey)
    {
        synchronized (strKey.intern())
        {
            return lockMap.computeIfAbsent(strKey, key -> new AutoLock(strKey)).lock();
        }
    }

    /**
     * 移除自动锁
     * @param strKey 自动锁关键字
     */
    private static void removeAutoLock(String strKey)
    {
        lockMap.remove(strKey);
    }

    /**
     * 自动锁
     */
    public static class AutoLock implements AutoCloseable
    {
        // 锁的关键字
        private String lockKey = "";
        // 事务锁对象
        private ReentrantLock reentrantLock = new ReentrantLock();
        // 引用计数
        private int refNumber = 0;

        // 初始化构造函数
        public AutoLock(String strKey)
        {
            if (StringUtils.isNotBlank(strKey))
            {
                lockKey = strKey;
            }
        }

        /**
         * 自动锁 加锁
         * @return 返回自动锁本身
         */
        private AutoLock lock()
        {
            // 增加引用次数
            refNumber++;
            // 加锁
            reentrantLock.lock();
            return this;
        }

        /**
         * 自动锁解锁
         * @return 返回自动锁本身
         */
        private AutoLock unLock()
        {
            // 解锁
            if (null != reentrantLock && reentrantLock.isLocked())
            {
                reentrantLock.unlock();
                // 判断是否应该把自动锁移除队列
                synchronized (lockKey.intern())
                {
                    // 减少引用次数
                    refNumber--;
                    // 如果引用计数
                    if (0 == refNumber)
                    {
                        removeAutoLock(lockKey);
                    }
                }
            }
            return this;
        }

        @Override
        public void close() throws Exception
        {
            unLock();
        }

    }
}
```

当然少不了调用示例
```java
private void testAutoLockA() throws Exception
{
	/// "Test" 为锁的关键字, 相同的关键字实现不可重入锁
    try(LockUtils.AutoLock autoLock = LockUtils.getAutoLock("Test"))
    {
        // do some thing
		sleep(10);
    }
}

private void testAutoLockB() throws Exception
{
	/// "Test" 为锁的关键字, 相同的关键字实现不可重入锁
    try(LockUtils.AutoLock autoLock = LockUtils.getAutoLock("Test"))
    {
        // do some thing
		sleep(10);
    }
}

```