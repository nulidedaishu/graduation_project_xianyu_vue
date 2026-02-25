<template>
  <el-container class="admin-layout">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>管理后台</h2>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        class="admin-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/admin">
          <el-icon><HomeFilled /></el-icon>
          <span>控制台</span>
        </el-menu-item>
        <el-menu-item index="/admin/products">
          <el-icon><Goods /></el-icon>
          <span>商品审核</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <breadcrumb-view />
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              {{ adminStore.adminInfo?.nickname || '管理员' }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { HomeFilled, Goods, User, ArrowDown } from '@element-plus/icons-vue'
import { useAdminStore } from '@/stores'
import BreadcrumbView from '@/components/BreadcrumbView.vue'

const router = useRouter()
const adminStore = useAdminStore()

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    await adminStore.logout()
    router.push('/admin/login')
  }
}
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;

  .sidebar {
    background-color: #304156;

    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid #1f2d3d;

      h2 {
        color: #fff;
        margin: 0;
        font-size: 18px;
      }
    }

    .admin-menu {
      border-right: none;
    }
  }

  .main-container {
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #fff;
      box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

      .user-info {
        cursor: pointer;
        color: #606266;
      }
    }

    .main-content {
      background-color: #f0f2f5;
      padding: 20px;
      overflow-y: auto;
    }
  }
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
