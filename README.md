# 番剧追踪器 (Anime Tracker)

一个纯前端的番剧/剧集观看进度追踪应用，配合一个本地 Flask 代理实现豆瓣搜索与封面加载。

![主题](https://img.shields.io/badge/theme-dark-1a1a2e) ![依赖](https://img.shields.io/badge/frontend-vanilla_JS-yellow) ![后端](https://img.shields.io/badge/backend-Flask-green)

## 功能

- **豆瓣搜索添加**：输入部分名称即可搜索，点击结果自动回填标题、封面、总集数；也支持纯手动添加
- **进度记录**：点击集数圆点切换已看/未看，带涟漪动画；悬停已看圆点显示观看日期
- **状态自动流转**：想看 →（标记首集）→ 在看 →（全部看完）→ 已看完，取消已看会自动回退
- **完成庆祝**：全部看完时弹出庆祝弹窗 + 彩带动画，统计观看天数
- **数据持久化**：基于 localStorage，支持导出 / 导入 JSON 备份
- **响应式**：移动端自动切换为抽屉式列表

## 项目结构

```
anime-tracker/
├── proxy.py          # Flask 代理，转发豆瓣搜索与图片
├── index.html        # 单页应用入口
├── css/
│   └── style.css     # 全部样式（深色主题）
└── js/
    ├── storage.js    # localStorage 持久化与导入导出
    ├── model.js      # 数据模型与状态流转
    ├── renderer.js   # DOM 渲染
    ├── search.js     # 豆瓣搜索与添加
    ├── interaction.js # 点击交互、涟漪、Tooltip、庆祝动画
    └── app.js        # 应用入口与初始化
```

## 快速开始

```bash
# 1. 安装 Python 依赖
pip install flask flask-cors requests

# 2. 启动豆瓣代理（搜索和封面功能依赖它）
python proxy.py

# 3. 用浏览器打开 index.html 即可（推荐 VS Code Live Server）
```

> 不启动代理也能正常使用手动添加、进度记录、导入导出等功能，只是无法搜索豆瓣。

## 技术说明

- 前端：原生 HTML / CSS / JavaScript，零框架零构建
- 后端：Flask 本地代理，仅用于绕过豆瓣接口的跨域与防盗链限制
- 数据：全部存储在浏览器 localStorage，不上传任何服务器

## License

MIT
