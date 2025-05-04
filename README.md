# Todolist
运行项目前需要配置npm环境

## 同步最新代码

网上有教程 ~~其实是我不太会~~

## Project setup
先安装项目的依赖，运行npm install
```
npm install
```
### 查看npm run的命令
```
npm run
```
就可以看见这个项目所有的npm 脚本
（也可以打开根目录下的package.json，查看script部分）

##  Run the frontend 启动前端代码

在项目根目录下，启动`npm run sreve`

![image-20250504144920721](https://yamapicgo.oss-cn-nanjing.aliyuncs.com/picgoImage/image-20250504144920721.png)

## Run the server 启动后端

先进入后端`cd backend`

再启动服务器`npm run dev` 

![image-20250504145003822](https://yamapicgo.oss-cn-nanjing.aliyuncs.com/picgoImage/image-20250504145003822.png)

---

## 使用cursor进行开发

用cursor打开项目文件夹（一定要是一整个文件夹）

比如在命令行中打开：

![image-20250504145252380](https://yamapicgo.oss-cn-nanjing.aliyuncs.com/picgoImage/image-20250504145252380.png)

可以看看项目有什么问题，有问题详细地和ai讲一下（agent模式会自己修改改代码，如果修改的代码不是自己需要的，需要`reject`）
