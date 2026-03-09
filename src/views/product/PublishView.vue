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
          <el-input
            v-model="priceInput"
            placeholder="请输入价格"
            style="width: 200px"
          >
            <template #prepend>￥</template>
          </el-input>
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
            v-model="form.imageList"
            :multiple="true"
            :limit="5"
            dir="products"
          />
          <p class="form-tip">第一张图片将作为主图，最多上传5张</p>
        </el-form-item>

        <el-form-item label="联系方式" prop="contactInfo">
          <el-input v-model="form.contactInfo" placeholder="微信号、手机号等" />
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

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const productStore = useProductStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const isEdit = computed(() => !!route.query.id)
const productId = computed(() => Number(route.query.id))

const form = reactive({
  name: '',
  description: '',
  price: 0,
  categoryId: undefined as number | undefined,
  imageList: [] as string[], // 所有图片URL，第一张为主图
  contactInfo: '',
})

// 价格输入框显示值（带￥符号格式）
const priceInput = computed({
  get: () => {
    if (!form.price && form.price !== 0) return ''
    return form.price.toFixed(2)
  },
  set: (val: string) => {
    const num = parseFloat(val)
    form.price = isNaN(num) ? 0 : num
  }
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  imageList: [{ required: true, message: '请至少上传一张商品图片', trigger: 'change', type: 'array', min: 1 }],
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid && form.categoryId) {
      submitting.value = true
      try {
        // 拆分主图和附图
        const data = {
          name: form.name,
          description: form.description,
          price: form.price,
          categoryId: form.categoryId,
          mainImageUrl: form.imageList[0] || '',      // 第一张为主图
          otherImageUrls: form.imageList.slice(1),    // 剩余为附图
          contactInfo: form.contactInfo,
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
      form.categoryId = product.categoryId
      // 合并主图和附图为一个数组
      const images: string[] = []
      if (product.mainImageUrl) {
        images.push(product.mainImageUrl)
      }
      if (product.otherImageUrls?.length) {
        images.push(...product.otherImageUrls)
      }
      // 向后兼容：如果没有新字段，使用旧的imageUrls
      if (images.length === 0 && product.imageUrls) {
        const oldImages = product.imageUrls.split(',').map(url => url.trim()).filter(Boolean)
        images.push(...oldImages)
      }
      form.imageList = images
      form.contactInfo = product.contactInfo || ''
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
