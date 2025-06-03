# 开发环境设置指南

## 🚀 快速启动

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发环境
```bash
# 方法一：同时启动前端和API服务器（推荐）
npm run dev:full

# 方法二：分别启动
# 终端1 - 启动API服务器
npm run dev:api

# 终端2 - 启动前端开发服务器
npm run dev
```

### 3. 访问应用
- **前端应用**: http://localhost:3000
- **管理界面**: http://localhost:3000/admin
- **API服务器**: http://localhost:8788

## 🔐 管理员登录信息

### 开发环境凭据
- **用户名**: `admin`
- **密码**: `admin123`

## 📁 项目结构

```
anq/
├── src/                    # 前端源码
│   ├── components/         # 组件
│   │   └── AdminPage.js   # 管理界面组件
│   ├── modules/           # 模块
│   ├── styles/            # 样式文件
│   └── utils/             # 工具函数
├── functions/             # Cloudflare Functions (生产环境)
│   └── api/
│       └── admin/         # 管理API
├── dev-server.js          # 开发环境API服务器
├── vite.config.js         # Vite配置
└── package.json           # 项目配置
```

## 🛠️ 开发环境配置

### API代理配置
开发环境使用Vite代理将API请求转发到本地API服务器：

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8788',
      changeOrigin: true,
      secure: false
    }
  }
}
```

### 开发API服务器
`dev-server.js` 提供了完整的API模拟服务：

- ✅ 管理员认证 (`/api/admin/auth`)
- ✅ 题库管理 (`/api/admin/questions`)
- ✅ 视频管理 (`/api/admin/videos`)
- ✅ 数据分析 (`/api/admin/analytics`)
- ✅ 性能监控 (`/api/v1/analytics/performance`)

## 🔧 可用脚本

| 脚本 | 描述 |
|------|------|
| `npm run dev` | 启动前端开发服务器 (端口3000) |
| `npm run dev:api` | 启动API模拟服务器 (端口8788) |
| `npm run dev:full` | 同时启动前端和API服务器 |
| `npm run dev:functions` | 启动Cloudflare Functions开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |

## 🐛 常见问题解决

### 1. API连接失败
**错误**: `ECONNREFUSED` 或 `fetch failed`

**解决方案**:
```bash
# 确保API服务器正在运行
npm run dev:api

# 或者使用完整开发环境
npm run dev:full
```

### 2. 管理界面登录失败
**错误**: "登录失败" 或 "用户名或密码错误"

**解决方案**:
1. 确认使用正确的凭据：
   - 用户名: `admin`
   - 密码: `admin123`

2. 检查API服务器是否运行：
   ```bash
   curl http://localhost:8788/api/admin/auth
   ```

3. 检查浏览器控制台是否有网络错误

### 3. 端口冲突
**错误**: `EADDRINUSE` 或端口已被占用

**解决方案**:
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000
netstat -ano | findstr :8788

# 终止进程 (Windows)
taskkill /PID <进程ID> /F

# 或者修改端口配置
```

### 4. 依赖安装失败
**错误**: npm install 失败

**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install

# 或使用yarn
yarn install
```

## 📊 开发环境特性

### 模拟数据
开发API服务器提供了丰富的模拟数据：

- **用户活动数据**: 20个模拟用户的学习记录
- **分析统计**: 完整的数据分析指标
- **设备分布**: 移动端、桌面端、平板端使用统计
- **学习路径**: 视频优先vs测试优先的偏好分析

### 实时更新
- 前端代码修改后自动热重载
- API服务器修改后需要手动重启
- 样式文件支持热更新

### 调试功能
- 浏览器开发者工具支持
- Console日志输出
- 网络请求监控
- 源码映射支持

## 🚀 部署准备

### 生产环境构建
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

### Cloudflare Pages部署
```bash
# 预览部署
npm run deploy:preview

# 生产部署
npm run deploy:production
```

## 📞 技术支持

如果遇到问题：

1. **检查控制台**: 查看浏览器和终端的错误信息
2. **验证端口**: 确认3000和8788端口可用
3. **重启服务**: 尝试重启开发服务器
4. **清除缓存**: 清除浏览器缓存和npm缓存
5. **查看日志**: 检查API服务器的控制台输出

## 🔄 开发流程

1. **启动开发环境**
   ```bash
   npm run dev:full
   ```

2. **访问管理界面**
   - 打开 http://localhost:3000/admin
   - 使用 admin/admin123 登录

3. **开发和测试**
   - 修改代码自动热重载
   - 在管理界面测试功能
   - 查看数据分析界面

4. **构建和部署**
   ```bash
   npm run build
   npm run deploy:preview
   ```

---

**最后更新**: 2024年1月
**开发环境**: Node.js 18+ | npm 9+
**状态**: ✅ 开发就绪
