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

            <!-- 库存信息 -->
            <div v-if="!isOwner" class="stock-section">
              <div class="stock-info">
                <span class="meta-label">库存：</span>
                <span :class="{ 'stock-low': availableStock <= 5 }">
                  {{ availableStock > 0 ? `剩余 ${availableStock} 件` : '已售罄' }}
                </span>
                <el-tag v-if="availableStock <= 5 && availableStock > 0" type="danger" size="small" class="stock-tag">
                  库存紧张
                </el-tag>
              </div>
            </div>

            <el-divider v-if="!isOwner && isOnSale && availableStock > 0" />

            <!-- 购买数量选择 -->
            <div v-if="!isOwner && isOnSale && availableStock > 0" class="quantity-section">
              <h3>购买数量</h3>
              <el-input-number
                v-model="quantity"
                :min="1"
                :max="maxQuantity"
                size="large"
              />
              <span v-if="quantity >= maxQuantity && availableStock > 0" class="quantity-hint">
                已达最大可购买数量
              </span>
            </div>

            <!-- 已售罄提示 -->
            <div v-else-if="!isOwner && isOnSale && availableStock <= 0" class="sold-out-section">
              <el-result icon="error" title="该商品已售罄" sub-title="来晚了，商品已经被其他人买走了" />
            </div>

            <el-divider v-if="!isOwner && isOnSale && availableStock > 0" />

            <div class="product-actions">
              <!-- 非自己发布的商品：显示购买操作 -->
              <template v-if="!isOwner">
                <template v-if="isOnSale">
                  <el-button
                    type="primary"
                    size="large"
                    :disabled="availableStock <= 0"
                    @click="handleBuyNow"
                  >
                    <el-icon><ShoppingCart /></el-icon>立即购买
                  </el-button>
                  <el-button
                    type="warning"
                    size="large"
                    :disabled="availableStock <= 0"
                    @click="handleAddToCart"
                  >
                    <el-icon><Plus /></el-icon>加入购物车
                  </el-button>
                </template>
                <el-button
                  v-else
                  type="info"
                  size="large"
                  disabled
                >
                  商品已下架
                </el-button>
                <el-button
                  type="default"
                  size="large"
                  :disabled="availableStock <= 0"
                  @click="handleContactSeller"
                >
                  <el-icon><ChatDotRound /></el-icon>联系卖家
                </el-button>
              </template>

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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChatDotRound, Edit, Download, Upload, Delete, ShoppingCart, Plus } from '@element-plus/icons-vue'
import { useProductStore } from '@/stores/product'
import { useUserStore, useCartStore } from '@/stores'
import { ProductStatus } from '@/types/api'
import StatusTag from '@/components/StatusTag.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const userStore = useUserStore()
const cartStore = useCartStore()

const productId = computed(() => Number(route.params.id))
const quantity = ref(1)

// 可用库存（总库存 - 锁定库存）
const availableStock = computed(() => {
  const stock = productStore.currentProduct?.stock || 0
  const lockedStock = productStore.currentProduct?.lockedStock || 0
  return Math.max(0, stock - lockedStock)
})

// 最大购买数量（取可用库存和99的最小值）
const maxQuantity = computed(() => {
  return Math.min(availableStock.value, 99)
})

// 判断商品是否在售
const isOnSale = computed(() => {
  return productStore.currentProduct?.status === ProductStatus.APPROVED
})

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

// 立即购买
const handleBuyNow = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  // 校验库存
  if (availableStock.value <= 0) {
    ElMessage.error('库存不足，无法购买')
    return
  }

  if (quantity.value > availableStock.value) {
    ElMessage.error(`库存不足，当前可用库存为 ${availableStock.value} 件`)
    return
  }

  // 跳转到订单确认页
  router.push({
    path: '/order/confirm',
    query: {
      productId: productId.value,
      quantity: quantity.value,
    },
  })
}

// 加入购物车
const handleAddToCart = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  // 校验库存
  if (availableStock.value <= 0) {
    ElMessage.error('库存不足，无法加入购物车')
    return
  }

  // 检查购物车中是否已有该商品
  const existingCartItem = cartStore.cartItems.find(item => item.productId === productId.value)
  const existingQuantity = existingCartItem?.quantity || 0
  const totalQuantity = existingQuantity + quantity.value

  // 校验总数量是否超过库存
  if (totalQuantity > availableStock.value) {
    if (existingQuantity > 0) {
      ElMessage.error('您当前购物车中的商品数量已达最大库存')
    } else {
      ElMessage.error(`库存不足，当前可用库存为 ${availableStock.value} 件`)
    }
    return
  }

  const success = await cartStore.addToCartAction({
    productId: productId.value,
    quantity: quantity.value,
  })

  if (success) {
    // 刷新商品详情以获取最新库存
    productStore.fetchProductDetail(productId.value)
  }
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
    // 加载购物车数据以便校验库存
    if (userStore.isLoggedIn) {
      cartStore.fetchCartList()
    }
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

  .stock-section {
    margin-bottom: 16px;

    .stock-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .meta-label {
        color: #909399;
      }

      .stock-low {
        color: #f56c6c;
        font-weight: bold;
      }
    }
  }

  .quantity-section {
    h3 {
      font-size: 16px;
      color: #303133;
      margin: 0 0 12px;
    }

    .quantity-hint {
      margin-left: 12px;
      color: #f56c6c;
      font-size: 12px;
    }
  }

  .sold-out-section {
    padding: 20px 0;
  }

  .product-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
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