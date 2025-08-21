# 工作室管理系统部署指南

## 自动部署到 Vercel

### 1. 准备工作

1. 确保你有 [Vercel 账户](https://vercel.com)
2. 将项目代码推送到 GitHub/GitLab 等代码仓库

### 2. 通过 Vercel 网站部署

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Import Project" 或 "New Project"
3. 从 GitHub 选择你的工作室管理系统仓库
4. Vercel 会自动识别为 Next.js 项目

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```
DATABASE_URL=postgresql://your-db-connection-string
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=https://your-app-name.vercel.app
DEEPSEEK_API_KEY=your-api-key-here
```

### 4. 数据库设置

#### 选项 1: Vercel Postgres (推荐)
1. 在 Vercel 项目中添加 Postgres 存储
2. 会自动设置 `DATABASE_URL` 环境变量

#### 选项 2: 外部 PostgreSQL
- Supabase: https://supabase.com (免费套餐)
- Neon: https://neon.tech (免费套餐)
- Railway: https://railway.app

### 5. 数据库初始化

部署成功后，需要初始化数据库：

```bash
# 在 Vercel Functions 中会自动运行
npx prisma db push
```

或在项目根目录创建一个 API 路由来初始化数据库。

### 6. 验证部署

访问部署的网址，检查：
- [ ] 首页能正常访问
- [ ] 会员管理页面功能正常
- [ ] 订单管理页面功能正常
- [ ] 数据导入功能正常
- [ ] 数据库连接正常

## 手动部署命令

如果要使用命令行部署：

```bash
# 1. 登录 Vercel
npx vercel login

# 2. 初次部署
npx vercel

# 3. 后续部署
npx vercel --prod
```

## 故障排除

### 常见问题
1. **数据库连接失败**: 检查 DATABASE_URL 环境变量
2. **Prisma 客户端错误**: 确保 postinstall 脚本运行了 prisma generate
3. **API 超时**: 检查 vercel.json 中的函数超时设置

### 日志查看
```bash
npx vercel logs [deployment-url]
```

## 本地开发到生产环境迁移

1. 将 SQLite 数据导出（如需要）
2. 在生产环境重新导入 Excel 数据
3. 测试所有功能

## 安全注意事项

- 确保 NEXTAUTH_SECRET 是一个强随机字符串
- 不要在代码中暴露 API 密钥
- 定期更新依赖包版本