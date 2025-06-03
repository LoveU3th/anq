/**
 * 开发环境API模拟服务器
 * 用于在没有Cloudflare Functions的情况下提供API服务
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8788;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟数据存储
const mockData = {
  adminSessions: new Map(),
  questions: [],
  videos: [],
  analytics: {
    totalUsers: 156,
    totalQuizzes: 89,
    averageScore: 78,
    completionRate: 85,
    avgStudyTime: 12,
    passRate: 82,
    activeUsers: 47,
    trends: {
      completionRate: 5.2,
      avgStudyTime: -2.1,
      passRate: 8.3,
      activeUsers: 12.5
    },
    userActivity: generateMockUserActivity(),
    deviceStats: {
      mobile: 65,
      desktop: 30,
      tablet: 5
    },
    learningPaths: {
      videoFirst: 70,
      quizFirst: 30
    },
    retentionRate: {
      day1: 85,
      day7: 60,
      day30: 35
    }
  }
};

// 生成模拟用户活动数据
function generateMockUserActivity() {
  const activities = [];
  const modules = ['安全操作', '违规识别'];
  const deviceTypes = ['移动端', '桌面端'];
  
  for (let i = 1; i <= 20; i++) {
    const userId = `user_${String(i).padStart(3, '0')}`;
    const module = modules[Math.floor(Math.random() * modules.length)];
    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
    const score = Math.floor(Math.random() * 40) + 60; // 60-100分
    const timeSpent = Math.floor(Math.random() * 15) + 5; // 5-20分钟
    
    // 生成最近30天内的随机时间
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 30);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    const completedAt = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000 - randomHours * 60 * 60 * 1000 - randomMinutes * 60 * 1000);
    
    activities.push({
      userId,
      module,
      completedAt: completedAt.toISOString().replace('T', ' ').substring(0, 19),
      score,
      timeSpent,
      deviceType
    });
  }
  
  return activities.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

// 生成会话token
function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 管理员认证API
app.post('/api/admin/auth', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  if (username === 'admin' && password === 'admin123') {
    const token = generateSessionToken();
    const sessionData = {
      username,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
    
    mockData.adminSessions.set(token, sessionData);
    
    res.json({
      success: true,
      token,
      message: '登录成功'
    });
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
});

// 验证管理员会话
app.get('/api/admin/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未提供认证token'
    });
  }
  
  const token = authHeader.slice(7);
  const sessionData = mockData.adminSessions.get(token);
  
  if (!sessionData) {
    return res.status(401).json({
      success: false,
      message: '会话已过期或无效'
    });
  }
  
  if (new Date() > new Date(sessionData.expiresAt)) {
    mockData.adminSessions.delete(token);
    return res.status(401).json({
      success: false,
      message: '会话已过期'
    });
  }
  
  res.json({
    success: true,
    user: {
      username: sessionData.username,
      loginTime: sessionData.loginTime
    }
  });
});

// 管理员登出
app.delete('/api/admin/auth', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    mockData.adminSessions.delete(token);
  }
  
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 验证管理员权限中间件
function verifyAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未提供认证token'
    });
  }
  
  const token = authHeader.slice(7);
  const sessionData = mockData.adminSessions.get(token);
  
  if (!sessionData) {
    return res.status(401).json({
      success: false,
      message: '会话无效'
    });
  }
  
  if (new Date() > new Date(sessionData.expiresAt)) {
    mockData.adminSessions.delete(token);
    return res.status(401).json({
      success: false,
      message: '会话已过期'
    });
  }
  
  req.user = {
    username: sessionData.username,
    loginTime: sessionData.loginTime
  };
  
  next();
}

// 题库管理API
app.get('/api/admin/questions', verifyAdminAuth, (req, res) => {
  res.json(mockData.questions);
});

app.post('/api/admin/questions', verifyAdminAuth, (req, res) => {
  const question = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  mockData.questions.push(question);
  
  res.json({
    success: true,
    question
  });
});

// 视频管理API
app.get('/api/admin/videos', verifyAdminAuth, (req, res) => {
  res.json(mockData.videos);
});

// 分析数据API
app.get('/api/admin/analytics', verifyAdminAuth, (req, res) => {
  res.json(mockData.analytics);
});

// 性能分析API（兼容现有的API调用）
app.get('/api/v1/analytics/performance', (req, res) => {
  res.json({
    success: true,
    data: {
      pageLoadTime: Math.random() * 1000 + 500,
      firstContentfulPaint: Math.random() * 800 + 200,
      largestContentfulPaint: Math.random() * 1200 + 800,
      cumulativeLayoutShift: Math.random() * 0.1,
      firstInputDelay: Math.random() * 50 + 10
    }
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 404处理
app.use((req, res) => {
  console.log('404 - Not found:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: 'API端点不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 开发API服务器运行在 http://localhost:${PORT}`);
  console.log('📝 管理员登录信息:');
  console.log('   用户名: admin');
  console.log('   密码: admin123');
});
