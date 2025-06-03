# 安全管理交互学习平台 (ANQ Platform)

现代化的安全管理交互式学习平台，基于 Cloudflare Pages + Functions 的无服务器架构。

## 🚀 项目特色

- **🎥 沉浸式视频学习**：高质量安全教育视频，对比展示标准操作与违规行为
- **📝 智能测试系统**：基于AI算法的题目推荐，个性化学习路径
- **📊 实时数据分析**：多维度学习效果追踪和可视化
- **🔧 灵活内容管理**：便捷的题库和视频内容管理系统
- **⚡ 边缘计算架构**：基于Cloudflare全球网络，毫秒级响应
- **📱 渐进式Web应用**：支持离线使用，原生应用体验

## 🛠️ 技术栈

### 前端技术
- **核心框架**: 原生ES6+ JavaScript + Web Components
- **构建工具**: Vite 5.0
- **样式方案**: CSS3 + CSS Custom Properties
- **PWA支持**: Service Worker + Web App Manifest

### 后端服务
- **计算层**: Cloudflare Pages Functions (V8 Isolates)
- **存储层**: Cloudflare KV (全球分布式键值存储)
- **缓存层**: Cloudflare CDN + 多级缓存策略
- **安全层**: JWT认证 + CSRF防护 + Rate Limiting

## 📁 项目结构

```
anq/
├── src/                     # 源代码目录
│   ├── pages/              # 页面文件
│   ├── modules/            # 核心功能模块
│   ├── components/         # UI组件
│   ├── utils/              # 工具函数
│   ├── styles/             # 样式文件
│   └── assets/             # 静态资源
├── functions/              # Cloudflare Functions
├── tests/                  # 测试文件
├── scripts/                # 构建脚本
└── docs/                   # 项目文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量模板：
```bash
cp .env.example .env.local
```

2. 配置必要的环境变量：
```bash
# Cloudflare配置
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# KV命名空间ID
CONTENT_STORE_KV_ID=your_content_kv_namespace_id
ANALYTICS_STORE_KV_ID=your_analytics_kv_namespace_id

# 其他配置...
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 🧪 测试

### 运行所有测试

```bash
npm test
```

### 运行单元测试

```bash
npm run test:unit
```

### 运行集成测试

```bash
npm run test:integration
```

### 运行端到端测试

```bash
npm run test:e2e
```

## 📦 部署

### 部署到预览环境

```bash
npm run deploy:preview
```

### 部署到生产环境

```bash
npm run deploy:production
```

## 🔧 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 确保代码质量：

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 提交规范

使用 Conventional Commits 规范：

```bash
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

## 📊 性能监控

项目集成了 Core Web Vitals 监控：

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

## 🔒 安全特性

- JWT认证机制
- CSRF攻击防护
- XSS攻击防护
- 速率限制
- 输入验证和清理
- 安全头部配置

## 🌐 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 联系我们

- 项目主页: [GitHub Repository](https://github.com/your-org/anq-platform)
- 问题反馈: [Issues](https://github.com/your-org/anq-platform/issues)
- 文档: [Documentation](https://docs.anq-platform.com)

## 🎯 路线图

### v1.0.0 (当前版本)
- [x] 基础架构搭建
- [x] 核心路由系统
- [x] 基础UI组件
- [ ] 视频播放模块
- [ ] 答题系统
- [ ] 管理后台

### v1.1.0 (计划中)
- [ ] PWA功能完善
- [ ] 离线支持
- [ ] 推送通知
- [ ] 数据可视化

### v2.0.0 (未来版本)
- [ ] AI智能推荐
- [ ] 多语言支持
- [ ] 高级分析功能
- [ ] 移动端原生应用

---

**Made with ❤️ by ANQ Team**
