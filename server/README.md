# 创意池后端服务

图片中转上传到 youdoogo.com 企业网盘。

## 快速启动

```bash
cd server
npm install
npm start
```

## 环境变量配置

创建 `.env` 文件：

```env
PORT=3001
YOUDOOGO_URL=https://pan.youdoogo.com
YOUDOOGO_USER=你的网盘账号
YOUDOOGO_PASS=你的网盘密码
```

## 部署方式

### 方式1：自有服务器
```bash
npm install
npm start
# 使用 pm2 守护进程
pm2 start index.js --name creative-pool
```

### 方式2：CloudBase 云函数（腾讯云开发）
需要激活 CloudBase 连接器，并部署云函数。

### 方式3：Vercel / Railway
支持 serverless 部署。

## API 接口

- `POST /api/upload` - 单文件上传 (multipart/form-data)
- `POST /api/upload-batch` - 批量上传 (multipart/form-data)
- `POST /api/upload-base64` - base64 图片上传 (JSON)
- `GET /api/health` - 健康检查

## 前端对接

修改前端 `API_BASE_URL` 为后端地址即可。

## 待完成

- [ ] 需要对接 youdoogo.com 网盘实际登录和上传 API
- [ ] 需要确认网盘系统类型（群晖？NextCloud？Seafile？自研？）
