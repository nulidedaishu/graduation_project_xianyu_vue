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

// ==================== 收藏相关类型 ====================

// 收藏信息
export interface Favorite {
  id: number
  productId: number
  productName: string
  productImage?: string
  productPrice: number
  createTime?: string
}

// 添加收藏请求
export interface FavoriteCreateRequest {
  productId: number
}

// ==================== 评价相关类型 ====================

// 评价类型
export const EvaluateType = {
  BUYER_TO_SELLER: 1, // 买家评价卖家
  SELLER_TO_BUYER: 2, // 卖家评价买家
} as const

export type EvaluateTypeType = typeof EvaluateType[keyof typeof EvaluateType]

// 评价信息
export interface Evaluate {
  id: number
  orderId: number
  productId: number
  productName?: string
  evaluatorId: number
  evaluatorName?: string
  evaluateeId: number
  evaluateeName?: string
  type: EvaluateTypeType
  rating: number
  content?: string
  createTime?: string
}

// 创建评价请求
export interface EvaluateCreateRequest {
  orderId: number
  productId: number
  evaluateeId: number
  type: EvaluateTypeType
  rating: number
  content?: string
}

// 待评价订单
export interface PendingEvaluateOrder {
  orderId: number
  orderSn: string
  productId: number
  productName: string
  productImage?: string
  sellerId: number
  sellerName?: string
  buyerId: number
  buyerName?: string
  type: 'buyer' | 'seller' // 当前用户需要以什么身份评价
}

// ==================== 信用积分相关类型 ====================

// 积分变动类型
export const CreditChangeType = {
  INCOME: 1, // 收入
  EXPENSE: 2, // 支出
} as const

export type CreditChangeTypeType = typeof CreditChangeType[keyof typeof CreditChangeType]

// 积分记录
export interface CreditLog {
  id: number
  changeType: CreditChangeTypeType
  changeTypeDesc: string
  points: number
  description?: string
  createTime?: string
}

// 积分统计
export interface CreditStatistics {
  currentScore: number
  creditLevel: string
  totalIncome: number
  totalExpense: number
}

// ==================== 通知相关类型 ====================

// 通知类型
export const NoticeType = {
  AUDIT: 1, // 审核通知
  ORDER: 2, // 订单通知
  SYSTEM: 3, // 系统公告
} as const

export type NoticeTypeType = typeof NoticeType[keyof typeof NoticeType]

// 通知信息
export interface Notice {
  id: number
  type: NoticeTypeType
  typeDesc: string
  title: string
  content?: string
  isRead: boolean
  createTime?: string
}

// 通知统计
export interface NoticeStatistics {
  total: number
  audit: number
  order: number
  system: number
}

// ==================== 即时通讯相关类型 ====================

// 消息类型
export const ChatMessageType = {
  TEXT: 1, // 文字
  IMAGE: 2, // 图片
} as const

export type ChatMessageTypeType = typeof ChatMessageType[keyof typeof ChatMessageType]

// 聊天消息
export interface ChatMessage {
  id: number
  sessionId: string
  senderId: number
  senderName?: string
  senderAvatar?: string
  receiverId: number
  receiverName?: string
  productId?: number
  productName?: string
  productImage?: string
  content: string
  messageType: ChatMessageTypeType
  isRead: boolean
  createTime?: string
}

// 会话信息
export interface ChatSession {
  sessionId: string
  otherUserId: number
  otherUserName: string
  otherUserAvatar?: string
  productId?: number
  productName?: string
  productImage?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

// 发送消息请求
export interface ChatMessageRequest {
  receiverId: number
  productId?: number
  content: string
  messageType: ChatMessageTypeType
}

// 未读消息统计
export interface ChatUnreadCount {
  total: number
  sessions: { sessionId: string; count: number }[]
}

// ==================== 统一消息中心类型 ====================

// 统一会话类型
export type SessionType = 'user' | 'system'

// 统一会话
export interface UnifiedSession {
  sessionType: SessionType
  sessionId: string
  // 用户会话字段
  otherUserId?: number
  otherUserName?: string
  otherUserAvatar?: string
  productId?: number
  productTitle?: string
  productImage?: string
  // 系统会话字段
  systemTitle?: string
  systemIcon?: string
  // 通用字段
  lastMessage: string
  lastMsgType: number // 0-文字, 1-图片, 2-通知
  lastMessageTime?: string
  unreadCount: number
  isPinned: boolean
}

// 消息推送事件
export interface MessagePushEvent {
  eventType: 'chat' | 'notice' | 'order' | 'system' | 'ping'
  data: any
  serverTime: number
  sequence: number
  targetUserId: number | null
}

// 系统通知会话
export interface NoticeSession {
  sessionId: string
  title: string
  icon: string
  lastNoticeTitle: string
  lastNoticeTime?: string
  unreadCount: number
}

// 总未读数
export interface TotalUnreadCount {
  total: number
  chat: number
  notice: number
}

// 游标分页参数
export interface CursorPageParams {
  lastId?: number
  size?: number
}
