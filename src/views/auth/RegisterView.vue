<template>
  <div class="register-view">
    <h2 class="title">创建账号</h2>
    <p class="subtitle">加入我们，开启闲置交易之旅</p>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      class="register-form"
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

      <el-form-item prop="nickname">
        <el-input
          v-model="form.nickname"
          placeholder="请输入昵称"
          :prefix-icon="Avatar"
        />
      </el-form-item>

      <el-form-item prop="phone">
        <el-input
          v-model="form.phone"
          placeholder="请输入手机号"
          :prefix-icon="Phone"
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

      <el-form-item prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请确认密码"
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
          注册
        </el-button>
      </el-form-item>
    </el-form>

    <div class="form-footer">
      <span>已有账号？</span>
      <el-link type="primary" @click="$router.push('/login')">立即登录</el-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Avatar, Phone } from '@element-plus/icons-vue'
import { register } from '@/api/auth'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  phone: '',
})

// 自定义密码确认验证
const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度3-20个字符', trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 50, message: '昵称最多50个字符', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度6-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await register({
          username: form.username,
          password: form.password,
          confirmPassword: form.confirmPassword,
          nickname: form.nickname,
          phone: form.phone,
        })
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.register-view {
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

.register-form {
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
