#!/bin/bash

# 停止已运行的PM2进程
pm2 delete all

# 启动应用
sudo pm2 start ecosystem.config.js

# 保存PM2进程列表
sudo pm2 save

echo "服务已启动，使用 pm2 logs 查看日志"
