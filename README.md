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

## 📦 部署到 Cloudflare Pages

### 前置准备

1. **注册 Cloudflare 账户**
   - 访问 [Cloudflare](https://cloudflare.com) 注册账户
   - 完成邮箱验证

2. **获取 API Token**
   - 登录 Cloudflare Dashboard
   - 进入 "My Profile" → "API Tokens"
   - 点击 "Create Token"
   - 选择 "Custom token" 模板
   - 配置权限：
     ```
     Zone:Zone:Read
     Zone:Page Rules:Edit
     Account:Cloudflare Pages:Edit
     Account:Account Settings:Read
     ```
   - 复制生成的 API Token

3. **创建 KV 命名空间**
   - 在 Cloudflare Dashboard 中进入 "Workers & Pages"
   - 点击 "KV" 标签
   - 创建以下命名空间：
     - `anq-content-store` (存储题库和视频数据)
     - `anq-analytics-store` (存储用户学习数据)
     - `anq-user-store` (存储用户信息)
   - 记录每个命名空间的 ID

### 方式一：通过 Git 集成部署（推荐）

1. **推送代码到 Git 仓库**
   ```bash
   # 如果还没有初始化 git
   git init
   git add .
   git commit -m "Initial commit"

   # 推送到 GitHub/GitLab
   git remote add origin https://github.com/your-username/anq-platform.git
   git push -u origin main
   ```

2. **连接 Cloudflare Pages**
   - 登录 Cloudflare Dashboard
   - 进入 "Workers & Pages"
   - 点击 "Create application"
   - 选择 "Pages" → "Connect to Git"
   - 授权并选择你的仓库
   - 配置构建设置：
     ```
     Framework preset: Vite
     Build command: npm run build
     Build output directory: dist
     Root directory: /
     ```

3. **配置环境变量**
   - 在 Pages 项目设置中进入 "Environment variables"
   - 添加以下变量：
     ```bash
     # 生产环境变量
     NODE_ENV=production
     VITE_APP_TITLE=安全管理交互学习平台
     VITE_API_BASE_URL=https://your-domain.pages.dev

     # Cloudflare 配置
     CLOUDFLARE_API_TOKEN=your_api_token_here
     CLOUDFLARE_ACCOUNT_ID=your_account_id_here

     # KV 命名空间 ID
     CONTENT_STORE_KV_ID=your_content_kv_namespace_id
     ANALYTICS_STORE_KV_ID=your_analytics_kv_namespace_id
     USER_STORE_KV_ID=your_user_kv_namespace_id

     # JWT 配置
     JWT_SECRET=your_jwt_secret_key_here
     JWT_EXPIRES_IN=7d

     # 其他配置
     VITE_QUIZ_PASSING_SCORE=90
     VITE_QUIZ_POINTS_PER_QUESTION=10
     ```

4. **绑定 KV 命名空间**
   - 在 Pages 项目设置中进入 "Functions"
   - 在 "KV namespace bindings" 部分添加：
     ```
     Variable name: CONTENT_STORE → KV namespace: anq-content-store
     Variable name: ANALYTICS_STORE → KV namespace: anq-analytics-store
     Variable name: USER_STORE → KV namespace: anq-user-store
     ```

5. **触发部署**
   - 推送代码到主分支会自动触发部署
   - 或在 Cloudflare Dashboard 中手动触发重新部署

### 方式二：通过 Wrangler CLI 部署

1. **安装 Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **配置 wrangler.toml**
   ```bash
   # 项目根目录创建 wrangler.toml
   cat > wrangler.toml << EOF
   name = "anq-platform"
   compatibility_date = "2024-01-01"

   [env.production]
   account_id = "your_account_id_here"

   [[env.production.kv_namespaces]]
   binding = "CONTENT_STORE"
   id = "your_content_kv_namespace_id"

   [[env.production.kv_namespaces]]
   binding = "ANALYTICS_STORE"
   id = "your_analytics_kv_namespace_id"

   [[env.production.kv_namespaces]]
   binding = "USER_STORE"
   id = "your_user_kv_namespace_id"
   EOF
   ```

4. **构建并部署**
   ```bash
   # 构建项目
   npm run build

   # 部署到 Cloudflare Pages
   wrangler pages deploy dist --project-name=anq-platform
   ```

### 部署后配置

1. **自定义域名（可选）**
   - 在 Pages 项目设置中进入 "Custom domains"
   - 添加你的域名
   - 配置 DNS 记录指向 Cloudflare

2. **初始化数据**
   - 访问部署后的网站
   - 使用管理员账户登录
   - 上传初始题库和视频内容

3. **性能优化**
   - 启用 Cloudflare 的 "Auto Minify"
   - 配置缓存规则
   - 启用 Brotli 压缩

### 部署验证

1. **功能测试**
   ```bash
   # 检查网站可访问性
   curl -I https://your-domain.pages.dev

   # 检查 API 端点
   curl https://your-domain.pages.dev/api/health
   ```

2. **性能测试**
   - 使用 [PageSpeed Insights](https://pagespeed.web.dev/) 测试性能
   - 检查 Core Web Vitals 指标
   - 验证 PWA 功能

3. **功能验证清单**
   - [ ] 首页正常加载
   - [ ] 用户注册/登录功能
   - [ ] 视频播放功能
   - [ ] 答题系统功能
   - [ ] 数据分析界面
   - [ ] 管理后台功能
   - [ ] 移动端适配
   - [ ] PWA 安装提示

### 持续部署

1. **自动部署**
   - 推送到 `main` 分支自动部署到生产环境
   - 推送到 `develop` 分支自动部署到预览环境

2. **部署回滚**
   ```bash
   # 通过 Cloudflare Dashboard 回滚到之前版本
   # 或使用 Wrangler CLI
   wrangler pages deployment list --project-name=anq-platform
   wrangler pages deployment tail --project-name=anq-platform
   ```

3. **监控和日志**
   - 在 Cloudflare Dashboard 中查看访问日志
   - 监控 Functions 执行情况
   - 设置告警通知

### 故障排除

1. **常见问题**
   - **构建失败**: 检查 Node.js 版本和依赖
   - **Functions 错误**: 检查 KV 绑定和环境变量
   - **静态资源 404**: 检查构建输出目录配置

2. **调试工具**
   ```bash
   # 本地预览 Functions
   wrangler pages dev dist

   # 查看实时日志
   wrangler pages deployment tail --project-name=anq-platform
   ```

3. **性能优化**
   - 启用 Cloudflare 缓存
   - 优化图片和视频资源
   - 使用 CDN 加速静态资源

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
