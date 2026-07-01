# 📋 项目开发日志 (PROJECT_LOG)

> 本文档记录「创意池 (idea-pool)」的演进过程、关键决策与后续任务清单。
> 任何接手开发的人都应先读此文档。

---

## 🎯 项目定位

**轻量级创意收集工具**，专注游戏创意的快速记录。

### 核心价值
- **极简流程**：打开 → 写描述 → 提交，三步完成
- **智能提取**：从 Markdown 描述中自动解析 5 大关键字段
- **多端图片**：4 种图片上传方式（选择/拖拽/URL/Ctrl+V 粘贴）
- **零依赖前端**：单文件 HTML，本地存储无需后端

---

## 🏗️ 架构总览

```
┌────────────────────────────────────────────────────────┐
│                     idea-pool                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  浏览器 (GitHub Pages)         浏览器 (本地/任意托管)   │
│       │                                │               │
│       ▼                                ▼               │
│  ┌─────────┐                      ┌─────────┐          │
│  │ dist/   │                      │ dist/   │          │
│  │ index.  │  ─── API 调用 ───>   │ index.  │          │
│  │ html    │                      │ html    │          │
│  └─────────┘                      └────┬────┘          │
│                                        │               │
│                                        ▼               │
│                                  ┌──────────┐          │
│                                  │  后端    │          │
│                                  │ server/  │          │
│                                  │ Express  │          │
│                                  │ Multer   │          │
│                                  └────┬─────┘          │
│                                       │                │
│                                       ▼                │
│                              ┌────────────────┐        │
│                              │ youdoogo.com   │        │
│                              │ 企业网盘       │        │
│                              │ (TODO 实现)    │        │
│                              └────────────────┘        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 数据流
1. 用户输入描述 + 选/拖/粘图片
2. （可选）后端将图片中转到网盘，返回 URL
3. 前端解析 Markdown，提取元数据（游戏类型/年龄/人数/操作/链接）
4. 存入 `localStorage`，key = `creative_ideas_v3`

---

## 📦 仓库结构

```
NYQ3316/idea-pool
├── main 分支 ─────────────────────────────────────────
│   ├── README.md                # 项目说明（外部读者）
│   ├── PROJECT_LOG.md           # 本文件：开发日志
│   ├── GITHUB_SETUP.md          # GitHub 部署/协作说明
│   ├── .gitignore
│   ├── .github/
│   │   └── workflows/
│   │       └── deploy-pages.yml # 自动部署 Pages
│   ├── dist/
│   │   └── index.html           # 前端单文件应用
│   └── server/
│       ├── index.js             # Express 后端
│       ├── package.json
│       └── README.md
│
└── gh-pages 分支 ──────────────────────────────────────
    └── index.html               # 仅含 dist/ 内容，用于 Pages
```

---

## 📅 演进时间线

### 2026-06-25：原始版本
- 位置：`C:\Users\Nicholas\WorkBuddy\2026-06-25-15-57-09\`
- 状态：本地项目，无版本控制
- 缺失：README.md（根目录）

### 2026-07-01：GitHub 迁移（本次任务）
| 步骤 | 内容 |
|---|---|
| 1 | 配置 Git 全局身份（NYQ3316）|
| 2 | 补全根目录 README.md |
| 3 | 创建 .gitignore |
| 4 | `git init` + 首次 commit `0950fe9` |
| 5 | 通过 GitHub API 自动创建仓库 |
| 6 | 推送 main 分支 |
| 7 | 推送 gh-pages 分支（托管 dist/）|
| 8 | GitHub Pages 自动启用并构建完成 |
| 9 | 创建 PROJECT_LOG.md（本文）|
| 10 | 添加 GitHub Actions 自动部署 |

---

## 🛠️ 技术决策记录

### 决策 1：单文件前端 vs. 拆分
- **选择**：单文件 `dist/index.html`
- **理由**：项目无构建工具链，零依赖直接可用，部署简单

### 决策 2：localStorage vs. 数据库
- **选择**：localStorage（前端）+ 网盘（后端）
- **理由**：MVP 阶段最简方案，避免引入数据库依赖

### 决策 3：gh-pages 分支 vs. main 分支根目录
- **选择**：用 `gh-pages` 分支托管 `dist/`
- **理由**：保持 `main` 分支是完整项目（含后端、文档），Pages 只暴露前端

### 决策 4：手动同步 vs. GitHub Actions
- **本次**：手动推送 gh-pages
- **后续**：已添加 Actions，后续 push main 自动同步（见 `.github/workflows/`）

---

## 📝 后续 TODO 清单

### 🔥 P0：核心功能

- [ ] **后端网盘集成**
  - [ ] 调研 youdoogo.com 的 API 类型（群晖/NextCloud/Seafile/自研）
  - [ ] 实现 `loginToDisk()` 函数
  - [ ] 实现 `uploadToDisk()` 函数
  - [ ] 处理 Cookie/Token 会话管理
  - [ ] 单元测试：上传成功/失败/超时 各种场景

- [ ] **环境变量管理**
  - [ ] 引入 `dotenv` 包
  - [ ] 创建 `.env.example` 模板
  - [ ] 文档化所有配置项

### 🟡 P1：体验优化

- [ ] **数据导出/导入**
  - [ ] 支持从 JSON 导入（目前只能导出）
  - [ ] 支持 Markdown 导出
  - [ ] 支持图片打包导出（zip）

- [ ] **搜索/过滤**
  - [ ] 按关键词搜索
  - [ ] 按游戏类型过滤
  - [ ] 按作者过滤

- [ ] **数据迁移**
  - [ ] 提供 localStorage → 远程存储 的迁移工具
  - [ ] 处理多端同步冲突

### 🟢 P2：部署与运维

- [ ] **后端部署**
  - [ ] 选择平台：CloudBase / Vercel / Railway / 自有服务器
  - [ ] 配置 CI/CD 自动部署
  - [ ] 配置 HTTPS + 自定义域名
  - [ ] 健康检查 + 监控告警

- [ ] **GitHub Pages 增强**
  - [ ] ✅ 自动化部署（本次完成）
  - [ ] 自定义域名（可选）
  - [ ] HTTPS 强制（GitHub 默认已启用）

- [ ] **GitHub 仓库优化**
  - [ ] 添加 Topics 标签（idea-pool, markdown, game-design, creative-tools）
  - [ ] 添加 About 描述 + Website URL
  - [ ] 启用 Issues 模板
  - [ ] 添加 PR 模板
  - [ ] 配置分支保护规则

### 🔵 P3：扩展功能

- [ ] **多用户协作**
  - [ ] 登录/注册
  - [ ] 权限管理
  - [ ] 评论/点赞

- [ ] **AI 辅助**
  - [ ] 自动补全描述
  - [ ] 创意打分/相似度检测
  - [ ] 标签推荐

- [ ] **PWA 化**
  - [ ] 添加 manifest.json
  - [ ] 添加 service worker
  - [ ] 离线可用

---

## 🐛 已知问题

| 编号 | 问题 | 影响 | 优先级 |
|---|---|---|---|
| #1 | localStorage 容量限制（5-10MB）| 大量图片会撑爆 | P0（已有降级方案：转 base64 后存后端）|
| #2 | `loginToDisk` / `uploadToDisk` 是占位实现 | 后端无法真正工作 | P0 |
| #3 | Markdown 渲染器是手写简化版 | 不支持表格、任务列表等高级语法 | P2 |
| #4 | 无后端时图片以 base64 存储 | 性能较差 | P1 |
| #5 | 单语言（中文）| 海外用户无法使用 | P3 |

---

## 📚 参考资料

- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Express 文档](https://expressjs.com/)
- [Multer 文档](https://github.com/expressjs/multer)

---

## 📞 联系方式

- **GitHub**: [@NYQ3316](https://github.com/NYQ3316)
- **Email**: yonghengqiu8@gmail.com
- **项目地址**: https://github.com/NYQ3316/idea-pool
- **在线访问**: https://nyq3316.github.io/idea-pool/
