<template>
  <div class="order-confirm-view">
    <h1 class="page-title">确认订单</h1>

    <!-- 商品列表 -->
    <el-card class="product-section" shadow="never">
      <template #header>
        <div class="section-header">商品信息</div>
      </template>

      <div class="product-list">
        <div
          v-for="item in orderItems"
          :key="item.productId"
          class="product-item"
        >
          <el-image
            :src="item.productImage || '/placeholder.png'"
            fit="cover"
            class="product-image"
          />
          <div class="product-info">
            <div class="product-name">{{ item.productName }}</div>
            <div class="product-price">
              ¥{{ item.price.toFixed(2) }} × {{ item.quantity }}
            </div>
            <div class="product-stock" :class="{ 'stock-low': (item.availableStock || 0) <= 5 }">
              <span v-if="item.availableStock !== undefined">
                库存: {{ item.availableStock }} 件
                <el-tag v-if="(item.availableStock || 0) <= 0" type="danger" size="small" effect="dark">已售罄</el-tag>
                <el-tag v-else-if="(item.availableStock || 0) <= 5" type="warning" size="small">库存紧张</el-tag>
              </span>
            </div>
          </div>
          <div class="product-total">
            ¥{{ (item.price * item.quantity).toFixed(2) }}
          </div>
        </div>
      </div>
    </el-card>

    <!-- 收货地址 -->
    <el-card class="address-section" shadow="never">
      <template #header>
        <div class="section-header">收货地址</div>
        <el-button type="primary" size="small" @click="openAddressDialog">选择地址</el-button>
      </template>
      <div v-if="selectedAddress" class="selected-address">
        <div class="contact-row">
          <span class="name">{{ selectedAddress.consignee }}</span>
          <span class="phone">{{ selectedAddress.phone }}</span>
          <el-tag v-if="selectedAddress.isDefault === 1" type="danger" size="small">默认</el-tag>
        </div>
        <div class="address-row">
          {{ selectedAddress.fullAddress || `${selectedAddress.province}${selectedAddress.city}${selectedAddress.district}${selectedAddress.detailAddress}` }}
        </div>
      </div>
      <div v-else class="no-address">
        <el-empty description="请选择收货地址">
          <el-button type="primary" @click="openAddressDialog">选择地址</el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 备注 -->
    <el-card class="remark-section" shadow="never">
      <template #header>
        <div class="section-header">订单备注</div>
      </template>
      <el-input
        v-model="remark"
        type="textarea"
        :rows="3"
        placeholder="请输入订单备注（选填）"
        maxlength="200"
        show-word-limit
      />
    </el-card>

    <!-- 订单汇总 -->
    <el-card class="summary-section" shadow="never">
      <div class="summary-row">
        <span>商品总价：</span>
        <span class="price">¥{{ totalAmount.toFixed(2) }}</span>
      </div>
      <div class="summary-row">
        <span>运费：</span>
        <span class="price">¥0.00</span>
      </div>
      <el-divider />
      <div class="summary-row total">
        <span>应付总额：</span>
        <span class="total-price">¥{{ totalAmount.toFixed(2) }}</span>
      </div>
    </el-card>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <el-button
        type="primary"
        size="large"
        :loading="orderStore.creating"
        :disabled="orderItems.some(item => (item.availableStock || 0) <= 0)"
        @click="handleSubmit"
      >
        提交订单
      </el-button>
      <el-button size="large" @click="goBack">返回</el-button>
    </div>

    <!-- 地址选择弹窗 -->
    <el-dialog
      v-model="addressDialogVisible"
      title="选择收货地址"
      width="600px"
      destroy-on-close
    >
      <div class="address-dialog-content">
        <div class="address-list">
          <el-card
            v-for="item in addressList"
            :key="item.id"
            class="address-item"
            :class="{ 'is-default': item.isDefault === 1, 'selected': selectedAddressId === item.id }"
            shadow="hover"
            @click="selectAddress(item)"
          >
            <div class="address-content">
              <div class="address-info">
                <div class="contact-row">
                  <span class="name">{{ item.consignee }}</span>
                  <span class="phone">{{ item.phone }}</span>
                  <el-tag v-if="item.isDefault === 1" type="danger" size="small">默认</el-tag>
                </div>
                <div class="address-row">
                  {{ item.fullAddress || `${item.province}${item.city}${item.district}${item.detailAddress}` }}
                </div>
              </div>
              <div class="address-actions">
                <el-button type="primary" link @click="editAddress(item)">编辑</el-button>
                <el-button
                  v-if="item.isDefault !== 1"
                  type="warning"
                  link
                  @click="handleSetDefaultAddress(item.id)"
                >
                  设为默认
                </el-button>
                <el-button type="danger" link @click="handleDeleteAddress(item.id)">删除</el-button>
              </div>
            </div>
          </el-card>
        </div>
        <div v-if="addressList.length === 0" class="empty-address">
          <el-empty description="暂无收货地址">
            <el-button type="primary" @click="addAddress">添加地址</el-button>
          </el-empty>
        </div>
        <div class="dialog-footer">
          <el-button type="primary" @click="addAddress">新增地址</el-button>
          <el-button @click="addressDialogVisible = false">取消</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 添加/编辑地址弹窗 -->
    <el-dialog
      v-model="addressFormDialogVisible"
      :title="isEditAddress ? '编辑地址' : '新增地址'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="addressFormRef"
        :model="addressForm"
        :rules="addressRules"
        label-width="80px"
      >
        <el-form-item label="收货人" prop="consignee">
          <el-input v-model="addressForm.consignee" placeholder="请输入收货人姓名" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="addressForm.phone" placeholder="请输入手机号码" maxlength="11" />
        </el-form-item>
        <el-form-item label="所在地区" prop="region" required>
          <el-cascader
            v-model="addressForm.region"
            :props="cascaderProps"
            placeholder="请选择省 / 市 / 区"
            style="width: 100%"
            @change="handleRegionChange"
          />
        </el-form-item>
        <el-form-item label="详细地址" prop="detailAddress">
          <el-input
            v-model="addressForm.detailAddress"
            type="textarea"
            :rows="2"
            placeholder="请输入街道、楼牌号等详细地址"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="isDefaultAddress">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addressFormDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingAddress" @click="submitAddressForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore, useCartStore } from '@/stores'
import { getProductDetail } from '@/api/product'
import { checkStockBatch } from '@/api/cart'
import type { OrderCreateRequest } from '@/types/api'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Address, AddressRequest, ProvinceVO, CityVO, DistrictVO } from '@/types/api'
import type { CascaderProps } from 'element-plus'
import {
  getAddressList,
  createAddress,
  updateAddress,
  deleteAddress as deleteAddressApi,
  setDefaultAddress as setDefaultAddressApi,
  getProvinces,
  getCities,
  getDistricts,
} from '@/api/address'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const cartStore = useCartStore()

// 查询参数
const productId = computed(() => Number(route.query.productId))
const quantity = computed(() => Number(route.query.quantity) || 1)
const cartIds = computed(() => {
  const ids = route.query.cartIds as string
  return ids ? ids.split(',').map(Number) : []
})

// 订单数据（扩展类型包含库存信息）
interface OrderItemWithStock {
  productId: number
  productName: string
  productImage?: string
  price: number
  quantity: number
  stock?: number
  lockedStock?: number
  availableStock?: number
}

const orderItems = ref<OrderItemWithStock[]>([])
const remark = ref('')
const checkingStock = ref(false)

// 地址相关数据
const addressList = ref<Address[]>([])
const selectedAddress = ref<Address | null>(null)
const selectedAddressId = ref<number | null>(null)
const addressDialogVisible = ref(false)
const addressFormDialogVisible = ref(false)
const isEditAddress = ref(false)
const editAddressId = ref<number>(0)
const submittingAddress = ref(false)

// 表单引用
const addressFormRef = ref<FormInstance>()

// 表单数据
interface AddressFormData extends AddressRequest {
  region: number[]
}

const addressForm = reactive<AddressFormData>({
  consignee: '',
  phone: '',
  provinceId: 0,
  cityId: 0,
  districtId: 0,
  detailAddress: '',
  isDefault: 0,
  region: [],
})

// 是否默认地址（用于复选框）
const isDefaultAddress = ref(false)

// 表单验证规则
const addressRules: FormRules = {
  consignee: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  region: [
    { required: true, message: '请选择所在地区', trigger: 'change' },
    { validator: (rule, value, callback) => {
      if (!value || value.length !== 3) {
        callback(new Error('请选择完整的省市区'))
      } else {
        callback()
      }
    }, trigger: 'change' },
  ],
  detailAddress: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 100, message: '长度在 5 到 100 个字符', trigger: 'blur' },
  ],
}

// 级联选择器懒加载配置
const cascaderProps: CascaderProps = {
  lazy: true,
  value: 'id',
  label: 'name',
  leaf: 'leaf',
  lazyLoad: async (node, resolve) => {
    const { level } = node

    try {
      if (level === 0) {
        // 加载省份列表
        const res = await getProvinces()
        const provinces = (res || []).map((p: ProvinceVO) => ({
          ...p,
          leaf: false,
        }))
        resolve(provinces)
      } else if (level === 1) {
        // 加载城市列表
        const provinceId = node.value as number
        const res = await getCities(provinceId)
        const cities = (res || []).map((c: CityVO) => ({
          ...c,
          leaf: false,
        }))
        resolve(cities)
      } else if (level === 2) {
        // 加载区县列表
        const cityId = node.value as number
        const res = await getDistricts(cityId)
        const districts = (res || []).map((d: DistrictVO) => ({
          ...d,
          leaf: true,
        }))
        resolve(districts)
      }
    } catch (error) {
      console.error('加载地区数据失败:', error)
      ElMessage.error('加载地区数据失败')
      resolve([])
    }
  },
}

// 计算总价
const totalAmount = computed(() => {
  return orderItems.value.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)
})

// 地址相关方法
const loadAddressList = async () => {
  try {
    const res = await getAddressList()
    addressList.value = res || []
    // 如果有默认地址，自动选中
    const defaultAddress = addressList.value.find(addr => addr.isDefault === 1)
    if (defaultAddress) {
      selectedAddress.value = defaultAddress
      selectedAddressId.value = defaultAddress.id
    }
  } catch (error) {
    console.error('获取地址列表失败:', error)
    ElMessage.error('获取地址列表失败')
  }
}

// 地区选择变化处理
const handleRegionChange = (value: number[]) => {
  if (value) {
    if (value.length === 3) {
      addressForm.provinceId = value[0]
      addressForm.cityId = value[1]
      addressForm.districtId = value[2]
    } else {
      addressForm.provinceId = 0
      addressForm.cityId = 0
      addressForm.districtId = 0
    }
  } else {
    addressForm.provinceId = 0
    addressForm.cityId = 0
    addressForm.districtId = 0
  }
}

// 重置级联选择数据
const resetCascadeData = () => {
  addressForm.region = []
  addressForm.provinceId = 0
  addressForm.cityId = 0
  addressForm.districtId = 0
}

// 打开地址选择弹窗
const openAddressDialog = () => {
  addressDialogVisible.value = true
}

// 选择地址
const selectAddress = (address: Address) => {
  selectedAddress.value = address
  selectedAddressId.value = address.id
  addressDialogVisible.value = false
}

// 添加地址
const addAddress = () => {
  isEditAddress.value = false
  editAddressId.value = 0
  resetAddressForm()
  addressFormDialogVisible.value = true
  resetCascadeData()
}

// 编辑地址
const editAddress = (item: Address) => {
  isEditAddress.value = true
  editAddressId.value = item.id
  addressForm.consignee = item.consignee
  addressForm.phone = item.phone
  addressForm.detailAddress = item.detailAddress
  addressForm.isDefault = item.isDefault
  isDefaultAddress.value = item.isDefault === 1
  // 设置级联选择器的值 [provinceId, cityId, districtId]
  addressForm.region = [item.provinceId, item.cityId, item.districtId]
  // 设置ID值
  addressForm.provinceId = item.provinceId
  addressForm.cityId = item.cityId
  addressForm.districtId = item.districtId
  // 打开弹窗
  addressFormDialogVisible.value = true
}

// 重置表单
const resetAddressForm = () => {
  addressForm.consignee = ''
  addressForm.phone = ''
  addressForm.provinceId = 0
  addressForm.cityId = 0
  addressForm.districtId = 0
  addressForm.detailAddress = ''
  addressForm.isDefault = 0
  addressForm.region = []
  isDefaultAddress.value = false
  addressFormRef.value?.resetFields()
}

// 提交地址表单
const submitAddressForm = async () => {
  if (!addressFormRef.value) return

  await addressFormRef.value.validate(async (valid) => {
    if (!valid) return

    submittingAddress.value = true
    try {
      // 设置是否默认
      addressForm.isDefault = isDefaultAddress.value ? 1 : 0

      if (isEditAddress.value) {
        await updateAddress(editAddressId.value, addressForm)
        ElMessage.success('地址修改成功')
      } else {
        await createAddress(addressForm)
        ElMessage.success('地址添加成功')
      }
      addressFormDialogVisible.value = false
      loadAddressList()
    } catch (error) {
      console.error('保存地址失败:', error)
      ElMessage.error(isEditAddress.value ? '地址修改失败' : '地址添加失败')
    } finally {
      submittingAddress.value = false
    }
  })
}

// 设置默认地址
const handleSetDefaultAddress = async (id: number) => {
  try {
    await setDefaultAddressApi(id)
    ElMessage.success('默认地址设置成功')
    loadAddressList()
  } catch (error) {
    console.error('设置默认地址失败:', error)
    ElMessage.error('设置默认地址失败')
  }
}

// 删除地址
const handleDeleteAddress = (id: number) => {
  ElMessageBox.confirm('确定要删除该地址吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteAddressApi(id)
        ElMessage.success('地址删除成功')
        loadAddressList()
      } catch (error) {
        console.error('删除地址失败:', error)
        ElMessage.error('删除地址失败')
      }
    })
    .catch(() => {})
}

// 校验库存
const validateStock = async (): Promise<boolean> => {
  if (orderItems.value.length === 0) return false

  checkingStock.value = true
  try {
    const stockChecks = orderItems.value.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }))

    const results = await checkStockBatch(stockChecks)

    // 检查是否有库存不足的商品
    const insufficientItems = results.filter(r => !r.sufficient)

    if (insufficientItems.length > 0) {
      // 显示第一个库存不足的商品
      const item = insufficientItems[0]
      ElMessage.error(`商品【${item.productName}】库存不足，已售罄`)
      return false
    }

    // 更新库存信息
    results.forEach(result => {
      const item = orderItems.value.find(i => i.productId === result.productId)
      if (item) {
        item.stock = result.stock
        item.lockedStock = result.lockedStock
        item.availableStock = result.availableStock
      }
    })

    return true
  } catch (error: any) {
    console.error('库存校验失败:', error)
    ElMessage.error(error.message || '库存校验失败，请稍后重试')
    return false
  } finally {
    checkingStock.value = false
  }
}

// 获取订单商品信息
onMounted(async () => {
  // 清空之前的数据
  orderItems.value = []

  if (cartIds.value.length > 0) {
    // 从购物车结算
    await cartStore.fetchCartList()
    const selectedItems = cartStore.cartItems.filter(item =>
      cartIds.value.includes(item.id)
    )
    orderItems.value = selectedItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      price: item.price,
      quantity: item.quantity,
    }))
  } else if (productId.value) {
    // 直接购买
    try {
      const product = await getProductDetail(productId.value)

      // 直接购买时检查库存
      const availableStock = (product.stock || 0) - (product.lockedStock || 0)
      if (availableStock < quantity.value) {
        ElMessage.error(`商品【${product.name}】库存不足，当前可用库存为 ${availableStock} 件`)
        router.back()
        return
      }

      // 处理图片URL（兼容数组和字符串类型）
      let productImage = ''
      if (product.imageUrls) {
        if (Array.isArray(product.imageUrls)) {
          productImage = product.imageUrls[0] || ''
        } else if (typeof product.imageUrls === 'string') {
          productImage = product.imageUrls.split(',')[0] || ''
        }
      }

      orderItems.value = [{
        productId: product.id,
        productName: product.name,
        productImage,
        price: product.price,
        quantity: quantity.value,
        stock: product.stock,
        lockedStock: product.lockedStock,
        availableStock: availableStock,
      }]
    } catch (error) {
      ElMessage.error('获取商品信息失败')
      router.back()
      return
    }
  } else {
    ElMessage.warning('请选择要购买的商品')
    router.push('/cart')
    return
  }

  // 从购物车结算时，校验库存（检查但不锁定）
  if (cartIds.value.length > 0) {
    const stockValid = await validateStock()
    if (!stockValid) {
      // 库存校验失败，跳回购物车
      router.push('/cart')
      return
    }
  }

  // 加载地址列表
  await loadAddressList()
})

// 提交订单
const handleSubmit = async () => {
  if (orderItems.value.length === 0) {
    ElMessage.warning('请选择要购买的商品')
    return
  }

  // 检查是否选择了地址
  if (!selectedAddress.value) {
    ElMessage.warning('请选择收货地址')
    return
  }

  const request: OrderCreateRequest = {
    remark: remark.value,
    addressId: selectedAddress.value.id,
  }

  if (cartIds.value.length > 0) {
    // 从购物车创建订单
    request.cartIds = cartIds.value
  } else {
    // 直接购买
    request.items = orderItems.value.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }))
  }

  const order = await orderStore.createOrderAction(request)
  if (order) {
    // 如果是从购物车创建订单，刷新购物车数量
    if (cartIds.value.length > 0) {
      cartStore.fetchCartCount()
    }
    // 跳转到已购买订单列表页
    router.push('/orders/bought')
  }
}

// 返回
const goBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
.order-confirm-view {
  .page-title {
    font-size: 24px;
    color: #303133;
    margin-bottom: 20px;
  }

  .section-header {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }

  .product-section {
    margin-bottom: 20px;

    .product-list {
      .product-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .product-image {
          width: 80px;
          height: 80px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .product-info {
          flex: 1;

          .product-name {
            font-size: 14px;
            color: #303133;
            margin-bottom: 8px;
          }

          .product-price {
            font-size: 14px;
            color: #909399;
          }

          .product-stock {
            font-size: 12px;
            color: #606266;
            margin-top: 4px;

            &.stock-low {
              color: #f56c6c;
            }

            .el-tag {
              margin-left: 8px;
            }
          }
        }

        .product-total {
          font-size: 16px;
          font-weight: bold;
          color: #f56c6c;
        }
      }
    }
  }

  .remark-section {
    margin-bottom: 20px;
  }

  .summary-section {
    margin-bottom: 20px;

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      color: #606266;

      .price {
        color: #303133;
      }

      &.total {
        font-size: 16px;
        font-weight: bold;

        .total-price {
          color: #f56c6c;
          font-size: 24px;
        }
      }
    }
  }

  .submit-section {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 0;
  }

  .address-section {
    margin-bottom: 20px;

    .selected-address {
      padding: 16px;
      background-color: #f5f7fa;
      border-radius: 4px;

      .contact-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .name {
          font-size: 16px;
          font-weight: bold;
          color: #303133;
        }

        .phone {
          font-size: 14px;
          color: #606266;
        }
      }

      .address-row {
        font-size: 14px;
        color: #909399;
        line-height: 1.5;
      }
    }

    .no-address {
      text-align: center;
      padding: 40px 0;
    }
  }

  .address-dialog-content {
    .address-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 8px;
      margin-bottom: 20px;
    }

    .address-item {
      cursor: pointer;
      transition: all 0.3s;

      &.is-default {
        border: 1px solid #f56c6c;
      }

      &.selected {
        border: 2px solid #409eff;
      }

      :deep(.el-card__body) {
        padding: 16px;
      }

      .address-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;

        @media (max-width: 768px) {
          flex-direction: column;
        }
      }

      .address-info {
        flex: 1;

        .contact-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .name {
            font-size: 16px;
            font-weight: bold;
            color: #303133;
          }

          .phone {
            font-size: 14px;
            color: #606266;
          }
        }

        .address-row {
          font-size: 14px;
          color: #909399;
          line-height: 1.5;
        }
      }

      .address-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;

        @media (max-width: 768px) {
          width: 100%;
          justify-content: flex-end;
          border-top: 1px solid #ebeef5;
          padding-top: 12px;
          margin-top: 8px;
        }
      }
    }

    .empty-address {
      text-align: center;
      padding: 40px 0;
    }

    .dialog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;
    }
  }
}
</style>
