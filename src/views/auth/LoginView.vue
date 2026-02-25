<template>
  <div class="login-view">
    <h2 class="title">欢迎回来</h2>
    <p class="subtitle">登录你的账号，开始交易之旅</p>

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
          placeholder="请输入用户名"
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

    <div class="form-footer">
      <span>还没有账号？</span>
      <el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度3-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度6-20个字符', trigger: 'blur' },
  ],
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      const success = await userStore.login(form.username, form.password)
      loading.value = false

      if (success) {
        // 登录成功，跳转到原页面或首页
        const redirect = route.query.redirect as string
        router.push(redirect || '/home')
      }
    }
  })
}
</script>

<style scoped lang="scss">
.login-view {
  .title {
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    margin: 0 0 10px;
    color: #303133;
  }

  .subtitle {
    text-align: center;
    color: #909399;
    margin-bottom: 30px;
    font-size: 14px;
  }
}

.login-form {
  .submit-btn {
    width: 100%;
    margin-top: 10px;
  }
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  color: #606266;
  font-size: 14px;
}
</style>
