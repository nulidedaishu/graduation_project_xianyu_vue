<template>
  <div class="address-view">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>收货地址管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增地址
          </el-button>
        </div>
      </template>

      <!-- 地址列表 -->
      <div v-if="addressList.length > 0" class="address-list">
        <el-card
          v-for="item in addressList"
          :key="item.id"
          class="address-item"
          :class="{ 'is-default': item.isDefault === 1 }"
          shadow="hover"
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
              <el-button type="primary" link @click="handleEdit(item)">编辑</el-button>
              <el-button
                v-if="item.isDefault !== 1"
                type="warning"
                link
                @click="handleSetDefault(item.id)"
              >
                设为默认
              </el-button>
              <el-button type="danger" link @click="handleDelete(item.id)">删除</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="暂无收货地址">
        <el-button type="primary" @click="handleAdd">添加地址</el-button>
      </el-empty>
    </el-card>

    <!-- 添加/编辑地址弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑地址' : '新增地址'"
      :width="isMobile ? '90%' : '500px'"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="收货人" prop="consignee">
          <el-input v-model="form.consignee" placeholder="请输入收货人姓名" maxlength="20" show-word-limit />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号码" maxlength="11" />
        </el-form-item>

        <el-form-item label="所在地区" prop="region" required>
          <el-cascader
            v-model="form.region"
            :props="cascaderProps"
            placeholder="请选择省 / 市 / 区"
            style="width: 100%"
            @change="handleRegionChange"
          />
        </el-form-item>

        <el-form-item label="详细地址" prop="detailAddress">
          <el-input
            v-model="form.detailAddress"
            type="textarea"
            :rows="2"
            placeholder="请输入街道、楼牌号等详细地址"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="isDefault">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useMobile } from '@/composables/useMobile'
import type { FormInstance, FormRules } from 'element-plus'
import type { Address, AddressRequest, ProvinceVO, CityVO, DistrictVO } from '@/types/api'
import type { CascaderProps } from 'element-plus'
import {
  getAddressList,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getProvinces,
  getCities,
  getDistricts,
} from '@/api/address'
// 地址列表
const addressList = ref<Address[]>([])
const loading = ref(false)
const { isMobile } = useMobile()

// 弹窗控制
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number>(0)
const submitting = ref(false)

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
interface FormData extends AddressRequest {
  region: number[]
}

const form = reactive<FormData>({
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
const isDefault = ref(false)

// 表单验证规则
const rules: FormRules = {
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

// 地区选择变化处理
const handleRegionChange = (value: number[]) => {
  if (value && value.length === 3) {
    form.provinceId = value[0]
    form.cityId = value[1]
    form.districtId = value[2]
  } else {
    form.provinceId = 0
    form.cityId = 0
    form.districtId = 0
  }
}

// 重置级联选择数据
const resetCascadeData = () => {
  form.region = []
  form.provinceId = 0
  form.cityId = 0
  form.districtId = 0
}

// 监听弹窗关闭，重置级联数据
watch(dialogVisible, (newVisible) => {
  if (!newVisible) {
    resetCascadeData()
  }
})

// 加载地址列表
const loadAddressList = async () => {
  loading.value = true
  try {
    const res = await getAddressList()
    addressList.value = res || []
  } catch (error) {
    console.error('获取地址列表失败:', error)
    ElMessage.error('获取地址列表失败')
  } finally {
    loading.value = false
  }
}

// 打开添加弹窗
const handleAdd = () => {
  isEdit.value = false
  editId.value = 0
  resetForm()
  dialogVisible.value = true
  // 重置级联数据
  resetCascadeData()
}

// 打开编辑弹窗
const handleEdit = async (item: Address) => {
  isEdit.value = true
  editId.value = item.id
  form.consignee = item.consignee
  form.phone = item.phone
  form.detailAddress = item.detailAddress
  form.isDefault = item.isDefault
  isDefault.value = item.isDefault === 1
  // 设置级联选择器的值 [provinceId, cityId, districtId]
  form.region = [item.provinceId, item.cityId, item.districtId]
  // 设置ID值
  form.provinceId = item.provinceId
  form.cityId = item.cityId
  form.districtId = item.districtId
  // 打开弹窗
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  form.consignee = ''
  form.phone = ''
  form.provinceId = 0
  form.cityId = 0
  form.districtId = 0
  form.detailAddress = ''
  form.isDefault = 0
  form.region = []
  isDefault.value = false
  formRef.value?.resetFields()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      // 设置是否默认
      form.isDefault = isDefault.value ? 1 : 0

      if (isEdit.value) {
        await updateAddress(editId.value, form)
        ElMessage.success('地址修改成功')
      } else {
        await createAddress(form)
        ElMessage.success('地址添加成功')
      }
      dialogVisible.value = false
      loadAddressList()
    } catch (error) {
      console.error('保存地址失败:', error)
      ElMessage.error(isEdit.value ? '地址修改失败' : '地址添加失败')
    } finally {
      submitting.value = false
    }
  })
}

// 设置默认地址
const handleSetDefault = async (id: number) => {
  try {
    await setDefaultAddress(id)
    ElMessage.success('默认地址设置成功')
    loadAddressList()
  } catch (error) {
    console.error('设置默认地址失败:', error)
    ElMessage.error('设置默认地址失败')
  }
}

// 删除地址
const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要删除该地址吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteAddress(id)
        ElMessage.success('地址删除成功')
        loadAddressList()
      } catch (error) {
        console.error('删除地址失败:', error)
        ElMessage.error('删除地址失败')
      }
    })
    .catch(() => {})
}

onMounted(() => {
  loadAddressList()
})
</script>

<style scoped lang="scss">
.address-view {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  .address-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .address-item {
    &.is-default {
      border: 1px solid #f56c6c;
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

  // 移动端适配
  @media (max-width: $screen-sm) {
    :deep(.el-dialog) {
      width: 90% !important;
      margin: 0 auto;
    }

    :deep(.el-form-item__label) {
      float: none;
      display: block;
      text-align: left;
      padding: 0 0 8px;
    }

    :deep(.el-form-item__content) {
      margin-left: 0 !important;
    }

    .address-item {
      :deep(.el-card__body) {
        padding: 12px;
      }

      .address-info {
        .contact-row {
          flex-wrap: wrap;
          gap: 6px;

          .name {
            font-size: 15px;
          }

          .phone {
            font-size: 13px;
          }
        }

        .address-row {
          font-size: 13px;
        }
      }

      .address-actions {
        .el-button {
          font-size: 13px;
          padding: 6px 10px;
        }
      }
    }
  }
}
</style>
