# todolist
运行项目前需要配置npm环境

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

### Compiles and hot-reloads for development
这一步是启动项目，成功后在终端中会有网址出现，点击网址即可看见demo
```
npm run serve
```

### 打包成desktop应用(调试版本)
```
npm run electron:serve
```

前端开发的时候：改变了前端的代码记得**刷新页面**才会显示出更改的效果
后端开发的时候：可以自行修改前端代码，让前端调用后端的api，看看后端是否正常；也可以直接使用apifox，post、get等等看看接口是否符合预期。

---




### 打包成desktop应用(发行)
```
npm run electron:build
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
