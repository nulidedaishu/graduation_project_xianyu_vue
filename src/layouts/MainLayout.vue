<template>
  <el-container class="main-layout">
    <!-- 顶部搜索栏 -->
    <div class="global-search-bar">
      <div class="search-content">
        <div class="logo" @click="router.push('/home')">
          <el-icon size="32" color="#409EFF"><ShoppingBag /></el-icon>
          <span class="logo-text">闲鱼二手</span>
        </div>
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索你想要的商品..."
            size="large"
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>搜索
              </el-button>
            </template>
          </el-input>
        </div>
        <div class="search-actions">
          <el-button
            v-if="userStore.isLoggedIn"
            type="primary"
            @click="openInNewTab('/publish')"
          >
            <el-icon><Plus /></el-icon>
            发布闲置
          </el-button>

          <template v-if="!userStore.isLoggedIn">
            <el-button @click="openInNewTab('/login')">登录</el-button>
            <el-button type="primary" @click="openInNewTab('/register')">注册</el-button>
          </template>

          <el-dropdown v-else @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.avatar">
                {{ userStore.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="nickname">{{ userStore.nickname }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="user">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="my-products">
                  <el-icon><Goods /></el-icon>我的商品
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <el-main class="main-content">
      <router-view />
    </el-main>

    <!-- 页脚 -->
    <el-footer class="footer">
      <div class="footer-content">
        <p>© 2024 闲鱼二手交易平台 - 基于 Vue 3 + Spring Boot 开发</p>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'
import {
  ShoppingBag,
  Search,
  Plus,
  Goods,
  ArrowDown,
  User,
  SwitchButton,
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const searchKeyword = ref('')

// 在新标签页打开链接
const openInNewTab = (path: string) => {
  const url = window.location.origin + path
  window.open(url, '_blank')
}

// 搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    const url = `${window.location.origin}/products?keyword=${encodeURIComponent(searchKeyword.value)}`
    window.open(url, '_blank')
  }
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'user':
      openInNewTab('/user')
      break
    case 'my-products':
      openInNewTab('/my-products')
      break
    case 'logout':
      userStore.logout()
      window.location.href = '/login'
      break
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
  background-color: #f5f5f5;
}

// 顶部搜索栏
.global-search-bar {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 15px 0;
  position: sticky;
  top: 0;
  z-index: 100;

  .search-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;
    padding: 0 20px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: opacity 0.3s;
    flex-shrink: 0;

    &:hover {
      opacity: 0.8;
    }
  }

  .logo-text {
    font-size: 20px;
    font-weight: bold;
    color: #409EFF;
  }

  .search-box {
    flex: 1;
    max-width: 600px;

    .search-input {
      width: 100%;
    }
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #f5f5f5;
  }
}

.nickname {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
}

.footer {
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
  padding: 20px 0;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  color: #909399;
}

// 页面过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>