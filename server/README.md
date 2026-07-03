# 创意池后端服务

图片中转上传到 **GitHub 仓库**（替代传统网盘方案）。

## 快速启动

```bash
cd server
npm install
npm start
```

## 环境变量配置

创建 `.env` 文件（参考 `.env.example`）：

```env
# 必填：GitHub Personal Access Token
# 需要 repo 权限（读写）
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# 必填：仓库信息
GITHUB_OWNER=NYQ3316
GITHUB_REPO=idea-pool
GITHUB_BRANCH=main

# 可选：仓库内存储目录（默认 uploads）
UPLOAD_DIR=uploads

# 可选：服务端口（默认 3001）
PORT=3001
```

> ⚠️ **不配置 GITHUB_TOKEN 时**，后端仍可启动，但图片会降级为 base64 直接返回前端存储。
> 配置后，图片会通过 GitHub Contents API 上传到 `uploads/YYYYMM/` 目录。

## 部署方式

### 方式1：本地运行
```bash
npm install
npm start
```

### 方式2：自有服务器
```bash
# 用 pm2 守护
pm2 start index.js --name idea-pool
```

### 方式3：云函数（CloudBase / Vercel / Railway）
需要适配对应平台的入口文件格式。

## 图片存储结构

上传后的图片会出现在 GitHub 仓库的：

```
uploads/
├── 202607/
│   ├── 1719816000000-a1b2c3d4-创意-水果忍者.png
│   ├── 1719816123456-e5f6g7h8-screenshot.jpg
│   └── ...
└── 202608/
    └── ...
```

文件名格式：`时间戳-随机哈希-原文件名`

## 访问图片

上传成功后返回的 `url` 字段是 GitHub 原始文件链接，**可直接在浏览器/img 标签访问**：
```
https://raw.githubusercontent.com/NYQ3316/idea-pool/main/uploads/202607/xxx.png
```

## API 接口

| 方法   | 路径                 | 说明                              |
|--------|----------------------|-----------------------------------|
| GET    | `/api/health`        | 健康检查（包含 GitHub 配置状态）  |
| POST   | `/api/upload`        | 单文件上传 (multipart/form-data)  |
| POST   | `/api/upload-batch`  | 批量上传 (multipart/form-data)    |
| POST   | `/api/upload-base64` | base64 图片上传 (JSON)            |

### 响应格式

成功：
```json
{
  "success": true,
  "url": "https://raw.githubusercontent.com/...",  // 原始图片 URL
  "pageUrl": "https://github.com/...",              // GitHub 网页 URL
  "path": "uploads/202607/xxx.png",                 // 仓库内路径
  "name": "image.png",
  "size": 12345,
  "source": "github"  // 或 "base64"（降级）
}
```

失败：
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 前端对接

修改前端 `API_BASE_URL` 为后端地址即可：

```js
// dist/index.html 中
const API_BASE_URL = 'http://localhost:3001';
// 部署后改为：
const API_BASE_URL = 'https://your-backend.com';
```

## 限制

- **GitHub API 限流**：未认证 60 次/小时，认证 5000 次/小时
- **单文件大小**：GitHub 单文件限制 100MB（建议 < 5MB）
- **并发**：不推荐同时上传大量文件

## 安全建议

- **生产环境必须配置 GITHUB_TOKEN**
- Token 应限定为单一仓库 + 仅 `Contents: Read and write` 权限
- 定期轮换 Token
- 建议配置仓库仅允许 token 推送（branch protection）
