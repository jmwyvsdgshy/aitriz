<template>
  <div class="p-8 h-full flex flex-col max-w-screen-2xl mx-auto">
    <div class="flex justify-between items-center mb-6 shrink-0">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">{{ t('pageTitle') }}</h2>
        <p class="text-gray-500 mt-2 text-sm">{{ t('pageDesc') }}</p>
      </div>
      <el-button type="primary" @click="generateInspirations" :loading="isGenerating" :disabled="!hasProblemData" size="large" round>
        <el-icon class="mr-2"><MagicStick /></el-icon> {{ t('generateBtn') }}
      </el-button>
    </div>

    <div class="flex-1 flex gap-8 overflow-hidden pb-4">
      <div v-if="!hasProblemData" class="w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400">
        <el-icon :size="100" class="text-orange-300 mb-4"><Warning /></el-icon>
        <p class="text-lg text-gray-600 font-medium">{{ t('needAnalysisTitle') }}</p>
        <p class="text-sm mt-2 text-gray-400 mb-6">{{ t('needAnalysisDesc') }}</p>
        <el-button type="primary" plain round @click="goToProblem">
          <el-icon class="mr-2"><Back /></el-icon> {{ t('goBackBtn') }}
        </el-button>
      </div>

      <div v-else-if="inspirations.length === 0 && !isGenerating" class="w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400">
        <el-icon :size="100" class="text-gray-200 mb-4"><Opportunity /></el-icon>
        <p class="text-lg text-gray-600 font-medium">{{ t('waitTitle') }}</p>
        <p class="text-sm mt-2 text-gray-400">{{ t('waitDesc') }}</p>
      </div>

      <div v-else-if="isGenerating" class="w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
        <el-icon class="is-loading text-blue-500 mb-4" :size="50"><Loading /></el-icon>
        <p class="text-gray-600 font-medium animate-pulse">{{ t('generatingTitle') }}</p>
        <div class="mt-4 text-sm text-gray-400 max-w-md text-center">
          {{ t('generatingDesc') }}
        </div>
      </div>

      <div v-else class="w-full flex gap-6 h-full">
        <!-- 左侧：原理列表 -->
        <div class="w-1/3 flex flex-col gap-4 h-full overflow-y-auto pr-2">
           <h3 class="font-bold text-gray-700 mb-2 pl-1">{{ t('principlesTitle') }}</h3>
           <div v-for="(item, index) in inspirations" :key="index"
               class="bg-white p-5 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md hover:border-blue-300"
               :class="{'border-blue-500 bg-blue-50/50': activeIndex === index, 'border-gray-100': activeIndex !== index}"
               @click="activeIndex = index">
            <div class="flex items-center mb-2">
              <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">{{ index + 1 }}</div>
              <h4 class="font-bold text-gray-800 text-lg">{{ item.principle }}</h4>
            </div>
            <p class="text-sm text-gray-600 line-clamp-2 mt-2">{{ item.abstract_reasoning }}</p>
          </div>
        </div>

        <!-- 右侧：跨界灵感看板 -->
        <div class="w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-hidden" v-if="activeInspiration">
          <div class="mb-6 shrink-0 border-b border-gray-100 pb-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xl font-bold text-gray-800 flex items-center">
                <el-icon class="mr-2 text-orange-500"><MagicStick /></el-icon> 
                {{ activeInspiration.principle }}
              </h3>
            </div>
            <div class="bg-slate-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed border border-slate-200">
              <span class="font-bold text-gray-600 mr-2">{{ t('abstractLogic') }}:</span>
              {{ activeInspiration.abstract_reasoning }}
            </div>
          </div>

          <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <h4 class="font-bold text-gray-700 mb-4 flex items-center">
              <el-icon class="mr-2 text-blue-500"><Monitor /></el-icon> 
              {{ t('crossDomainCases') }}
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="(domain, dIndex) in activeInspiration.domains" :key="dIndex" 
                   class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div class="absolute top-0 left-0 w-1 h-full" :class="getDomainColor(domain.domain_name)"></div>
                
                <div class="flex justify-between items-start mb-3">
                  <el-tag :type="getDomainTagType(domain.domain_name)" effect="light" size="small" class="font-bold">
                    {{ domain.domain_name }}
                  </el-tag>
                </div>
                
                <h5 class="font-bold text-gray-800 mb-2 text-base">{{ domain.case_name }}</h5>
                <p class="text-sm text-gray-600 mb-4 leading-relaxed h-16 overflow-y-auto">{{ domain.case_desc }}</p>
                
                <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-auto">
                  <div class="text-xs font-bold text-blue-800 mb-1 flex items-center">
                    <el-icon class="mr-1"><Connection /></el-icon> {{ t('inspirationLink') }}
                  </div>
                  <p class="text-sm text-blue-900 leading-snug">{{ domain.inspiration_for_user }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { store } from '../store'
import { useI18n } from '../composables/useI18n'

const i18nMsgs = {
  zh: {
    pageTitle: '步骤 4：跨界灵感看板',
    pageDesc: '打破思维定势，看看其他领域（如生物、航天、建筑等）是如何应用相同原理解决类似底层矛盾的。',
    generateBtn: '获取跨界灵感',
    needAnalysisTitle: '未检测到问题定义数据',
    needAnalysisDesc: '请先完成步骤 2 的问题分析，才能为您推荐跨界灵感。',
    goBackBtn: '返回问题分析',
    waitTitle: '准备探索跨领域解决方案',
    waitDesc: '点击右上角按钮，AI 将为您当前的问题匹配来自不同行业的跨界灵感案例。',
    generatingTitle: '正在搜索跨界案例库...',
    generatingDesc: '正在将您的业务痛点抽象为底层物理/技术矛盾，并在生物学、工程学、管理学等领域寻找相似解...',
    principlesTitle: '推荐突破原理',
    abstractLogic: '底层抽象逻辑',
    crossDomainCases: '跨界成功案例',
    inspirationLink: '对您的启发 (降维应用)',
    errNoApi: '请先在【系统配置】页面配置 API Key',
    warnNoData: '缺少问题数据，请返回上一步',
    successGen: '跨界灵感获取成功！'
  },
  en: {
    pageTitle: 'Step 4: Cross-Domain Inspiration Board',
    pageDesc: 'Break mental inertia. See how other domains (biology, aerospace, architecture, etc.) apply the same principles to solve similar underlying contradictions.',
    generateBtn: 'Get Inspirations',
    needAnalysisTitle: 'No Problem Definition Data',
    needAnalysisDesc: 'Please complete Step 2 problem analysis before getting cross-domain inspirations.',
    goBackBtn: 'Back to Problem Analysis',
    waitTitle: 'Ready to Explore Cross-Domain Solutions',
    waitDesc: 'Click the button above to let AI match cross-industry inspiration cases for your current problem.',
    generatingTitle: 'Searching cross-domain case base...',
    generatingDesc: 'Abstracting your pain points into underlying physical/technical contradictions, and looking for similar solutions in biology, engineering, management, etc...',
    principlesTitle: 'Recommended Breakthrough Principles',
    abstractLogic: 'Underlying Abstract Logic',
    crossDomainCases: 'Cross-Domain Success Cases',
    inspirationLink: 'Inspiration for You (Application)',
    errNoApi: 'Please configure API Key in Settings first',
    warnNoData: 'Missing problem data, please go back',
    successGen: 'Cross-domain inspirations generated successfully!'
  }
}

const { t, currentLang } = useI18n(i18nMsgs)
const router = useRouter()

const isGenerating = ref(false)
const inspirations = ref([])
const activeIndex = ref(0)

const activeInspiration = computed(() => {
  if (inspirations.value.length === 0) return null
  return inspirations.value[activeIndex.value]
})

const hasProblemData = computed(() => {
  const data = store.structData
  return !!(data && Object.keys(data).length > 0 && (data.techSystem || data.problem))
})

const goToProblem = () => {
  router.push('/problem')
}

// 辅助函数：根据领域名称返回不同的颜色和标签类型，增加视觉丰富度
const domainColors = [
  { keywords: ['生物', '自然', '医', 'Biology', 'Nature', 'Medical'], color: 'bg-green-500', type: 'success' },
  { keywords: ['IT', '软件', '计算', 'Software', 'Computing'], color: 'bg-blue-500', type: 'primary' },
  { keywords: ['航天', '机械', '工程', 'Aerospace', 'Mechanical', 'Engineering'], color: 'bg-purple-500', type: 'warning' },
  { keywords: ['建筑', '城市', 'Architecture', 'City'], color: 'bg-orange-500', type: 'warning' },
  { keywords: ['管理', '商业', 'Management', 'Business'], color: 'bg-red-500', type: 'danger' }
]

const getDomainInfo = (domainName) => {
  const name = domainName || ''
  for (const info of domainColors) {
    if (info.keywords.some(k => name.includes(k))) {
      return info
    }
  }
  return { color: 'bg-indigo-500', type: 'info' } // 默认颜色
}

const getDomainColor = (domainName) => getDomainInfo(domainName).color
const getDomainTagType = (domainName) => getDomainInfo(domainName).type

const generateInspirations = async () => {
  const config = JSON.parse(localStorage.getItem('triz_api_config') || '{}')
  const parsedData = store.structData

  if (!config.apiKey) {
    ElMessage.error(t('errNoApi'))
    return
  }

  if (!parsedData) {
    ElMessage.warning(t('warnNoData'))
    return
  }

  isGenerating.value = true
  inspirations.value = []
  activeIndex.value = 0

  let problemContext = ''
  try {
    problemContext = `
1. Tech System: ${parsedData.techSystem || ''}
2. Function: ${parsedData.systemFunction || ''}
3. Constraint: ${parsedData.systemConstraint || ''}
4. Principle: ${parsedData.principle || ''}
5. Problem: ${parsedData.problem || ''}
6. Condition: ${parsedData.condition || ''}
7. History: ${parsedData.history || ''}
8. Requirement: ${parsedData.requirement || ''}
`
  } catch(e) {
    console.warn('Failed to parse structDataStr', e)
  }

  const langInstruction = currentLang.value === 'en' ? 'Please generate the final output strictly in English.' : '请用中文输出最终结果。'
  
  const prompt = `你是一个TRIZ跨界创新专家。
用户的业务问题背景如下 / Problem context:
${problemContext}

请你根据上述问题，抽象出其背后的物理或技术矛盾，并推荐 3-4 个最适用的 TRIZ 发明原理。
对于每个推荐的发明原理，请提供 3 个跨领域的经典应用案例（例如：生物界、航天界、建筑界、IT界等不同领域，越跨界越好），并明确指出这个案例能给用户当前问题带来什么具体的启发（降维应用）。

请务必返回完全合法的 JSON 对象（包含一个 "inspirations" 数组），必须严格遵守 JSON 格式。
${langInstruction}
JSON 数据结构如下 / JSON structure:
{
  "inspirations": [
    {
      "principle": "原理名称 (如: 分割原理)",
      "abstract_reasoning": "为什么推荐这个原理？这个原理对应的底层矛盾抽象逻辑是什么？",
      "domains": [
        {
          "domain_name": "领域名称 (如: 生物学)",
          "case_name": "案例名称",
          "case_desc": "该案例在这个领域是如何应用此原理的？",
          "inspiration_for_user": "这个案例的思路如果套用到用户的当前问题上，可以产生什么具体想法？"
        }
      ] // 每个原理需提供 2-4 个不同领域的案例
    }
  ]
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
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: 'You are a JSON generator. Always output valid JSON object without any markdown formatting.' },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature
      })
    })

    if (!response.ok) {
      throw new Error(`API Request Failed: ${response.status}`)
    }

    const resData = await response.json()
    let content = resData.choices[0].message.content.trim()
    
    // Clean up markdown code blocks if AI still wraps the JSON
    if (content.startsWith('```json')) {
      content = content.replace(/^```json/, '').replace(/```$/, '').trim()
    } else if (content.startsWith('```')) {
      content = content.replace(/^```/, '').replace(/```$/, '').trim()
    }

    const result = JSON.parse(content)
    if (result && result.inspirations && Array.isArray(result.inspirations)) {
      inspirations.value = result.inspirations
      ElMessage.success(t('successGen'))
    } else {
      throw new Error('Invalid JSON structure returned from AI')
    }

  } catch (error) {
    console.error('Inspiration generation failed:', error)
    ElMessage.error(t('errGen') + ': ' + error.message)
  } finally {
    isGenerating.value = false
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #94a3b8;
}
</style>
