<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-header">
        <div class="logo" @click="$router.push('/home')">
          <el-icon size="48" color="#409EFF"><ShoppingBag /></el-icon>
          <span class="logo-text">闲鱼二手</span>
        </div>
        <p class="slogan">闲置交易，让物品焕发新生</p>
      </div>

      <div class="auth-box">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>

      <div class="auth-footer">
        <p>© 2024 闲鱼二手交易平台</p>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShoppingBag } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    margin-bottom: 10px;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.8;
    }
  }

  .logo-text {
    font-size: 28px;
    font-weight: bold;
    color: #fff;
  }

  .slogan {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
  }
}

.auth-box {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

// 背景装饰
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: -50px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 10%;
  background: rgba(255, 255, 255, 0.05);
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

@media (max-width: 480px) {
  .auth-container {
    padding: 15px;
  }

  .auth-box {
    padding: 30px 20px;
  }
}
</style>