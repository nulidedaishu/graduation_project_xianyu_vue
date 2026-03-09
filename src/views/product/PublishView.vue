<template>
  <div class="publish-view">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h2>{{ isEdit ? '编辑商品' : '发布闲置' }}</h2>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        size="large"
      >
        <el-form-item label="标题" prop="name">
          <el-input v-model="form.name" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类">
            <el-option
              v-for="cat in categoryStore.categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="商品价格" prop="price">
          <div style="display: flex; gap: 16px; align-items: center;">
            <el-input-number
              v-model="form.price"
              :min="0"
              :max="999999"
              :precision="2"
              :step="1"
              placeholder="请输入商品价格"
              style="width: 180px"
              controls-position="right"
            >
              <template #prefix>
                <span style="color: #909399; font-size: 14px;">￥</span>
              </template>
            </el-input-number>
            
            <span style="color: #909399; font-size: 14px;">运费</span>
            
            <el-input-number
              v-model="form.freight"
              :min="0"
              :max="999999"
              :precision="2"
              :step="1"
              placeholder="请输入运费"
              style="width: 150px"
              controls-position="right"
            >
              <template #prefix>
                <span style="color: #909399; font-size: 14px;">￥</span>
              </template>
            </el-input-number>
          </div>
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            placeholder="详细描述商品信息"
          />
        </el-form-item>

        <el-form-item label="商品图片" prop="imageList">
          <ImageUpload
            ref="imageUploadRef"
            v-model="form.imageList"
            :multiple="true"
            :limit="5"
            dir="products"
            @files-change="handleFilesChange"
          />
          <p class="form-tip">第一张图片将作为主图，最多上传 5 张</p>
        </el-form-item>

        <el-form-item label="所在地区">
          <el-cascader
            v-model="form.region"
            :props="cascaderProps"
            placeholder="请选择省 / 市 / 区（可选）"
            style="width: 100%"
            clearable
            @change="handleRegionChange"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '立即发布' }}
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategoryStore } from '@/stores/category'
import { useProductStore } from '@/stores/product'
import ImageUpload from '@/components/ImageUpload.vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { CascaderProps } from 'element-plus'
import { getProvinces, getCities, getDistricts } from '@/api/address'
import type { ProvinceVO, CityVO, DistrictVO } from '@/types/api'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const productStore = useProductStore()

const formRef = ref<FormInstance>()
const imageUploadRef = ref()
const submitting = ref(false)
const hasLocalFiles = ref(false) // 标记是否有本地文件

const isEdit = computed(() => !!route.query.id)
const productId = computed(() => Number(route.query.id))

const form = reactive({
  name: '',
  description: '',
  price: 0 as number | undefined,
  shippingFee: 0 as number | undefined,  // 运费
  categoryId: undefined as number | undefined,
  imageList: [] as string[], // 所有图片 URL，第一张为主图
  region: [] as number[],    // 省市区 ID 数组
  provinceId: 0 as number,
  cityId: 0 as number,
  districtId: 0 as number,
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
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

// 处理本地文件变化
const handleFilesChange = (files: any[]) => {
  hasLocalFiles.value = files.length > 0
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid && form.categoryId) {
      submitting.value = true
      try {
        // 步骤 1: 如果有本地文件，先上传到 OSS
        let finalImageList = form.imageList
        if (hasLocalFiles.value && imageUploadRef.value) {
          finalImageList = await imageUploadRef.value.uploadAllImages()
        }
        
        // 步骤 2: 确保图片列表不为空
        if (finalImageList.length === 0) {
          ElMessage.error('请至少上传一张图片')
          return
        }
        
        // 步骤 3: 提交表单数据
        const data = {
          name: form.name,
          description: form.description,
          price: form.price,
          shippingFee: form.shippingFee || 0,  // 运费
          categoryId: form.categoryId,
          mainImageUrl: finalImageList[0] || '',      // 第一张为主图
          otherImageUrls: finalImageList.slice(1),    // 剩余为附图
          provinceId: form.provinceId || undefined,
          cityId: form.cityId || undefined,
          districtId: form.districtId || undefined,
        }
        if (isEdit.value) {
          // 编辑商品 - 调用更新接口
          await productStore.editProduct(productId.value, data)
        } else {
          // 发布新商品
          await productStore.publishProduct(data)
        }
        ElMessage.success(isEdit.value ? '修改成功' : '发布成功，等待审核')
        router.push('/my-products')
      } catch (error: any) {
        console.error('提交失败:', error)
        ElMessage.error(error.message || '提交失败，请重试')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(async () => {
  await categoryStore.fetchCategories()
  // 编辑模式：加载商品详情
  if (isEdit.value) {
    await productStore.fetchProductDetail(productId.value)
    const product = productStore.currentProduct
    if (product) {
      form.name = product.name
      form.description = product.description || ''
      form.price = product.price
      form.shippingFee = product.shippingFee || 0
      form.categoryId = product.categoryId
      // 合并主图和附图为一个数组
      const images: string[] = []
      if (product.mainImageUrl) {
        images.push(product.mainImageUrl)
      }
      if (product.otherImageUrls?.length) {
        images.push(...product.otherImageUrls)
      }
      // 向后兼容：如果没有新字段，使用旧的 imageUrls
      if (images.length === 0 && product.imageUrls) {
        const oldImages = product.imageUrls.split(',').map(url => url.trim()).filter(Boolean)
        images.push(...oldImages)
      }
      form.imageList = images
      
      // 加载地区信息
      if (product.provinceId && product.cityId && product.districtId) {
        form.region = [product.provinceId, product.cityId, product.districtId]
        form.provinceId = product.provinceId
        form.cityId = product.cityId
        form.districtId = product.districtId
      }
    }
  }
})
</script>

<style scoped lang="scss">
.publish-view {
  max-width: 800px;
  margin: 0 auto;

  .card-header {
    h2 {
      margin: 0;
      font-size: 20px;
    }
  }

  .unit {
    margin-left: 8px;
    color: #606266;
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin: 8px 0 0;
  }
}
</style>
