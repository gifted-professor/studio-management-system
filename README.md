# 工作室管理系统

基于 Next.js + Prisma 的工作室会员管理和催单系统。

## 功能特性

- 📋 **会员管理** - 添加、编辑、查看会员信息
- 🛒 **订单管理** - 跟踪订单状态、金额、利润
- 📞 **催单系统** - 记录催单历史、安排后续跟进
- 📊 **数据统计** - 销售数据和会员统计
- 📤 **数据导入** - 从Excel文件导入订单数据

## 技术栈

- **前端**: Next.js 14, React, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: SQLite (开发), PostgreSQL (生产)
- **ORM**: Prisma
- **部署**: Vercel

## 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 设置环境变量

复制 \`.env.local\` 文件并配置数据库连接：

\`\`\`bash
cp .env.local .env.local
\`\`\`

### 3. 初始化数据库

\`\`\`bash
# 生成Prisma客户端
npx prisma generate

# 推送数据库架构
npx prisma db push

# (可选) 打开数据库管理界面
npx prisma studio
\`\`\`

### 4. 导入现有数据

\`\`\`bash
npm run import-excel
\`\`\`

### 5. 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

\`\`\`
src/
├── app/                  # Next.js 13+ App Router
│   ├── api/             # API 路由
│   ├── members/         # 会员管理页面
│   ├── orders/          # 订单管理页面
│   ├── followups/       # 催单管理页面
│   └── page.tsx         # 首页
├── components/          # React 组件
├── lib/                # 工具库
│   ├── prisma.ts       # Prisma 客户端
│   └── utils.ts        # 工具函数
prisma/
├── schema.prisma       # 数据库模型定义
scripts/
├── import-excel.js     # Excel 数据导入脚本
\`\`\`

## 数据库模型

### Member (会员)
- 基本信息：姓名、手机号、地址
- 统计信息：总订单数、总消费金额、最后下单日期
- 状态管理：活跃/非活跃

### Order (订单)
- 订单信息：订单号、支付日期、平台、负责人
- 商品信息：商品名称、货品名、厂家、尺码、颜色
- 财务信息：收款额、成本价、利润、利润率
- 物流信息：收货地址、快递公司

### FollowUp (催单记录)
- 催单信息：催单日期、类型、内容、方式
- 结果跟踪：催单结果、下次跟进日期
- 操作记录：操作员信息

## 部署到 Vercel

### 1. 推送代码到 GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
\`\`\`

### 2. 在 Vercel 中导入项目

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 导入您的 GitHub 仓库
4. 配置环境变量

### 3. 配置生产环境数据库

推荐使用 [PlanetScale](https://planetscale.com) 或 [Railway](https://railway.app) 的 MySQL/PostgreSQL 数据库。

更新 \`.env.local\` 中的 \`DATABASE_URL\`：

\`\`\`
DATABASE_URL="mysql://username:password@host:port/database"
\`\`\`

### 4. 运行数据库迁移

在 Vercel 部署后，在 Vercel 控制台中运行：

\`\`\`bash
npx prisma db push
\`\`\`

## 开发指南

### 添加新功能

1. 更新 Prisma 模型 (\`prisma/schema.prisma\`)
2. 生成客户端：\`npx prisma generate\`
3. 推送模型变更：\`npx prisma db push\`
4. 创建 API 路由 (\`src/app/api/\`)
5. 创建前端页面 (\`src/app/\`)

### 代码规范

- 使用 TypeScript 进行类型安全
- 遵循 Next.js 13+ App Router 约定
- 使用 Tailwind CSS 进行样式设计
- API 路由返回统一的 JSON 格式

## 常见问题

### 数据库连接问题

如果遇到数据库连接问题，请检查：
1. \`.env.local\` 文件中的 \`DATABASE_URL\` 是否正确
2. 数据库服务是否正在运行
3. 防火墙设置是否允许连接

### Excel 导入失败

确保：
1. Excel 文件路径正确
2. Excel 文件格式与脚本中的列名匹配
3. 数据库连接正常

## 许可证

MIT License