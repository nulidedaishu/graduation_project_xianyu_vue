<template>
  <div class="my-products-view">
    <!-- 操作栏 -->
    <div class="action-bar">
      <h2>我的商品</h2>
      <!-- 状态筛选 -->
      <el-radio-group v-model="filterStatus" size="default" @change="handleFilterChange">
        <el-radio-button :label="null">全部</el-radio-button>
        <el-radio-button :label="0">待审核</el-radio-button>
        <el-radio-button :label="1">已上架</el-radio-button>
        <el-radio-button :label="2">已驳回</el-radio-button>
        <el-radio-button :label="3">已下架</el-radio-button>
        <el-radio-button :label="4">已售出</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 商品列表 -->
    <el-card shadow="never" class="product-list-card">
      <div
        v-infinite-scroll="loadMore"
        :infinite-scroll-disabled="loadingMore || !hasMore"
        :infinite-scroll-distance="50"
        class="infinite-scroll-wrapper"
      >
        <el-table v-loading="productStore.loading && !loadingMore" :data="filteredProducts">
          <el-table-column label="商品" min-width="200">
            <template #default="{ row }">
              <div class="product-cell" @click="viewDetail(row.id)" style="cursor: pointer;">
                <el-image
                  :src="getFirstImage(row)"
                  class="product-thumb"
                  fit="cover"
                />
                <div class="product-info">
                  <div class="name">{{ row.name }}</div>
                  <div class="price">¥{{ row.price.toFixed(2) }}</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <status-tag :status="row.status" />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="editProduct(row.id)">编辑</el-button>
              <!-- 待审核(0)或已上架(1)：显示下架 -->
              <el-button
                v-if="row.status === 0 || row.status === 1"
                link
                type="warning"
                @click="handleOffline(row.id)"
              >
                下架
              </el-button>
              <!-- 已下架(3)：显示上架 -->
              <el-button
                v-if="row.status === 3"
                link
                type="success"
                @click="handleOnline(row.id)"
              >
                上架
              </el-button>
              <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 加载更多提示 -->
        <div class="load-more-status">
          <el-divider v-if="loadingMore">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span style="margin-left: 8px;">加载中...</span>
          </el-divider>
          <el-divider v-else-if="!hasMore && filteredProducts.length > 0">
            <span style="color: #909399;">没有更多了</span>
          </el-divider>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!productStore.loading && filteredProducts.length === 0" description="暂无商品" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { Loading } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import type { Product } from '@/types/api'

const router = useRouter()
const productStore = useProductStore()

// 筛选状态
const filterStatus = ref<number | null>(null)

// 加载更多状态
const loadingMore = ref(false)

// 是否有更多数据
const hasMore = computed(() => productStore.hasMore)

// 商品列表（现在直接使用 store 的数据）
const filteredProducts = computed(() => productStore.myProducts)

// 加载更多数据
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  try {
    await productStore.loadMoreMyProducts(filterStatus.value ?? undefined)
  } finally {
    loadingMore.value = false
  }
}

// 获取第一张图片（优先使用主图字段，向后兼容旧字段）
const getFirstImage = (product: Product) => {
  // 优先使用主图
  if (product.mainImageUrl) {
    return product.mainImageUrl
  }
  // 向后兼容
  if (!product.imageUrls) return ''
  // 兼容数组类型
  if (Array.isArray(product.imageUrls)) {
    return product.imageUrls[0] || ''
  }
  // 字符串类型
  if (typeof product.imageUrls === 'string') {
    return product.imageUrls.split(',')[0] || ''
  }
  return ''
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 查看详情
const viewDetail = (id: number) => {
  router.push(`/product/${id}`)
}

// 编辑商品
const editProduct = (id: number) => {
  router.push(`/publish?id=${id}`)
}

// 下架
const handleOffline = async (id: number) => {
  try {
    await productStore.toggleProductStatus(id, 'offline')
    ElMessage.success('商品已下架')
    fetchData()
  } catch (error) {
    // 错误已由 request 拦截器处理
  }
}

// 上架
const handleOnline = async (id: number) => {
  try {
    await productStore.toggleProductStatus(id, 'online')
    ElMessage.success('商品已上架')
    fetchData()
  } catch (error) {
    // 错误已由 request 拦截器处理
  }
}

// 删除商品
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？删除后不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await productStore.removeProduct(id)
    ElMessage.success('商品已删除')
    fetchData()
  } catch {
    // 取消操作或错误已由 request 拦截器处理
  }
}

// 筛选状态变化 - 重新调用接口获取数据
const handleFilterChange = () => {
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
  // 重新加载数据
  fetchData()
}

const fetchData = () => {
  productStore.resetPagination()
  productStore.fetchMyProducts(filterStatus.value ?? undefined)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.my-products-view {
  .product-list-card {
    overflow: visible;
  }

  .infinite-scroll-wrapper {
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }

  .load-more-status {
    padding: 16px 0;
    text-align: center;

    .el-divider {
      margin: 0;
    }
  }

  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;

    h2 {
      margin: 0;
      font-size: 20px;
    }
  }

  .product-cell {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;

    &:hover {
      background-color: #f5f7fa;
      border-radius: 4px;
      padding: 4px;
      margin: -4px;
    }

    .product-thumb {
      width: 60px;
      height: 60px;
      border-radius: 4px;
    }

    .product-info {
      .name {
        font-size: 14px;
        color: #303133;
        margin-bottom: 4px;
      }

      .price {
        font-size: 14px;
        color: #f56c6c;
        font-weight: bold;
      }
    }
  }

  @media (max-width: 768px) {
    .action-bar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>
