<template>
  <div class="home-view" ref="homeViewRef">
    <!-- 分类导航区域 -->
    <div class="category-section">
      <category-nav :category-tree="categoryStore.categoryTree" />
    </div>

    <!-- 商品列表区域 -->
    <div class="product-section">
      <!-- 标签切换 -->
      <div class="tabs-header">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'recommend' }"
          @click="switchTab('recommend')"
        >
          <el-icon><Star /></el-icon>
          猜你喜欢
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'latest' }"
          @click="switchTab('latest')"
        >
          <el-icon><Clock /></el-icon>
          最新发布
        </div>
      </div>

      <!-- 商品列表 -->
      <el-row :gutter="20">
        <el-col
          v-for="product in productStore.products"
          :key="product.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <product-card :product="product" @click="openProductDetail(product.id)" />
        </el-col>
      </el-row>

      <!-- 加载中 -->
      <div v-if="productStore.loading" class="loading-more">
        <el-icon class="loading-icon"><Loading /></el-icon>
        加载中...
      </div>

      <!-- 没有更多了 -->
      <div v-if="!productStore.hasMore && productStore.products.length > 0" class="no-more">
        没有更多了
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!productStore.loading && productStore.products.length === 0" description="暂无商品" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Clock, Star, Loading } from '@element-plus/icons-vue'
import { useCategoryStore } from '@/stores/category'
import { useProductStore } from '@/stores/product'
import ProductCard from '@/components/ProductCard.vue'
import CategoryNav from '@/components/CategoryNav.vue'

const categoryStore = useCategoryStore()
const productStore = useProductStore()

const homeViewRef = ref<HTMLElement | null>(null)
const activeTab = ref<'recommend' | 'latest'>('recommend')

// 在新标签页打开链接
const openInNewTab = (path: string) => {
  const url = window.location.origin + path
  window.open(url, '_blank')
}

// 打开商品详情
const openProductDetail = (id: number) => {
  const url = `${window.location.origin}/product/${id}`
  window.open(url, '_blank')
}

// 切换标签
const switchTab = async (tab: 'recommend' | 'latest') => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  productStore.resetPagination()
  productStore.products = []

  if (tab === 'recommend') {
    await productStore.fetchRecommendedProducts()
  } else {
    await productStore.fetchProducts()
  }
}

// 加载更多
const loadMore = async () => {
  if (productStore.loading || !productStore.hasMore) return

  if (activeTab.value === 'recommend') {
    await productStore.loadMoreRecommend()
  } else {
    await productStore.loadMoreLatest()
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

onMounted(() => {
  categoryStore.fetchCategoryTree()
  // 默认加载猜你喜欢
  productStore.fetchRecommendedProducts()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.home-view {
  padding-bottom: 40px;
}

.category-section {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.product-section {
  .tabs-header {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e4e7ed;

    .tab-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 20px;
      font-size: 16px;
      color: #606266;
      cursor: pointer;
      border-radius: 20px;
      transition: all 0.3s;

      &:hover {
        color: #409eff;
        background-color: #ecf5ff;
      }

      &.active {
        color: #fff;
        background-color: #409eff;
        font-weight: 500;
      }

      .el-icon {
        font-size: 18px;
      }
    }
  }
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
</style>
