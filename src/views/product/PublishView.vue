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
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
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
          <el-input-number
            v-model="form.price"
            :min="0.01"
            :precision="2"
            placeholder="请输入价格"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="简要描述商品"
          />
        </el-form-item>

        <el-form-item label="商品详情" prop="detail">
          <el-input
            v-model="form.detail"
            type="textarea"
            :rows="5"
            placeholder="详细描述商品信息"
          />
        </el-form-item>

        <el-form-item label="图片链接" prop="imageUrls">
          <el-input
            v-model="form.imageUrls"
            type="textarea"
            :rows="2"
            placeholder="输入图片URL，多个用逗号分隔"
          />
          <p class="form-tip">支持多个图片链接，用英文逗号分隔</p>
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
import type { FormInstance, FormRules } from 'element-plus'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const productStore = useProductStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const isEdit = computed(() => !!route.query.id)

const form = reactive({
  name: '',
  description: '',
  price: 0,
  categoryId: undefined as number | undefined,
  imageUrls: '',
  detail: '',
  contactInfo: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid && form.categoryId) {
      submitting.value = true
      try {
        await productStore.publishProduct({
          name: form.name,
          description: form.description,
          price: form.price,
          categoryId: form.categoryId,
          imageUrls: form.imageUrls,
          detail: form.detail,
          contactInfo: form.contactInfo,
        })
        ElMessage.success(isEdit.value ? '修改成功' : '发布成功，等待审核')
        router.push('/my-products')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  categoryStore.fetchCategories()
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
