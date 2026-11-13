"use strict";

const STORAGE_KEY = "yzhStudyV7State";
const SESSION_STORAGE_KEY = "yzhStudyV7AnonymousSession";
const SYNC_QUEUE_KEY = "yzhStudyV7PendingSync";
const STUDY_VERSION = 7;
const SYNC_ENDPOINT = "/api/study/sync";
const SESSION_ENDPOINT = "/api/study/session";

const STEPS = [
  "intro",
  "profile",
  "needs",
  "infoRank",
  "infoReveal",
  "contentIntro",
  "contentTrial",
  "structureIntro",
  "structureTrial",
  "interview",
  "scenario",
  "complete"
];

const STEP_LABELS = {
  intro: "研究说明",
  profile: "参与者信息",
  needs: "Task 1 · 用户需求",
  infoRank: "Task 2 · 信息排序",
  infoReveal: "Task 2 · 逐层揭露",
  contentIntro: "Task 2 · 单集内信息",
  contentTrial: "Task 2 · 单集内信息",
  structureIntro: "Task 3 · 呈现形式",
  structureTrial: "Task 3 · 结构对比",
  interview: "Task 4 · 结构访谈",
  scenario: "Task 4 · 真实场景",
  complete: "完成"
};

const INFORMATION_FIELDS = [
  ["标题", "单集名称和核心表达"],
  ["主持人", "主持人姓名"],
  ["时长", "单集总时长"],
  ["主题标签", "内容涉及的主题关键词"],
  ["简介", "对单集内容的简要概括"],
  ["评论概览", "听众评论中的主要观点"],
  ["播放量", "单集的累计播放数据"],
  ["相似播客", "与本期主题或内容相近的节目"],
  ["转写文本", "音频对应的逐字文字内容"],
  ["内容主题划分（时间轴）", "主题及其出现的时间位置"],
  ["时间戳评论", "与具体音频位置关联的评论"],
  ["情感分析", "不同片段的情绪方向与强度"],
  ["音频分析特征", "语速、停顿、说话人切换等特征"]
];

const THEME_META = {
  growth: { label: "个人成长", color: "#c8727d" },
  career: { label: "职业发展", color: "#75a966" },
  art: { label: "文学艺术", color: "#825d82" },
  relations: { label: "关系家庭", color: "#d99056" },
  identity: { label: "身份性别", color: "#2f706c" },
  society: { label: "社会经验", color: "#667f99" }
};

const EPISODES = [
  {
    id: "S4E5", guest: "范贝贝", title: "在迪士尼和HBO做高管，我卖过的电影比看过的多",
    theme: "career", duration: "1:16:30", plays: 212661,
    topics: ["职业发展", "影视行业", "女性管理者"],
    summary: "从国际影视发行与管理经历出发，讨论职业选择、团队协作与人生转折。",
    comments: "听众主要讨论跨文化职业经历、管理方式和女性领导者处境。",
    similar: "S8E4 黎紫书、S9E2 张诺",
    transcript: "……职业并不是一条预先画好的直线，很多关键选择发生在看不清结果的时候。",
    timeline: "00:00 职业起点｜18:20 海外影视行业｜42:10 管理与选择｜63:00 人生转折",
    timestampComments: "42:18 ‘这一段关于管理者责任的讨论很真实。’",
    sentiment: "整体积极；谈到职业低谷时情绪强度明显上升。",
    audioFeatures: "中等语速；双人对谈；平均停顿 0.8 秒；观点段落较集中。"
  },
  {
    id: "S8E4", guest: "黎紫书", title: "飞向更高远的天空，即便空气稀薄",
    theme: "art", duration: "1:42:20", plays: 1876041,
    topics: ["文学创作", "职业转折", "文化认同"],
    summary: "从新闻工作转向文学创作，谈写作道路、职业转型与文化认同。",
    comments: "听众对从稳定工作转向创作的选择，以及长期写作经验讨论较多。",
    similar: "S7E8 翟永明、S8E5 朱天文",
    transcript: "……写作并不是逃离工作，而是终于找到一种能够长期坚持的工作方式。",
    timeline: "00:00 新闻工作｜21:40 开始写作｜49:10 文化身份｜78:20 职业转折",
    timestampComments: "49:32 ‘文化身份与写作语言的关系讲得很清楚。’",
    sentiment: "前段平静，中段谈职业转折时紧张感上升，结尾趋向积极。",
    audioFeatures: "偏慢语速；长句较多；平均停顿 1.2 秒；主持人追问密度较低。"
  },
  {
    id: "S8E8", guest: "张虹", title: "冰场上的向日葵，日复一日、向光疯长",
    theme: "career", duration: "1:29:03", plays: 1616269,
    topics: ["竞技体育", "退役转型", "终身学习"],
    summary: "回顾奥运经历、竞技压力和退役后的职业转型与持续学习。",
    comments: "听众集中讨论运动员退役后的身份转变和重新学习。",
    similar: "S9E2 张诺、S4E5 范贝贝",
    transcript: "……退役并不是运动生涯的句号，而是第一次需要自己重新定义目标。",
    timeline: "00:00 训练经历｜24:30 奥运赛场｜52:10 退役转型｜70:40 持续学习",
    timestampComments: "52:45 ‘重新学习的过程比比赛本身更打动我。’",
    sentiment: "竞技回忆段落情绪强烈，退役转型部分由低落逐步转向积极。",
    audioFeatures: "较快语速；叙事段落能量高；说话人切换频繁；笑声较多。"
  },
  {
    id: "S9E2", guest: "张诺", title: "我不优秀，但我依然是一个胜利者",
    theme: "career", duration: "1:19:09", plays: 665259,
    topics: ["赛车运动", "职业转型", "心理挑战"],
    summary: "从赛车梦想、严重事故与女性车手身份谈到退役后的职业变化。",
    comments: "听众对失败、胜利的重新定义和退役决定反馈集中。",
    similar: "S8E8 张虹、S7E9 小帕",
    transcript: "……胜利不只是站在领奖台上，也包括知道什么时候应该换一条路。",
    timeline: "00:00 赛车起点｜17:20 事故经历｜39:40 女性车手｜61:10 退役决定",
    timestampComments: "61:26 ‘承认要换一条路也需要很大的勇气。’",
    sentiment: "事故段落偏负向，退役决定后情绪明显回升。",
    audioFeatures: "中快语速；情绪波动大；事故段落停顿变长；结尾语调上扬。"
  },
  {
    id: "S7E7", guest: "劳东燕", title: "敢于面向黑暗，恰因此心光明",
    theme: "society", duration: "1:15:36", plays: 1775993,
    topics: ["法律正义", "公共讨论", "女性成长"],
    summary: "讨论法律、刑罚、公众认知与女性在职业和公共表达中的成长。",
    comments: "关于正义感、独立判断和公共表达的讨论较多。",
    similar: "S8E7 李银河、S8E3 扎十一惹",
    transcript: "……面对复杂问题时，重要的不是快速站队，而是保留判断的能力。",
    timeline: "00:00 法律学习｜20:10 公共讨论｜44:30 女性成长｜62:00 独立判断",
    timestampComments: "44:55 ‘职业身份与女性经验没有被割裂开。’",
    sentiment: "整体理性克制；公共讨论段落的情绪强度略高。",
    audioFeatures: "稳定语速；信息密度高；长停顿少；主持人澄清性提问较多。"
  },
  {
    id: "S8E6", guest: "鸟鸟", title: "没有魅力的人，也值得拥有世界",
    theme: "identity", duration: "1:26:45", plays: 3604567,
    topics: ["脱口秀", "女性表达", "年龄焦虑"],
    summary: "从语言幽默、创作日常谈女性成长、自我接纳和年龄经验。",
    comments: "听众较多讨论自我接纳、表达压力与年龄焦虑。",
    similar: "S7E9 小帕、S5E8 张春",
    transcript: "……不需要先变成一个有魅力的人，才有资格占据自己的生活。",
    timeline: "00:00 脱口秀创作｜22:30 自我表达｜48:20 年龄焦虑｜69:00 自我接纳",
    timestampComments: "69:18 ‘这句话让我重新理解了所谓的自信。’",
    sentiment: "幽默段落积极度高；年龄焦虑部分短暂下降，结尾恢复。",
    audioFeatures: "语速变化明显；笑声频繁；短停顿多；对话节奏活跃。"
  },
  {
    id: "S8E7", guest: "李银河", title: "从「三反」到「银河」，她走出了时代",
    theme: "identity", duration: "1:24:38", plays: 2414677,
    topics: ["社会学", "亲密关系", "女性成长"],
    summary: "从个人经历、社会学研究和亲密关系讨论时代中的女性经验。",
    comments: "听众对代际变化、亲密关系与女性主体讨论较多。",
    similar: "S7E7 劳东燕、S8E1 蒋胜男",
    transcript: "……个人经验并不是社会结构之外的故事，它常常正好说明结构如何运作。",
    timeline: "00:00 成长经历｜19:00 社会学｜45:20 亲密关系｜68:40 女性主体",
    timestampComments: "45:33 ‘把亲密关系放回社会结构里理解很有启发。’",
    sentiment: "平稳叙述为主，回忆个人经历时情绪更柔和。",
    audioFeatures: "偏慢语速；主持人发言占比 31%；停顿稳定；叙事段落较长。"
  },
  {
    id: "S9E3", guest: "蔡皋", title: "我本布衣，种花种草种春天",
    theme: "art", duration: "1:19:30", plays: 698756,
    topics: ["艺术创作", "乡村生活", "人生阶段"],
    summary: "从乡村女教师到艺术创作者，谈自然、绘画和生命经验。",
    comments: "自然观察、生活态度和创作方式最受听众关注。",
    similar: "S8E5 朱天文、S7E8 翟永明",
    transcript: "……不是先有一个宏大的主题再去画，而是生活里的草木先来敲门。",
    timeline: "00:00 乡村教学｜21:10 自然观察｜43:30 绘画创作｜64:20 人生阶段",
    timestampComments: "43:52 ‘生活和创作在这里没有边界。’",
    sentiment: "整体温和积极；谈自然和儿童时积极度最高。",
    audioFeatures: "慢语速；平均停顿 1.5 秒；环境叙事多；声音能量平稳。"
  }
];

const STRUCTURE_EPISODES = [
  ...EPISODES,
  { id: "S5E8", guest: "张春", title: "要活得很久，我做了这个决定", theme: "growth", plays: 6135436 },
  { id: "S7E9", guest: "小帕", title: "要走多少路，才能成为一个女人", theme: "growth", plays: 3853845 },
  { id: "S8E1", guest: "蒋胜男", title: "她可以为你而死，但不会只为你而活", theme: "relations", plays: 1653065 },
  { id: "S8E2", guest: "陈慧", title: "人如南瓜，可攀援亦可贴地生长", theme: "relations", plays: 1527405 },
  { id: "S8E3", guest: "扎十一惹", title: "从此我们不忧伤、不害怕", theme: "society", plays: 2775085 },
  { id: "S8E5", guest: "朱天文", title: "他已登岸归家，吾独续写「巫」言", theme: "art", plays: 1203209 },
  { id: "S9E1", guest: "张赞英", title: "那朵叫「赞英」的花", theme: "relations", plays: 756344 }
];

const CONTENT_TRIALS = [
  {
    feature: "转写文本",
    prompt: "阅读与音频同步的文字内容，判断它对理解速度和理解深度的帮助。",
    content: () => `
      <div class="transcript-line"><time>00:18</time><span><b>鲁豫：</b>你是什么时候意识到，职业并不一定是一条直线的？</span></div>
      <div class="transcript-line"><time>00:27</time><span><b>嘉宾：</b>是在第一次主动离开稳定岗位之后。结果并不确定，但我开始知道自己在寻找什么。</span></div>
      <div class="transcript-line"><time>00:44</time><span><b>鲁豫：</b>所以真正困难的不是离开，而是在没有答案时继续判断。</span></div>`
  },
  {
    feature: "内容主题划分（时间轴）",
    prompt: "借助主题时间轴快速了解片段的内容结构。",
    content: () => `
      <div class="topic-timeline">
        <div class="topic-segment" style="flex:1;background:#667f99">职业起点<br>00:00</div>
        <div class="topic-segment" style="flex:1.25;background:#d99056">关键选择<br>00:42</div>
        <div class="topic-segment" style="flex:.9;background:#825d82">低谷经验<br>01:37</div>
        <div class="topic-segment" style="flex:1.1;background:#2f706c">重新定义<br>02:18</div>
      </div>
      <p class="helper">颜色代表主题类别，宽度代表该主题在片段中所占时长。</p>`
  },
  {
    feature: "时间戳评论",
    prompt: "查看听众针对具体音频位置留下的评论。",
    content: () => `
      <div class="comment-pin"><time>00:36</time><br>“这里说的‘没有答案时继续判断’很像我换工作时的状态。”</div>
      <div class="comment-pin"><time>01:52</time><br>“希望能多聊一点职业低谷之后怎样恢复信心。”</div>
      <div class="comment-pin"><time>02:24</time><br>“重新定义成功的这一段很有帮助。”</div>`
  },
  {
    feature: "情感分析",
    prompt: "观察片段中情绪方向与强度的变化。",
    content: () => `
      <div class="sentiment-chart" aria-label="情感强度随时间变化">
        ${[42,58,76,49,34,62,88,73].map((height,index) => `<div class="sentiment-bar" style="height:${height}%"><span>${index * 24}s</span></div>`).join("")}
      </div>
      <p class="helper" style="margin-top:38px">柱形越高表示积极情绪强度越高；低谷段落集中在片段中部。</p>`
  },
  {
    feature: "音频分析特征",
    prompt: "查看语速、停顿、说话人占比等音频特征。",
    content: () => `
      <div class="feature-metrics">
        <div class="metric"><span>平均语速</span><b>238</b><small>字／分钟</small></div>
        <div class="metric"><span>平均停顿</span><b>0.9</b><small>秒</small></div>
        <div class="metric"><span>主持人占比</span><b>36%</b><small>发言时长</small></div>
        <div class="metric"><span>说话人切换</span><b>14</b><small>次／3分钟</small></div>
      </div>`
  }
];

const STRUCTURE_TYPES = {
  list: { label: "列表", description: "按顺序浏览单集信息" },
  network: { label: "网状", description: "通过关联线观察内容相似性" },
  tree: { label: "树状", description: "从栏目到主题再到单集" },
  cluster: { label: "分类", description: "在主题区域中浏览单集" }
};

const STRUCTURE_COMPARISONS = [
  { id: "T3-01", a: { type: "list", count: 5 }, b: { type: "network", count: 10 } },
  { id: "T3-02", a: { type: "network", count: 10 }, b: { type: "tree", count: 15 } },
  { id: "T3-03", a: { type: "tree", count: 15 }, b: { type: "cluster", count: 5 } },
  { id: "T3-04", a: { type: "cluster", count: 5 }, b: { type: "list", count: 10 } },
  { id: "T3-05", a: { type: "list", count: 10 }, b: { type: "network", count: 15 } },
  { id: "T3-06", a: { type: "network", count: 15 }, b: { type: "tree", count: 5 } },
  { id: "T3-07", a: { type: "tree", count: 5 }, b: { type: "cluster", count: 10 } },
  { id: "T3-08", a: { type: "cluster", count: 10 }, b: { type: "list", count: 15 } },
  { id: "T3-09", a: { type: "list", count: 15 }, b: { type: "network", count: 5 } },
  { id: "T3-10", a: { type: "network", count: 5 }, b: { type: "tree", count: 10 } },
  { id: "T3-11", a: { type: "tree", count: 10 }, b: { type: "cluster", count: 15 } },
  { id: "T3-12", a: { type: "cluster", count: 15 }, b: { type: "list", count: 5 } }
];

const app = document.querySelector("#app");
const toastElement = document.querySelector("#toast");
const accessDialog = document.querySelector("#accessDialog");
let countdownTimer = null;
let configAttempted = false;
let syncTimer = null;
let syncInFlight = false;
let syncQueued = false;
let serverSyncUnavailable = false;
let researcherSessionToken = "";
let sessionRegistered = false;
let sessionRegistrationPromise = null;
let syncRetryDelay = 1200;

function compactNumber(value) {
  const number = Number(value) || 0;
  return number >= 10000 ? `${(number / 10000).toFixed(1)}万` : String(number);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function randomHex(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function participantId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `P-${date}-${randomHex(12).toUpperCase()}`;
}

function createSessionCredential() {
  const token = randomHex(32);
  return {
    participantId: participantId(),
    token,
    layoutArm: parseInt(token.slice(0, 2), 16) % 2
  };
}

function loadSessionCredential() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
    if (participantIdIsValid(saved?.participantId) && /^[a-f0-9]{64}$/.test(saved?.token) && [0, 1].includes(saved?.layoutArm)) return saved;
  } catch {}
  const credential = createSessionCredential();
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(credential));
  return credential;
}

function participantIdIsValid(value) {
  return /^P-\d{8}-[A-F0-9]{24}$/.test(String(value || ""));
}

function seededRandom(seedText) {
  let seed = Array.from(seedText).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function balancedComparisons(id, layoutArm) {
  const comparisons = STRUCTURE_COMPARISONS.map((comparison, sourceIndex) => {
    const sideSwapped = (layoutArm + sourceIndex) % 2 === 1;
    const canonicalA = { ...comparison.a };
    const canonicalB = { ...comparison.b };
    return {
    id: comparison.id,
      sourceIndex,
      canonicalA,
      canonicalB,
      sideSwapped,
      a: { ...(sideSwapped ? canonicalB : canonicalA) },
      b: { ...(sideSwapped ? canonicalA : canonicalB) }
    };
  });
  const random = seededRandom(id);
  for (let index = comparisons.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [comparisons[index], comparisons[target]] = [comparisons[target], comparisons[index]];
  }
  return comparisons;
}

function newState() {
  const id = sessionCredential.participantId;
  return {
    version: STUDY_VERSION,
    participantId: id,
    step: "intro",
    pageEnteredAt: Date.now(),
    createdAt: new Date().toISOString(),
    answers: {},
    events: [],
    infoRanking: INFORMATION_FIELDS.map(item => item[0]),
    selectedFields: [],
    selectedEpisode: "",
    contentIndex: 0,
    contentStarts: {},
    featureOpen: {},
    structureIndex: 0,
    layoutArm: sessionCredential.layoutArm,
    structureComparisons: balancedComparisons(id, sessionCredential.layoutArm),
    nextEventSequence: 1,
    syncRevision: 0,
    lastSyncedEventSequence: 0,
    syncConflict: false,
    lastSyncedAt: "",
    updatedAt: new Date().toISOString(),
    completedAt: ""
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved?.version === STUDY_VERSION && saved.participantId === sessionCredential.participantId ? saved : newState();
  } catch {
    return newState();
  }
}

let sessionCredential = loadSessionCredential();
let state = loadState();
let pendingSync = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "null");
    return saved?.participantId === state.participantId ? saved : null;
  } catch { return null; }
})();

function save({ sync = true, touch = true } = {}) {
  if (touch) state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (sync) scheduleServerSync();
}

function log(type, target = "", payload = {}) {
  const sequence = state.nextEventSequence || (state.events.length + 1);
  state.events.push({
    id: `${state.participantId}-${sequence}`,
    sequence,
    type,
    target,
    payload,
    step: state.step,
    timestamp: new Date().toISOString(),
    epochMs: Date.now()
  });
  if (state.events.length > 5000 && (state.lastSyncedEventSequence || 0) > 0) {
    state.events = state.events.filter(event => event.sequence > state.lastSyncedEventSequence - 200);
  }
  state.nextEventSequence = sequence + 1;
  save();
}

function canUseServerAPI() {
  return !serverSyncUnavailable && ["http:", "https:"].includes(window.location?.protocol || "");
}

function answerRecords() {
  const [header, ...rows] = answerRows();
  return rows.map(row => Object.fromEntries(header.map((key, index) => [key, row[index]])));
}

function syncPayload(requestId = randomHex(16)) {
  const unsyncedEvents = state.events
    .filter(event => event.sequence > (state.lastSyncedEventSequence || 0))
    .slice(0, 500);
  const stateSnapshot = { ...state, events: state.events.slice(-100) };
  return {
    requestId,
    baseRevision: state.syncRevision || 0,
    participantId: state.participantId,
    studyVersion: STUDY_VERSION,
    currentStep: state.step,
    createdAt: state.createdAt,
    completedAt: state.completedAt || null,
    state: stateSnapshot,
    answers: answerRecords(),
    events: unsyncedEvents
  };
}

function loadOrCreatePendingSync() {
  if (pendingSync) return pendingSync;
  const requestId = randomHex(16);
  const payload = syncPayload(requestId);
  pendingSync = {
    participantId: state.participantId,
    requestId,
    maxEventSequence: payload.events.reduce((maximum, event) => Math.max(maximum, event.sequence || 0), state.lastSyncedEventSequence || 0),
    body: JSON.stringify(payload)
  };
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(pendingSync));
  return pendingSync;
}

function clearPendingSync() {
  pendingSync = null;
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

async function ensureParticipantSession() {
  if (sessionRegistered) return true;
  if (sessionRegistrationPromise) return sessionRegistrationPromise;
  sessionRegistrationPromise = (async () => {
    try {
      const response = await fetch(SESSION_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": `Participant ${sessionCredential.token}`
        },
        body: JSON.stringify({
          participantId: state.participantId,
          studyVersion: STUDY_VERSION,
          layoutArm: state.layoutArm
        })
      });
      if (response.status === 404 || response.status === 405) serverSyncUnavailable = true;
      if (!response.ok) return false;
      const result = await response.json();
      sessionRegistered = result.participantId === state.participantId && result.layoutArm === state.layoutArm;
      return sessionRegistered;
    } catch {
      return false;
    } finally {
      sessionRegistrationPromise = null;
    }
  })();
  return sessionRegistrationPromise;
}

function scheduleServerSync(delay = 900) {
  if (!canUseServerAPI() || state.syncConflict) return;
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    syncServerState();
  }, delay);
}

async function syncServerState() {
  if (!canUseServerAPI()) return false;
  if (syncInFlight) {
    syncQueued = true;
    return false;
  }
  syncInFlight = true;
  try {
    if (!await ensureParticipantSession()) {
      if (!serverSyncUnavailable) scheduleServerSync(syncRetryDelay);
      syncRetryDelay = Math.min(syncRetryDelay * 2, 30000);
      return false;
    }
    const queued = loadOrCreatePendingSync();
    const response = await fetch(SYNC_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Participant ${sessionCredential.token}`
      },
      body: queued.body,
      keepalive: true
    });
    if (response.status === 404 || response.status === 405) serverSyncUnavailable = true;
    if (response.status === 409) {
      const conflict = await response.json().catch(() => ({}));
      state.syncConflict = true;
      state.serverRevision = conflict.revision;
      clearPendingSync();
      save({ sync: false, touch: false });
      toast("检测到另一页面已更新本参与者记录；当前本地数据已保留，但已停止自动覆盖服务器数据。");
      return false;
    }
    if (!response.ok) {
      if (!serverSyncUnavailable) scheduleServerSync(syncRetryDelay);
      syncRetryDelay = Math.min(syncRetryDelay * 2, 30000);
      return false;
    }
    const result = await response.json();
    state.syncRevision = result.revision;
    state.lastSyncedEventSequence = Math.max(state.lastSyncedEventSequence || 0, queued.maxEventSequence || 0);
    state.lastSyncedAt = result.syncedAt || new Date().toISOString();
    state.syncConflict = false;
    clearPendingSync();
    syncRetryDelay = 1200;
    save({ sync: false, touch: false });
    if (state.events.some(event => event.sequence > state.lastSyncedEventSequence)) syncQueued = true;
    return true;
  } catch {
    scheduleServerSync(syncRetryDelay);
    syncRetryDelay = Math.min(syncRetryDelay * 2, 30000);
    return false;
  } finally {
    syncInFlight = false;
    if (syncQueued) {
      syncQueued = false;
      scheduleServerSync(250);
    }
  }
}

function toast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("show");
  window.setTimeout(() => toastElement.classList.remove("show"), 2200);
}

function pageDuration() {
  return Math.max(0, Date.now() - (state.pageEnteredAt || Date.now()));
}

function stopCountdown() {
  if (countdownTimer) window.clearInterval(countdownTimer);
  countdownTimer = null;
}

function goTo(step) {
  stopCountdown();
  const from = state.step;
  state.step = step;
  if (step === "complete" && !state.completedAt) state.completedAt = new Date().toISOString();
  state.pageEnteredAt = Date.now();
  save();
  log("navigation", `${from}->${step}`);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goBack() {
  if (state.step === "intro") return;
  if (state.step === "contentTrial" && state.contentIndex > 0) {
    state.contentIndex -= 1;
    state.pageEnteredAt = Date.now();
    save();
    render();
    return;
  }
  if (state.step === "structureTrial" && state.structureIndex > 0) {
    state.structureIndex -= 1;
    state.pageEnteredAt = Date.now();
    save();
    render();
    return;
  }
  const previous = {
    profile: "intro",
    needs: "profile",
    infoRank: "needs",
    infoReveal: "infoRank",
    contentIntro: "infoReveal",
    contentTrial: "contentIntro",
    structureIntro: "contentTrial",
    structureTrial: "structureIntro",
    interview: "structureTrial",
    scenario: "interview",
    complete: "scenario"
  }[state.step] || "intro";
  if (state.step === "structureIntro") state.contentIndex = CONTENT_TRIALS.length - 1;
  if (state.step === "interview") state.structureIndex = state.structureComparisons.length - 1;
  goTo(previous);
}

function resetStudy() {
  if (!window.confirm("重新开始会清除当前参与者的所有作答和进度。确定继续吗？")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(SYNC_QUEUE_KEY);
  pendingSync = null;
  sessionRegistered = false;
  sessionCredential = loadSessionCredential();
  state = newState();
  save();
  render();
  toast("已创建新的参与者记录");
}

function wrap(content, className = "") {
  return `<div class="page ${className}">${content}</div>`;
}

function sectionHeader(eyebrow, title, copy, meta = "") {
  return `<div class="section-head"><div class="section-copy"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="lede">${copy}</p></div>${meta ? `<div class="section-meta">${meta}</div>` : ""}</div>`;
}

function scaleHTML(id, max, leftLabel, rightLabel, selected = "") {
  const countClass = max === 10 ? " scale-11" : "";
  return `<div class="scale${countClass}" data-scale-group="${id}">${Array.from({ length: max + 1 }, (_, index) => {
    const value = max === 7 ? index + 1 : index;
    if (max === 7 && index === 7) return "";
    return `<button class="scale-button ${String(selected) === String(value) ? "selected" : ""}" type="button" data-scale-target="${id}" data-scale-value="${value}">${value}</button>`;
  }).join("")}</div><input type="hidden" id="${id}" name="${id}" value="${escapeHTML(selected)}"><div class="scale-anchors"><span>${leftLabel}</span><span>${rightLabel}</span></div>`;
}

function renderIntro() {
  return wrap(`<div class="hero">
    <section class="hero-panel">
      <div class="eyebrow">Podcast information study</div>
      <h1>播客信息如何帮助我们理解与选择？</h1>
      <p class="lede">本研究关注用户的真实需求、不同信息的价值，以及播客内容最适合怎样组织和呈现。</p>
      <div class="level-strip">
        <div class="level-item"><b>LEVEL 1</b><span>发现需求</span></div>
        <div class="level-item"><b>LEVEL 2</b><span>验证信息价值</span></div>
        <div class="level-item"><b>LEVEL 3</b><span>确定设计形式</span></div>
      </div>
      <div class="notice green" style="margin-top:24px">请勿填写真实姓名、手机号或其他可识别身份的信息。作答会暂存在本机浏览器中。</div>
      <label class="choice" style="margin-top:20px"><input type="checkbox" id="consentCheck"><span>我已了解研究流程，并同意参与本次测试。</span></label>
      <div class="form-actions"><button class="button" id="introNext" type="button" disabled>填写参与者信息</button></div>
    </section>
    <aside class="hero-art" aria-label="研究参与者编号">
      <div class="hero-art-copy"><span>参与者编号</span><strong>${state.participantId}</strong></div>
    </aside>
  </div>`);
}

function checkboxChoices(name, options) {
  return `<div class="choice-list two-columns">${options.map(([value, label]) => `<label class="choice"><input type="checkbox" name="${name}" value="${value}"><span>${label}</span></label>`).join("")}</div>`;
}

function limitedCheckboxChoices(name, options, limit, counterId) {
  return `<div class="choice-list two-columns">${options.map(([value, label]) => `<label class="choice"><input type="checkbox" name="${name}" value="${value}" data-choice-limit="${limit}" data-choice-group="${name}" data-counter-id="${counterId}"><span>${label}</span></label>`).join("")}</div><p class="helper" id="${counterId}">已选 0/${limit}</p>`;
}

function renderProfile() {
  return wrap(`${sectionHeader("Before all tasks", "参与者基本信息", "请先完成以下表单。参与者编号已自动生成，不需要填写姓名或联系方式。", `<span class="badge">约 3 分钟</span>`)}
    <form id="profileForm" class="narrow">
      <section class="card">
        <label class="field-label" for="participantIdDisplay">参与者编号</label>
        <input class="text-input participant-id-input" id="participantIdDisplay" value="${state.participantId}" readonly aria-readonly="true">
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">1</span><span>性别</span></div>
        ${radioChoices("gender", [["male","男"],["female","女"]])}
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">2</span><span>年龄</span></div>
        <label class="field-label" for="participantAge">请输入周岁</label>
        <input class="text-input" id="participantAge" name="age" type="number" min="12" max="100" inputmode="numeric" required placeholder="例如：26">
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">3</span><span>播客收听频率</span></div>
        ${radioChoices("listeningFrequency", [["almostDaily","几乎每天"],["weekly3to5","每周 3—5 次"],["weekly1to2","每周 1—2 次"],["monthly1to3","每月 1—3 次"],["rarely","很少收听"]])}
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">4</span><span>常用播客平台 <small class="muted">（可多选）</small></span></div>
        ${checkboxChoices("platforms", [["ximalaya","喜马拉雅"],["xiaoyuzhou","小宇宙"],["apple","Apple 播客"],["youtube","YouTube"],["other","其他（访谈）"]])}
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">5</span><span>常听的播客类型 <small class="muted">（最多选 3 项）</small></span></div>
        ${limitedCheckboxChoices("podcastTypes", [["business","商业"],["growthCareer","自我成长与职业探索"],["society","社会"],["stories","故事奇谈"],["humanitiesHistory","人文历史"],["technology","科技"],["health","医疗健康"],["foodLife","饮食生活"],["art","艺术"],["music","音乐"],["casualTalk","趣味闲谈"],["other","其他（访谈）"]], 3, "podcastTypeCount")}
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">6</span><span>收听播客的场景 <small class="muted">（最多选 3 项）</small></span></div>
        ${limitedCheckboxChoices("listeningScenes", [["commute","通勤"],["housework","家务"],["exercise","运动"],["walking","散步"],["workStudy","工作或学习"],["beforeSleep","睡前"],["dedicated","安排专门时间认真收听"]], 3, "listeningSceneCount")}
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">7</span><span>是否有播客创作经验</span></div>
        ${radioChoices("creationExperience", [["yes","有"],["no","没有"]])}
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">8</span><span>对《岩中花述》的熟悉程度</span></div>
        ${radioChoices("showFamiliarity", [["everyEpisode","每期都听"],["moreThanFive","听过 5 期以上"],["twoToFive","听过 2—5 期"],["oneOrTwo","听过一两次"],["never","没听过"]])}
      </section>
      <div class="form-actions"><button class="button" type="submit">提交并开始 Task 1</button></div>
    </form>`);
}

function radioChoices(name, options, required = true) {
  return `<div class="choice-list two-columns">${options.map(([value, label]) => `<label class="choice"><input type="radio" name="${name}" value="${value}" ${required ? "required" : ""}><span>${label}</span></label>`).join("")}</div>`;
}

function renderNeeds() {
  return wrap(`${sectionHeader("Level 1 · Task 1", "用户的需求", "请根据你平时使用播客平台的真实习惯作答。", `<span class="badge">约 5 分钟</span>`)}
    <form id="needsForm" class="narrow">
      <section class="card question-card"><div class="question-title"><span class="question-number">1</span><span>你一般更倾向于收听：</span></div>${radioChoices("listeningPreference", [["subscribedNew","A. 订阅节目的新播客"],["heardOld","B. 听过的旧播客"],["newInteresting","C. 感兴趣的新内容，不在乎是否订阅"]])}</section>
      <section class="card question-card"><div class="question-title"><span class="question-number">2</span><span>当你想寻找新的播客内容时，通常从哪里开始？</span></div>${radioChoices("discoveryStart", [["home","A. 平台首页或排行榜推荐"],["search","B. 关键词搜索"],["subscriptions","C. 订阅列表中的节目"],["social","D. 社交媒体推荐"],["friends","E. 朋友推荐"],["ai","F. AI 推荐"],["other","G. 其他（访谈）"]])}</section>
      <section class="card question-card"><div class="question-title"><span class="question-number">3</span><span>在决定是否收听一集陌生播客时，你最希望知道的是什么？</span></div>${radioChoices("mostWantedInfo", [["what","A. 这期播客究竟讨论什么"],["depth","B. 讨论是否足够深入"],["guest","C. 嘉宾的观点是否值得听"],["context","D. 音频是否适合当前场景或时间"],["interest","E. 内容是否符合自己的兴趣"],["other","F. 其他（访谈）"]])}</section>
      <section class="card question-card"><div class="question-title"><span class="question-number">4</span><span>在收听播客前，你认为多大程度上需要了解播客的内容信息？</span></div>${radioChoices("informationNeed", [["blind","A. 完全不知道，开盲盒也可以"],["type","B. 至少知道是哪个类型的播客"],["topicGuest","C. 至少知道主题、嘉宾"],["summary","D. 至少知道以上信息，并看过内容简介"],["reviews","E. 知道以上所有信息，并查看评论区评价"],["transcript","F. 还会浏览转写文本"]])}</section>
      <section class="card question-card"><div class="question-title"><span class="question-number">5</span><span>一般情况下，你需要听多久来决定继续收听还是退出？</span></div>${radioChoices("decisionTime", [["under1","A. 1 分钟内"],["oneToThree","B. 1—3 分钟"],["threeToTen","C. 3—10 分钟"],["tenToThirty","D. 10—30 分钟"],["overThirty","E. 30 分钟以上"]])}</section>
      <section class="card question-card"><div class="question-title"><span class="question-number">6</span><span>如果听后发现一集播客不符合预期，你通常会怎么做？</span></div>${radioChoices("mismatchAction", [["exit","A. 立即退出"],["seek","B. 跳到其他时间位置继续尝试"],["speed","C. 加速收听"],["finish","D. 仍然继续听完"],["rare","E. 很少出现这种情况"]])}</section>
      <section class="card question-card"><div class="question-title"><span class="question-number">7</span><span>有一期播客你非常喜欢，你是否试图回溯找到其中某一句言论或观点？</span></div>${radioChoices("refindFrequency", [["often","A. 经常"],["sometimes","B. 偶尔"],["rarely","C. 很少"],["never","D. 从未"]])}</section>
      <section class="card question-card"><div class="question-title"><span class="question-number">8</span><span>听完一期播客后，你意犹未尽，你会选择什么样的播客继续收听？<small class="muted">（最多选 2 项）</small></span></div>${limitedCheckboxChoices("afterListening", [["nextShow","A. 同栏目的下一期播客"],["system","B. 系统推荐的下一期播客"],["similar","C. 主题类似的播客"],["stop","D. 不再继续听"]], 2, "afterListeningCount")}</section>
      <div class="form-actions"><button class="button" type="submit">提交并继续</button></div>
    </form>`);
}

function renderInfoRank() {
  return wrap(`${sectionHeader("Level 2 · Task 2-A", "哪些信息更重要？", "请回想你发现一集感兴趣、但尚未收听的播客时的判断过程，把信息从重要到不重要排序。", `<span class="badge">拖动或使用箭头</span>`)}
    <div class="card narrow">
      <div class="rank-list" id="rankList">${state.infoRanking.map((name, index) => {
        const description = INFORMATION_FIELDS.find(item => item[0] === name)?.[1] || "";
        return `<div class="rank-item" draggable="true" data-rank-index="${index}">
          <span class="rank-number">${index + 1}</span><span class="drag-mark" aria-hidden="true">⋮⋮</span>
          <span class="rank-copy"><b>${name}</b><small>${description}</small></span>
          <span class="rank-controls"><button class="icon-button" type="button" data-rank-move="up" data-index="${index}" aria-label="上移 ${name}" ${index === 0 ? "disabled" : ""}>↑</button><button class="icon-button" type="button" data-rank-move="down" data-index="${index}" aria-label="下移 ${name}" ${index === state.infoRanking.length - 1 ? "disabled" : ""}>↓</button></span>
        </div>`;
      }).join("")}</div>
      <div class="form-actions"><button class="button" id="rankSubmit" type="button">完成排序</button></div>
    </div>`);
}

function fieldValue(episode, field) {
  const values = {
    "标题": `${episode.id} 鲁豫对话${episode.guest}｜${episode.title}`,
    "主持人": "陈鲁豫",
    "时长": episode.duration,
    "主题标签": episode.topics.join("、"),
    "简介": episode.summary,
    "评论概览": episode.comments,
    "播放量": `${compactNumber(episode.plays)}次播放`,
    "相似播客": episode.similar,
    "转写文本": episode.transcript,
    "内容主题划分（时间轴）": episode.timeline,
    "时间戳评论": episode.timestampComments,
    "情感分析": episode.sentiment,
    "音频分析特征": episode.audioFeatures
  };
  return values[field] || "";
}

function episodeChoiceHTML(episode) {
  return `<button class="episode-choice ${state.selectedEpisode === episode.id ? "selected" : ""}" type="button" data-episode-choice="${episode.id}">
    <span class="pod-cover">岩中<br>花述</span>
    <span><span class="episode-title">${episode.id} 鲁豫对话${episode.guest}｜${episode.title}</span><span class="episode-meta">本期嘉宾：${episode.guest}</span>
      ${state.selectedFields.length ? `<span class="revealed-info">${state.selectedFields.map(field => `<span><b>${field}：</b>${fieldValue(episode, field)}</span>`).join("")}</span>` : ""}
    </span>
  </button>`;
}

function renderInfoReveal() {
  return wrap(`${sectionHeader("Level 2 · Task 2-B", "选择信息，再选择想听的节目", "你最多可以逐步揭露 3 类信息。观察这些信息是否会改变你的判断。", `<span class="badge warm">已选 ${state.selectedFields.length}/3 类信息</span>`)}
    <section class="card">
      <h3>第一步：选择你想查看的信息</h3>
      <p class="muted">标题会始终显示；其余信息会同时呈现在每一期节目中。</p>
      <div class="field-picker">${INFORMATION_FIELDS.filter(item => item[0] !== "标题").map(([field]) => `<button class="field-chip ${state.selectedFields.includes(field) ? "selected" : ""}" type="button" data-field-choice="${field}">${field}</button>`).join("")}</div>
    </section>
    <section class="card">
      <h3>第二步：选择一集你最想听的节目</h3>
      <div class="episode-grid">${EPISODES.map(episodeChoiceHTML).join("")}</div>
    </section>
    <form id="revealForm" class="card">
      <h3>第三步：确认你的选择</h3>
      <div class="interview-callout"><b>（访谈）</b>哪些信息最影响你的决定？为什么？</div>
      <div class="form-actions"><button class="button" type="submit">确认选择并继续</button></div>
    </form>`);
}

function renderScenario() {
  return wrap(`${sectionHeader("Task 4 · 真实场景", "在小宇宙中寻找一期节目", "请在你手机中的小宇宙 App 完成以下任务，并边操作边说出你的想法。", `<span class="badge">任务用时将被记录</span>`)}
    <section class="card scenario-card">
      <div class="scenario-number">4</div>
      <div><h2>在“岩中花述”中找到一期你感兴趣的、与职业发展有关的播客</h2>
        <ol class="instruction-list"><li>请打开手机中的小宇宙 App。</li><li>进入“岩中花述”栏目。</li><li>寻找由鲁豫主持、与职业发展有关、且你比较感兴趣的一期。</li><li>找到后告诉我们你是怎样找到的。</li></ol>
        <div class="notice">研究者不会提供额外内容线索。请按你平时使用播客平台的方式操作。</div>
      </div>
    </section>
    <form id="scenarioForm" class="card narrow">
      <label class="field-label" for="scenarioEpisode">你最终选择了哪一期？</label>
      <select id="scenarioEpisode" name="episode" required><option value="">请选择</option>${EPISODES.map(episode => `<option value="${episode.id}">${episode.id} 鲁豫对话${episode.guest}｜${episode.title}</option>`).join("")}<option value="other">其他／未在列表中</option></select>
      <div class="interview-callout"><b>（访谈）</b>请口头描述你寻找这期节目的过程，以及过程中查看了哪些信息。</div>
      <div class="form-actions"><button class="button" type="submit">完成研究</button></div>
    </form>`);
}

function renderContentIntro() {
  return wrap(`<div class="hero">
    <section class="hero-panel">
      <div class="eyebrow">Level 2 · Task 2-D</div>
      <h1>单集内的信息能带来什么帮助？</h1>
      <p class="lede">接下来有 5 个 3 分钟片段。每个片段对应一种辅助信息，请评价它对内容理解的帮助。</p>
      <ul class="instruction-list"><li>每题点击“开始 3 分钟试听”后开始计时。</li><li>需要时打开右侧辅助信息。</li><li>试听结束或认为已经足够判断时，可以提交评价。</li></ul>
      <div class="notice">当前为流程演示版。如果研究者尚未接入正式音频，页面会显示演示波形，但所有计时、辅助信息和评价仍可测试。</div>
      <div class="form-actions"><button class="button" id="contentBegin" type="button">开始第 1 个片段</button></div>
    </section>
    <aside class="hero-art"><div class="hero-art-copy"><span>5 种信息</span><strong>理解帮助</strong></div></aside>
  </div>`);
}

function waveformHTML() {
  const heights = [24,46,33,66,52,71,38,58,31,75,49,61,28,68,43,55,35,72,47,30,63,41,57,26];
  return `<div class="waveform" aria-hidden="true">${heights.map(height => `<i style="height:${height}px"></i>`).join("")}</div>`;
}

function audioSource(index) {
  return window.YZH_STUDY_MATERIALS?.audioSources?.[index] || "";
}

function renderContentTrial() {
  const trial = CONTENT_TRIALS[state.contentIndex];
  const startedAt = state.contentStarts[state.contentIndex];
  const isOpen = Boolean(state.featureOpen[state.contentIndex]);
  const source = audioSource(state.contentIndex);
  return wrap(`${sectionHeader(`Task 2-D · ${state.contentIndex + 1}/5`, trial.feature, trial.prompt, `<span class="badge warm">单段最多 03:00</span>`)}
    <div class="trial-layout">
      <section class="card audio-panel">
        <div class="eyebrow">Audio segment ${state.contentIndex + 1}</div>
        <div class="timer-display" id="clipTimer">03:00</div>
        ${source ? `<audio class="audio-control" controls preload="metadata" src="${escapeHTML(source)}"></audio>` : `<div class="audio-placeholder"><div>${waveformHTML()}<b>演示音频片段 ${state.contentIndex + 1}</b><p class="helper">正式实验前请在 study-materials.js 中接入音频。</p></div></div>`}
        <button class="button green" id="startClip" type="button" ${startedAt ? "disabled" : ""}>${startedAt ? "计时已开始" : "开始 3 分钟试听"}</button>
      </section>
      <section class="card feature-panel">
        <div class="feature-status"><div><div class="eyebrow">辅助信息</div><h2>${trial.feature}</h2></div><button class="feature-toggle" id="featureToggle" type="button">${isOpen ? "收起辅助信息" : `查看${trial.feature}`}</button></div>
        <div class="feature-content" id="featureContent">${isOpen ? trial.content() : `<div class="audio-placeholder"><p>点击右上角按钮查看辅助信息。</p></div>`}</div>
      </section>
    </div>
    <form id="contentRatingForm" class="card" style="margin-top:20px">
      <h2>本题评价</h2>
      <div class="scale-block"><label>你认为${trial.feature}对内容理解的帮助是？</label>${scaleHTML("contentHelp", 7, "1 完全没有帮助", "7 非常有帮助")}</div>
      <div class="interview-callout"><b>（访谈）</b>你是如何使用这项信息的？它在什么地方有帮助或造成干扰？</div>
      <div class="form-actions"><button class="button" type="submit">${state.contentIndex === CONTENT_TRIALS.length - 1 ? "完成并进入 Task 3" : "提交并进入下一题"}</button></div>
    </form>`);
}

function renderStructureIntro() {
  return wrap(`<div class="hero">
    <section class="hero-panel">
      <div class="eyebrow">Level 3 · Task 3</div>
      <h1>哪一种呈现形式更好？</h1>
      <p class="lede">你将完成 12 组 A/B 对比。每组同时展示两种界面，请先选择视觉上更舒适的一项，再选择更容易理解内容及信息组织的一项。</p>
      <div class="level-strip">
        <div class="level-item"><b>4 种形式</b><span>列表、网状、树状、分类</span></div>
        <div class="level-item"><b>3 种数量</b><span>5、10、15 期节目</span></div>
        <div class="level-item"><b>2 个选择</b><span>视觉舒适、内容理解</span></div>
      </div>
      <div class="notice green" style="margin-top:22px">12 组对比会为每位参与者随机排序。请比较界面的组织方式本身，不需要挑选或播放节目。</div>
      <div class="form-actions"><button class="button" id="structureBegin" type="button">开始 12 组对比</button></div>
    </section>
    <aside class="hero-art"><div class="hero-art-copy"><span>A / B</span><strong>12 组对比</strong></div></aside>
  </div>`);
}

const NETWORK_POSITIONS = {
  5: [[18,18],[53,13],[82,26],[29,63],[72,78]],
  10: [[16,13],[48,13],[82,12],[27,35],[64,32],[87,43],[15,61],[46,58],[78,67],[48,86]],
  15: [[15,10],[48,11],[82,10],[26,27],[61,26],[88,31],[13,47],[45,45],[78,49],[27,64],[60,64],[88,69],[14,84],[47,84],[79,86]]
};

function edgeHTML(from, to, strong = false) {
  const deltaX = to[0] - from[0];
  const deltaY = to[1] - from[1];
  const width = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  return `<i class="network-edge ${strong ? "strong" : ""}" style="left:${from[0]}%;top:${from[1]}%;width:${width}%;transform:rotate(${angle}deg)"></i>`;
}

function structureList(episodes) {
  return `<div class="phone-list" style="grid-template-rows:repeat(${episodes.length},1fr)">${episodes.map(episode => {
    const theme = THEME_META[episode.theme];
    return `<div class="phone-list-item" style="--node-color:${theme.color}"><i class="phone-list-mark"></i><span><b>${episode.id} 鲁豫对话${episode.guest}</b><small>${episode.title} · ${theme.label}</small></span></div>`;
  }).join("")}</div>`;
}

function structureNetwork(episodes) {
  const positions = NETWORK_POSITIONS[episodes.length];
  const edges = [];
  Object.keys(THEME_META).forEach(themeKey => {
    const members = episodes.map((episode, index) => ({ episode, index })).filter(item => item.episode.theme === themeKey);
    for (let index = 1; index < members.length; index += 1) edges.push(edgeHTML(positions[members[index - 1].index], positions[members[index].index], true));
  });
  for (let index = 1; index < episodes.length; index += 4) edges.push(edgeHTML(positions[index - 1], positions[index], false));
  const nodes = episodes.map((episode, index) => {
    const theme = THEME_META[episode.theme];
    return `<div class="phone-node" style="left:${positions[index][0]}%;top:${positions[index][1]}%;--node-color:${theme.color}"><b>${episode.id} · ${episode.guest}</b><small>${theme.label}</small></div>`;
  }).join("");
  return `<div class="phone-network">${edges.join("")}${nodes}</div>`;
}

function structureClusters(episodes) {
  return `<div class="phone-clusters">${Object.entries(THEME_META).map(([key, theme]) => {
    const members = episodes.filter(episode => episode.theme === key);
    return `<section class="phone-cluster" style="--cluster-color:${theme.color}"><b>${theme.label} · ${members.length}</b><div class="phone-cluster-items">${members.map(episode => `<span class="phone-cluster-item">${episode.id} ${episode.guest}</span>`).join("")}</div></section>`;
  }).join("")}</div>`;
}

function structureTree(episodes) {
  const activeThemes = Object.entries(THEME_META).filter(([key]) => episodes.some(episode => episode.theme === key));
  return `<div class="phone-tree"><div class="tree-root">岩中花述</div><div class="tree-groups">${activeThemes.map(([key, theme]) => {
    const members = episodes.filter(episode => episode.theme === key);
    return `<section class="tree-group" style="--tree-color:${theme.color}"><b class="tree-theme">${theme.label}</b><div class="tree-leaves">${members.map(episode => `<span class="tree-leaf">${episode.id} ${episode.guest}</span>`).join("")}</div></section>`;
  }).join("")}</div></div>`;
}

function structureHTML(type, count) {
  const episodes = STRUCTURE_EPISODES.slice(0, count);
  const content = type === "list" ? structureList(episodes) : type === "network" ? structureNetwork(episodes) : type === "tree" ? structureTree(episodes) : structureClusters(episodes);
  return `<div class="phone density-${count}"><div class="phone-screen"><div class="phone-status"><span>9:41</span><span>● ● ▰</span></div><div class="phone-caption">岩中花述 · ${count} 期 · ${STRUCTURE_TYPES[type].label}</div><div class="phone-content">${content}</div></div></div>`;
}

function renderStructureTrial() {
  const comparison = state.structureComparisons[state.structureIndex];
  const aMeta = STRUCTURE_TYPES[comparison.a.type];
  const bMeta = STRUCTURE_TYPES[comparison.b.type];
  const optionLabel = (side, condition, metadata) => `${side}：${metadata.label}结构 · ${condition.count} 期`;
  return wrap(`${sectionHeader(`Task 3 · ${state.structureIndex + 1}/12`, `${comparison.id} · A/B 结构对比`, "请先整体观察两个手机界面，再完成下方两项选择。", `<span class="badge">题目顺序已随机</span>`)}
    <div class="comparison-grid">
      <section class="comparison-option"><div class="comparison-label"><b>A</b><span>${aMeta.label}结构 · ${comparison.a.count} 期</span></div><div class="phone-stage compact">${structureHTML(comparison.a.type, comparison.a.count)}</div></section>
      <section class="comparison-option"><div class="comparison-label"><b>B</b><span>${bMeta.label}结构 · ${comparison.b.count} 期</span></div><div class="phone-stage compact">${structureHTML(comparison.b.type, comparison.b.count)}</div></section>
    </div>
    <form id="structureComparisonForm" class="card comparison-form">
      <section class="pair-question"><h3>Q1　哪个界面在第一眼看上去更舒适？</h3>${radioChoices("visualChoice", [["A",optionLabel("A", comparison.a, aMeta)],["B",optionLabel("B", comparison.b, bMeta)]])}</section>
      <section class="pair-question"><h3>Q2　哪个界面更容易理解节目内容及信息组织？</h3>${radioChoices("understandingChoice", [["A",optionLabel("A", comparison.a, aMeta)],["B",optionLabel("B", comparison.b, bMeta)]])}</section>
      <div class="form-actions"><button class="button" type="submit">${state.structureIndex === state.structureComparisons.length - 1 ? "完成结构对比" : "下一组对比"}</button></div>
    </form>`);
}

function renderInterview() {
  return wrap(`${sectionHeader("Task 4 · 访谈", "关于四种结构的看法", "请回顾刚才看到的列表、网状、树状与分类结构。", `<span class="badge warm">开放题</span>`)}
    <section class="card">
      <div class="notice green">以下问题由主持人口头提问，参与者不需要在网站中填写文字。</div>
      <div class="interview-grid">
        <div class="interview-prompt"><b>（访谈）1. 哪种结构最容易快速理解？为什么？</b><p class="muted">主持人追问参与者的判断依据。</p></div>
        <div class="interview-prompt"><b>（访谈）2. 哪种结构最有助于发现节目之间的关联？为什么？</b><p class="muted">主持人追问哪些视觉线索起到了作用。</p></div>
        <div class="interview-prompt"><b>（访谈）3. 哪种结构在节目数量增加后最容易使用？</b><p class="muted">主持人追问 5、10、15 期之间的感受变化。</p></div>
        <div class="interview-prompt"><b>（访谈）4. 哪种结构视觉上最舒适？有哪些地方需要改进？</b><p class="muted">主持人追问布局、字号、密度和关联表达。</p></div>
      </div>
      <div class="interview-callout"><b>（访谈）</b>还有其他想法吗？</div>
      <div class="form-actions"><button class="button" id="interviewComplete" type="button">口头访谈已完成，进入最后任务</button></div>
    </section>`);
}

function renderComplete() {
  return wrap(`<div class="hero">
    <section class="hero-panel">
      <div class="eyebrow">Study complete</div>
      <h1>谢谢你的参与</h1>
      <p class="lede">你已经完成需求调查、信息价值测试、12 组结构对比和真实场景任务。</p>
      <p>请在关闭页面前告知研究者，并按需要导出本次记录。</p>
      <div class="form-actions" style="justify-content:flex-start"><button class="button" id="exportCSV" type="button">导出答案 CSV</button><button class="button secondary" id="exportEventsCSV" type="button">导出行为日志 CSV</button><button class="button secondary" id="exportJSON" type="button">导出 JSON</button></div>
      <div class="notice" style="margin-top:24px">答题过程会先保存在本机浏览器；在 Sites 环境中还会同步到研究数据库。关闭页面前请确认研究者已完成数据核对。</div>
    </section>
    <aside class="hero-art"><div class="hero-art-copy"><span>参与者编号</span><strong>${state.participantId}</strong></div></aside>
  </div>`);
}

const RENDERERS = {
  intro: renderIntro,
  profile: renderProfile,
  needs: renderNeeds,
  infoRank: renderInfoRank,
  infoReveal: renderInfoReveal,
  scenario: renderScenario,
  contentIntro: renderContentIntro,
  contentTrial: renderContentTrial,
  structureIntro: renderStructureIntro,
  structureTrial: renderStructureTrial,
  interview: renderInterview,
  complete: renderComplete
};

function updateHeader() {
  let index = STEPS.indexOf(state.step);
  let fraction = 0;
  if (state.step === "contentTrial") fraction = state.contentIndex / CONTENT_TRIALS.length;
  if (state.step === "structureTrial") fraction = state.structureIndex / state.structureComparisons.length;
  const progress = ((index + fraction + 1) / STEPS.length) * 100;
  document.querySelector("#progressBar").style.width = `${Math.min(100, progress)}%`;
  let label = STEP_LABELS[state.step] || "";
  if (state.step === "contentTrial") label += ` ${state.contentIndex + 1}/5`;
  if (state.step === "structureTrial") label += ` ${state.structureIndex + 1}/12`;
  document.querySelector("#stepLabel").textContent = label;
  document.querySelector("#backButton").disabled = state.step === "intro";
}

function render() {
  stopCountdown();
  app.innerHTML = (RENDERERS[state.step] || renderIntro)();
  updateHeader();
  bindCurrentView();
  if (state.step === "contentTrial" && state.contentStarts[state.contentIndex]) runCountdown();
  app.focus({ preventScroll: true });
}

function setScale(target, value) {
  const input = document.querySelector(`#${CSS.escape(target)}`);
  if (!input) return;
  input.value = value;
  document.querySelectorAll(`[data-scale-target="${target}"]`).forEach(button => button.classList.toggle("selected", button.dataset.scaleValue === value));
  log("scale_select", target, { value: Number(value) });
}

function collectForm(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

function validateScale(ids) {
  const missing = ids.find(id => !document.querySelector(`#${CSS.escape(id)}`)?.value);
  if (missing) {
    toast("请完成所有量表评价");
    document.querySelector(`#${CSS.escape(missing)}`)?.closest(".scale-block")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  return true;
}

function bindRankDrag() {
  let draggedIndex = null;
  document.querySelectorAll(".rank-item").forEach(item => {
    item.addEventListener("dragstart", () => { draggedIndex = Number(item.dataset.rankIndex); item.classList.add("dragging"); });
    item.addEventListener("dragend", () => { item.classList.remove("dragging"); document.querySelectorAll(".rank-item").forEach(row => row.classList.remove("drag-over")); });
    item.addEventListener("dragover", event => { event.preventDefault(); item.classList.add("drag-over"); });
    item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
    item.addEventListener("drop", event => {
      event.preventDefault();
      const targetIndex = Number(item.dataset.rankIndex);
      if (draggedIndex === null || draggedIndex === targetIndex) return;
      const [moved] = state.infoRanking.splice(draggedIndex, 1);
      state.infoRanking.splice(targetIndex, 0, moved);
      log("rank_drag", moved, { from: draggedIndex, to: targetIndex });
      save();
      render();
    });
  });
}

function moveRank(index, direction) {
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= state.infoRanking.length) return;
  const [moved] = state.infoRanking.splice(index, 1);
  state.infoRanking.splice(target, 0, moved);
  log("rank_button", moved, { from: index, to: target });
  save();
  render();
}

function startClip() {
  if (!state.contentStarts[state.contentIndex]) {
    state.contentStarts[state.contentIndex] = Date.now();
    log("audio_trial_start", CONTENT_TRIALS[state.contentIndex].feature, { trial: state.contentIndex + 1, sourceConfigured: Boolean(audioSource(state.contentIndex)) });
    save();
  }
  document.querySelector("#startClip")?.setAttribute("disabled", "");
  runCountdown();
}

function runCountdown() {
  stopCountdown();
  const timerElement = document.querySelector("#clipTimer");
  const startedAt = state.contentStarts[state.contentIndex];
  if (!timerElement || !startedAt) return;
  const update = () => {
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = Math.max(0, 180 - elapsedSeconds);
    timerElement.textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
    if (remaining === 0) {
      stopCountdown();
      timerElement.textContent = "时间到";
      log("audio_trial_timeout", CONTENT_TRIALS[state.contentIndex].feature, { trial: state.contentIndex + 1 });
    }
  };
  update();
  countdownTimer = window.setInterval(update, 1000);
}

function bindCurrentView() {
  if (state.step === "infoRank") bindRankDrag();
}

function renderResearcher() {
  stopCountdown();
  const completedContent = Object.keys(state.answers.contentTrials || {}).length;
  const completedStructures = Object.keys(state.answers.structureTrials || {}).length;
  const aggregateExports = canUseServerAPI() ? `<button class="button" id="researchExportAllAnswers" type="button">导出全部答案 CSV</button><button class="button secondary" id="researchExportTask3" type="button">导出 Task 3 对比 CSV</button><button class="button secondary" id="researchExportAllEvents" type="button">导出全部日志 CSV</button>` : "";
  app.innerHTML = wrap(`${sectionHeader("Researcher console", "研究执行台", `当前参与者：${state.participantId}`, `<span class="badge dark">${STEP_LABELS[state.step]}</span>`)}
    <div class="research-grid">
      <aside class="card research-nav"><button class="button secondary" id="returnParticipant" type="button">← 返回参与者视图</button><button class="button" id="researchExportCSV" type="button">导出本参与者答案 CSV</button><button class="button secondary" id="researchExportEventsCSV" type="button">导出本参与者日志 CSV</button><button class="button secondary" id="researchExportJSON" type="button">导出本参与者 JSON</button>${aggregateExports}<button class="button secondary" id="markInterrupted" type="button">标记异常中断</button></aside>
      <div>
        <div class="stats"><div class="stat"><span>事件数</span><b>${state.events.length}</b></div><div class="stat"><span>单集内测试</span><b>${completedContent}/5</b></div><div class="stat"><span>结构对比</span><b>${completedStructures}/12</b></div></div>
        <section class="card"><h2>阶段跳转</h2><div class="jump-grid">${STEPS.map((step, index) => `<button class="jump-button" type="button" data-research-jump="${step}">${index + 1}. ${STEP_LABELS[step]}</button>`).join("")}</div></section>
        <section class="card"><h2>最近行为日志</h2><div class="log-box">${state.events.slice(-80).reverse().map(event => `${escapeHTML(event.timestamp)}　${escapeHTML(event.type)}　${escapeHTML(event.target)}　${escapeHTML(JSON.stringify(event.payload))}`).join("<br>") || "暂无记录"}</div></section>
      </div>
    </div>`);
  updateHeader();
}

function download(filename, content, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\ufeff", content], { type }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  log("export", filename);
}

function exportJSON() {
  download(`${state.participantId}.json`, JSON.stringify(state, null, 2), "application/json");
}

function csvText(rows) {
  return rows.map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
}

function answerRows() {
  const rows = [["participant_id", "study_version", "question_id", "stage", "measure", "response", "duration_ms", "metadata"]];
  const add = (questionId, stage, measure, response, durationMs = "", metadata = "") => {
    const normalized = Array.isArray(response) ? response.join(";") : response;
    rows.push([state.participantId, STUDY_VERSION, questionId, stage, measure, normalized, durationMs, typeof metadata === "string" ? metadata : JSON.stringify(metadata)]);
  };
  const profile = state.answers.profile || {};
  add("P1-01", "Pre-interview", "participant_id", state.participantId, profile.durationMs);
  add("P1-02", "Pre-interview", "gender", profile.gender, profile.durationMs);
  add("P1-03", "Pre-interview", "age", profile.age, profile.durationMs);
  add("P1-04", "Pre-interview", "listening_frequency", profile.listeningFrequency, profile.durationMs);
  add("P1-05", "Pre-interview", "platforms", profile.platforms, profile.durationMs);
  add("P1-06", "Pre-interview", "podcast_types", profile.podcastTypes, profile.durationMs);
  add("P1-06.5", "Pre-interview", "listening_scenes", profile.listeningScenes, profile.durationMs);
  add("P1-08", "Pre-interview", "creation_experience", profile.creationExperience, profile.durationMs);
  add("P1-09", "Pre-interview", "show_familiarity", profile.showFamiliarity, profile.durationMs);

  const needs = state.answers.needs || {};
  add("T1-01", "Task 1", "listening_preference", needs.listeningPreference, needs.durationMs);
  add("T1-02", "Task 1", "discovery_start", needs.discoveryStart, needs.durationMs);
  add("T1-03", "Task 1", "most_wanted_information", needs.mostWantedInfo, needs.durationMs);
  add("T1-07", "Task 1", "information_need", needs.informationNeed, needs.durationMs);
  add("T1-03-duration", "Task 1", "decision_time", needs.decisionTime, needs.durationMs, { sourceQuestionId: "T1-03", note: "源表中编号重复，导出时添加 duration 后缀" });
  add("T1-04", "Task 1", "mismatch_action", needs.mismatchAction, needs.durationMs);
  add("T1-05", "Task 1", "refind_frequency", needs.refindFrequency, needs.durationMs);
  add("T1-06", "Task 1", "after_listening", needs.afterListening, needs.durationMs);

  const ranking = state.answers.infoRanking || {};
  add("T2-E01", "Task 2", "information_ranking", ranking.order, ranking.durationMs);
  const reveal = state.answers.infoReveal || {};
  add("T2-E02", "Task 2", "selected_episode", reveal.episode, reveal.durationMs, { selectedFields: reveal.fields || [] });
  Object.entries(state.answers.contentTrials || {}).forEach(([index, trial]) => add(`T2-C0${Number(index) + 1}`, "Task 2", "helpfulness_1_to_7", trial.help, trial.elapsedMs, {
    feature: trial.feature,
    featureOpened: trial.featureOpened,
    audioConfigured: trial.audioConfigured
  }));
  Object.values(state.answers.structureTrials || {}).sort((a, b) => a.questionId.localeCompare(b.questionId)).forEach(trial => {
    const metadata = {
      displayAType: trial.aType,
      displayACount: trial.aCount,
      displayBType: trial.bType,
      displayBCount: trial.bCount,
      canonicalAType: trial.canonicalAType,
      canonicalACount: trial.canonicalACount,
      canonicalBType: trial.canonicalBType,
      canonicalBCount: trial.canonicalBCount,
      sideSwapped: trial.sideSwapped,
      layoutArm: trial.layoutArm
    };
    add(trial.questionId, "Task 3", "visual_comfort_choice", trial.visualChoice, trial.durationMs, metadata);
    add(trial.questionId, "Task 3", "understanding_choice", trial.understandingChoice, trial.durationMs, { ...metadata, dimensionsAgree: trial.dimensionsAgree });
  });
  const interview = state.answers.interview || {};
  add("T4-01", "Task 4", "oral_interview_completed", interview.completed, interview.durationMs);
  const scenario = state.answers.scenario || {};
  add("T4-02", "Task 4", "selected_episode", scenario.episode, scenario.durationMs, { responseMode: "task_and_oral_interview" });
  return rows;
}

function exportCSV() {
  download(`${state.participantId}-answers.csv`, csvText(answerRows()), "text/csv;charset=utf-8");
}

function exportEventsCSV() {
  const rows = [["participant_id", "study_version", "step", "event_type", "target", "timestamp", "payload"]];
  state.events.forEach(event => rows.push([state.participantId, STUDY_VERSION, event.step, event.type, event.target, event.timestamp, JSON.stringify(event.payload)]));
  download(`${state.participantId}-events.csv`, csvText(rows), "text/csv;charset=utf-8");
}

async function exportAggregateCSV(kind) {
  if (!researcherSessionToken) return toast("请重新进入研究者视图并验证访问令牌");
  try {
    await syncServerState();
    const response = await fetch(`/api/research/${kind}.csv`, {
      headers: { "authorization": `Bearer ${researcherSessionToken}` }
    });
    if (!response.ok) return toast(response.status === 401 ? "研究者访问令牌无效" : "全部数据导出失败");
    const content = await response.text();
    const date = new Date().toISOString().slice(0, 10);
    download(`yzh-study-${kind}-${date}.csv`, content, "text/csv;charset=utf-8");
  } catch {
    toast("无法连接研究数据服务");
  }
}

function loadLocalConfig() {
  if (window.YZH_STUDY_CONFIG || configAttempted) return Promise.resolve(Boolean(window.YZH_STUDY_CONFIG));
  configAttempted = true;
  return new Promise(resolve => {
    const script = document.createElement("script");
    script.src = `config.js?local=${Date.now()}`;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

async function openResearcherAccess() {
  const configured = await loadLocalConfig();
  document.querySelector("#accessHint").textContent = configured ? "请输入本地研究者访问码。" : canUseServerAPI() ? "请输入 Sites 中配置的研究者访问令牌。" : "尚未找到本地 config.js。请先复制 config.example.js 并设置访问码。";
  accessDialog.showModal();
  window.setTimeout(() => document.querySelector("#accessCode").focus(), 50);
}

document.querySelector("#backButton").addEventListener("click", goBack);
document.querySelector("#restartButton").addEventListener("click", resetStudy);
document.querySelector("#researcherButton").addEventListener("click", openResearcherAccess);
document.querySelector("#accessCancel").addEventListener("click", () => accessDialog.close());
document.querySelector("#accessForm").addEventListener("submit", async event => {
  event.preventDefault();
  const configuredCode = window.YZH_STUDY_CONFIG?.researcherAccessCode || "";
  const enteredCode = document.querySelector("#accessCode").value;
  if (configuredCode && enteredCode !== configuredCode) return toast("访问码不正确");
  if (!configuredCode) {
    if (!canUseServerAPI()) return toast("研究者访问尚未配置");
    try {
      const response = await fetch("/api/research/authorize", {
        method: "POST",
        headers: { "authorization": `Bearer ${enteredCode}` }
      });
      if (!response.ok) return toast("访问令牌不正确或尚未配置");
      researcherSessionToken = enteredCode;
    } catch {
      return toast("无法连接研究数据服务");
    }
  } else {
    researcherSessionToken = enteredCode;
  }
  document.querySelector("#accessCode").value = "";
  accessDialog.close();
  log("researcher_view_open");
  renderResearcher();
});

document.addEventListener("click", event => {
  const scaleButton = event.target.closest("[data-scale-target]");
  if (scaleButton) setScale(scaleButton.dataset.scaleTarget, scaleButton.dataset.scaleValue);

  if (event.target.id === "introNext") goTo("profile");
  if (event.target.id === "rankSubmit") {
    state.answers.infoRanking = { order: [...state.infoRanking], durationMs: pageDuration() };
    log("info_ranking_complete", "", state.answers.infoRanking);
    save();
    goTo("infoReveal");
  }
  const rankMove = event.target.closest("[data-rank-move]");
  if (rankMove) moveRank(Number(rankMove.dataset.index), rankMove.dataset.rankMove);

  const fieldButton = event.target.closest("[data-field-choice]");
  if (fieldButton) {
    const field = fieldButton.dataset.fieldChoice;
    const existingIndex = state.selectedFields.indexOf(field);
    if (existingIndex >= 0) state.selectedFields.splice(existingIndex, 1);
    else if (state.selectedFields.length < 3) state.selectedFields.push(field);
    else return toast("最多同时查看 3 类信息");
    log("information_toggle", field, { selected: existingIndex < 0, current: [...state.selectedFields] });
    save();
    render();
  }

  const episodeButton = event.target.closest("[data-episode-choice]");
  if (episodeButton) {
    state.selectedEpisode = episodeButton.dataset.episodeChoice;
    log("episode_select", state.selectedEpisode, { fields: [...state.selectedFields] });
    save();
    render();
  }

  if (event.target.id === "contentBegin") {
    state.contentIndex = 0;
    goTo("contentTrial");
  }
  if (event.target.id === "startClip") startClip();
  if (event.target.id === "featureToggle") {
    state.featureOpen[state.contentIndex] = !state.featureOpen[state.contentIndex];
    log("feature_toggle", CONTENT_TRIALS[state.contentIndex].feature, { open: state.featureOpen[state.contentIndex] });
    save();
    render();
  }
  if (event.target.id === "structureBegin") {
    state.structureIndex = 0;
    goTo("structureTrial");
  }
  if (event.target.id === "interviewComplete") {
    state.answers.interview = { completed: true, durationMs: pageDuration() };
    log("interview_complete", "", state.answers.interview);
    save();
    goTo("scenario");
  }

  if (event.target.id === "exportCSV" || event.target.id === "researchExportCSV") exportCSV();
  if (event.target.id === "exportEventsCSV" || event.target.id === "researchExportEventsCSV") exportEventsCSV();
  if (event.target.id === "exportJSON" || event.target.id === "researchExportJSON") exportJSON();
  if (event.target.id === "researchExportAllAnswers") exportAggregateCSV("answers");
  if (event.target.id === "researchExportTask3") exportAggregateCSV("task3");
  if (event.target.id === "researchExportAllEvents") exportAggregateCSV("events");
  if (event.target.id === "returnParticipant") render();
  if (event.target.id === "markInterrupted") {
    state.answers.interrupted = { step: state.step, timestamp: new Date().toISOString() };
    log("interruption_marked", state.step);
    toast("已标记异常中断");
  }
  const jumpButton = event.target.closest("[data-research-jump]");
  if (jumpButton) {
    if (jumpButton.dataset.researchJump === "contentTrial") state.contentIndex = 0;
    if (jumpButton.dataset.researchJump === "structureTrial") state.structureIndex = 0;
    goTo(jumpButton.dataset.researchJump);
  }
});

window.addEventListener("pagehide", () => {
  if (!canUseServerAPI() || !sessionRegistered || state.syncConflict) return;
  const queued = loadOrCreatePendingSync();
  fetch(SYNC_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Participant ${sessionCredential.token}`
    },
    body: queued.body,
    keepalive: true
  }).catch(() => {});
});

document.addEventListener("change", event => {
  if (event.target.id === "consentCheck") document.querySelector("#introNext").disabled = !event.target.checked;
  if (event.target.matches("[data-choice-limit]")) {
    const limit = Number(event.target.dataset.choiceLimit);
    const group = event.target.dataset.choiceGroup;
    const selector = `[data-choice-group="${CSS.escape(group)}"]:checked`;
    const checked = [...document.querySelectorAll(selector)];
    if (checked.length > limit) {
      event.target.checked = false;
      toast(`最多选择 ${limit} 项`);
    }
    const count = document.querySelectorAll(selector).length;
    const counter = document.querySelector(`#${CSS.escape(event.target.dataset.counterId)}`);
    if (counter) counter.textContent = `已选 ${count}/${limit}`;
  }
});

document.addEventListener("submit", event => {
  if (event.target.id === "profileForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const platforms = formData.getAll("platforms");
    const podcastTypes = formData.getAll("podcastTypes");
    const listeningScenes = formData.getAll("listeningScenes");
    if (!platforms.length) return toast("请至少选择一个常用播客平台");
    if (!podcastTypes.length) return toast("请至少选择一种常听的播客类型");
    if (podcastTypes.length > 3) return toast("常听的播客类型最多选择 3 项");
    if (!listeningScenes.length) return toast("请至少选择一个收听播客的场景");
    if (listeningScenes.length > 3) return toast("收听场景最多选择 3 项");
    state.answers.profile = {
      participantId: state.participantId,
      gender: formData.get("gender"),
      age: Number(formData.get("age")),
      listeningFrequency: formData.get("listeningFrequency"),
      platforms,
      podcastTypes,
      listeningScenes,
      creationExperience: formData.get("creationExperience"),
      showFamiliarity: formData.get("showFamiliarity"),
      durationMs: pageDuration()
    };
    log("profile_complete", "", state.answers.profile);
    save();
    goTo("needs");
  }

  if (event.target.id === "needsForm") {
    event.preventDefault();
    const afterListening = [...event.target.querySelectorAll("input[name='afterListening']:checked")].map(input => input.value);
    if (!afterListening.length) return toast("请至少选择一种继续收听的方式");
    if (afterListening.length > 2) return toast("继续收听的方式最多选择 2 项");
    const data = collectForm(event.target);
    state.answers.needs = { ...data, afterListening, durationMs: pageDuration() };
    log("needs_complete", "", state.answers.needs);
    save();
    goTo("infoRank");
  }

  if (event.target.id === "revealForm") {
    event.preventDefault();
    if (!state.selectedFields.length) return toast("请至少选择一类信息");
    if (!state.selectedEpisode) return toast("请选择一集想听的节目");
    state.answers.infoReveal = {
      fields: [...state.selectedFields], episode: state.selectedEpisode,
      durationMs: pageDuration()
    };
    log("info_reveal_complete", state.selectedEpisode, state.answers.infoReveal);
    save();
    goTo("contentIntro");
  }

  if (event.target.id === "scenarioForm") {
    event.preventDefault();
    const data = collectForm(event.target);
    state.answers.scenario = { episode: data.episode, durationMs: pageDuration() };
    log("scenario_complete", data.episode, state.answers.scenario);
    save();
    goTo("complete");
  }

  if (event.target.id === "contentRatingForm") {
    event.preventDefault();
    if (!state.contentStarts[state.contentIndex]) return toast("请先开始试听计时");
    if (!validateScale(["contentHelp"])) return;
    const data = collectForm(event.target);
    state.answers.contentTrials ||= {};
    const trial = CONTENT_TRIALS[state.contentIndex];
    const elapsedMs = Math.min(Date.now() - state.contentStarts[state.contentIndex], 180000);
    state.answers.contentTrials[state.contentIndex] = {
      feature: trial.feature,
      help: Number(data.contentHelp),
      featureOpened: Boolean(state.featureOpen[state.contentIndex]), elapsedMs,
      audioConfigured: Boolean(audioSource(state.contentIndex))
    };
    log("content_trial_complete", trial.feature, state.answers.contentTrials[state.contentIndex]);
    save();
    if (state.contentIndex === CONTENT_TRIALS.length - 1) goTo("structureIntro");
    else {
      state.contentIndex += 1;
      state.pageEnteredAt = Date.now();
      save();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (event.target.id === "structureComparisonForm") {
    event.preventDefault();
    const data = collectForm(event.target);
    const comparison = state.structureComparisons[state.structureIndex];
    state.answers.structureTrials ||= {};
    state.answers.structureTrials[state.structureIndex] = {
      questionId: comparison.id,
      aType: comparison.a.type,
      aCount: comparison.a.count,
      bType: comparison.b.type,
      bCount: comparison.b.count,
      canonicalAType: comparison.canonicalA.type,
      canonicalACount: comparison.canonicalA.count,
      canonicalBType: comparison.canonicalB.type,
      canonicalBCount: comparison.canonicalB.count,
      sideSwapped: comparison.sideSwapped,
      layoutArm: state.layoutArm,
      visualChoice: data.visualChoice,
      understandingChoice: data.understandingChoice,
      dimensionsAgree: data.visualChoice === data.understandingChoice,
      durationMs: pageDuration()
    };
    log("structure_comparison_complete", comparison.id, state.answers.structureTrials[state.structureIndex]);
    save();
    if (state.structureIndex === state.structureComparisons.length - 1) goTo("interview");
    else {
      state.structureIndex += 1;
      state.pageEnteredAt = Date.now();
      save();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

});

save();
log("session_open", state.participantId, { version: STUDY_VERSION });
render();
