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
              <div class="stat-value">{{ productStore.myProducts.length }}</div>
              <div class="stat-label">发布数</div>
            </div>
          </div>
        </el-card>

        <!-- 快捷菜单 -->
        <el-card class="quick-menu" shadow="never">
          <template #header>快捷入口</template>
          <el-menu :default-active="activeMenu" @select="handleMenuSelect">
            <el-menu-item index="profile">
              <el-icon><User /></el-icon>个人资料
            </el-menu-item>
            <el-menu-item index="my-products">
              <el-icon><Goods /></el-icon>我的商品
            </el-menu-item>
            <el-menu-item index="publish">
              <el-icon><Plus /></el-icon>发布闲置
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <!-- 右侧内容区 -->
      <el-col :xs="24" :md="16">
        <!-- 个人资料 -->
        <el-card v-if="activeMenu === 'profile'" shadow="never">
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

        <!-- 我的商品 -->
        <el-card v-if="activeMenu === 'my-products'" shadow="never">
          <template #header>
            <div class="card-header">
              <span>我的商品</span>
              <el-button type="primary" size="small" @click="$router.push('/publish')">发布商品</el-button>
            </div>
          </template>

          <el-empty v-if="productStore.myProducts.length === 0" description="暂无商品" />

          <div v-else class="product-list">
            <div
              v-for="product in productStore.myProducts.slice(0, 4)"
              :key="product.id"
              class="product-item"
              @click="$router.push(`/product/${product.id}`)"
            >
              <el-image :src="getFirstImage(product.imageUrls)" fit="cover" />
              <div class="product-info">
                <div class="name">{{ product.name }}</div>
                <div class="price">¥{{ product.price.toFixed(2) }}</div>
                <status-tag :status="product.status" />
              </div>
            </div>
          </div>

          <div v-if="productStore.myProducts.length > 4" class="more-link">
            <el-link type="primary" @click="$router.push('/my-products')">查看更多 <el-icon><ArrowRight /></el-icon></el-link>
          </div>
        </el-card>

        <!-- 发布闲置 -->
        <el-card v-if="activeMenu === 'publish'" shadow="never">
          <template #header>发布闲置</template>
          <div class="publish-tip">
            <el-result icon="info" title="准备好发布闲置了吗？">
              <template #sub-title>点击下方按钮开始发布</template>
              <template #extra>
                <el-button type="primary" @click="$router.push('/publish')">立即发布</el-button>
              </template>
            </el-result>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Goods, Plus, ArrowRight } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { useProductStore } from '@/stores/product'
import { updateUser } from '@/api/user'
import StatusTag from '@/components/StatusTag.vue'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const activeMenu = ref('profile')
const saving = ref(false)

const editForm = reactive({
  nickname: userStore.nickname || '',
  phone: userStore.userInfo?.phone || '',
  avatar: userStore.avatar || '',
})

// 获取第一张图片
const getFirstImage = (imageUrls?: string) => {
  if (!imageUrls) return ''
  return imageUrls.split(',')[0] || ''
}

const handleMenuSelect = (index: string) => {
  if (index === 'my-products') {
    router.push('/my-products')
  } else if (index === 'publish') {
    router.push('/publish')
  } else {
    activeMenu.value = index
  }
}

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

onMounted(() => {
  productStore.fetchMyProducts()
})
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
