<template>
  <div class="p-8 h-full flex flex-col max-w-screen-2xl mx-auto">
    <div class="flex justify-between items-center mb-6 shrink-0">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">{{ t('pageTitle') }}</h2>
        <p class="text-gray-500 mt-2 text-sm">{{ t('pageDesc') }}</p>
      </div>
      <div class="flex gap-3">
        <el-button type="success" @click="exportExcel" :disabled="solutions.length === 0" size="large" round>
          <el-icon class="mr-2"><Download /></el-icon> {{ t('exportExcel') }}
        </el-button>
        <el-button type="primary" @click="exportImage" :disabled="solutions.length === 0" size="large" round>
          <el-icon class="mr-2"><Picture /></el-icon> {{ t('exportImage') }}
        </el-button>
      </div>
    </div>

    <div class="flex-1 flex gap-8 overflow-hidden pb-4">
      <!-- 左侧：TRIZ 方法选择器 -->
      <div class="w-[300px] flex flex-col gap-3 h-full overflow-y-auto pr-2 shrink-0">
        <h3 class="font-bold text-gray-700 mb-2 pl-1">{{ t('methodTitle') }}</h3>
        
        <div v-for="method in trizMethods" :key="method.id" 
             class="bg-white p-4 rounded-xl shadow-sm method-card flex items-center justify-between"
             :class="{'is-active': selectedMethods.includes(method.id)}"
             @click="toggleMethod(method.id)">
          <div class="flex items-center">
            <el-icon class="text-blue-500 mr-3 text-lg"><component :is="method.icon" /></el-icon>
            <span class="font-medium text-gray-700">{{ t('method_' + method.id) }}</span>
          </div>
          <el-checkbox :model-value="selectedMethods.includes(method.id)" @click.stop></el-checkbox>
        </div>

        <el-button type="primary" size="large" class="mt-4 !rounded-xl shadow-md" @click="generateSolutions" :loading="isGenerating" :disabled="!hasProblemData">
          <el-icon class="mr-2"><Cpu /></el-icon> {{ t('generateBtn') }}
        </el-button>
      </div>

      <!-- 右侧：方案表格生成区 -->
      <div class="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-hidden">
        
        <div v-if="!hasProblemData" class="h-full flex flex-col items-center justify-center text-gray-400">
          <el-icon :size="100" class="text-orange-300 mb-4"><Warning /></el-icon>
          <p class="text-lg text-gray-600 font-medium">{{ t('needAnalysisTitle') }}</p>
          <p class="text-sm mt-2 text-gray-400 mb-6">{{ t('needAnalysisDesc') }}</p>
          <el-button type="primary" plain round @click="goToProblem">
            <el-icon class="mr-2"><Back /></el-icon> {{ t('goBackBtn') }}
          </el-button>
        </div>

        <div v-else-if="solutions.length === 0 && !isGenerating" class="h-full flex flex-col items-center justify-center text-gray-400">
          <el-icon :size="100" class="text-gray-200 mb-4"><DataBoard /></el-icon>
          <p class="text-lg text-gray-600 font-medium">{{ t('waitTitle') }}</p>
          <p class="text-sm mt-2 text-gray-400">{{ t('waitDesc') }}</p>
        </div>

        <div v-else-if="isGenerating" class="h-full flex flex-col items-center justify-center">
          <el-icon class="is-loading text-blue-500 mb-4" :size="50"><Loading /></el-icon>
          <p class="text-gray-600 font-medium animate-pulse">{{ t('generatingTitle') }}</p>
          <div class="mt-4 text-sm text-gray-400 max-w-md text-center">
            {{ t('generatingDesc1') }} <span class="text-blue-500">{{selectedMethods.length}}</span> {{ t('generatingDesc2') }}
          </div>
        </div>

        <div v-else class="h-full flex flex-col">
          <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center shrink-0">
            <el-icon class="mr-2 text-green-500"><DataLine /></el-icon> {{ t('tableTitle') }}
          </h3>
          
          <div id="export-target" class="flex-1 overflow-auto border border-gray-200 rounded-xl bg-white relative">
            <el-table :data="solutions" stripe style="width: 100%" height="100%" :header-cell-style="{background:'#f8fafc', color:'#334155'}">
              <el-table-column prop="id" :label="t('col_id')" width="70" align="center"></el-table-column>
              <el-table-column prop="trizPrinciple" :label="t('col_principle')" width="200">
                <template #default="scope">
                  <el-tag :type="scope.row.tagType || 'primary'" effect="light" class="whitespace-normal h-auto leading-relaxed py-1">
                    {{ scope.row.trizPrinciple }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="solutionDesc" :label="t('col_desc')" min-width="350">
                <template #default="scope">
                  <div class="text-sm leading-relaxed text-gray-700 py-2">{{ scope.row.solutionDesc }}</div>
                </template>
              </el-table-column>
              <el-table-column prop="pros_cons" :label="t('col_pros_cons')" width="260">
                <template #default="scope">
                  <div class="grid grid-cols-[40px_1fr] gap-x-2 gap-y-1 text-sm text-gray-600 items-start">
                    <div class="text-xs font-bold text-gray-500 pt-0.5 whitespace-nowrap">{{ t('pros') }}:</div>
                    <div class="text-green-600 leading-snug">{{ scope.row.pros }}</div>
                    <div class="text-xs font-bold text-gray-500 pt-0.5 whitespace-nowrap">{{ t('cons') }}:</div>
                    <div class="text-orange-600 leading-snug">{{ scope.row.cons }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="evaluation" :label="t('col_eval')" width="180">
                <template #default="scope">
                  <div class="text-sm leading-relaxed text-gray-700 py-2">{{ scope.row.evaluation }}</div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import { useI18n } from '../composables/useI18n'
import { store } from '../store'

const i18nMsgs = {
  zh: {
    pageTitle: '步骤 3：TRIZ 方法选择与方案生成',
    pageDesc: '基于上一步结构化的问题，选择适合的 TRIZ 工具视角，让 AI 为您推导最终解决方案表。',
    exportExcel: '导出 Excel',
    exportImage: '导出图片',
    methodTitle: '选择切入视角 (多选)',
    method_conflict: '技术矛盾与物理矛盾',
    method_field: '场与场分析 (物场模型)',
    method_trimming: '功能分析和裁剪',
    method_evolution: '技术系统进化法则',
    method_principles: '40个发明原理',
    method_ariz: 'ARIZ 算法',
    method_matrix: '阿奇舒勒矩阵 (矛盾矩阵)',
    method_ifr: '最终理想解 (IFR)',
    generateBtn: '开始推导方案',
    waitTitle: '勾选左侧的 TRIZ 方法并点击生成',
    waitDesc: 'AI 将结合您上一步定义的问题，综合运用所选理论生成解决方案与评估表',
    generatingTitle: 'TRIZ 专家正在推导概念中，这可能需要几十秒...',
    generatingDesc1: '正在使用',
    generatingDesc2: '种 TRIZ 工具交叉验证解空间...',
    tableTitle: '最终问题解方案表',
    col_id: '序号',
    col_principle: '所用创新原理 (切入点)',
    col_desc: '具体方案描述',
    col_pros_cons: '优缺点',
    col_eval: '可用性评估',
    pros: '优点',
    cons: '缺点',
    warnMethod: '请至少选择一种 TRIZ 方法进行推导',
    errNoApi: '请先在【系统配置】页面配置 API Key',
    warnNoData: '未检测到问题定义数据，请先返回上一步进行问题分析',
    successGen: '方案生成完毕！',
    errGen: '生成失败',
    exportExcelSuccess: 'Excel 报表导出成功！',
    exportExcelFail: '导出失败：',
    generatingImg: '正在生成高清图片，请稍候...',
    exportImgSuccess: '图片导出成功！',
    exportImgFail: '导出图片失败：',
    needAnalysisTitle: '未检测到问题定义数据',
    needAnalysisDesc: '请先在步骤 2 中输入您的业务痛点，并让 AI 完成结构化分析。',
    goBackBtn: '返回问题分析页面'
  },
  en: {
    pageTitle: 'Step 3: TRIZ Method Selection & Solution',
    pageDesc: 'Based on the structured problem, select TRIZ tools and let AI derive the final solutions.',
    exportExcel: 'Export Excel',
    exportImage: 'Export Image',
    methodTitle: 'Select Perspectives',
    method_conflict: 'Tech & Physical Contradictions',
    method_field: 'Su-Field Analysis',
    method_trimming: 'Function Analysis & Trimming',
    method_evolution: 'Laws of Tech Evolution',
    method_principles: '40 Inventive Principles',
    method_ariz: 'ARIZ Algorithm',
    method_matrix: 'Altshuller Matrix',
    method_ifr: 'Ideal Final Result (IFR)',
    generateBtn: 'Generate Solutions',
    waitTitle: 'Select TRIZ methods on the left and click Generate',
    waitDesc: 'AI will combine your problem definition with selected theories to generate solutions.',
    generatingTitle: 'TRIZ Expert is deriving concepts, this may take a while...',
    generatingDesc1: 'Using',
    generatingDesc2: 'TRIZ tools to cross-validate the solution space...',
    tableTitle: 'Final Solution Matrix',
    col_id: 'No.',
    col_principle: 'Inventive Principle',
    col_desc: 'Detailed Solution Description',
    col_pros_cons: 'Pros & Cons',
    col_eval: 'Feasibility Evaluation',
    pros: 'Pros',
    cons: 'Cons',
    warnMethod: 'Please select at least one TRIZ method',
    errNoApi: 'Please configure the API Key in the Settings page first',
    warnNoData: 'No problem definition detected, please go back to step 2',
    successGen: 'Solutions generated successfully!',
    errGen: 'Generation failed',
    exportExcelSuccess: 'Excel exported successfully!',
    exportExcelFail: 'Export failed: ',
    generatingImg: 'Generating high-res image, please wait...',
    exportImgSuccess: 'Image exported successfully!',
    exportImgFail: 'Image export failed: ',
    needAnalysisTitle: 'No Problem Definition Data Detected',
    needAnalysisDesc: 'Please enter your pain points in Step 2 and let AI complete the structured analysis first.',
    goBackBtn: 'Go Back to Problem Analysis'
  }
}

const { t, currentLang } = useI18n(i18nMsgs)
const router = useRouter()

const trizMethods = [
  { id: 'conflict', icon: 'Switch' },
  { id: 'field', icon: 'Magnet' },
  { id: 'trimming', icon: 'Scissor' },
  { id: 'evolution', icon: 'TrendCharts' },
  { id: 'principles', icon: 'Opportunity' },
  { id: 'ariz', icon: 'Cpu' },
  { id: 'matrix', icon: 'Grid' },
  { id: 'ifr', icon: 'Aim' }
]

const selectedMethods = ref(['principles', 'matrix'])
const isGenerating = ref(false)
const solutions = ref([])
const hasProblemData = computed(() => {
  const data = store.structData
  return !!(data && Object.keys(data).length > 0 && (data.techSystem || data.problem))
})

const toggleMethod = (id) => {
  const index = selectedMethods.value.indexOf(id)
  if (index > -1) {
    selectedMethods.value.splice(index, 1)
  } else {
    selectedMethods.value.push(id)
  }
}

const goToProblem = () => {
  router.push('/problem')
}

const generateSolutions = async () => {
  if (selectedMethods.value.length === 0) {
    ElMessage.warning(t('warnMethod'))
    return
  }

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
  solutions.value = []
  
  const methodNames = trizMethods.filter(m => selectedMethods.value.includes(m.id)).map(m => t('method_' + m.id)).join('、')
  
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
  const systemPrompt = config.prompt + `\n
用户定义的问题背景如下 / Problem context:
${problemContext}

请你运用以下 TRIZ 方法：【${methodNames}】进行发散与推导。
请务必返回完全合法的 JSON 对象（包含一个 "solutions" 数组，数组中每个对象代表一个解决方案），必须严格遵守 JSON 格式。
${langInstruction}
解决方案对象必须包含以下键 / The JSON object must contain the following keys:
- "id": 数字序号 / number
- "trizPrinciple": 使用的创新原理(切入点) / Inventive principle used
- "tagType": 标签颜色(从 'primary', 'success', 'warning', 'danger' 中选一) / tag color
- "solutionDesc": 具体方案描述 / Solution description
- "pros": 优点 / Pros
- "cons": 缺点 / Cons
- "evaluation": 可用性评估（综合评价） / Overall evaluation`

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
          { role: 'user', content: '请生成解决方案表格数据。/ Please generate the solution table data.' }
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
    
    const parsedResult = JSON.parse(resultText)
    solutions.value = parsedResult.solutions || parsedResult

    ElMessage.success(t('successGen'))
  } catch (error) {
    console.error('Generation Error:', error)
    ElMessage.error(`${t('errGen')}：${error.message}`)
  } finally {
    isGenerating.value = false
  }
}

const exportExcel = () => {
  try {
    const exportData = solutions.value.map(s => ({
      [t('col_id')]: s.id,
      [t('col_principle')]: s.trizPrinciple,
      [t('col_desc')]: s.solutionDesc,
      [t('pros')]: s.pros,
      [t('cons')]: s.cons,
      [t('col_eval')]: s.evaluation
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "TRIZ")
    XLSX.writeFile(wb, "TRIZ_Solutions.xlsx")
    ElMessage.success(t('exportExcelSuccess'))
  } catch (error) {
    ElMessage.error(t('exportExcelFail') + error.message)
  }
}

const exportImage = () => {
  const target = document.getElementById('export-target')
  if (!target) return
  
  const loading = ElLoading.service({
    lock: true,
    text: t('generatingImg'),
    background: 'rgba(255, 255, 255, 0.7)',
  })

  // 克隆节点进行截图，避免破坏当前页面布局
  const cloneTarget = target.cloneNode(true)
  cloneTarget.id = 'export-target-clone'
  cloneTarget.classList.add('is-exporting')
  document.body.appendChild(cloneTarget)

  setTimeout(() => {
    html2canvas(cloneTarget, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 1200, // 强制设置画布宽度
      windowWidth: 1200 // 强制设置视窗宽度
    }).then(canvas => {
      const link = document.createElement('a')
      link.download = 'TRIZ_Solutions_' + new Date().getTime() + '.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      ElMessage.success(t('exportImgSuccess'))
    }).catch(err => {
      ElMessage.error(t('exportImgFail') + err.message)
    }).finally(() => {
      // 截图完成后移除克隆节点
      document.body.removeChild(cloneTarget)
      loading.close()
    })
  }, 800) // 稍微增加一点延迟让克隆节点的样式渲染完全
}
</script>