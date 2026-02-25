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
              <!-- 非自己发布的商品：显示联系卖家 -->
              <el-button
                v-if="!isOwner"
                type="primary"
                size="large"
                @click="handleContactSeller"
              >
                <el-icon><ChatDotRound /></el-icon>联系卖家
              </el-button>

              <!-- 自己发布的商品：显示编辑、下架/上架、删除 -->
              <template v-else>
                <!-- 待审核(0)、已上架(1)、已驳回(2)、已下架(3)：显示编辑 -->
                <el-button
                  v-if="productStore.currentProduct.status === 0 || productStore.currentProduct.status === 1 || productStore.currentProduct.status === 2 || productStore.currentProduct.status === 3"
                  size="large"
                  @click="handleEdit"
                >
                  <el-icon><Edit /></el-icon>编辑商品
                </el-button>
                <!-- 待审核(0)或已上架(1)：显示下架 -->
                <el-button
                  v-if="productStore.currentProduct.status === 0 || productStore.currentProduct.status === 1"
                  type="warning"
                  size="large"
                  @click="handleOffline"
                >
                  <el-icon><Download /></el-icon>下架商品
                </el-button>
                <!-- 已下架(3)：显示上架 -->
                <el-button
                  v-if="productStore.currentProduct.status === 3"
                  type="success"
                  size="large"
                  @click="handleOnline"
                >
                  <el-icon><Upload /></el-icon>上架商品
                </el-button>
                <el-button type="danger" size="large" @click="handleDelete">
                  <el-icon><Delete /></el-icon>删除商品
                </el-button>
              </template>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 商品描述 -->
      <el-card class="detail-section" shadow="never">
        <template #header>
          <div class="section-header">商品描述</div>
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
import { ChatDotRound, Edit, Download, Upload, Delete } from '@element-plus/icons-vue'
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

// 联系卖家
const handleContactSeller = () => {
  ElMessage.info('联系卖家功能开发中')
}

// 下架商品
const handleOffline = async () => {
  try {
    await ElMessageBox.confirm('确定要下架该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await productStore.toggleProductStatus(productId.value, 'offline')
    ElMessage.success('商品已下架')
    productStore.fetchProductDetail(productId.value)
  } catch {
    // 取消操作
  }
}

// 上架商品
const handleOnline = async () => {
  try {
    await ElMessageBox.confirm('确定要重新上架该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })
    await productStore.toggleProductStatus(productId.value, 'online')
    ElMessage.success('商品已上架')
    productStore.fetchProductDetail(productId.value)
  } catch {
    // 取消操作
  }
}

// 删除商品
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？删除后不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await productStore.removeProduct(productId.value)
    ElMessage.success('商品已删除')
    router.push('/my-products')
  } catch {
    // 取消操作
  }
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