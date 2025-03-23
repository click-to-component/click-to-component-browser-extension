# [click-to-component-browser-extension](https://chromewebstore.google.com/detail/click-to-component/hdiiegojkjkgaakbdjpoaaadhnddpfdc)

[English](./README.md) | 简体中文

在浏览器中按住 Option(Alt) 点击组件，立即在编辑器中打开对应代码。

## 功能

1. 在浏览器中按住 Option(Alt) 点击组件，立即在编辑器中打开对应代码；
2. 在浏览器中按住 Option(Alt) 右键点击组件，展示包含当前组件和父组件的列表；
3. 支持自定义配置打开 WebStorm、Cursor、GitHub 等；
4. 支持 `data-__source-code-location`；
   - Vue 使用 [vue-click-to-component](https://www.npmjs.com/package/vue-click-to-component) 生成。
   - React 使用 [babel-plugin-transform-react-jsx-data-source-code-location](https://www.npmjs.com/package/babel-plugin-transform-react-jsx-data-source-code-location) 生成。
5. 支持 React `__source` (由 [@babel/plugin-transform-react-jsx-source](https://babeljs.io/docs/babel-plugin-transform-react-jsx-source) 生成)。

## 安装

1. 打开链接 [Click To Component - Chrome Web Store](https://chromewebstore.google.com/detail/hdiiegojkjkgaakbdjpoaaadhnddpfdc)；
2. 点击 `添加至 Chrome`。

你可以将此扩展的“站点访问”配置为“点击时”或“特定站点”，以控制点击组件的脚本注入。
