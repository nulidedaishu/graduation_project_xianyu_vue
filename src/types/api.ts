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
  imageUrls?: string // 向后兼容，逗号分隔的图片URL
  mainImageUrl?: string // 主图URL
  otherImageUrls?: string[] // 其他图片URL数组
  detail?: string
  contactInfo?: string
  status: ProductStatusType
  stock?: number
  lockedStock?: number
  userId: number
  userNickname?: string
  province?: string // 省份
  createTime?: string
  updateTime?: string
}

// 创建商品请求
export interface ProductCreateRequest {
  name: string
  description?: string
  price: number
  categoryId: number
  mainImageUrl?: string // 主图URL
  otherImageUrls?: string[] // 其他图片URL数组
  freight?: number // 运费
  districtId?: number // 区域ID
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

// ==================== 购物车相关类型 ====================

// 购物车信息
export interface Cart {
  id: number
  productId: number
  productName: string
  productImage?: string
  price: number
  quantity: number
  stock: number
  createTime?: string
  updateTime?: string
}

// 添加购物车请求
export interface CartAddRequest {
  productId: number
  quantity: number
}

// 更新购物车数量请求
export interface CartUpdateRequest {
  quantity: number
}

// 库存校验请求
export interface StockCheckRequest {
  productId: number
  quantity: number
}

// 库存校验结果
export interface StockCheckResult {
  productId: number
  productName: string
  stock: number
  lockedStock: number
  availableStock: number
  requestedQuantity: number
  sufficient: boolean
}

// 库存锁定请求
export interface StockLockRequest {
  productId: number
  quantity: number
}

// 库存锁定结果
export interface StockLockResult {
  productId: number
  productName: string
  success: boolean
  message?: string
}

// ==================== 订单相关类型 ====================

// 订单状态
export const OrderStatus = {
  PENDING_PAYMENT: 0, // 待付款
  PENDING_SHIPMENT: 1, // 待发货
  PENDING_RECEIPT: 2, // 待收货
  PENDING_REVIEW: 3, // 待评价
  COMPLETED: 4, // 已完成
  CANCELLED: 5, // 已取消
  CLOSED: 6, // 已关闭
} as const

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus]

// 订单状态描述
export const OrderStatusDesc: Record<OrderStatusType, string> = {
  [OrderStatus.PENDING_PAYMENT]: '待付款',
  [OrderStatus.PENDING_SHIPMENT]: '待发货',
  [OrderStatus.PENDING_RECEIPT]: '待收货',
  [OrderStatus.PENDING_REVIEW]: '待评价',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.CLOSED]: '已关闭',
}

// 订单项
export interface OrderItem {
  id: number
  productId: number
  productName: string
  productImage?: string
  price: number
  quantity: number
  sellerId: number
  sellerName?: string
}

// 订单信息
export interface Order {
  id: number
  orderSn: string
  totalAmount: number
  status: OrderStatusType
  statusDesc: string
  payType?: number
  payTime?: string
  deliveryTime?: string
  receiveTime?: string
  expireTime?: string
  closeTime?: string
  completeTime?: string
  remark?: string
  createTime?: string
  items: OrderItem[]
}

// 订单商品项请求
export interface OrderItemRequest {
  productId: number
  quantity: number
}

// 创建订单请求
export interface OrderCreateRequest {
  cartIds?: number[]
  items?: OrderItemRequest[]
  addressId?: number
  remark?: string
}

// 订单查询参数
export interface OrderQueryParams {
  status?: OrderStatusType
}

// ==================== 地址相关类型 ====================

// 省份信息
export interface ProvinceVO {
  id: number
  countryId: number
  name: string
}

// 城市信息
export interface CityVO {
  id: number
  provinceId: number
  name: string
}

// 区县信息
export interface DistrictVO {
  id: number
  cityId: number
  name: string
}

// 地址信息
export interface Address {
  id: number
  consignee: string
  phone: string
  provinceId: number
  province: string
  cityId: number
  city: string
  districtId: number
  district: string
  detailAddress: string
  isDefault: number // 后端使用 0/1
  fullAddress?: string // 完整地址，后端返回
  createTime?: string
  updateTime?: string
}

// 添加/更新地址请求
export interface AddressRequest {
  consignee: string
  phone: string
  provinceId: number
  cityId: number
  districtId: number
  detailAddress: string
  isDefault: number // 0-否, 1-是
}
