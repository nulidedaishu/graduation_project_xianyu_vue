<template>
  <div class="product-list-view">


    <!-- 商品列表 -->
    <el-card shadow="never">
      <div v-if="loading && productStore.page === 1" class="loading-wrapper">
        <el-skeleton :rows="3" animated />
        <el-skeleton :rows="3" animated />
      </div>

      <template v-else>
        <el-row :gutter="20">
          <el-col
            v-for="product in productStore.products"
            :key="product.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <product-card :product="product" @click="goToDetail(product.id)" />
          </el-col>
        </el-row>

        <!-- 空状态 -->
        <el-empty v-if="!loading && productStore.products.length === 0" description="暂无商品" />

        <!-- 加载中 -->
        <div v-if="productStore.loading && productStore.page > 1" class="loading-more">
          <el-icon class="loading-icon"><Loading /></el-icon>
          加载中...
        </div>

        <!-- 没有更多了 -->
        <div v-if="!productStore.hasMore && productStore.products.length > 0" class="no-more">
          没有更多了
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Loading } from '@element-plus/icons-vue'
import { useCategoryStore } from '@/stores/category'
import { useProductStore } from '@/stores/product'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()
const categoryStore = useCategoryStore()
const productStore = useProductStore()

const keyword = ref('')
const selectedCategory = ref<number | ''>('')
const loading = ref(false)

// 初始化筛选条件
const initFilters = () => {
  const { keyword: k, categoryId } = route.query
  if (k) keyword.value = String(k)
  if (categoryId) selectedCategory.value = Number(categoryId)
}

// 搜索
const handleSearch = () => {
  productStore.resetPagination()
  productStore.products = []
  fetchProducts()
}

// 分类切换
const handleCategoryChange = () => {
  productStore.resetPagination()
  productStore.products = []
  fetchProducts()
}

// 获取商品列表
const fetchProducts = async () => {
  loading.value = true
  try {
    if (keyword.value) {
      await productStore.searchProductsAction(keyword.value, {
        categoryId: selectedCategory.value || undefined,
      })
    } else if (selectedCategory.value) {
      await productStore.fetchProductsByCategory(selectedCategory.value)
    } else {
      await productStore.fetchProducts()
    }
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = async () => {
  if (productStore.loading || !productStore.hasMore) return

  productStore.page++
  loading.value = true
  try {
    if (keyword.value) {
      await productStore.loadMoreSearchProducts(keyword.value, {
        categoryId: selectedCategory.value || undefined,
      })
    } else if (selectedCategory.value) {
      await productStore.loadMoreByCategory(selectedCategory.value)
    } else {
      await productStore.loadMoreLatest()
    }
  } finally {
    loading.value = false
  }
}

// 滚动监听
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  // 距离底部 100px 时触发加载
  if (scrollTop + windowHeight >= documentHeight - 100) {
    loadMore()
  }
}

// 在新标签页打开商品详情
const goToDetail = (id: number) => {
  const url = `${window.location.origin}/product/${id}`
  window.open(url, '_blank')
}

onMounted(() => {
  initFilters()
  categoryStore.fetchCategories()
  fetchProducts()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.product-list-view {
  padding-bottom: 40px;

  .filter-bar {
    margin-bottom: 20px;

    .filter-content {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      align-items: center;
      justify-content: space-between;
    }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 10px;

      .filter-label {
        font-weight: 500;
        color: #606266;
      }
    }

    .search-box {
      width: 300px;
    }
  }

  .loading-wrapper {
    padding: 20px;
  }

  .loading-more {
    text-align: center;
    padding: 20px;
    color: #909399;

    .loading-icon {
      animation: rotating 2s linear infinite;
      margin-right: 8px;
    }
  }

  .no-more {
    text-align: center;
    padding: 20px;
    color: #909399;
    font-size: 14px;
  }

  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
