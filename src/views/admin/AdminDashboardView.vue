<template>
  <div class="admin-dashboard">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409eff">
              <el-icon size="40" color="#fff"><Goods /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">待审核商品</div>
              <div class="stat-value">{{ pendingCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon size="40" color="#fff"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">注册用户</div>
              <div class="stat-value">{{ userCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon size="40" color="#fff"><ShoppingBag /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">商品总数</div>
              <div class="stat-value">{{ productCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="welcome-card" shadow="never">
      <template #header>
        <span>欢迎使用管理后台</span>
      </template>
      <div class="welcome-content">
        <p>您好，<strong>{{ adminStore.adminInfo?.nickname || '管理员' }}</strong></p>
        <p>当前时间：{{ currentTime }}</p>
        <el-divider />
        <h4>快捷操作</h4>
        <div class="quick-actions">
          <el-button type="primary" @click="$router.push('/admin/products')">
            <el-icon><Goods /></el-icon>审核商品
          </el-button>
          <el-button type="success" @click="$router.push('/admin/users')">
            <el-icon><User /></el-icon>管理用户
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Goods, User, ShoppingBag } from '@element-plus/icons-vue'
import { useAdminStore } from '@/stores'

const adminStore = useAdminStore()

const pendingCount = ref(0)
const userCount = ref(0)
const productCount = ref(0)
const currentTime = ref('')

let timer: number | null = null

const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN')
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
  // 加载统计数据
  loadStats()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

const loadStats = async () => {
  await adminStore.fetchPendingProducts(1, 1)
  pendingCount.value = adminStore.total
  await adminStore.fetchUsers(1, 1)
  userCount.value = adminStore.total
}
</script>

<style scoped lang="scss">
.admin-dashboard {
  .stat-card {
    display: flex;
    align-items: center;
    padding: 10px;

    .stat-icon {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
    }

    .stat-info {
      .stat-title {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
      }
    }
  }

  .welcome-card {
    margin-top: 20px;

    .welcome-content {
      p {
        margin: 10px 0;
        color: #606266;
      }

      .quick-actions {
        margin-top: 20px;

        .el-button {
          margin-right: 16px;
        }
      }
    }
  }
}
</style>
