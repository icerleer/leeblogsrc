---
title: CentOS7 + mysqlcluster 配置部署
date: 2015/08/12 01:12:05
updated: 2015/08/12 01:12:05
subtitle: CentOS7 + mysql-cluster-7.4.6 配置部署
categories:
- 技术
tag:
- linux
- db
cover: http://oys481nr9.bkt.clouddn.com/mysqlcluser_install.jpg
---
 
前后折腾了4天终于把这个东西东西配置好了。吐槽一下，网上的很多资料虽然按照其指定的方法确实可以在CentOS上配置出可用的Mysql Cluster 但是并没有分清管理节点，数据节点，应用节点的目录和区别，如果就这样糊里糊涂的配置，在生产环境估计使用起来够呛。
【注：可能是我没有真正理解这些资料，个人意见而已】

 **1. 参数配置**


很多时候我们都参照网上的并不是很官方的资料，而且并不知道很多参数的含义，所以我找了一个比较比错的方法来生成配置参数, mysql官方在 mysql cluster 7.3 后，做了一个自动化部署的工具,工具很不错。官方的视频地址 http://www.mysql.com/products/cluster/installer.html

启动方式在MYSQL Cluster版本的应用SQL节点程序的bin目录下 运行 ndb_setup.py 会自动跳转到web端配置。[前提是要安装Python]

我并没有用这个工具来真正的部署mysql cluster , 因为部署前需要配置东西较多，而且不利于真正的理解部署环境。所以只用它来获取配置参数(官方的配置放心些， 而且我们可以更改我们的物理机器配置，来获取不同的数据对比各个参数的变化，更好的理解参数的意义)，在部署的过程中我们可以填写物理服务器的配置以及要使用的实时性应用级别，具体的见官方视频介绍
 
我生成的配置数据如下（生成后保存此参数为config.ini文件）

```
#
# Configuration file for PaiDB MyCluster
#

[NDB_MGMD DEFAULT]
Portnumber=1186

[NDB_MGMD]
NodeId=49
HostName=192.168.1.45
DataDir=/usr/local/paidb/mysqlmgm/mgmdata
Portnumber=1186

[TCP DEFAULT]
SendBufferMemory=8M
ReceiveBufferMemory=8M

[NDBD DEFAULT]
BackupMaxWriteSize=1M
BackupDataBufferSize=16M
BackupLogBufferSize=4M
BackupMemory=20M
BackupReportFrequency=10
MemReportFrequency=30
LogLevelStartup=15
LogLevelShutdown=15
LogLevelCheckpoint=8
LogLevelNodeRestart=15
DataMemory=1630M
IndexMemory=291M
MaxNoOfTables=4096
MaxNoOfTriggers=3500
NoOfReplicas=2
StringMemory=25
DiskPageBufferMemory=64M
SharedGlobalMemory=20M
LongMessageBuffer=32M
MaxNoOfConcurrentTransactions=16384
BatchSizePerLocalScan=512
FragmentLogFileSize=256M
NoOfFragmentLogFiles=9
RedoBuffer=64M
MaxNoOfExecutionThreads=2
StopOnError=false
LockPagesInMainMemory=1
TimeBetweenEpochsTimeout=32000
TimeBetweenWatchdogCheckInitial=60000
TransactionInactiveTimeout=60000
HeartbeatIntervalDbDb=1500
HeartbeatIntervalDbApi=1500

[NDBD]
NodeId=1
HostName=192.168.1.45
DataDir=/usr/local/paidb/mysqldata/data1
BackupDataDir=/usr/local/paidb/mysqldata/backup1

[NDBD]
NodeId=2
HostName=192.168.1.40
DataDir=/var/local/paidb/mysqldata/data2
BackupDataDir=/usr/local/paidb/mysqldata/backup2

[MYSQLD DEFAULT]

[MYSQLD]
NodeId=50
HostName=192.168.1.45

[MYSQLD]
NodeId=51
HostName=192.168.1.40

[API]
NodeId=52
HostName=192.168.1.45

[API]
NodeId=53
HostName=192.168.1.45
```
 **2. 配置前准备**

（1）.停止防火墙或者防火墙允许端口1186, 2202, 3306，我为了图方便直接停止防火墙 
```
systemctl stop firewalld
systemctl disable firewalld
```
（2）.解压 mysql cluster 安装包到目录
```
#把我的安装文件放在了 /usr/src/ 文件夹下面
#进入此目录解压
cd /usr/src
tar -zxf mysql-cluster-7.4.6-linux-glibc2.5-x86_64.tar.gz
#简化文件夹名称
mv mysql-cluster-7.4.6-linux-glibc2.5-x86_64 mysqlc
```
（3）.在用户目录下新建要安装的管理节点，数据节点，应用节点的目录，我这里他们都放在 /usr/local/paidb/ 目录下，为每台机器创建要勇于服务的节点目录， 由于测试机器有限，我在其中一台服务器配置，管理节点，数据节点1，应用节点1；另一台服务器配置数据节点2，应用节点2；
下面是我的节点分配情况"()"号内是目录的名称
192.168.1.45 -->管理节点(mysqlmgm) ---> 数据节点(mysqldata) --->应用节点(mysqlapp)
192.168.1.40 -->数据节点(mysqldata)  ---> 应用节点(mysqlapp)

准备工作做好了接下来我们就来配置各个节点的服务了。

 **3. 配置管理节点**
 
 在192.168.1.45的服务器上配置管理节点
```
#创建管理节点运行目录和配置完成后的生成文件目录
mkdir -p /usr/local/paidb/mysqlmgm/bin/config
#创建管理节点数据目录
mkdir -p /usr/local/paidb/mysqlmgm/mgmdata
#进入管理节点目录
cd /usr/local/paidb/mysqlmgm
#拷贝管理节点的必要文件到运行目录
mv /usr/src/mysqlc/bin/ndb_mgmd /usr/local/paidb/mysqlmgm/bin/
mv /usr/src/mysqlc/bin/ndb_mgm  /usr/local/paidb/mysqlmgm/bin/

#拷贝参数配置文件到管理节点运行目录
mv /usr/local/paidb/config.ini /usr/local/paidb/mysqlmgm/bin/config.ini
#把管理节点的运行目录加入环境变量
vim ~/.bash_profile
```
```
#在PATH变量后面增加":/usr/local/paidb/mysqlmgm/bin",如下形式：
PATH=$PATH:$HOME/bin:/usr/local/paidb/mysqlmgm/bin
```
```
#退出VIM，使用命令，让环境变量立即生效
source ~/.bash_profile
```
到此管理节点就算配置完成了

**4. 配置数据节点**

分别在192.168.1.45， 192.168.1.40上配置数据节点

```
#192.168.1.45上创建数据节点所需目录
mkdir -p /usr/local/paidb/mysqldata/bin/
mkdir /usr/local/paidb/mysqldata/data1
mkdir /usr/local/paidb/mysqldata/backup1

#192.168.1.40上创建数据节点所需目录
mkdir -p /usr/local/paidb/mysqldata/bin/
mkdir /usr/local/paidb/mysqldata/data2
mkdir /usr/local/paidb/mysqldata/backup2


#两台机器上都做以下操作
#进入数据节点的运行目录
cd /usr/local/paidb/mysqldata/bin
#拷贝必要的程序到运行目录
mv /usr/src/mysqlc/bin/ndbd    /usr/local/paidb/mysqldata/bin/
mv /usr/src/mysqlc/bin/ndbmtd  /usr/local/paidb/mysqldata/bin/
```
编写配置文件如下，文件命名为：my_data.cnf
```
[mysql_cluster] 
# Options for data node process: 
# location of management server
ndb-connectstring=192.168.1.45:1186,
```
拷贝 my_data.cnf 文件到 /usr/local/paidb/mysqldata/bin/ 目录下

```
#把数据节点的运行目录加入环境变量
vim ~/.bash_profile
```
```
#在PATH变量后面增加":/usr/local/paidb/mysqldata/bin";
# 如下形式：
PATH=$PATH:$HOME/bin:/usr/local/paidb/mysqlmgm/bin:/usr/local/paidb/mysqldata/bin
# 或
PATH=$PATH:$HOME/bin:/usr/local/paidb/mysqldata/bin
```
```
#退出VIM，使用命令，让环境变量立即生效
source ~/.bash_profile
```

到此两个数据节点配置完成

**5. 配置 mysql 应用节点**

相对复杂一点，接下来看配置
分别在192.168.1.45， 192.168.1.40上配置应用节点
```
#创建应用节点所需目录
mkdir -p /usr/local/paidb/mysqlapp/
mkdir /usr/local/paidb/mysqlapp/data
mkdir /usr/local/paidb/mysqlapp/log
mkdir /usr/local/paidb/mysqlapp/socket
mkdir /usr/local/paidb/mysqlapp/tmp

#复所需运行文件到应用节点目录
mv /usr/src/mysqlc    /usr/local/paidb/mysqlapp/app/

#目录转到mysql应用节点运行目录
cd /usr/local/paidb/mysqlapp/app/
#创建mysql实例
./scripts/mysql_install_db --basedir=/usr/local/paidb/mysqlapp/app --datadir=/usr/local/paidb/mysqlapp/data
# 如果出现:FATAL ERROR: please install the following Perl modules before executing ./scripts/mysql_install_db:Data::Dumper，请安装 perl-module  
yum install -y perl-Module-Install.noarch  
#再创建mysql实例
./scripts/mysql_install_db --basedir=/usr/local/paidb/mysqlapp/app --datadir=/usr/local/paidb/mysqlapp/data
```

创建 mysql 应用节点配置文件, 命名问my_app.cnf
```
[mysqld]
ndbcluster=on
port=3306
log-error=/usr/local/paidb/mysqlapp/mysqld.err
basedir=/usr/local/paidb/mysqlapp/app
datadir=/usr/local/paidb/mysqlapp/data
tmpdir=/usr/local/paidb/mysqlapp/tmp
ndb-connectstring=192.168.1.45:1186,
socket=/usr/local/paidb/mysqlapp/socket/mysql.socket
```
拷贝 my_app.cnf 文件到 /usr/local/paidb/mysqlapp/app/ 目录下


```
#把应用节点的运行目录加入环境变量
vim ~/.bash_profile
```
```
#在PATH变量后面增加":/usr/local/paidb/mysqlapp/app/bin";
# 如下形式：
PATH=$PATH:$HOME/bin:/usr/local/paidb/mysqlmgm/bin:/usr/local/paidb/mysqldata/bin:/usr/local/paidb/mysqlapp/app/bin
# 或
PATH=$PATH:$HOME/bin:/usr/local/paidb/mysqldata/bin:/usr/local/paidb/mysqlapp/app/bin
```
```
#退出VIM，使用命令，让环境变量立即生效
source ~/.bash_profile
```

到此为止应用节点配置算是完成了。


**6. 运行各个节点服务**

（1）先启动管理节点

```
#第一次启动是使用
ndb_mgmd -f /usr/local/paidb/mysqlmgm/bin/config.ini --configdir=/usr/local/paidb/mysqlmgm/bin/config --initial

#以后的每一次启动使用
ndb_mgmd -f /usr/local/paidb/mysqlmgm/bin/config.ini --configdir=/usr/local/paidb/mysqlmgm/bin/config
```
（2）然后启动数据节点

分别在 192.168.1.45 和 192.168.1.40上执行

```
#第一次启动是使用
ndbmtd --defaults-file=/usr/local/paidb/mysqldata/bin/my_data.cnf --initial

#以后的每一次启动使用
ndbmtd --defaults-file=/usr/local/paidb/mysqldata/bin/my_data.cnf 
```

（2）最后启动应用节点

```
#创建启动应用节点所需的符号链接
ln -s /usr/local/paidb/mysqlapp/socket/mysql.socket /tmp/mysql.sock
```

```
#创建mysql用户和组，以启动mysql应用节点服务
groupadd mysql
useradd -g mysql -s /usr/sbin/nologin mysql
#赋值用户和组的权限
chown -R mysql:mysql /usr/local/paidb
```

制作 mysql 应用节点服务文件，命名为 mysqlapp.service，以便开机启动,  

```
[Unit]
Description=mysqlapp -- mysql cluster API 
Before=network.target

[Service]
Type=simple
ExecStart=/usr/local/paidb/mysqlapp/app/bin/mysqld --defaults-file=/usr/local/paidb/mysqlapp/app/my_app.cnf --user=mysql

[Install]
WantedBy=basic.target
```

拷贝此文件到 /usr/lib/systemd/system 目录下

```
#启动 mysql cluster 应用节点
systemctl start mysqlapp

#如果要查看当前应用节点运行状态
systemctl status mysqlapp

#如果要停止应用节点服务
systemctl stop mysqlapp
```


到此  mysql cluster 全部部署完成。

