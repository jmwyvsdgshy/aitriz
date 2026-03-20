<template>
  <div class="p-8 h-full flex flex-col max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-8 shrink-0">
      <div class="flex items-center">
        <h2 class="text-2xl font-bold text-gray-800">{{ t('pageTitle') }}</h2>
      </div>
      <div class="flex space-x-3">
        <el-button plain icon="Upload" @click="triggerImport">{{ t('importBtn') }}</el-button>
        <el-button plain icon="Download" @click="exportConfig">{{ t('exportBtn') }}</el-button>
        <input type="file" ref="fileInput" @change="importConfig" accept=".json" style="display: none;" />
      </div>
    </div>

    <main class="flex-1 overflow-y-auto pb-12 pr-2">
      <div class="space-y-6">
        <el-alert
          :title="t('alertTitle')"
          type="info"
          :description="t('alertDesc')"
          show-icon
          class="!mb-2 !rounded-xl"
        ></el-alert>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 class="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <div class="bg-blue-50 p-2 rounded-lg mr-3">
              <el-icon class="text-blue-600"><Connection /></el-icon>
            </div>
            {{ t('formTitle') }}
          </h3>
          
          <el-form :model="form" label-width="160px" label-position="left">
            <el-form-item :label="t('provider')">
              <el-select v-model="form.provider" class="w-full" :placeholder="t('providerPlaceholder')" size="large" @change="handleProviderChange">
                <el-option-group label="国际主流大模型 / Int. Models">
                  <el-option label="OpenAI" value="openai"></el-option>
                  <el-option label="Anthropic Claude" value="anthropic"></el-option>
                  <el-option label="Google Gemini" value="google"></el-option>
                  <el-option label="Azure OpenAI" value="azure"></el-option>
                </el-option-group>
                <el-option-group label="国内优秀大模型 / CN Models">
                  <el-option label="DeepSeek (深度求索)" value="deepseek"></el-option>
                  <el-option label="阿里通义千问 (Qwen)" value="aliyun"></el-option>
                  <el-option label="智谱清言 (GLM)" value="zhipu"></el-option>
                  <el-option label="月之暗面 (Kimi)" value="moonshot"></el-option>
                  <el-option label="百度文心一言 (Ernie)" value="baidu"></el-option>
                  <el-option label="科大讯飞 (Spark)" value="xunfei"></el-option>
                  <el-option label="腾讯通义 (Hunyuan)" value="tencent"></el-option>
                </el-option-group>
                <el-option-group label="其他 / Others">
                  <el-option label="本地私有化部署 (Ollama)" value="local"></el-option>
                </el-option-group>
              </el-select>
            </el-form-item>

            <el-form-item :label="t('baseUrl')">
              <el-input v-model="form.baseUrl" :placeholder="t('baseUrlPlaceholder')" size="large"></el-input>
            </el-form-item>

            <el-form-item :label="t('apiKey')">
              <el-input v-model="form.apiKey" type="password" show-password placeholder="sk-..." size="large"></el-input>
            </el-form-item>

            <el-form-item :label="t('modelName')">
              <el-input v-model="form.modelName" :placeholder="t('modelNamePlaceholder')" size="large"></el-input>
            </el-form-item>

            <el-divider border-style="dashed" class="!my-8"></el-divider>

            <h4 class="font-bold text-gray-700 mb-4">{{ t('promptTitle') }}</h4>
            <el-form-item label="System Prompt">
              <el-input 
                v-model="form.prompt" 
                type="textarea" 
                :rows="8"
                :placeholder="t('promptPlaceholder')"
              ></el-input>
              <div class="text-xs text-gray-400 mt-2 leading-tight">
                {{ t('promptDesc') }}
              </div>
            </el-form-item>

            <el-form-item :label="t('temperature')">
              <el-slider v-model="form.temperature" :max="2" :step="0.1" show-input></el-slider>
              <div class="text-xs text-gray-400 w-full mt-1">{{ t('tempDesc') }}</div>
            </el-form-item>

            <el-form-item class="mt-10">
              <el-button type="primary" size="large" @click="saveConfig" class="px-10 !rounded-xl" :loading="isSaving">
                {{ t('saveBtn') }}
              </el-button>
              <el-button size="large" class="!rounded-xl ml-4" @click="resetConfig">{{ t('resetBtn') }}</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from '../composables/useI18n'

const i18nMsgs = {
  zh: {
    pageTitle: '系统配置',
    importBtn: '导入配置',
    exportBtn: '导出配置',
    alertTitle: '数据安全说明',
    alertDesc: '系统支持接入私有化部署的大语言模型，您的创新项目数据将通过加密通道传输至您配置的端点，平台不作任何留存。',
    formTitle: 'AI 引擎配置 (LLM API)',
    provider: '服务提供商',
    providerPlaceholder: '请选择服务商',
    baseUrl: 'Base URL (接口地址)',
    baseUrlPlaceholder: '例如：https://api.openai.com/v1',
    apiKey: 'API Key (密钥)',
    modelName: '模型名称 (Model)',
    modelNamePlaceholder: '例如：gpt-4o, claude-3-opus',
    promptTitle: 'TRIZ 专家角色 Prompt 调优',
    promptPlaceholder: '定义 AI 的系统角色...',
    promptDesc: '默认提示词已内置了结构化问题分析与完整的 TRIZ 工具链知识库。',
    temperature: '生成温度 (Temperature)',
    tempDesc: '值越低越严谨（适合严谨工程分析），值越高越发散（适合头脑风暴）。推荐值：0.4',
    saveBtn: '保存并测试连接',
    resetBtn: '恢复默认',
    emptyApiKey: 'API Key 不能为空',
    saveSuccess: '连接成功，配置已保存在本地浏览器！',
    saveFail: '连接失败',
    networkFail: '网络请求失败，请检查 Base URL 是否正确或是否存在跨域问题：',
    exportSuccess: '配置已导出',
    importSuccess: '配置导入成功',
    importFail: '配置文件格式错误'
  },
  en: {
    pageTitle: 'System Settings',
    importBtn: 'Import Config',
    exportBtn: 'Export Config',
    alertTitle: 'Data Security Notice',
    alertDesc: 'The system supports privately deployed LLMs. Your project data will be transmitted via encrypted channels without platform retention.',
    formTitle: 'AI Engine Configuration',
    provider: 'Service Provider',
    providerPlaceholder: 'Select Provider',
    baseUrl: 'Base URL',
    baseUrlPlaceholder: 'e.g., https://api.openai.com/v1',
    apiKey: 'API Key',
    modelName: 'Model Name',
    modelNamePlaceholder: 'e.g., gpt-4o, claude-3-opus',
    promptTitle: 'TRIZ Expert Prompt Tuning',
    promptPlaceholder: 'Define the AI role...',
    promptDesc: 'Default prompt includes structured problem analysis and full TRIZ toolchain knowledge.',
    temperature: 'Temperature',
    tempDesc: 'Lower values for rigorous analysis, higher values for brainstorming. Recommended: 0.4',
    saveBtn: 'Save & Test Connection',
    resetBtn: 'Reset Default',
    emptyApiKey: 'API Key cannot be empty',
    saveSuccess: 'Connected successfully, config saved locally!',
    saveFail: 'Connection failed',
    networkFail: 'Network request failed. Please check Base URL or CORS issues: ',
    exportSuccess: 'Configuration exported',
    importSuccess: 'Configuration imported successfully',
    importFail: 'Invalid configuration file format'
  }
}

const { t } = useI18n(i18nMsgs)
const fileInput = ref(null)
const isSaving = ref(false)

const providerDefaults = {
  openai: { baseUrl: 'https://api.openai.com/v1', modelName: 'gpt-4o' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', modelName: 'claude-3-5-sonnet-20240620' },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', modelName: 'gemini-1.5-pro' },
  azure: { baseUrl: 'https://your-resource.openai.azure.com/openai/deployments', modelName: 'gpt-4o' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', modelName: 'deepseek-chat' },
  aliyun: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', modelName: 'qwen-max' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', modelName: 'glm-4' },
  moonshot: { baseUrl: 'https://api.moonshot.cn/v1', modelName: 'moonshot-v1-32k' },
  baidu: { baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat', modelName: 'ernie-4.0-8k' },
  xunfei: { baseUrl: 'https://spark-api-open.xf-yun.com/v1', modelName: 'generalv3.5' },
  tencent: { baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1', modelName: 'hunyuan-pro' },
  local: { baseUrl: 'http://localhost:11434/v1', modelName: 'llama3' }
}

const form = reactive({
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  modelName: 'gpt-4o',
  prompt: '你是一位顶级的 TRIZ（发明问题解决理论）专家。你的任务是：\n1. 引导用户输入问题背景，并进行结构化分析。\n2. 运用技术矛盾、物理矛盾、场分析、裁剪、进化法则、40个发明原理、阿奇舒勒矩阵、IFR等核心 TRIZ 工具生成解决方案。\n3. 最终输出包含序号、方案描述、所用创新原理、优缺点及可用性评估的综合表格。',
  temperature: 0.4
})

onMounted(() => {
  const savedConfig = JSON.parse(localStorage.getItem('triz_api_config') || '{}')
  if (savedConfig.provider) form.provider = savedConfig.provider
  if (savedConfig.baseUrl) form.baseUrl = savedConfig.baseUrl
  if (savedConfig.apiKey) form.apiKey = savedConfig.apiKey
  if (savedConfig.modelName) form.modelName = savedConfig.modelName
  if (savedConfig.prompt) form.prompt = savedConfig.prompt
  if (savedConfig.temperature !== undefined) form.temperature = savedConfig.temperature
})

const handleProviderChange = (val) => {
  const defaults = providerDefaults[val]
  if (defaults) {
    form.baseUrl = defaults.baseUrl
    form.modelName = defaults.modelName
  }
}

const saveConfig = async () => {
  if (!form.apiKey) {
    ElMessage.error(t('emptyApiKey'))
    return
  }
  isSaving.value = true
  
  try {
    const response = await fetch(`${form.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${form.apiKey}`
      },
      body: JSON.stringify({
        model: form.modelName,
        messages: [{ role: 'user', content: '测试连接，请回复"OK"' }],
        max_tokens: 10
      })
    })

    if (response.ok) {
      localStorage.setItem('triz_api_config', JSON.stringify(form))
      ElMessage.success(t('saveSuccess'))
    } else {
      const errData = await response.json().catch(() => ({}))
      ElMessage.error(`${t('saveFail')}: ${response.status} ${errData.error?.message || ''}`)
    }
  } catch (error) {
    ElMessage.error(`${t('networkFail')}${error.message}`)
  } finally {
    isSaving.value = false
  }
}

const resetConfig = () => {
  form.provider = 'openai'
  form.baseUrl = 'https://api.openai.com/v1'
  form.apiKey = ''
  form.modelName = 'gpt-4o'
  form.temperature = 0.4
  form.prompt = '你是一位顶级的 TRIZ（发明问题解决理论）专家。你的任务是：\n1. 引导用户输入问题背景，并进行结构化分析。\n2. 运用技术矛盾、物理矛盾、场分析、裁剪、进化法则、40个发明原理、阿奇舒勒矩阵、IFR等核心 TRIZ 工具生成解决方案。\n3. 最终输出包含序号、方案描述、所用创新原理、优缺点及可用性评估的综合表格。'
}

const exportConfig = () => {
  const dataStr = JSON.stringify(form, null, 2)
  const blob = new Blob([dataStr], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "triz_config.json"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success(t('exportSuccess'))
}

const triggerImport = () => {
  fileInput.value.click()
}

const importConfig = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target.result)
      if (config.provider) form.provider = config.provider
      if (config.baseUrl) form.baseUrl = config.baseUrl
      if (config.apiKey) form.apiKey = config.apiKey
      if (config.modelName) form.modelName = config.modelName
      if (config.prompt) form.prompt = config.prompt
      if (config.temperature !== undefined) form.temperature = config.temperature
      ElMessage.success(t('importSuccess'))
    } catch (error) {
      ElMessage.error(t('importFail'))
    }
    fileInput.value.value = ''
  }
  reader.readAsText(file)
}
</script>