# 🔧 GitHub 部署与协作说明

> 本文档说明仓库的 GitHub 配置状态、Pages 部署机制、后续 push 流程。

---

## 📍 关键信息

| 项目 | 值 |
|---|---|
| **GitHub 用户名** | NYQ3316 |
| **仓库** | https://github.com/NYQ3316/idea-pool |
| **可见性** | Public |
| **在线访问** | https://nyq3316.github.io/idea-pool/ |
| **Pages 状态** | ✅ built (已部署) |
| **Git 身份** | NYQ3316 <yonghengqiu8@gmail.com> |
| **凭据助手** | Windows Credential Manager（已配置）|

---

## 🌿 分支策略

### `main` 分支
- **作用**：主分支，完整项目源码
- **包含**：README、PROJECT_LOG、dist/、server/、.github/workflows/
- **保护**：建议启用 branch protection（Settings → Branches → Add rule）

### `gh-pages` 分支
- **作用**：仅托管 `dist/` 内容，供 GitHub Pages 使用
- **包含**：单个 `index.html`
- **更新方式**：
  1. **自动**（推荐）：push main 后，GitHub Actions 自动同步
  2. **手动**（紧急）：临时构建并强制推送

---

## 🚀 后续开发流程

### 1. 修改代码
在 `C:\Users\Nicholas\WorkBuddy\2026-06-25-15-57-09\` 目录下编辑文件。

### 2. 提交到本地
```bash
cd "C:\Users\Nicholas\WorkBuddy\2026-06-25-15-57-09"
git add .
git commit -m "feat: 你的修改说明"
```

### 3. 推送到 GitHub
```bash
git push origin main
```

### 4. 自动部署（如果有改 dist/）
- 触发条件：push 时 `dist/**` 路径发生变化
- 触发动作：GitHub Actions 同步 dist/ 到 gh-pages
- 等待时间：约 30-60 秒
- 查看状态：https://github.com/NYQ3316/idea-pool/actions

### 5. 验证部署
打开 https://nyq3316.github.io/idea-pool/ 确认更新生效。

---

## 🔐 Token 与认证

### 当前状态
- **Token 类型**：GitHub 经典 PAT (Classic)
- **权限范围**：`repo`（完整仓库读写）
- **使用方式**：已通过 Windows Credential Manager 缓存
- **首次 push 时输入过一次**，之后无需重复

### 安全建议
- **保持**：`idea-pool` 项目**安全等级要求不高**（用户已确认）
- **如果需要撤销/重置**：
  1. 打开 https://github.com/settings/tokens
  2. 找到 `idea-pool-deploy` 之类的 token
  3. 点击 **Revoke** 撤销
  4. 重新生成并更新本地凭据

### 重新配置凭据（如换电脑/重装系统）
```bash
# 首次 push 时会提示输入用户名/密码
# 用户名：NYQ3316
# 密码：粘贴 ghp_xxx 开头的 token
git push origin main

# 或手动配置（推荐）
git config --global credential.helper manager
```

---

## 📦 GitHub Pages 配置

### 当前配置
- **源分支**：`gh-pages`
- **路径**：`/`（根目录）
- **构建类型**：legacy
- **自定义域名**：无
- **HTTPS**：强制启用（GitHub 默认）

### 修改配置
通过 https://github.com/NYQ3316/idea-pool/settings/pages 修改，或 API 调用：
```bash
# 查询当前状态
curl -H "Authorization: token <TOKEN>" \
  https://api.github.com/repos/NYQ3316/idea-pool/pages

# 修改源分支
curl -X POST -H "Authorization: token <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"source":{"branch":"main","path":"/"}}' \
  https://api.github.com/repos/NYQ3316/idea-pool/pages
```

### 添加自定义域名
1. 在域名 DNS 添加 CNAME 记录指向 `nyq3316.github.io`
2. 在仓库 Settings → Pages → Custom domain 填写域名
3. 勾选 **Enforce HTTPS**

---

## 🤖 GitHub Actions 工作流

### 文件位置
`.github/workflows/deploy-pages.yml`

### 触发条件
| 触发方式 | 条件 |
|---|---|
| 自动 | push 到 main 且 `dist/**` 或工作流文件变更 |
| 手动 | 在 Actions 页面点击 "Run workflow" |

### 工作流步骤
1. 检出 main 分支
2. 配置 Git 身份
3. 复制 `dist/*` 到临时目录
4. 添加 `.nojekyll` 标记（避免 Jekyll 处理）
5. 推送到 `gh-pages` 分支
6. 清理临时文件
7. 输出访问地址

### 查看工作流
- 列表：https://github.com/NYQ3316/idea-pool/actions
- 详情：点击具体 run 查看日志

### 调试
- 工作流失败时，邮箱会收到通知
- 排查步骤：查看 Actions 日志 → 检查 `dist/` 是否正确 → 检查 token 权限

---

## 🔄 常见操作

### 克隆仓库到其他机器
```bash
git clone https://github.com/NYQ3316/idea-pool.git
cd idea-pool
npm install --prefix server  # 如果需要后端依赖
```

### 切换到 gh-pages 查看部署版本
```bash
git fetch origin gh-pages
git checkout gh-pages
ls  # 只会看到 index.html
```

### 强制重新部署（不改代码）
在 https://github.com/NYQ3316/idea-pool/actions/workflows/deploy-pages.yml
点击 **Run workflow** → 选择 main 分支 → 运行。

---

## 📞 问题排查

| 问题 | 原因 | 解决 |
|---|---|---|
| push 提示认证失败 | Token 过期/无效 | 重新生成 Token |
| Pages 一直 building | 等待时间不足 | 等待 1-2 分钟，刷新 Pages 页面 |
| 改了 dist/ 但页面没更新 | Actions 没触发/失败 | 检查 Actions 日志 |
| gh-pages 和 main 冲突 | 手动改了 gh-pages | 用 Actions 推送，避免手动操作 |
| Token 输错被锁 | GitHub 限流 | 等待 1 小时或换 IP |

---

## 📚 延伸阅读
- [PROJECT_LOG.md](./PROJECT_LOG.md) — 项目开发日志
- [README.md](./README.md) — 用户使用说明
- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
