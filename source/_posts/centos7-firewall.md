---
title: Centos 7 firewallD 配置
subtitle: Centos 7 相对 Centos 6 配置变化较大
date: 2015/06/01 20:00:12
updated: 2015/06/01 20:00:12
categories:
- 技术
tag:
- centos
- linux
- 运维
#cover: http://oo12ugek5.bkt.clouddn.com/images/default_cover.png
---
#### FirewallD 构建简单配置


比如，要启用或禁用 HTTP 服务： 

```
firewall-cmd --zone=public --add-service=http --permanent
firewall-cmd --zone=public --remove-service=http --permanent
```

比如：允许或者禁用 12345 端口的 TCP 流量。

```
firewall-cmd --zone=public --add-port=12345/tcp --permanent
firewall-cmd --zone=public --remove-port=12345/tcp --permanent
```



#### FirewallD 构建规则集

允许来自主机 192.168.0.* 的所有 IPv4 流量。

```
firewall-cmd --zone=public --add-rich-rule 'rule family="ipv4" source address=192.168.0.0/24 accept'
```


拒绝来自主机 192.168.1.10 到 22 端口的 IPv4 的 TCP 流量。

```
firewall-cmd --zone=public --add-rich-rule 'rule family="ipv4" source address="192.168.1.10" port port=22 protocol=tcp reject'
```


允许来自主机 10.1.0.3 到 80 端口的 IPv4 的 TCP 流量，并将流量转发到 6532 端口上。

```
firewall-cmd --zone=public --add-rich-rule 'rule family=ipv4 source address=10.1.0.3 forward-port port=80 protocol=tcp to-port=6532'
```

允许UDP组播通过防火墙

```
firewall-cmd --permanent --direct --add-rule ipv4 filter INPUT 0 -m pkttype --pkt-type multicast -j ACCEPT
firewall-cmd --permanent --direct --add-rule ipv6 filter INPUT 0 -m pkttype --pkt-type multicast -j ACCEPT

```


#### 重新加载 Firewall 使配置生效

```
firewall-cmd --reload
```