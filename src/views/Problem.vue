<template>
  <div class="p-8 h-full flex flex-col max-w-screen-2xl mx-auto">
    <div class="flex justify-between items-center mb-6 shrink-0">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">{{ t('pageTitle') }}</h2>
        <p class="text-gray-500 mt-2 text-sm">{{ t('pageDesc') }}</p>
      </div>
      <el-button type="primary" @click="goToSolution" :disabled="!analysisDone" size="large" round>
        {{ t('nextBtn') }} <el-icon class="ml-2"><ArrowRight /></el-icon>
      </el-button>
    </div>

    <div class="flex-1 flex gap-8 overflow-hidden pb-4">
      <!-- 左侧：问题输入区 -->
      <div class="w-1/3 flex flex-col gap-6 h-full overflow-y-auto pr-2">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
          <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <div class="bg-blue-50 p-2 rounded-lg mr-3"><el-icon class="text-blue-600"><EditPen /></el-icon></div>
            {{ t('inputTitle') }}
          </h3>
          <el-input
            v-model="rawProblem"
            type="textarea"
            :rows="12"
            :placeholder="t('inputPlaceholder')"
            class="flex-1 mb-6 text-base"
          ></el-input>
          <el-button type="primary" size="large" class="w-full !rounded-xl" @click="analyzeProblem" :loading="isAnalyzing">
            <el-icon class="mr-2"><MagicStick /></el-icon> {{ t('analyzeBtn') }}
          </el-button>
        </div>
      </div>

      <!-- 右侧：AI 结构化结果区 (可编辑) -->
      <div class="w-2/3 h-full overflow-y-auto pl-2">
        <div v-if="!analysisDone" class="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-gray-400">
          <el-icon :size="80" class="text-gray-200 mb-6"><Document /></el-icon>
          <p class="text-lg text-gray-500">{{ t('waitTitle') }}</p>
          <p class="text-sm mt-2 text-gray-400">{{ t('waitDesc') }}</p>
        </div>

        <div v-else class="space-y-4 pb-8">
          <el-alert :title="t('resultAlert')" type="success" show-icon class="!mb-4 !rounded-xl"></el-alert>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-gray-200 struct-card col-span-2">
              <h4 class="font-bold text-gray-700 mb-4 flex items-center text-sm"><el-icon class="mr-2 text-blue-500"><Target /></el-icon>{{ t('f1_title') }}</h4>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <span class="text-xs text-gray-500 mb-1 block">{{ t('f1_sys') }}</span>
                  <el-input v-model="structData.techSystem" type="textarea" :rows="3" :placeholder="t('f1_sys_p')"></el-input>
                </div>
                <div>
                  <span class="text-xs text-gray-500 mb-1 block">{{ t('f1_func') }}</span>
                  <el-input v-model="structData.systemFunction" type="textarea" :rows="3" :placeholder="t('f1_func_p')"></el-input>
                </div>
                <div>
                  <span class="text-xs text-gray-500 mb-1 block">{{ t('f1_cons') }}</span>
                  <el-input v-model="structData.systemConstraint" type="textarea" :rows="3" :placeholder="t('f1_cons_p')"></el-input>
                </div>
              </div>
            </div>
            
            <div class="bg-white p-5 rounded-2xl border border-gray-200 struct-card">
              <h4 class="font-bold text-gray-700 mb-2 flex items-center text-sm"><el-icon class="mr-2 text-indigo-500"><Setting /></el-icon>{{ t('f2_title') }}</h4>
              <el-input v-model="structData.principle" type="textarea" :rows="3"></el-input>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-gray-200 struct-card">
              <h4 class="font-bold text-gray-700 mb-2 flex items-center text-sm"><el-icon class="mr-2 text-orange-500"><Timer /></el-icon>{{ t('f4_title') }}</h4>
              <el-input v-model="structData.condition" type="textarea" :rows="3"></el-input>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-red-100 struct-card col-span-2">
              <h4 class="font-bold text-red-700 mb-2 flex items-center text-sm"><el-icon class="mr-2"><Warning /></el-icon>{{ t('f3_title') }}</h4>
              <el-input v-model="structData.problem" type="textarea" :rows="3"></el-input>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-gray-200 struct-card col-span-2">
              <h4 class="font-bold text-gray-700 mb-2 flex items-center text-sm"><el-icon class="mr-2 text-purple-500"><CircleClose /></el-icon>{{ t('f5_title') }}</h4>
              <el-input v-model="structData.history" type="textarea" :rows="3"></el-input>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-green-100 struct-card col-span-2">
              <h4 class="font-bold text-green-700 mb-2 flex items-center text-sm"><el-icon class="mr-2"><Promotion /></el-icon>{{ t('f6_title') }}</h4>
              <el-input v-model="structData.requirement" type="textarea" :rows="3"></el-input>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from '../composables/useI18n'

const i18nMsgs = {
  zh: {
    pageTitle: '步骤 2：问题定义与结构化分析',
    pageDesc: '将您的原始业务痛点输入给 AI，AI 将按 TRIZ 标准范式解构问题，您可随时对解构结果进行修正。',
    nextBtn: '确认无误，进入方案生成',
    inputTitle: '描述业务/技术痛点',
    inputPlaceholder: '请尽可能详细地描述您的背景...\n例如：\n我们正在研发一款高空作业无人机。目前遇到的问题是，为了保证能搭载重型雷达设备并维持2小时的续航，我们必须使用大容量电池。但这导致整机重量严重超标，起飞阶段电机功耗极大，不仅容易过热，而且降低了实际的飞行机动性。我们曾尝试换用更轻的碳纤维外壳，但成本太高无法量产...',
    analyzeBtn: '让 AI 进行结构化拆解',
    waitTitle: '等待 AI 解析',
    waitDesc: '系统将自动从功能、原理、约束、历史方案等维度拆解您的痛点',
    resultAlert: '您可以点击卡片内的文本框，直接修改 AI 的分析结果以确保准确性。',
    f1_title: '1. 定义技术系统实现的功能',
    f1_sys: '所在的技术系统',
    f1_sys_p: '例如：高空作业无人机系统',
    f1_func: '该技术系统的功能',
    f1_func_p: '例如：搭载重型雷达设备并实现高空飞行',
    f1_cons: '实现该功能的约束',
    f1_cons_p: '例如：量产成本需受控，重量受限',
    f2_title: '2. 现有系统工作原理',
    f3_title: '3. 当前系统存在的问题',
    f4_title: '4. 问题出现的条件和时间',
    f5_title: '5. 现有解决方案及其缺点',
    f6_title: '6. 新系统的要求 (理想状态)',
    warnInput: '请输入问题描述',
    errNoApi: '请先在【系统配置】页面配置 API Key',
    successParsed: 'AI 解析完成，请核对并修改不准确的内容。',
    errParsed: '解析失败',
    defaultProblem: '我们正在研发一款高空作业无人机。目前遇到的问题是，为了保证能搭载重型雷达设备并维持2小时的续航，我们必须使用大容量电池。但这导致整机重量严重超标，起飞阶段电机功耗极大，不仅容易过热，而且降低了实际的飞行机动性。我们曾尝试换用更轻的碳纤维外壳，但成本太高无法量产。'
  },
  en: {
    pageTitle: 'Step 2: Problem Definition & Analysis',
    pageDesc: 'Describe your pain point to AI, and it will deconstruct the problem using the TRIZ paradigm. You can edit the results anytime.',
    nextBtn: 'Confirm & Generate Solutions',
    inputTitle: 'Describe Business/Tech Pain Points',
    inputPlaceholder: 'Please describe your background in detail...\nFor example:\nWe are developing a high-altitude drone. To carry heavy radar and fly for 2 hours, we use large batteries. But this makes it too heavy, draws massive power on takeoff, causes overheating, and limits agility. We tried carbon fiber, but it is too expensive to mass-produce...',
    analyzeBtn: 'Let AI Deconstruct the Problem',
    waitTitle: 'Waiting for AI Analysis',
    waitDesc: 'The system will automatically extract functions, principles, constraints, and historical solutions.',
    resultAlert: 'You can click on the text boxes inside the cards to modify the AI analysis directly.',
    f1_title: '1. Define the System Function',
    f1_sys: 'Technical System',
    f1_sys_p: 'e.g. High-altitude Drone',
    f1_func: 'System Function',
    f1_func_p: 'e.g. Carry heavy radar and fly high',
    f1_cons: 'Constraints',
    f1_cons_p: 'e.g. Mass production cost, weight limits',
    f2_title: '2. Current Working Principle',
    f3_title: '3. Current System Problems',
    f4_title: '4. Conditions and Timing of the Problem',
    f5_title: '5. Existing Solutions & Flaws',
    f6_title: '6. Requirements for the New System (Ideal State)',
    warnInput: 'Please enter a problem description',
    errNoApi: 'Please configure the API Key in the Settings page first',
    successParsed: 'AI analysis completed. Please verify and edit if needed.',
    errParsed: 'Analysis failed',
    defaultProblem: 'We are developing a high-altitude drone. To carry heavy radar and fly for 2 hours, we use large batteries. But this makes it too heavy, draws massive power on takeoff, causes overheating, and limits agility. We tried carbon fiber, but it is too expensive to mass-produce.'
  }
}

const { t, currentLang } = useI18n(i18nMsgs)
const router = useRouter()

const rawProblem = ref(i18nMsgs[currentLang.value].defaultProblem)
const isAnalyzing = ref(false)
const analysisDone = ref(false)

const structData = reactive({
  techSystem: '',
  systemFunction: '',
  systemConstraint: '',
  principle: '',
  problem: '',
  condition: '',
  history: '',
  requirement: ''
})

watch(currentLang, (newLang) => {
  if (!analysisDone.value) {
    rawProblem.value = i18nMsgs[newLang].defaultProblem
  }
})

watch(structData, (newVal) => {
  if (analysisDone.value) {
    localStorage.setItem('triz_struct_data', JSON.stringify(newVal))
  }
}, { deep: true })

const analyzeProblem = async () => {
  if (!rawProblem.value) {
    ElMessage.warning(t('warnInput'))
    return
  }

  const config = JSON.parse(localStorage.getItem('triz_api_config') || '{}')
  if (!config.apiKey) {
    ElMessage.error(t('errNoApi'))
    return
  }

  isAnalyzing.value = true
  
  const langInstruction = currentLang.value === 'en' ? 'Please output the values in English.' : '请用中文输出。'
  const systemPrompt = config.prompt + `\n请针对用户的输入进行结构化拆解，并务必且仅返回一段合法的 JSON 数据。JSON 的键必须完全符合以下结构（${langInstruction}）：
{
  "techSystem": "所在的技术系统",
  "systemFunction": "该技术系统的功能",
  "systemConstraint": "实现该功能的约束",
  "principle": "现有系统工作原理",
  "problem": "当前系统存在的问题",
  "condition": "问题出现的条件和时间",
  "history": "现有方案及其缺点",
  "requirement": "新系统的要求(理想状态)"
}`

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        temperature: config.temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: rawProblem.value }
        ]
      })
    })

    if (!response.ok) throw new Error('API Request Failed')
    
    const data = await response.json()
    if (data.error) {
      throw new Error(data.error.message || 'API Request Failed')
    }
    let resultText = data.choices[0].message.content
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim()
    
    const parsedData = JSON.parse(resultText)
    Object.assign(structData, parsedData)
    
    analysisDone.value = true
    localStorage.setItem('triz_struct_data', JSON.stringify(structData))
    ElMessage.success(t('successParsed'))
  } catch (error) {
    console.error('Analysis Error:', error)
    ElMessage.error(`${t('errParsed')}：${error.message}`)
  } finally {
    isAnalyzing.value = false
  }
}

const goToSolution = () => {
  router.push('/solution')
}
</script>