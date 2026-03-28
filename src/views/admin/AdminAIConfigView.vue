<template>
  <div class="ai-config-view">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>AI大模型配置</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>添加配置
          </el-button>
        </div>
      </template>

      <el-table :data="configList" v-loading="loading" border>
        <el-table-column prop="name" label="配置名称" min-width="120" />
        <el-table-column prop="provider" label="服务商" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.provider }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="model" label="模型" min-width="150" />
        <el-table-column prop="baseUrl" label="API地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="enabled" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              :active-value="1"
              :inactive-value="0"
              @change="(val) => handleToggleEnabled(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="isDefault" label="默认" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault === 1" type="success">默认</el-tag>
            <el-button
              v-else-if="row.enabled === 1"
              link
              type="primary"
              @click="handleSetDefault(row)"
            >
              设为默认
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handleTest(row)">测试</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑配置' : '添加配置'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="form.name" placeholder="如：OpenAI生产环境" />
        </el-form-item>
        <el-form-item label="服务商" prop="provider">
          <el-select v-model="form.provider" placeholder="选择服务商" style="width: 100%">
            <el-option label="OpenAI" value="openai" />
          </el-select>
        </el-form-item>
        <el-form-item label="API密钥" prop="apiKey">
          <el-input
            v-model="form.apiKey"
            type="password"
            show-password
            placeholder="sk-..."
          />
        </el-form-item>
        <el-form-item label="API地址" prop="baseUrl">
          <el-input v-model="form.baseUrl" placeholder="https://api.openai.com（可选）" />
          <span class="form-tip">留空使用默认地址</span>
        </el-form-item>
        <el-form-item label="模型" prop="model">
          <el-select v-model="form.model" placeholder="选择模型" style="width: 100%">
            <el-option label="GPT-4" value="gpt-4" />
            <el-option label="GPT-4 Turbo" value="gpt-4-turbo-preview" />
            <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo" />
            <el-option label="GPT-3.5 Turbo 16K" value="gpt-3.5-turbo-16k" />
          </el-select>
        </el-form-item>
        <el-form-item label="温度" prop="temperature">
          <el-slider v-model="form.temperature" :min="0" :max="2" :step="0.1" show-stops />
          <span class="form-tip">{{ form.temperature }} - 值越高回答越随机</span>
        </el-form-item>
        <el-form-item label="最大Token" prop="maxTokens">
          <el-input-number v-model="form.maxTokens" :min="100" :max="4000" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="系统提示词" prop="systemPrompt">
          <el-input
            v-model="form.systemPrompt"
            type="textarea"
            :rows="3"
            placeholder="设置AI的系统角色提示词（可选）"
          />
        </el-form-item>
        <el-form-item label="启用" prop="enabled">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="success" :loading="testing" @click="handleTestBeforeSave">测试连接</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getAIConfigs,
  createAIConfig,
  updateAIConfig,
  deleteAIConfig,
  setDefaultAIConfig,
  toggleAIConfigEnabled,
  testAIConfig,
  testNewAIConfig,
} from '@/api/admin/aiConfig'

interface AIConfig {
  id?: number
  name: string
  provider: string
  apiKey: string
  baseUrl?: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt?: string
  enabled: number
  isDefault?: number
  updateTime?: string
}

const loading = ref(false)
const configList = ref<AIConfig[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const testing = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<AIConfig>({
  name: '',
  provider: 'openai',
  apiKey: '',
  baseUrl: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: '',
  enabled: 1,
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择服务商', trigger: 'change' }],
  apiKey: [{ required: true, message: '请输入API密钥', trigger: 'blur' }],
  model: [{ required: true, message: '请选择模型', trigger: 'change' }],
}

// 加载配置列表
const loadConfigs = async () => {
  loading.value = true
  try {
    const res = await getAIConfigs()
    configList.value = res
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.error('加载配置失败')
  } finally {
    loading.value = false
  }
}

// 添加
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: AIConfig) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: AIConfig) => {
  try {
    await ElMessageBox.confirm(`确定删除配置 "${row.name}" 吗？`, '提示', {
      type: 'warning',
    })
    await deleteAIConfig(row.id!)
    ElMessage.success('删除成功')
    loadConfigs()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 设置默认
const handleSetDefault = async (row: AIConfig) => {
  try {
    await setDefaultAIConfig(row.id!)
    ElMessage.success('设置成功')
    loadConfigs()
  } catch (error: any) {
    ElMessage.error(error.message || '设置失败')
  }
}

// 启用/禁用
const handleToggleEnabled = async (row: AIConfig, val: number) => {
  try {
    await toggleAIConfigEnabled(row.id!, val)
    ElMessage.success(val === 1 ? '已启用' : '已禁用')
    loadConfigs()
  } catch (error: any) {
    row.enabled = val === 1 ? 0 : 1 // 恢复状态
    ElMessage.error(error.message || '操作失败')
  }
}

// 测试已保存的配置
const handleTest = async (row: AIConfig) => {
  const loading = ElLoading.service({ text: '测试中...' })
  try {
    const success = await testAIConfig(row.id!)
    if (success) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error('连接测试失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '测试失败')
  } finally {
    loading.close()
  }
}

// 测试新配置（保存前）
const handleTestBeforeSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    testing.value = true
    try {
      const success = await testNewAIConfig(form)
      if (success) {
        ElMessage.success('连接测试成功，可以保存')
      } else {
        ElMessage.error('连接测试失败，请检查配置')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '测试失败')
    } finally {
      testing.value = false
    }
  })
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateAIConfig(form.id!, form)
      } else {
        await createAIConfig(form)
      }
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadConfigs()
    } catch (error: any) {
      ElMessage.error(error.message || '保存失败')
    } finally {
      submitting.value = false
    }
  })
}

const resetForm = () => {
  form.id = undefined
  form.name = ''
  form.provider = 'openai'
  form.apiKey = ''
  form.baseUrl = ''
  form.model = 'gpt-3.5-turbo'
  form.temperature = 0.7
  form.maxTokens = 2000
  form.systemPrompt = ''
  form.enabled = 1
}

onMounted(() => {
  loadConfigs()
})
</script>

<style scoped lang="scss">
.ai-config-view {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
