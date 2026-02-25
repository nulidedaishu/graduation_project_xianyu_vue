import request from '@/utils/request'
import type {
  PageResult,
  Product,
  ProductCreateRequest,
  ProductQueryRequest,
  ProductReviewRequest,
} from '@/types/api'

// 发布商品
export const createProduct = (data: ProductCreateRequest): Promise<Product> => {
  return request.post('/api/products', data)
}

// 更新商品
export const updateProduct = (id: number, data: ProductCreateRequest): Promise<Product> => {
  return request.put(`/api/products/${id}`, data)
}

// 获取商品列表
export const getProducts = (params?: ProductQueryRequest): Promise<PageResult<Product>> => {
  return request.get('/api/products', { params })
}

// 获取推荐商品
export const getRecommendedProducts = (params?: { page?: number; size?: number }): Promise<PageResult<Product>> => {
  return request.get('/api/products/recommend', { params })
}

// 搜索商品
export const searchProducts = (keyword: string, params?: Omit<ProductQueryRequest, 'keyword'>): Promise<PageResult<Product>> => {
  return request.get('/api/products/search', { params: { ...params, keyword } })
}

// 获取商品详情
export const getProductDetail = (id: number): Promise<Product> => {
  return request.get(`/api/products/${id}`)
}

// 按分类查询商品
export const getProductsByCategory = (categoryId: number, params?: Omit<ProductQueryRequest, 'categoryId'>): Promise<PageResult<Product>> => {
  return request.get(`/api/products/category/${categoryId}`, { params })
}

// 获取我发布的商品
export const getMyProducts = (params?: Omit<ProductQueryRequest, 'userId'>): Promise<PageResult<Product>> => {
  return request.get('/api/products/my', { params })
}

// 下架商品
export const offlineProduct = (id: number): Promise<void> => {
  return request.post(`/api/products/${id}/offline`)
}

// 重新上架商品
export const onlineProduct = (id: number): Promise<void> => {
  return request.post(`/api/products/${id}/online`)
}

// 删除商品
export const deleteProduct = (id: number): Promise<void> => {
  return request.delete(`/api/products/${id}`)
}

// 获取待审核商品列表（管理员）
export const getPendingProducts = (params?: { page?: number; size?: number }): Promise<PageResult<Product>> => {
  return request.get('/api/products/pending', { params })
}

// 审核商品（管理员）
export const reviewProduct = (id: number, data: Omit<ProductReviewRequest, 'productId'>): Promise<void> => {
  return request.post(`/api/products/${id}/review`, data)
}
