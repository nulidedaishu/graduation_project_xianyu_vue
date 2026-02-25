<template>
  <div class="my-products-view">
    <!-- 操作栏 -->
    <div class="action-bar">
      <h2>我的商品</h2>
      <el-button type="primary" @click="$router.push('/publish')">
        <el-icon><Plus /></el-icon>发布商品
      </el-button>
    </div>

    <!-- 商品列表 -->
    <el-card shadow="never">
      <el-table v-loading="productStore.loading" :data="productStore.myProducts">
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image
                :src="getFirstImage(row.imageUrls)"
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

        <el-table-column label="分类" prop="categoryName" width="120" />

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <status-tag :status="row.status" />
          </template>
        </el-table-column>

        <el-table-column label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row.id)">查看</el-button>
            <el-button
              v-if="row.status === 1"
              link
              type="warning"
              @click="handleOffline(row.id)"
            >
              下架
            </el-button>
            <el-button
              v-if="row.status === 3"
              link
              type="success"
              @click="handleOnline(row.id)"
            >
              上架
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!productStore.loading && productStore.myProducts.length === 0" description="暂无商品" />

      <!-- 分页 -->
      <div v-if="productStore.total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :total="productStore.total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { useProductStore } from '@/stores/product'
import StatusTag from '@/components/StatusTag.vue'

const router = useRouter()
const productStore = useProductStore()

const currentPage = ref(1)

// 获取第一张图片
const getFirstImage = (imageUrls?: string) => {
  if (!imageUrls) return ''
  return imageUrls.split(',')[0] || ''
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

// 页码变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  productStore.page = page
  fetchData()
}

const fetchData = () => {
  productStore.fetchMyProducts()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.my-products-view {
  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
    }
  }

  .product-cell {
    display: flex;
    align-items: center;
    gap: 12px;

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

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}
</style>
