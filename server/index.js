const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== GitHub 配置（从环境变量读取） =====
const GITHUB_CONFIG = {
  token: process.env.GITHUB_TOKEN || '',
  owner: process.env.GITHUB_OWNER || 'NYQ3316',
  repo: process.env.GITHUB_REPO || 'idea-pool',
  branch: process.env.GITHUB_BRANCH || 'main',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',  // 仓库内存储目录
};

// 确保本地临时目录存在
const tmpDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

// multer 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== 工具函数 =====
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function isGitHubConfigured() {
  return !!(GITHUB_CONFIG.token && GITHUB_CONFIG.owner && GITHUB_CONFIG.repo);
}

/**
 * 把文件上传到 GitHub 仓库
 * @param {string} filePath  本地文件路径
 * @param {string} fileName  原始文件名
 * @returns {Promise<{url: string, rawUrl: string, path: string}>}
 */
async function uploadToGitHub(filePath, fileName) {
  if (!isGitHubConfigured()) {
    throw new Error('GitHub 未配置：缺少 GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO');
  }

  // 1. 读取文件，转 base64
  const fileBuffer = fs.readFileSync(filePath);
  const base64Content = fileBuffer.toString('base64');

  // 2. 生成仓库内路径：uploads/YYYYMM/时间戳-哈希-原文件名
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const hash = crypto.randomBytes(4).toString('hex');
  const timestamp = Date.now();
  // 文件名做简单清理，避免非法字符
  const safeName = fileName.replace(/[^\w.\u4e00-\u9fa5-]/g, '_');
  const repoPath = `${GITHUB_CONFIG.uploadDir}/${yearMonth}/${timestamp}-${hash}-${safeName}`;

  // 3. 调用 GitHub Contents API
  const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${repoPath}`;

  log(`上传到 GitHub: ${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}@${GITHUB_CONFIG.branch}:${repoPath}`);

  const response = await axios.put(
    apiUrl,
    {
      message: `upload: ${safeName}`,
      content: base64Content,
      branch: GITHUB_CONFIG.branch,
    },
    {
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'idea-pool-backend',
      },
      timeout: 30000,
    }
  );

  const data = response.data;
  return {
    url: data.content.html_url,           // GitHub 网页 URL
    rawUrl: data.content.download_url,    // 原始图片 URL（直接访问）
    path: repoPath,
    sha: data.content.sha,
  };
}

// ===== 接口：上传图片 =====
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '没有收到图片文件' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    log(`收到上传请求: ${originalName} (${req.file.size} bytes)`);

    let result = null;
    let source = 'base64';

    if (isGitHubConfigured()) {
      try {
        result = await uploadToGitHub(filePath, originalName);
        source = 'github';
        log(`GitHub 上传成功: ${result.rawUrl}`);
      } catch (err) {
        log(`GitHub 上传失败: ${err.message}`);
        // 不阻断，降级到 base64
      }
    }

    // 清理临时文件
    try { fs.unlinkSync(filePath); } catch (e) {}

    if (result) {
      return res.json({
        success: true,
        url: result.rawUrl,         // 直接可用的图片 URL
        pageUrl: result.url,        // GitHub 网页查看 URL
        path: result.path,
        name: originalName,
        size: req.file.size,
        source: source,
      });
    }

    // 降级：返回 base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/png';
    res.json({
      success: true,
      url: `data:${mimeType};base64,${base64}`,
      name: originalName,
      size: req.file.size,
      source: 'base64',
    });
  } catch (error) {
    log(`上传处理错误: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 接口：批量上传 =====
app.post('/api/upload-batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: '没有收到图片文件' });
    }

    const results = [];
    for (const file of req.files) {
      const filePath = file.path;
      let result = null;
      let source = 'base64';

      if (isGitHubConfigured()) {
        try {
          result = await uploadToGitHub(filePath, file.originalname);
          source = 'github';
        } catch (err) {
          log(`GitHub 上传失败: ${err.message}`);
        }
      }

      try { fs.unlinkSync(filePath); } catch (e) {}

      if (result) {
        results.push({
          url: result.rawUrl,
          pageUrl: result.url,
          path: result.path,
          name: file.originalname,
          size: file.size,
          source,
        });
      } else {
        // 降级 base64
        const fileBuffer = fs.readFileSync(filePath);
        const base64 = fileBuffer.toString('base64');
        const mimeType = file.mimetype || 'image/png';
        results.push({
          url: `data:${mimeType};base64,${base64}`,
          name: file.originalname,
          size: file.size,
          source: 'base64',
        });
      }
    }

    res.json({ success: true, images: results });
  } catch (error) {
    log(`批量上传错误: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 接口：粘贴图片（base64） =====
app.post('/api/upload-base64', async (req, res) => {
  try {
    const { base64, name } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, error: '缺少 base64 数据' });
    }

    // 解析 base64
    const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, error: '无效的 base64 格式' });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const fileName = name || `paste-${Date.now()}.png`;
    const filePath = path.join(tmpDir, fileName);

    fs.writeFileSync(filePath, buffer);

    let result = null;
    let source = 'base64';

    if (isGitHubConfigured()) {
      try {
        result = await uploadToGitHub(filePath, fileName);
        source = 'github';
      } catch (err) {
        log(`GitHub 上传失败: ${err.message}`);
      }
    }

    try { fs.unlinkSync(filePath); } catch (e) {}

    if (result) {
      return res.json({
        success: true,
        url: result.rawUrl,
        pageUrl: result.url,
        path: result.path,
        name: fileName,
        size: buffer.length,
        source,
      });
    }

    res.json({
      success: true,
      url: base64,  // 原始 base64 不变
      name: fileName,
      size: buffer.length,
      source: 'base64',
    });
  } catch (error) {
    log(`base64 上传错误: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 接口：健康检查 =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    githubConfigured: isGitHubConfigured(),
    githubTarget: `${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}@${GITHUB_CONFIG.branch}`,
    uploadDir: GITHUB_CONFIG.uploadDir,
  });
});

// ===== 启动服务 =====
app.listen(PORT, () => {
  log(`后端服务已启动: http://localhost:${PORT}`);
  log(`GitHub 配置: ${isGitHubConfigured() ? `${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}@${GITHUB_CONFIG.branch}` : '❌ 未配置'}`);
  log(`上传目录: ${GITHUB_CONFIG.uploadDir}/`);
  log(`提示: 设置 GITHUB_TOKEN 环境变量后重启以启用 GitHub 上传`);
});
