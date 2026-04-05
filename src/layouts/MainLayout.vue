<template>
  <el-container class="main-layout">
    <!-- 顶部搜索栏 -->
    <div class="global-search-bar">
      <div class="search-content">
        <div class="logo" @click="router.push('/home')">
          <el-icon size="32" color="#409EFF"><ShoppingBag /></el-icon>
          <span class="logo-text mobile-hide">紫金二手</span>
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
          <!-- 消息 -->
          <el-badge
            v-if="userStore.isLoggedIn"
            :value="unreadCount"
            :hidden="unreadCount === 0"
            class="message-badge"
          >
            <el-button
              circle
              @click="router.push('/messages')"
            >
              <el-icon :size="18"><Bell /></el-icon>
            </el-button>
          </el-badge>

          <!-- 购物车 -->
          <el-badge
            v-if="userStore.isLoggedIn"
            :value="cartStore.cartCount"
            :hidden="cartStore.cartCount === 0"
            class="cart-badge"
          >
            <el-button
              circle
              @click="router.push('/cart')"
            >
              <el-icon :size="18"><ShoppingCart /></el-icon>
            </el-button>
          </el-badge>

          <el-button
            v-if="userStore.isLoggedIn"
            type="primary"
            @click="openInNewTab('/publish')"
            class="mobile-hide"
          >
            <el-icon><Plus /></el-icon>
            发布闲置
          </el-button>
          <el-button
            v-if="userStore.isLoggedIn"
            type="primary"
            circle
            @click="openInNewTab('/publish')"
            class="desktop-hide"
          >
            <el-icon><Plus /></el-icon>
          </el-button>

          <template v-if="!userStore.isLoggedIn">
            <el-button @click="openInNewTab('/login')">登录</el-button>
            <el-button type="primary" @click="openInNewTab('/register')">注册</el-button>
          </template>

          <el-dropdown v-else @command="handleCommand">
            <span class="user-info" @click="goToUserProfile">
              <el-avatar :size="isMobile ? 28 : 32" :src="userStore.avatar">
                {{ userStore.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="nickname mobile-hide">{{ userStore.nickname }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="published">
                  <el-icon><CircleCheck /></el-icon>我发布的
                </el-dropdown-item>
                <el-dropdown-item command="sold">
                  <el-icon><SoldOut /></el-icon>我卖出的
                </el-dropdown-item>
                <el-dropdown-item command="bought">
                  <el-icon><ShoppingCart /></el-icon>我买到的
                </el-dropdown-item>
                <el-dropdown-item command="favorites">
                  <el-icon><Star /></el-icon>我的收藏
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
      </div>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useCartStore } from '@/stores'
import { useMessageStore } from '@/stores/message'
import { useMessagePush } from '@/composables/useMessagePush'
import { useMobile } from '@/composables/useMobile'
import {
  ShoppingBag,
  Search,
  Plus,
  CircleCheck,
  SoldOut,
  ShoppingCart,
  Star,
  SwitchButton,
  Bell,
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const messageStore = useMessageStore()
const { connect, disconnect, onMessage } = useMessagePush()
const { isMobile } = useMobile()

const searchKeyword = ref('')

// 未读数从message store获取
const unreadCount = computed(() => messageStore.totalUnreadCount.total)

// 初始化
onMounted(() => {
  if (userStore.isLoggedIn) {
    cartStore.fetchCartCount()
    messageStore.fetchTotalUnreadCount()

    // 建立SSE连接
    connect()

    // 监听消息推送（SSE只刷新未读数，消息内容由WebSocket处理）
    onMessage((event) => {
      messageStore.fetchTotalUnreadCount()
    })
  }
})

// 监听登录状态变化
watch(() => userStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    cartStore.fetchCartCount()
    messageStore.fetchTotalUnreadCount()
    connect()
  } else {
    // 登出时清空
    cartStore.cartCount = 0
    messageStore.reset()
    disconnect()
  }
})

// 组件卸载时断开连接
onUnmounted(() => {
  disconnect()
})


// 在新标签页打开链接
const openInNewTab = (path: string) => {
  const url = window.location.origin + path
  window.open(url, '_blank')
}

// 跳转到个人中心
const goToUserProfile = () => {
  router.push('/user')
}

// 搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    const url = `${window.location.origin}/products?keyword=${encodeURIComponent(searchKeyword.value)}`
    window.open(url, '_blank')
  }
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'published':
      router.push('/my-products')
      break
    case 'sold':
      router.push('/orders/sold')
      break
    case 'bought':
      router.push('/orders/bought')
      break
    case 'favorites':
      router.push('/user/favorites')
      break
    case 'logout':
      await userStore.logout()
      router.push('/home')
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

  .cart-badge,
  .message-badge {
    :deep(.el-badge__content) {
      top: 8px;
      right: 8px;
    }
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

// 移动端适配
@media (max-width: $screen-sm) {
  .global-search-bar {
    padding: 10px 0;

    .search-content {
      gap: 10px;
      padding: 0 10px;
    }

    .search-box {
      max-width: none;
    }
  }

  .main-content {
    padding: 10px;
  }

  .search-actions {
    gap: 8px;
  }
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