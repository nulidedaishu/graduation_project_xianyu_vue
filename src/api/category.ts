import request from '@/utils/request'
import type {
  Category,
  CategoryCreateRequest,
  CategoryTreeVO,
  CategoryUpdateRequest,
} from '@/types/api'

// 创建分类
export const createCategory = (data: CategoryCreateRequest): Promise<Category> => {
  return request.post('/api/categories', data)
}

// 更新分类
export const updateCategory = (data: CategoryUpdateRequest): Promise<Category> => {
  return request.put('/api/categories', data)
}

// 删除分类
export const deleteCategory = (id: number): Promise<void> => {
  return request.delete(`/api/categories/${id}`)
}

// 获取分类详情
export const getCategoryById = (id: number): Promise<Category> => {
  return request.get(`/api/categories/${id}`)
}

// 获取所有分类（平铺）
export const getAllCategories = (): Promise<Category[]> => {
  return request.get('/api/categories')
}

// 获取分类树形结构
export const getCategoryTree = (): Promise<CategoryTreeVO[]> => {
  return request.get('/api/categories/tree')
}

// 获取子分类
export const getCategoryChildren = (parentId: number): Promise<Category[]> => {
  return request.get(`/api/categories/${parentId}/children`)
}

// 检查分类名称可用性
export const checkCategoryName = (name: string, excludeId?: number): Promise<boolean> => {
  return request.get('/api/categories/check-name', { params: { name, excludeId } })
}
