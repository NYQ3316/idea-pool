# 💡 创意池 (idea-pool)

> 用最少的步骤，记录最好的想法。

一个**轻量级的创意收集工具**，特别适合游戏创意的快速记录。支持从 Markdown 描述中**自动提取**游戏类型、建议年龄、游戏人数、操作方式、参考原型链接等关键信息。

---

## ✨ 核心特性

- 🎨 **玻璃拟态 UI**：深色主题 + 紫色渐变，简洁美观
- 📝 **Markdown 编辑**：支持富文本描述，自动渲染预览
- 🤖 **智能提取**：从描述中自动解析 5 大关键字段
- 📎 **多方式上传图片**：
  - 点击选择文件
  - 拖拽图片到上传区
  - 粘贴图片 URL 链接
  - 任意位置 `Ctrl+V` 粘贴截图
- 💾 **本地存储**：默认使用浏览器 `localStorage`，零依赖
- ☁️ **网盘中转**（可选）：通过后端将图片中转到第三方网盘，避免 base64 撑爆 localStorage
- 📥 **导出 / 清空**：支持 JSON 导出和批量管理

---

## 📁 项目结构

```
idea-pool/
├── dist/
│   └── index.html        # 前端单文件应用（HTML + CSS + JS 全内联）
├── server/
│   ├── index.js          # Express 后端入口
│   ├── package.json      # 后端依赖
│   └── uploads/          # 上传临时目录（自动创建，.gitignore 排除）
├── .gitignore
└── README.md
```

---

## 🚀 快速开始

### 方式一：纯前端（最简单）

直接用浏览器打开 `dist/index.html` 即可使用，**所有数据保存在 localStorage**。

> ⚠️ localStorage 通常限制 5–10MB，若图片较多会很快撑爆，建议配合后端使用。

### 方式二：前端 + 后端（推荐）

#### 1. 启动后端

```bash
cd server
npm install
npm start
```

后端默认运行在 `http://localhost:3001`，提供以下接口：

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET`  | `/api/health`        | 健康检查 |
| `POST` | `/api/upload`        | 单文件上传（multipart/form-data）|
| `POST` | `/api/upload-batch`  | 批量上传（最多 10 个）|
| `POST` | `/api/upload-base64` | 粘贴图片（base64 编码）|

#### 2. 配置前端

打开 `dist/index.html`，找到这段 JS（约第 701 行）：

```js
const API_BASE_URL = ''; // 留空则使用本地 base64
```

改为你的后端地址：

```js
const API_BASE_URL = 'http://localhost:3001';
// 或部署后：'https://your-backend.com'
```

> 设置后，所有图片会自动通过后端上传到网盘；未设置则降级为本地 base64 存储。

---

## ⚙️ 后端环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT`            | `3001`                              | 后端服务端口 |
| `YOUDOOGO_URL`    | `https://pan.youdoogo.com`          | 网盘 API 地址 |
| `YOUDOOGO_USER`   | （必填）                            | 网盘账号 |
| `YOUDOOGO_PASS`   | （必填）                            | 网盘密码 |

> ⚠️ `loginToDisk()` 和 `uploadToDisk()` 是**占位实现**，需要根据 youdoogo.com 的实际接口（登录/上传）填充。

---

## 🤖 智能提取规则

提交时系统会从 Markdown 描述中自动解析以下字段：

| 字段 | 识别方式 | 示例 |
|---|---|---|
| 🎮 游戏类型 | 关键词匹配 | 休闲、射击、解谜、益智、塔防、动作、跑酷、竞速、卡牌、音游、沙盒、模拟经营、RPG、格斗、策略、恐怖、冒险、体感、派对 |
| 👶 建议年龄 | 正则匹配范围 | `6-12岁`、`9+`、`全年龄` |
| 👥 游戏人数 | 正则匹配 | `1~4人`、`仅限2人`、`多人` |
| 🕹️ 操作方式 | 智能分类 | 体感（细分双手/单手/上下肢/全身/头部/手指）、VR（手柄/手势/眼动）、手柄、触摸、键盘、语音、陀螺仪、眼动、脑波 |
| 🔗 参考原型 | 提取所有 URL | 排除图片 URL，其余视为参考链接 |

---

## 🛠️ 技术栈

- **前端**：原生 HTML + CSS + JavaScript（无框架，零依赖）
- **后端**：Node.js + Express
- **文件上传**：Multer
- **HTTP 客户端**：Axios
- **存储**：浏览器 `localStorage`（前端）+ 第三方网盘（后端，可选）

---

## 📦 数据格式

前端存储的创意数据结构：

```json
{
  "id": 2001,
  "author": "张三",
  "title": "水果忍者体感版",
  "desc": "# 水果忍者体感版\n...",
  "gameType": "体感游戏",
  "urls": ["http://example.com"],
  "age": "6-12",
  "players": "1人",
  "control": "体感（上肢）",
  "images": [
    { "src": "data:image/png;base64,...", "alt": "截图", "source": "upload" }
  ],
  "createdAt": "2026/7/1 10:30:00"
}
```

---

## 📝 开发说明

- `localStorage` key：`creative_ideas_v3`、`creative_next_id_v3`
- 创意 ID 自增，默认从 `2001` 开始
- 全部逻辑在 `dist/index.html` 中（约 1450 行），适合二次开发

---

## 📄 License

MIT
