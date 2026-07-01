const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== 网盘配置（从环境变量读取） =====
const YOUDOOGO_CONFIG = {
  baseUrl: process.env.YOUDOOGO_URL || 'https://pan.youdoogo.com',
  username: process.env.YOUDOOGO_USER || '',
  password: process.env.YOUDOOGO_PASS || '',
};

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// multer 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== 全局状态：网盘登录会话 =====
let diskSession = null;

// ===== 工具函数 =====
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ===== 网盘登录（待实现） =====
async function loginToDisk() {
  if (!YOUDOOGO_CONFIG.username || !YOUDOOGO_CONFIG.password) {
    throw new Error('缺少网盘账号密码配置 (YOUDOOGO_USER / YOUDOOGO_PASS)');
  }
  
  // TODO: 根据实际网盘系统实现登录
  // 常见方案：
  // 1. 表单登录 POST /api/login
  // 2. Basic Auth
  // 3. Token 认证
  // 4. OAuth
  
  log('正在登录网盘...');
  // 占位：需要用户提供实际接口
  return { token: 'placeholder', cookie: 'placeholder' };
}

// ===== 上传文件到网盘（待实现） =====
async function uploadToDisk(filePath, fileName) {
  if (!diskSession) {
    diskSession = await loginToDisk();
  }
  
  // TODO: 根据实际网盘系统实现上传
  // 常见方案：
  // 1. POST /api/upload 带 multipart/form-data
  // 2. 预签名 URL 上传
  // 3. WebDAV PUT
  
  log(`正在上传文件到网盘: ${fileName}`);
  // 占位：需要用户提供实际接口
  return { url: null, fileId: null };
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
    
    // 尝试上传到网盘
    let diskUrl = null;
    try {
      const result = await uploadToDisk(filePath, originalName);
      diskUrl = result.url;
    } catch (err) {
      log(`网盘上传失败: ${err.message}`);
    }
    
    // 如果网盘上传失败，返回 base64 作为降级方案
    const fallbackBase64 = fs.readFileSync(filePath, { encoding: 'base64' });
    const mimeType = req.file.mimetype || 'image/png';
    
    // 清理临时文件
    try { fs.unlinkSync(filePath); } catch (e) {}
    
    res.json({
      success: true,
      url: diskUrl || `data:${mimeType};base64,${fallbackBase64}`,
      name: originalName,
      size: req.file.size,
      source: diskUrl ? 'disk' : 'base64'
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
      let diskUrl = null;
      try {
        const result = await uploadToDisk(filePath, file.originalname);
        diskUrl = result.url;
      } catch (err) {
        log(`网盘上传失败: ${err.message}`);
      }
      
      const fallbackBase64 = fs.readFileSync(filePath, { encoding: 'base64' });
      const mimeType = file.mimetype || 'image/png';
      try { fs.unlinkSync(filePath); } catch (e) {}
      
      results.push({
        url: diskUrl || `data:${mimeType};base64,${fallbackBase64}`,
        name: file.originalname,
        size: file.size,
        source: diskUrl ? 'disk' : 'base64'
      });
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
    const filePath = path.join(uploadDir, fileName);
    
    fs.writeFileSync(filePath, buffer);
    
    let diskUrl = null;
    try {
      const result = await uploadToDisk(filePath, fileName);
      diskUrl = result.url;
    } catch (err) {
      log(`网盘上传失败: ${err.message}`);
    }
    
    try { fs.unlinkSync(filePath); } catch (e) {}
    
    res.json({
      success: true,
      url: diskUrl || base64,
      name: fileName,
      size: buffer.length,
      source: diskUrl ? 'disk' : 'base64'
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
    diskConfigured: !!(YOUDOOGO_CONFIG.username && YOUDOOGO_CONFIG.password)
  });
});

// ===== 启动服务 =====
app.listen(PORT, () => {
  log(`后端服务已启动: http://localhost:${PORT}`);
  log(`网盘配置: ${YOUDOOGO_CONFIG.baseUrl}`);
  log(`账号配置: ${YOUDOOGO_CONFIG.username ? '已配置' : '未配置'}`);
});
