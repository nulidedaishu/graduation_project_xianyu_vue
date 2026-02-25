# 闲鱼二手交易平台 (xianyu_vue)

基于 Vue 3 + TypeScript + Element Plus + Vite 开发的前端项目。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Element Plus** - 基于 Vue 3 的组件库
- **Vite** - 下一代前端构建工具
- **Vue Router** - Vue.js 官方路由管理器
- **Pinia** - Vue.js 状态管理库
- **Axios** - HTTP 客户端

## 项目结构

```
xianyu_vue/
├── public/                # 静态资源
├── src/
│   ├── api/               # API 接口封装
│   ├── assets/            # 静态资源
│   ├── components/        # 公共组件
│   ├── composables/       # 组合式函数
│   ├── layouts/           # 布局组件
│   ├── router/            # 路由配置
│   ├── stores/            # 状态管理 (Pinia)
│   ├── styles/            # 样式文件
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   ├── views/             # 页面组件
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── .env.example           # 环境变量示例
├── .env.development       # 开发环境变量
├── .env.production        # 生产环境变量
├── .eslintrc.cjs          # ESLint 配置
├── .prettierrc            # Prettier 配置
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
npm run dev
```

默认启动在 http://localhost:3000

## 构建生产版本

```bash
npm run build
```

## 代码规范

```bash
# ESLint 检查并修复
npm run lint

# Prettier 格式化
npm run format
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并根据需要修改：

```bash
# API 基础 URL
VITE_API_BASE_URL=http://localhost:8080

# 应用标题
VITE_APP_TITLE=闲鱼二手交易平台
```

## 后端 API

本项目对接的后端 API 基于 Spring Boot 开发，运行在 `http://localhost:8080`。

主要 API 模块：
- `/api/auth` - 认证模块（登录、注册、登出）
- `/api/products` - 商品模块（CRUD、搜索）
- `/api/categories` - 分类模块
- `/api/users` - 用户模块

## 功能特性

- 用户注册、登录、登出
- 商品浏览、搜索、分类筛选
- 商品发布、编辑、上架/下架
- 个人中心管理
- 响应式布局设计
- 路由守卫权限控制
- 自动导入 Element Plus 组件和图标
- Pinia 状态管理 + 持久化
- Axios 请求封装和拦截器

## 开发服务器代理

在 `vite.config.ts` 中配置了代理，开发时前端请求 `/api` 会自动转发到后端：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

## 许可证

MIT
