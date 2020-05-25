#仅供学习参考，多进程分工，充分利用多核
### 主进程负责把spider获得的infohash传递给btclient，btclient把解析过后的种子信息写入数据库
### spider子进程负责爬取节点获取infohash传给主进程的btclient
### btclient子进程负责解析种子文件信息传给主进程写入数据库