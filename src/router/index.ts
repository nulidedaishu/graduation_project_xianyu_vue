import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore, useAdminStore } from '@/stores'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'MainLayout',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/home/HomeView.vue'),
        meta: { title: '首页' },
      },
      {
        path: '/products',
        name: 'Products',
        component: () => import('@/views/product/ProductListView.vue'),
        meta: { title: '商品列表' },
      },
      {
        path: '/product/:id',
        name: 'ProductDetail',
        component: () => import('@/views/product/ProductDetailView.vue'),
        meta: { title: '商品详情' },
      },
      {
        path: '/publish',
        name: 'Publish',
        component: () => import('@/views/product/PublishView.vue'),
        meta: { title: '发布商品', requiresAuth: true },
      },
      {
        path: '/user',
        name: 'User',
        component: () => import('@/views/user/UserProfileView.vue'),
        meta: { title: '个人中心', requiresAuth: true },
      },
      {
        path: '/my-products',
        name: 'MyProducts',
        component: () => import('@/views/product/MyProductsView.vue'),
        meta: { title: '我的商品', requiresAuth: true },
      },
      {
        path: '/cart',
        name: 'Cart',
        component: () => import('@/views/cart/CartView.vue'),
        meta: { title: '购物车', requiresAuth: true },
      },
      {
        path: '/order/confirm',
        name: 'OrderConfirm',
        component: () => import('@/views/order/OrderConfirmView.vue'),
        meta: { title: '确认订单', requiresAuth: true },
      },
      {
        path: '/order/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/OrderDetailView.vue'),
        meta: { title: '订单详情', requiresAuth: true },
      },
      {
        path: '/orders/bought',
        name: 'OrdersBought',
        component: () => import('@/views/order/OrderListView.vue'),
        meta: { title: '我买到的', requiresAuth: true },
      },
      {
        path: '/orders/sold',
        name: 'OrdersSold',
        component: () => import('@/views/order/OrderListView.vue'),
        meta: { title: '我卖出的', requiresAuth: true },
      },
      {
        path: '/user/addresses',
        name: 'UserAddresses',
        component: () => import('@/views/user/AddressView.vue'),
        meta: { title: '收货地址', requiresAuth: true },
      },
    ],
  },
  {
    path: '/auth',
    name: 'AuthLayout',
    component: () => import('@/layouts/AuthLayout.vue'),
    redirect: '/login',
    children: [
      {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { title: '登录', guestOnly: true },
      },
      {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { title: '注册', guestOnly: true },
      },
    ],
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/AdminLoginView.vue'),
    meta: { title: '管理员登录', guestOnly: true },
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { requiresAdmin: true },
    children: [
      {
        path: '/admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/AdminDashboardView.vue'),
        meta: { title: '控制台' },
      },
      {
        path: '/admin/products',
        name: 'AdminProducts',
        component: () => import('@/views/admin/AdminProductReviewView.vue'),
        meta: { title: '商品审核' },
      },
      {
        path: '/admin/users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/AdminUserView.vue'),
        meta: { title: '用户管理' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面未找到' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const adminStore = useAdminStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - ${import.meta.env.VITE_APP_TITLE || '闲鱼二手交易平台'}`
  }

  // 管理员路由
  if (to.meta.requiresAdmin) {
    if (!adminStore.isLoggedIn) {
      ElMessage.warning('请先登录管理员账号')
      next('/admin/login')
      return
    }
  }

  // 管理员登录页，已登录则跳转
  if (to.path === '/admin/login' && adminStore.isLoggedIn) {
    next('/admin')
    return
  }

  // 需要登录但未登录
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录但访问登录/注册页
  if (to.meta.guestOnly && userStore.isLoggedIn && !to.path.startsWith('/admin')) {
    next('/home')
    return
  }

  next()
})

export default router
