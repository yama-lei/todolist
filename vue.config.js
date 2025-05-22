const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  lintOnSave: false,
  transpileDependencies: true,
  outputDir: 'docs',
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: "植语心声",
        icon: "public/icon.png",
        appId: "com.zhiyuxinsheng.app",
        publish: {
          provider: "github",
          owner: "yama-lei",
          repo: "todolist",
          releaseType: "release"
        },
        win: {
          target: ["nsis"]
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true
        },
        asar: true,
        directories: {
          output: "dist_electron"
        }
      }
    }
  }
})
