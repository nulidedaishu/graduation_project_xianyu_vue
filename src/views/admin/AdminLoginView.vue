<template>
  <div class="admin-login">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2>管理后台登录</h2>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        size="large"
        @keyup.enter="handleSubmit"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入管理员账号"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="handleSubmit"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="back-link">
        <el-link type="primary" @click="$router.push('/home')">返回前台首页</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { useAdminStore } from '@/stores'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const adminStore = useAdminStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      const success = await adminStore.login(form.username, form.password)
      loading.value = false

      if (success) {
        router.push('/admin')
      }
    }
  })
}
</script>

<style scoped lang="scss">
.admin-login {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .login-card {
    width: 400px;

    .card-header {
      text-align: center;

      h2 {
        margin: 0;
        color: #303133;
      }
    }

    .submit-btn {
      width: 100%;
    }

    .back-link {
      text-align: center;
      margin-top: 16px;
    }
  }
}
</style>
