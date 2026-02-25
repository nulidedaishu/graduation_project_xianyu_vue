<template>
  <div class="user-profile-view">
    <el-row :gutter="20">
      <!-- 左侧用户信息卡片 -->
      <el-col :xs="24" :md="8">
        <el-card class="user-card" shadow="never">
          <div class="user-avatar">
            <el-avatar :size="100" :src="userStore.avatar">
              {{ userStore.nickname?.charAt(0) || 'U' }}
            </el-avatar>
          </div>

          <div class="user-info">
            <h2 class="nickname">{{ userStore.nickname }}</h2>
            <p class="username">@{{ userStore.username }}</p>
          </div>

          <el-divider />

          <div class="user-stats">
            <div class="stat-item">
              <div class="stat-value">{{ userStore.userInfo?.creditScore || 100 }}</div>
              <div class="stat-label">信用分</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ userStore.userInfo?.publishCount || 0 }}</div>
              <div class="stat-label">发布数</div>
            </div>
          </div>
        </el-card>

        <!-- 快捷入口 -->
        <el-card class="quick-menu" shadow="never">
          <template #header>快捷入口</template>
          <div class="quick-entry-grid">
            <div class="quick-entry-item" @click="router.push('/my-products')">
              <div class="entry-icon">
                <el-icon :size="24" color="#409EFF"><CircleCheck /></el-icon>
              </div>
              <div class="entry-text">我发布的</div>
            </div>
            <div class="quick-entry-item" @click="router.push('/orders/sold')">
              <div class="entry-icon">
                <el-icon :size="24" color="#67C23A"><SoldOut /></el-icon>
              </div>
              <div class="entry-text">我卖出的</div>
            </div>
            <div class="quick-entry-item" @click="router.push('/orders/bought')">
              <div class="entry-icon">
                <el-icon :size="24" color="#E6A23C"><ShoppingCart /></el-icon>
              </div>
              <div class="entry-text">我买到的</div>
            </div>
            <div class="quick-entry-item" @click="router.push('/favorites')">
              <div class="entry-icon">
                <el-icon :size="24" color="#F56C6C"><Star /></el-icon>
              </div>
              <div class="entry-text">我的收藏</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧内容区 -->
      <el-col :xs="24" :md="16">
        <!-- 个人资料 -->
        <el-card shadow="never">
          <template #header>
            <div class="card-header">个人资料</div>
          </template>

          <el-form :model="editForm" label-width="80px">
            <el-form-item label="昵称">
              <el-input v-model="editForm.nickname" />
            </el-form-item>

            <el-form-item label="手机号">
              <el-input v-model="editForm.phone" />
            </el-form-item>

            <el-form-item label="头像">
              <el-input v-model="editForm.avatar" placeholder="头像URL" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { CircleCheck, SoldOut, ShoppingCart, Star } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { updateUser } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

const saving = ref(false)

const editForm = reactive({
  nickname: userStore.nickname || '',
  phone: userStore.userInfo?.phone || '',
  avatar: userStore.avatar || '',
})

const handleSave = async () => {
  if (!userStore.userInfo?.id) return

  saving.value = true
  try {
    await updateUser(userStore.userInfo.id, {
      nickname: editForm.nickname,
      phone: editForm.phone,
      avatar: editForm.avatar,
    })
    ElMessage.success('保存成功')
    userStore.fetchUserInfo()
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.user-profile-view {
  .user-card {
    text-align: center;
    margin-bottom: 20px;

    .user-avatar {
      margin-bottom: 16px;
    }

    .nickname {
      font-size: 20px;
      font-weight: bold;
      margin: 0 0 8px;
    }

    .username {
      font-size: 14px;
      color: #909399;
      margin: 0;
    }

    .user-stats {
      display: flex;
      justify-content: center;
      gap: 40px;

      .stat-item {
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #409EFF;
        }

        .stat-label {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }
  }

  .quick-menu {
    :deep(.el-card__header) {
      font-weight: bold;
    }

    .el-menu {
      border-right: none;
    }
  }

  // 快捷入口网格
  .quick-entry-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .quick-entry-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #f5f7fa;

    &:hover {
      background-color: #ecf5ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .entry-icon {
      margin-bottom: 8px;
      padding: 12px;
      border-radius: 50%;
      background-color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .entry-text {
      font-size: 14px;
      color: #606266;
      font-weight: 500;
    }
  }

  @media (max-width: 768px) {
    .quick-entry-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .quick-entry-item {
      padding: 16px 8px;

      .entry-icon {
        padding: 10px;
      }

      .entry-text {
        font-size: 13px;
      }
    }
  }

  .card-header {
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .product-list {
    .product-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-bottom: 1px solid #ebeef5;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f5f7fa;
      }

      .el-image {
        width: 80px;
        height: 80px;
        border-radius: 4px;
      }

      .product-info {
        flex: 1;

        .name {
          font-size: 14px;
          color: #303133;
          margin-bottom: 8px;
        }

        .price {
          font-size: 16px;
          font-weight: bold;
          color: #f56c6c;
          margin-bottom: 8px;
        }
      }
    }
  }

  .more-link {
    text-align: center;
    margin-top: 16px;
  }

  .publish-tip {
    padding: 20px 0;
  }
}
</style>
