import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getProducts,
  getProductDetail,
  searchProducts,
  getProductsByCategory,
  getMyProducts,
  createProduct,
  updateProduct,
  offlineProduct,
  onlineProduct,
  deleteProduct,
  getRecommendedProducts,
} from '@/api/product'
import type { Product, ProductQueryRequest, ProductCreateRequest } from '@/types/api'

export const useProductStore = defineStore('product', () => {
  // State
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const myProducts = ref<Product[]>([])
  const loading = ref(false)
  const page = ref(1)
  const size = ref(12)
  const total = ref(0)
  const hasMore = ref(true)

  // Getters
  const totalPages = computed(() => Math.ceil(total.value / size.value))

  // Actions
  const fetchProducts = async (params?: ProductQueryRequest) => {
    loading.value = true
    try {
      const data = await getProducts({
        page: page.value,
        size: size.value,
        ...params,
      })
      if (data) {
        products.value = data.records || []
        total.value = data.total || 0
        hasMore.value = data.records?.length === size.value
      }
    } finally {
      loading.value = false
    }
  }

  const searchProductsAction = async (keyword: string, params?: Omit<ProductQueryRequest, 'keyword'>) => {
    loading.value = true
    try {
      const data = await searchProducts(keyword, {
        page: page.value,
        size: size.value,
        ...params,
      })
      if (data) {
        products.value = data.records || []
        total.value = data.total || 0
        hasMore.value = data.records?.length === size.value
      }
    } finally {
      loading.value = false
    }
  }

  const fetchProductsByCategory = async (categoryId: number, params?: Omit<ProductQueryRequest, 'categoryId'>) => {
    loading.value = true
    try {
      const data = await getProductsByCategory(categoryId, {
        page: page.value,
        size: size.value,
        ...params,
      })
      if (data) {
        products.value = data.records || []
        total.value = data.total || 0
        hasMore.value = data.records?.length === size.value
      }
    } finally {
      loading.value = false
    }
  }

  const fetchMyProducts = async (status?: number) => {
    loading.value = true
    try {
      const data = await getMyProducts({
        page: page.value,
        size: size.value,
        status,
      })
      if (data) {
        myProducts.value = data.records || []
        total.value = data.total || 0
        hasMore.value = data.records?.length === size.value
      }
    } finally {
      loading.value = false
    }
  }

  const fetchProductDetail = async (id: number) => {
    loading.value = true
    try {
      const data = await getProductDetail(id)
      currentProduct.value = data || null
    } finally {
      loading.value = false
    }
  }

  const publishProduct = async (data: ProductCreateRequest) => {
    return await createProduct(data)
  }

  const editProduct = async (id: number, data: ProductCreateRequest) => {
    return await updateProduct(id, data)
  }

  const toggleProductStatus = async (id: number, status: 'online' | 'offline') => {
    if (status === 'offline') {
      return await offlineProduct(id)
    } else {
      return await onlineProduct(id)
    }
  }

  const removeProduct = async (id: number) => {
    return await deleteProduct(id)
  }

  // 获取推荐商品
  const fetchRecommendedProducts = async () => {
    loading.value = true
    try {
      const data = await getRecommendedProducts({
        page: page.value,
        size: size.value,
      })
      if (data) {
        if (page.value === 1) {
          products.value = data.records || []
        } else {
          products.value.push(...(data.records || []))
        }
        total.value = data.total || 0
        hasMore.value = data.records?.length === size.value
      }
    } finally {
      loading.value = false
    }
  }

  // 加载更多（最新发布）
  const loadMoreLatest = async () => {
    if (!hasMore.value) return
    page.value++
    loading.value = true
    try {
      const data = await getProducts({
        page: page.value,
        size: size.value,
      })
      if (data) {
        products.value.push(...(data.records || []))
        hasMore.value = data.records?.length === size.value
      }
    } finally {
      loading.value = false
    }
  }

  // 加载更多（推荐商品）
  const loadMoreRecommend = async () => {
    if (!hasMore.value) return
    page.value++
    loading.value = true
    try {
      const data = await getRecommendedProducts({
        page: page.value,
        size: size.value,
      })
      if (data) {
        products.value.push(...(data.records || []))
        hasMore.value = data.records?.length === size.value
      }
    } finally {
      loading.value = false
    }
  }

  // 加载更多（搜索商品）
  const loadMoreSearchProducts = async (keyword: string, params?: Omit<ProductQueryRequest, 'keyword'>) => {
    if (!hasMore.value) return
    page.value++
    loading.value = true
    try {
      const data = await searchProducts(keyword, {
        page: page.value,
        size: size.value,
        ...params,
      })
      if (data) {
        products.value.push(...(data.records || []))
        hasMore.value = data.records?.length === size.value
      }
    } finally {
      loading.value = false
    }
  }

  // 加载更多（分类商品）
  const loadMoreByCategory = async (categoryId: number, params?: Omit<ProductQueryRequest, 'categoryId'>) => {
    if (!hasMore.value) return
    page.value++
    loading.value = true
    try {
      const data = await getProductsByCategory(categoryId, {
        page: page.value,
        size: size.value,
        ...params,
      })
      if (data) {
        products.value.push(...(data.records || []))
        hasMore.value = data.records?.length === size.value
      }
    } finally {
      loading.value = false
    }
  }

  // 加载更多（我的商品）
  const loadMoreMyProducts = async (status?: number) => {
    if (!hasMore.value) return
    page.value++
    loading.value = true
    try {
      const data = await getMyProducts({
        page: page.value,
        size: size.value,
        status,
      })
      if (data) {
        myProducts.value.push(...(data.records || []))
        hasMore.value = data.records?.length === size.value
      }
    } finally {
      loading.value = false
    }
  }

  const resetPagination = () => {
    page.value = 1
    total.value = 0
    hasMore.value = true
  }

  return {
    products,
    currentProduct,
    myProducts,
    loading,
    page,
    size,
    total,
    hasMore,
    totalPages,
    fetchProducts,
    searchProductsAction,
    fetchProductsByCategory,
    fetchMyProducts,
    fetchProductDetail,
    publishProduct,
    editProduct,
    toggleProductStatus,
    removeProduct,
    resetPagination,
    fetchRecommendedProducts,
    loadMoreLatest,
    loadMoreRecommend,
    loadMoreSearchProducts,
    loadMoreByCategory,
    loadMoreMyProducts,
  }
})
