// 统一API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页查询参数
export interface PageQuery {
  page?: number
  size?: number
}

// 分页响应数据
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 登录请求
export interface LoginRequest {
  username: string
  password: string
}

// 注册请求
export interface RegisterRequest {
  username: string
  password: string
  confirmPassword: string
  nickname: string
  phone: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: UserInfo
}

// 用户信息
export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar?: string
  phone?: string
  creditScore?: number
  status?: number
}

// 商品状态
export const ProductStatus = {
  PENDING: 0, // 待审核
  APPROVED: 1, // 已上架
  REJECTED: 2, // 审核驳回
  OFFLINE: 3, // 已下架
  SOLD: 4, // 已售出
  DELETED: 5, // 已删除
} as const

export type ProductStatusType = typeof ProductStatus[keyof typeof ProductStatus]

// 商品信息
export interface Product {
  id: number
  name: string
  description?: string
  price: number
  categoryId: number
  categoryName?: string
  imageUrls?: string
  detail?: string
  contactInfo?: string
  status: ProductStatusType
  userId: number
  userNickname?: string
  createTime?: string
  updateTime?: string
}

// 创建商品请求
export interface ProductCreateRequest {
  name: string
  description?: string
  price: number
  categoryId: number
  imageUrls?: string
  detail?: string
  contactInfo?: string
}

// 商品查询请求
export interface ProductQueryRequest extends PageQuery {
  status?: number
  categoryId?: number
  keyword?: string
}

// 商品审核请求
export interface ProductReviewRequest {
  productId: number
  status: number
  auditMsg?: string
}

// 分类信息
export interface Category {
  id: number
  parentId: number
  name: string
  icon?: string
  sort: number
  createTime?: string
}

// 分类树形结构
export interface CategoryTreeVO extends Category {
  children?: CategoryTreeVO[]
}

// 创建分类请求
export interface CategoryCreateRequest {
  parentId?: number
  name: string
  icon?: string
  sort: number
}

// 更新分类请求
export interface CategoryUpdateRequest extends CategoryCreateRequest {
  id: number
}
