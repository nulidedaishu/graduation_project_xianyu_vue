<template>
  <div class="product-detail-view">
    <!-- 加载中 -->
    <div v-if="productStore.loading" class="loading-wrapper">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else-if="productStore.currentProduct">
      <el-row :gutter="20">
        <!-- 左侧图片 -->
        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <el-carousel height="400px" indicator-position="outside">
              <el-carousel-item
                v-for="(url, index) in imageList"
                :key="index"
              >
                <el-image
                  :src="url"
                  fit="contain"
                  style="width: 100%; height: 100%"
                  :preview-src-list="imageList"
                  :initial-index="index"
                />
              </el-carousel-item>
            </el-carousel>
          </el-card>
        </el-col>

        <!-- 右侧信息 -->
        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <div class="product-header">
              <h1 class="product-title">{{ productStore.currentProduct.name }}</h1>
              <div class="product-price">
                ¥{{ productStore.currentProduct.price.toFixed(2) }}
              </div>
            </div>

            <el-divider />

            <div class="product-meta">
              <div class="meta-item">
                <span class="meta-label">分类：</span>
                <el-tag>{{ productStore.currentProduct.categoryName }}</el-tag>
              </div>
              <div class="meta-item">
                <span class="meta-label">状态：</span>
                <status-tag :status="productStore.currentProduct.status" />
              </div>
              <div class="meta-item">
                <span class="meta-label">发布时间：</span>
                <span>{{ formatDate(productStore.currentProduct.createTime) }}</span>
              </div>
            </div>

            <el-divider />

            <div class="seller-info">
              <h3>卖家信息</h3>
              <div class="seller">
                <el-avatar :size="40">
                  {{ productStore.currentProduct.userNickname?.charAt(0) || 'U' }}
                </el-avatar>
                <span class="seller-name">{{ productStore.currentProduct.userNickname }}</span>
              </div>
            </div>

            <el-divider />

            <div class="product-actions">
              <el-button type="primary" size="large">
                <el-icon><ChatDotRound /></el-icon>联系卖家
              </el-button>
              <el-button
                v-if="isOwner"
                size="large"
                @click="handleEdit"
              >
                编辑商品
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 商品详情 -->
      <el-card class="detail-section" shadow="never">
        <template #header>
          <div class="section-header">商品详情</div>
        </template>
        <div class="detail-content">{{ productStore.currentProduct.detail || '暂无详情' }}</div>
      </el-card>

      <!-- 联系方式 -->
      <el-card class="contact-section" shadow="never">
        <template #header>
          <div class="section-header">联系方式</div>
        </template>
        <div class="contact-content">{{ productStore.currentProduct.contactInfo || '暂无联系方式' }}</div>
      </el-card>
    </template>

    <!-- 未找到 -->
    <el-empty v-else description="商品不存在或已被删除" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useProductStore } from '@/stores/product'
import { useUserStore } from '@/stores'
import StatusTag from '@/components/StatusTag.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const userStore = useUserStore()

const productId = computed(() => Number(route.params.id))

// 解析图片列表
const imageList = computed(() => {
  const urls = productStore.currentProduct?.imageUrls
  if (!urls) return []
  return urls.split(',').filter(Boolean)
})

// 判断是否为自己的商品
const isOwner = computed(() => {
  return productStore.currentProduct?.userId === userStore.userInfo?.id
})

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 编辑商品
const handleEdit = () => {
  router.push(`/publish?id=${productId.value}`)
}

onMounted(() => {
  if (productId.value) {
    productStore.fetchProductDetail(productId.value)
  }
})
</script>

<style scoped lang="scss">
.product-detail-view {
  .loading-wrapper {
    padding: 40px;
  }

  .product-header {
    .product-title {
      font-size: 24px;
      font-weight: bold;
      color: #303133;
      margin: 0 0 16px;
      line-height: 1.4;
    }

    .product-price {
      font-size: 32px;
      font-weight: bold;
      color: #f56c6c;
    }
  }

  .product-meta {
    .meta-item {
      margin-bottom: 12px;
      display: flex;
      align-items: center;

      .meta-label {
        color: #909399;
        width: 80px;
      }
    }
  }

  .seller-info {
    h3 {
      font-size: 16px;
      color: #303133;
      margin: 0 0 12px;
    }

    .seller {
      display: flex;
      align-items: center;
      gap: 12px;

      .seller-name {
        font-size: 14px;
        color: #606266;
      }
    }
  }

  .product-actions {
    display: flex;
    gap: 12px;
  }

  .detail-section,
  .contact-section {
    margin-top: 20px;

    .section-header {
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }

    .detail-content,
    .contact-content {
      font-size: 14px;
      color: #606266;
      line-height: 1.8;
      white-space: pre-wrap;
    }
  }
}
</style>