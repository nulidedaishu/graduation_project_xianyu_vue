<template>
  <div class="favorites-view">
    <div class="page-header">
      <h1>我的收藏</h1>
    </div>

    <!-- 收藏列表 -->
    <div v-if="favorites.length > 0" class="favorites-list">
      <el-row :gutter="20">
        <el-col
          v-for="item in favorites"
          :key="item.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card class="favorite-card" shadow="hover">
            <div class="product-image" @click="goToProduct(item.productId)">
              <el-image
                :src="item.productImage || '/placeholder.png'"
                fit="cover"
                class="image"
              />
            </div>
            <div class="product-info">
              <div class="product-name" @click="goToProduct(item.productId)">
                {{ item.productName }}
              </div>
              <div class="product-price">¥{{ Number(item.productPrice).toFixed(2) }}</div>
              <div class="product-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="goToProduct(item.productId)"
                >
                  查看详情
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  plain
                  @click="handleRemove(item.productId)"
                >
                  取消收藏
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[12, 24, 36]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-else description="暂无收藏商品">
      <template #extra>
        <el-button type="primary" @click="$router.push('/products')">
          去逛逛
        </el-button>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFavorites, removeFavorite } from '@/api/favorite'
import type { Favorite } from '@/types/api'

const router = useRouter()

const favorites = ref<Favorite[]>([])
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const loading = ref(false)

// 获取收藏列表
const fetchFavorites = async () => {
  loading.value = true
  try {
    const res = await getFavorites({
      page: currentPage.value,
      size: pageSize.value,
    })
    favorites.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('获取收藏列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 跳转到商品详情
const goToProduct = (productId: number) => {
  router.push(`/product/${productId}`)
}

// 取消收藏
const handleRemove = async (productId: number) => {
  try {
    await ElMessageBox.confirm('确定要取消收藏该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await removeFavorite(productId)
    ElMessage.success('已取消收藏')
    fetchFavorites()
  } catch {
    // 取消操作
  }
}

// 分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchFavorites()
}

// 页码变化
const handlePageChange = (val: number) => {
  currentPage.value = val
  fetchFavorites()
}

onMounted(() => {
  fetchFavorites()
})
</script>

<style scoped lang="scss">
.favorites-view {
  .page-header {
    margin-bottom: 20px;

    h1 {
      font-size: 24px;
      color: #303133;
      margin: 0;
    }
  }

  .favorites-list {
    .favorite-card {
      margin-bottom: 20px;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-4px);
      }

      :deep(.el-card__body) {
        padding: 0;
      }

      .product-image {
        width: 100%;
        height: 200px;
        overflow: hidden;

        .image {
          width: 100%;
          height: 100%;
          transition: transform 0.3s;

          &:hover {
            transform: scale(1.05);
          }
        }
      }

      .product-info {
        padding: 16px;

        .product-name {
          font-size: 14px;
          color: #303133;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          &:hover {
            color: #409eff;
          }
        }

        .product-price {
          font-size: 18px;
          font-weight: bold;
          color: #f56c6c;
          margin-bottom: 12px;
        }

        .product-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 30px;
  }
}
</style>
