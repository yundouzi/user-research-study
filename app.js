"use strict";

const STORAGE_KEY = "yzhStudyV8State";
const SESSION_STORAGE_KEY = "yzhStudyV8AnonymousSession";
const SYNC_QUEUE_KEY = "yzhStudyV8PendingSync";
const STUDY_VERSION = 8;
const SYNC_ENDPOINT = "/api/study/sync";
const SESSION_ENDPOINT = "/api/study/session";
const CONTENT_TRIAL_LIMIT_MS = 2 * 60 * 1000;

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
  needs: "Task 1 · 收听播客的习惯",
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

const TASK_ONE_QUESTIONS = [
  {
    key: "listeningPreference", type: "radio", title: "你一般更倾向于收听：",
    options: [["subscribedNew","A. 订阅节目的新播客"],["heardOld","B. 听过的旧播客"],["newInteresting","C. 感兴趣的新内容，不在乎是否订阅"]]
  },
  {
    key: "discoveryStart", type: "checkbox", max: 2, title: "当你想寻找新的播客内容时，通常从哪里开始？",
    options: [["home","A. 平台首页或排行榜推荐"],["search","B. 关键词搜索"],["subscriptions","C. 订阅列表中的节目"],["social","D. 社交媒体推荐"],["friends","E. 朋友推荐"],["ai","F. AI 推荐"],["other","G. 其他"]],
    otherKey: "discoveryStartOther", otherPlaceholder: "请填写其他寻找方式"
  },
  {
    key: "mostWantedInfo", type: "checkbox", max: 2, title: "在决定是否收听一集陌生播客时，你最希望知道的是什么？",
    options: [["what","A. 这期播客究竟讨论什么"],["depth","B. 讨论是否足够深入"],["guest","C. 嘉宾的观点是否值得听"],["context","D. 音频是否适合当前场景或时间"],["interest","E. 内容是否符合自己的兴趣"],["other","F. 其他"]],
    otherKey: "mostWantedInfoOther", otherPlaceholder: "请填写其他信息"
  },
  {
    key: "informationNeed", type: "radio", title: "在收听播客前，你认为多大程度上需要了解播客的内容信息？",
    options: [["blind","A. 完全不知道，开盲盒也可以"],["type","B. 至少知道是哪个类型的播客"],["topicGuest","C. 至少知道主题、嘉宾"],["summary","D. 至少知道以上信息，并看过内容简介"],["reviews","E. 知道以上所有信息，并查看评论区评价"],["transcript","F. 还会浏览转写文本"]]
  },
  {
    key: "decisionTime", type: "radio", title: "一般情况下，你需要听多久来决定继续收听还是退出？",
    options: [["under1","A. 1 分钟内"],["oneToThree","B. 1—3 分钟"],["threeToTen","C. 3—10 分钟"],["tenToThirty","D. 10—30 分钟"],["overThirty","E. 30 分钟以上"]]
  },
  {
    key: "mismatchAction", type: "radio", title: "如果听后发现一集播客不符合预期，你通常会怎么做？",
    options: [["exit","A. 立即退出"],["seek","B. 跳到其他时间位置继续尝试"],["speed","C. 加速收听"],["finish","D. 仍然继续听完"],["rare","E. 很少出现这种情况"]]
  },
  {
    key: "refindFrequency", type: "radio", title: "你是否曾想重新找到之前在播客中听过的一句话、某个观点或某段讨论？",
    options: [["often","A. 经常"],["sometimes","B. 偶尔"],["rarely","C. 很少"],["never","D. 从未"]]
  },
  {
    key: "afterListening", type: "radio", title: "听完一期播客后，你意犹未尽，你会选择什么样的播客继续收听？",
    options: [["nextShow","A. 同栏目的下一期播客"],["system","B. 系统推荐的下一期播客"],["similar","C. 主题类似的播客"],["stop","D. 不再继续听"]]
  }
];

const RANKING_FIELDS = [
  { id: "podcast_title", label: "播客标题" },
  { id: "hosts_guests", label: "主持人与嘉宾" },
  { id: "duration", label: "播客时长" },
  { id: "topic_tags", label: "主题标签" },
  { id: "description", label: "播客简介" },
  { id: "comments", label: "评论区" },
  { id: "play_count", label: "播放量" },
  { id: "similar_recommendations", label: "相似播客推荐" },
  { id: "transcript", label: "转写文本" }
];

// Task 2-A 与 Task 2-B 共用同一组稳定字段 ID。
const INFORMATION_FIELDS = RANKING_FIELDS;
const INFORMATION_LABELS = Object.fromEntries(RANKING_FIELDS.map(field => [field.id, field.label]));

const INFORMATION_FIELD_IDS = {
  "播客标题": "podcast_title",
  "主持人与嘉宾": "hosts_guests",
  "播客时长": "duration",
  "主题标签": "topic_tags",
  "播客简介": "description",
  "评论区": "comments",
  "播放量": "play_count",
  "相似播客推荐": "similar_recommendations",
  "转写文本": "transcript",
  // 兼容旧版本参与者的本地状态与导出数据。
  "标题": "podcast_title",
  "主持人": "hosts_guests",
  "时长": "duration",
  "简介": "description",
  "评论概览": "comments",
  "相似播客": "similar_recommendations",
  "内容主题划分（时间轴）": "topic_timeline",
  "时间戳评论": "timestamp_comments",
  "情感分析": "sentiment_analysis",
  "音频分析特征": "audio_features"
};

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

// Task 2-B 使用项目资料库中的真实节目元数据与转写节选。
// 评论为研究者根据真实评论截图整理的精选节选；播放量不使用评论数替代。
const TASK2B_EPISODES = [
  {
    id: "S4E5", sourceEpisodeNumber: 33,
    title: "S4E5 在迪士尼和HBO做高管，我卖过的电影比看过的多",
    host: "陈鲁豫", guest: "范贝贝", duration: "1:16:30", playCount: 212661,
    topicTags: ["代际关系和情感", "职业经历", "好莱坞的女明星与女性高管"],
    description: "岩中花述第四季第五期节目，鲁豫和范贝贝聊起了传媒人的不同选择。与范贝贝有关的新闻常和大型企业的人事任命相关——华纳兄弟、迪士尼、HBO、苏富比，以至当被人问起有没有看过某部电影时，她总会很自豪地说“没有，但是我卖过。”但她更愿意聊的，是在南极跑马拉松时一望无垠的白色大陆，是在珠峰大本营仰望峰顶时的敬畏之心，还有第一次站上拳台挥出拳头后那种“再也没有不可能”的勇气。这种勇气，让她决意转换赛道，改变生活状态，甚至自己创业。",
    commentOverview: [
      { username: "花花菜", text: "这个贝贝不简单！内在比较强大，又不冒进又不自负，这个系列真的很好。" },
      { username: "猫三思", text: "如果说毛尖老师给了好多灵感，这期贝贝老师在最后给了我一些勇气。" }
    ],
    similar: ["S3E5 你好像奈良美智画的那个小孩", "S4E9 身体的使用说明书，不能只有医生知道", "S9E2 我不优秀，但我依然是一个胜利者"],
    transcriptExcerpt: "今天和我对谈的范贝贝，让我想到了1996年的一部电视剧。那一年范贝贝进入北京广播学院，就是现在的中国传媒大学电视编辑专业上学，我是在那一年去香港工作。此刻的贝贝在伦敦，也是非常巧合，贝贝碰巧是我在广院的学妹。"
  },
  {
    id: "S8E4", sourceEpisodeNumber: 73,
    title: "S8E4 飞向更高远的天空，即便空气稀薄",
    host: "陈鲁豫", guest: "黎紫书", duration: "1:42:20", playCount: 1876041,
    topicTags: ["文学阅读与写作成长", "作家成长与文学创作", "家庭关系与童年成长"],
    description: "岩中花述第八季第四期节目，鲁豫撞上了“若吾不写，无人能写”的黎紫书。卖过鞋、做过厨房帮工、当过小学教师，也曾是《星洲日报》记者，如今，她是马来西亚知名的本土华文作家。家乡怡保没有文学的土壤，她抓住任何阅读的可能，终于在中学图书馆初遇《孔乙己》时真正感知到文学的能量。35岁时她决心飞往故国以外的世界，同时告别奖项、职业与婚姻，用诚实浇灌文字、将生命付诸文学。",
    commentOverview: [
      { username: "Allbetter", text: "打定主意做一个诚实的人，从此在江湖行走便更快意了。" }
    ],
    similar: ["S7E3 有些艰难无法走出，我始终与其共处", "S8E5 他已登岸归家，吾独续写“巫”言", "S7E5 爱，像颤动的内脏，也似地底的岩浆"],
    transcriptExcerpt: "大家好，欢迎来到岩中花述。这两天北京天气好到让人无法相信，已经是秋天的尾声了。在这样一个秋天的尾声，我终于见到了黎紫书。她是来自马来西亚的作家，我在一两年前频繁听到她的名字，今天终于有机会与她见面。"
  },
  {
    id: "S8E8", sourceEpisodeNumber: 77,
    title: "S8E8 冰场上的向日葵，日复一日、向光疯长",
    host: "陈鲁豫", guest: "张虹", duration: "1:29:03", playCount: 1616269,
    topicTags: ["艺术审美与人生感悟", "女性成长与冠军心态", "竞技体育与奥运精神"],
    description: "岩中花述第八季第八期节目，鲁豫带来了一棵在冰场生长的向日葵。7岁的张虹开始练习滑冰，她为滑冰付出23年光阴，走向一条没有退路的单行道。速度滑冰从不馈赠幸运，只能一次次把自己逼到极限。在夺冠与伤病之间，她靠一条主力腿完成了人生最后一场比赛。退役后，她将从竞技中继承的耐力带进更广阔的国际赛场，从零学习语言、规则与秩序。",
    commentOverview: [
      { username: "熙_RKFD", text: "这11分钟的独白真好，就像坐在我旁边和我娓娓道来的老友。" }
    ],
    similar: ["S5E1 相信日复一日的努力，是金斯伯格教会我的事", "S3E1 成名要趁早？你hold不住的时候反而更痛苦", "S6E3 壮阔与极限，在横断山脉，也在柴米油盐"],
    transcriptExcerpt: "在加速、在起飞，我能感受到风声、感受到速度。过去一年我有一些印象很深刻的记忆想跟大家分享。第一个就是岩中花述在成都做的线下活动，与其说是我拥抱了1000个女孩，不如说是我被1000个女孩拥抱。"
  },
  {
    id: "S9E2", sourceEpisodeNumber: 80,
    title: "S9E2 我不优秀，但我依然是一个胜利者",
    host: "陈鲁豫", guest: "张诺", duration: "1:19:09", playCount: 665259,
    topicTags: ["家庭与童年成长", "职业生涯与退役转型", "赛车经历与竞技梦想"],
    description: "岩中花述第九季第二期，鲁豫见到了前赛车手张诺。二十年前，她的人生是另一种速度。父亲痴迷赛车，她早早在心里种下了关于速度的想象。后来她通过女子赛车手选拔成为职业赛车手，在赛场上面对速度，也面对偏见。一次翻车成为梦魇，甲减改变了她的生理与心理，她选择结婚、生子，离开赛场。现在，她想重新回到赛场。",
    commentOverview: [
      { username: "赛车手张诺", text: "谢谢大家对我的鼓励，所有的留言我都有看，我会振作起来的😊" },
      { username: "水色片羽", text: "这一季正在剥离精英叙事，普通人的故事当然值得被讲述。" }
    ],
    similar: ["S4E5 在迪士尼和HBO做高管，我卖过的电影比看过的多", "S3E9 知道自己是少数派，就不要分外在意孤独", "S3E3 天价拍卖背后，我们都是美的暂时保管者"],
    transcriptExcerpt: "大家好，欢迎来到岩中花述。过往采访过的嘉宾都曾经做成过什么事。如果一个人没有成，她的故事还值得讲吗？如果你想听到的是一个普通人追求理想、没有成功、离开再回来、绝地反击的故事，你可能也会失望。今天讲的是一个女人决定去赛车，后来决定做妈妈，现在想再试一次回到赛场。"
  },
  {
    id: "S7E7", sourceEpisodeNumber: 64,
    title: "S7E7 敢于面向黑暗，恰因此心光明",
    host: "陈鲁豫", guest: "劳东燕", duration: "1:15:36", playCount: 1775993,
    topicTags: ["女性处境与性别平等", "性别教育与成长经历", "家庭责任与育儿观念"],
    description: "岩中花述第七季第七期节目，鲁豫遇到正直、勇敢、有阅读量的劳东燕。她走上刑法学道路，有时运的掉落，有自身的优秀，也有不断剔除枝丫的个人选择。她关心社会事件中无力为自己争取权益的群体，提醒技术发展下对公民自由可能产生的风险，也希望更多女性走上决策位置。她相信法律是为捍卫良善价值观所拿起的武器。",
    commentOverview: [
      { username: "Ryann-", text: "劳东燕教授如此敏感，屡次马上get到鲁豫提问的底层在追问的是什么，并马上给出回答。这期听得真爽。" },
      { username: "超人儿", text: "每次手机里蹦出鲁豫对谈嘉宾的名字，我第一反应就是怎么又不认识……" }
    ],
    similar: ["S5E7 哪有所谓的人生胜利组，坦然接受就会散发光芒", "S8E1 她可以为你而死，但不会只为你而活", "S7E9 要走多少路，才能成为一个女人，答案在风中飘荡"],
    transcriptExcerpt: "大家好，欢迎来到岩中花述。今天请到的是清华大学法学院教授、博士生导师劳东燕。她研究的领域是刑法学，日常关注风险社会中的刑法理论和实践。在很多社会事件中，我们都可以听到她的声音。"
  },
  {
    id: "S8E6", sourceEpisodeNumber: 75,
    title: "S8E6 没有魅力的人，也值得拥有世界",
    host: "陈鲁豫", guest: "鸟鸟", duration: "1:26:45", playCount: 3604567,
    topicTags: ["女性成长与年龄焦虑", "艺术审美与个人表达", "脱口秀创作与女性表达"],
    description: "岩中花述第八季第六期节目，鲁豫兑现了与鸟鸟的岩中花述之约。她学龄前常常独自在家，早早懂得了孤独的滋味；大学选择了并不喜欢的地质学专业，又跨学科考入北大中文。在怀疑中探索、经历自由职业与回归故里的尝试后，她遇到了脱口秀。漫长的自我挣扎在语言中被消解、治愈，她也终于感知到自己的存在很重要。",
    commentOverview: [
      { username: "禾尤山", text: "总有一款鄙视链适合你，哈哈哈。" },
      { username: "老刘来了", text: "这期是鸟鸟，我还记得小帕那期，什么时候请李银河，许愿🎁" }
    ],
    similar: ["S9E3 我本布衣，种花种草种春天", "S4E6 译者就是躲在原文背后，一仆侍二主", "S6E9 命运无常，我有常"],
    transcriptExcerpt: "大家好，欢迎来到岩中花述。今天的嘉宾是鸟鸟。我们图书在北京做线下首发时，鸟鸟从上海飞到北京做嘉宾，而且在现场主动问我什么时候可以采访她。我当时有一种灯下黑的感觉，这个嘉宾一直在我身边，于是我们立刻约了今天的时间。"
  },
  {
    id: "S8E7", sourceEpisodeNumber: 76,
    title: "S8E7 从“三反”到“银河”，她走出了时代",
    host: "陈鲁豫", guest: "李银河", duration: "1:24:38", playCount: 2414677,
    topicTags: ["写作、文学与作品", "家庭与童年记忆", "女性成长与社会学研究"],
    description: "岩中花述第八季第七期节目，鲁豫与李银河在新时代的语境中，回望一个人如何被时代反复推搡，又如何一步步站稳自己。她的性别意识启蒙来源于家庭，后来在社会学研习班中第一次真正接触这门研究人如何生活的学问。她一生追求爱与美，与王小波在文学与思想中彼此确认，也在研究中关注女性、婚姻与社会的变化。",
    commentOverview: [
      { username: "清瘦似梅", text: "你好哇，李银河。" },
      { username: "想飞的猫猫", text: "人生还是得紧着好日子先过，谁知道以后怎么样呢。" }
    ],
    similar: ["S7E2 永不做他人的缪斯，亲手写就我的故事", "S6E1 人这一生，不就是放多了收，收多了再放吗？", "S5E7 哪有所谓的人生胜利组，坦然接受就会散发光芒"],
    transcriptExcerpt: "大家好，欢迎来到岩中花述。今天的嘉宾是李银河老师。对于岩中花述的听众来说，银河是一个不太需要定语、不太需要介绍的名字。她一直用温暖的语言表达很超前的观点，而且立场非常坚定。"
  },
  {
    id: "S9E3", sourceEpisodeNumber: 81,
    title: "S9E3 我本布衣，种花种草种春天",
    host: "陈鲁豫", guest: "蔡皋", duration: "1:19:30", playCount: 698756,
    topicTags: ["艺术审美与生活美学", "家庭教育与成长经历", "写作创作与人生阶段"],
    description: "岩中花述第九季第三期节目，鲁豫在刚下过雨的春日清晨，与绘本画家蔡皋一同点石成绿。时代变动曾让她在乡下度过7年教学与劳作的光阴，但凭着“我喜欢，我选择”的主体性，她始终没有让绘画离开生活。36岁时她迈入绘本世界，55岁退休后迎来创作高峰，也在种植、土地与普通生活中形成了自己的美学。",
    commentOverview: [
      { username: "Giaaax", text: "太感人了，之前听岩中花述一直觉得鲁豫老师是那个兜底的人，但是在今天跟蔡皋老师的对话里面鲁豫老师也被赞扬了，像小女孩一样被女性长辈轻轻抚摸了🥺" },
      { username: "cosmomomo", text: "大家爱你，知道不，鲁豫。" }
    ],
    similar: ["S4E6 译者就是躲在原文背后，一仆侍二主", "S8E3 从此我们不忧伤、不害怕", "S8E6 没有魅力的人，也值得拥有世界"],
    transcriptExcerpt: "我采访蔡皋老师后，听说她获得了国际安徒生奖插画家奖，这是插画领域的重要荣誉。她说，得奖就好像在空旷的地方喊了一嗓子，突然听到了来自不同国度、超越语言的回声。接下来才是这期节目真正的开始。"
  }
];

const STRUCTURE_EPISODES = [
  { id:"S4E5", title:"在迪士尼和HBO做高管，我卖过的电影比看过的多", guest:"范贝贝", host:"陈鲁豫", category:"职场探索", tags:["影视行业","职业选择","职场管理","女性职场"], color:"#aa7856" },
  { id:"S8E4", title:"飞向更高远的天空，即便空气稀薄", guest:"黎紫书", host:"陈鲁豫", category:"文学艺术", tags:["文学创作","文化身份","写作人生","职业选择"], color:"#9271a1" },
  { id:"S8E8", title:"冰场上的向日葵，日复一日、向光疯长", guest:"张虹", host:"陈鲁豫", category:"运动人生", tags:["竞技体育","运动员","职业转型","女性职场"], color:"#6f8bba" },
  { id:"S9E2", title:"我不优秀，但我依然是一个胜利者", guest:"张诺", host:"陈鲁豫", category:"运动人生", tags:["竞技体育","赛车","职业转型","女性职场"], color:"#6f8bba" },
  { id:"S7E7", title:"敢于面向黑暗，恰因此心光明", guest:"劳东燕", host:"陈鲁豫", category:"社会观察", tags:["法律","公共表达","性别议题","职业选择"], color:"#728f8e" },
  { id:"S8E6", title:"没有魅力的人，也值得拥有世界", guest:"鸟鸟", host:"陈鲁豫", category:"个人成长", tags:["脱口秀","创作","自我认同","性别议题"], color:"#a77a89" },
  { id:"S8E7", title:"从「三反」到「银河」，她走出了时代", guest:"李银河", host:"陈鲁豫", category:"社会观察", tags:["社会学","亲密关系","女性成长","自我认同"], color:"#728f8e" },
  { id:"S9E3", title:"我本布衣，种花种草种春天", guest:"蔡皋", host:"陈鲁豫", category:"文学艺术", tags:["艺术创作","自然生活","生命经验","女性成长"], color:"#9271a1" },
  { id:"S5E8", title:"要活得很久，我做了这个决定", guest:"张春", host:"陈鲁豫", category:"个人成长", tags:["文学创作","心理健康","女性成长","自我认同"], color:"#a77a89" },
  { id:"S7E9", title:"要走多少路，才能成为一个女人，答案在风中飘荡", guest:"小帕", host:"陈鲁豫", category:"个人成长", tags:["脱口秀","女性成长","家庭关系","自我认同"], color:"#a77a89" },
  { id:"S8E1", title:"她可以为你而死，但不会只为你而活", guest:"蒋胜男", host:"陈鲁豫", category:"文学艺术", tags:["历史写作","文学创作","女性成长","家庭关系"], color:"#9271a1" },
  { id:"S8E2", title:"人如南瓜，可攀援亦可贴地生长", guest:"陈慧", host:"陈鲁豫", category:"文学艺术", tags:["文学创作","家庭关系","自然生活","生命经验"], color:"#9271a1" },
  { id:"S8E3", title:"从此我们不忧伤、不害怕", guest:"扎十一惹", host:"陈鲁豫", category:"个人成长", tags:["自然生活","女性成长","自我认同","职业选择"], color:"#a77a89" },
  { id:"S8E5", title:"他已登岸归家，吾独续写「巫」言", guest:"朱天文", host:"陈鲁豫", category:"文学艺术", tags:["文学创作","文化身份","电影艺术","写作人生"], color:"#9271a1" },
  { id:"S9E1", title:"那朵叫「赞英」的花", guest:"张赞英", host:"陈鲁豫", category:"个人成长", tags:["生命经验","职业选择","家庭关系","女性成长"], color:"#a77a89" }
].map(episode => ({ ...episode, full: `${episode.id} 鲁豫对话${episode.guest}｜${episode.title}` }));

const STRUCTURE_CATEGORIES = ["职场探索", "文学艺术", "运动人生", "社会观察", "个人成长"];
const STRUCTURE_PALETTE = Object.fromEntries(STRUCTURE_EPISODES.map(episode => [episode.category, episode.color]));
const STRUCTURE_NETWORK_VIEWS = {
  5: { positions:{ S4E5:[56.82,77.72],S8E4:[73.01,29.82],S8E8:[28.41,49.12],S9E2:[34.09,65.44],S7E7:[26.99,21.05] }, edges:[{a:"S7E7",b:"S4E5",s:.0737},{a:"S8E4",b:"S7E7",s:.0781},{a:"S8E4",b:"S4E5",s:.0808},{a:"S4E5",b:"S9E2",s:.0902},{a:"S4E5",b:"S8E8",s:.0909},{a:"S8E8",b:"S9E2",s:.3942}] },
  10: { positions:{ S4E5:[22.6,29.3],S8E4:[43.83,8.95],S8E8:[16.48,57.33],S9E2:[25.9,76.05],S7E7:[81.07,70.41],S8E6:[75.77,16.81],S8E7:[55.2,60.67],S9E3:[56.27,90.7],S5E8:[83.52,43.98],S7E9:[58.33,33.42] }, edges:[{a:"S8E4",b:"S4E5",s:.0808},{a:"S8E4",b:"S5E8",s:.09},{a:"S4E5",b:"S9E2",s:.0902},{a:"S4E5",b:"S8E8",s:.0909},{a:"S7E7",b:"S8E6",s:.1048},{a:"S8E7",b:"S5E8",s:.1756},{a:"S8E7",b:"S7E9",s:.1786},{a:"S5E8",b:"S7E9",s:.1966},{a:"S8E6",b:"S7E9",s:.235},{a:"S8E8",b:"S9E2",s:.3942}] },
  15: { positions:{ S4E5:[18.89,73.74],S8E4:[82.23,58.77],S8E8:[24.5,14.91],S9E2:[16.48,28.3],S7E7:[49.5,8.95],S8E6:[16.9,51.8],S8E7:[54.35,92.34],S9E3:[64.93,18.25],S5E8:[40.71,83.04],S7E9:[37.99,64.45],S8E1:[67.16,75.25],S8E2:[60.3,35.45],S8E3:[42.08,44.75],S8E5:[85.3,38.87],S9E1:[57.23,54.63] }, edges:[{a:"S7E7",b:"S8E6",s:.1048},{a:"S8E7",b:"S5E8",s:.1756},{a:"S8E7",b:"S7E9",s:.1786},{a:"S8E7",b:"S8E3",s:.1839},{a:"S5E8",b:"S8E1",s:.1889},{a:"S5E8",b:"S7E9",s:.1966},{a:"S7E9",b:"S8E3",s:.2026},{a:"S5E8",b:"S8E3",s:.2031},{a:"S7E9",b:"S8E1",s:.204},{a:"S8E1",b:"S9E1",s:.2053},{a:"S8E3",b:"S9E1",s:.2074},{a:"S7E9",b:"S9E1",s:.2121},{a:"S9E3",b:"S9E1",s:.2123},{a:"S9E3",b:"S8E3",s:.215},{a:"S8E1",b:"S8E2",s:.2182},{a:"S8E6",b:"S7E9",s:.235},{a:"S9E3",b:"S8E2",s:.2478},{a:"S8E2",b:"S9E1",s:.2538},{a:"S8E8",b:"S9E2",s:.3942},{a:"S8E4",b:"S8E5",s:.4202}] }
};

const CONTENT_TRIALS = [
  {
    id: "T2-D01", featureType: "topic_keyword_timeline", feature: "主题关键词时间轴", startSec: 626, endSec: 685,
    prompt: "请按需收听音频，并在 2 分钟内回答三道题。",
    q1: { text: "鸟鸟小时候独自在家时，为什么需要寻找备用钥匙？", options: [["A","她想打开父母的卧室"],["B","父母把厕所门锁上，避免她接近厨房"],["C","她把家门钥匙弄丢了"],["D","她想去楼下买雪糕"]], correct: "B" },
    q2: { text: "这段经历的叙述顺序是什么？", options: [["A","偷吃雪糕—父母回家—找到钥匙—厕所被锁"],["B","父母回家—厕所被锁—独自在家—买雪糕"],["C","独自在家的风险—厕所被锁—找到备用钥匙—偷吃雪糕忘关冰箱"],["D","找到钥匙—去学校—独自在家—父母回家"]], correct: "C" },
    content: () => `
      <div class="keyword-timeline" aria-label="一分钟内容关键词索引">
        ${keywordMarkerHTML(0, 59, "独自在家的风险")}${keywordMarkerHTML(11, 59, "厨房与厕所")}${keywordMarkerHTML(20, 59, "厕所门被锁")}${keywordMarkerHTML(26, 59, "寻找备用钥匙")}${keywordMarkerHTML(52, 59, "偷吃雪糕")}
        <div class="timeline-line"></div><span class="timeline-start">00:00</span><span class="timeline-end">00:59</span>
      </div>`
  },
  {
    id: "T2-D02", featureType: "transcript", feature: "转写文本", startSec: 1445, endSec: 1503,
    prompt: "请按需收听音频，并在 2 分钟内回答三道题。",
    q1: { text: "鸟鸟为什么说自己在大学里感到不快乐和孤独？", options: [["A","她不喜欢学校所在的城市"],["B","她没有参加任何社团"],["C","她觉得课程太简单"],["D","她关心文学和社会议题，但身边同学很少与她交流这些内容"]], correct: "D" },
    q2: { text: "鸟鸟提到，部分理工科学生相信什么？", options: [["A","读万卷书不如行万里路"],["B","学好数理化，走遍天下都不怕"],["C","兴趣是最好的老师"],["D","实践比理论更重要"]], correct: "B" },
    content: () => `
      <div class="transcript-line"><button class="transcript-time" type="button" data-audio-offset="0">00:00</button><span><b>鲁豫：</b>那这个专业你大学四年学得开心吗？</span></div>
      <div class="transcript-line"><button class="transcript-time" type="button" data-audio-offset="3">00:03</button><span><b>鸟鸟：</b>不开心，因为我从初中开始看杂志。</span></div>
      <div class="transcript-line"><button class="transcript-time" type="button" data-audio-offset="6">00:06</button><span><b>鸟鸟：</b>然后初中可能看《读者》《格言》这种碎片性比较强的文摘，高中看的是文学类一点的杂志。</span></div>
      <div class="transcript-line"><button class="transcript-time" type="button" data-audio-offset="16">00:16</button><span><b>鸟鸟：</b>然后我上大学开始看时评类的，就《凤凰周刊》这种，我就很关心这些事情。</span></div>
      <div class="transcript-line"><button class="transcript-time" type="button" data-audio-offset="23">00:23</button><span><b>鸟鸟：</b>但是我身边没有同学关心这些事情，所以我就经常处于一种挺孤独的状态。</span></div>
      <div class="transcript-line"><button class="transcript-time" type="button" data-audio-offset="30">00:30</button><span><b>鸟鸟：</b>我觉得有时候大家学理工科的学生，我所看到的经常会因为太相信“学好数理化，走遍天下都不怕”，以至于对既有的系统缺乏反思。</span></div>
      <div class="transcript-line"><button class="transcript-time" type="button" data-audio-offset="44">00:44</button><span><b>鸟鸟：</b>然后觉得只要自己能混得好，别的都不重要。但我很关注其他人是怎么生活的、遇到什么事情，这社会还有什么没解决的事情。</span></div>`
  },
  {
    id: "T2-D03", featureType: "timestamp_comment", feature: "时间戳评论", startSec: 3790, endSec: 3860,
    prompt: "请按需收听音频，并在 2 分钟内回答三道题。",
    q1: { text: "为什么前辈女性脱口秀演员对鸟鸟很重要？", options: [["A","她们替鸟鸟修改了全部段子"],["B","她们在舞台上的掌控力让鸟鸟能够想象自己也可以做到"],["C","她们邀请鸟鸟加入相声社团"],["D","她们帮助鸟鸟找到电视台工作"]], correct: "B" },
    q2: { text: "鸟鸟说自己在开始练习一件事之前，通常需要什么？", options: [["A","先获得正式证书"],["B","先得到家人的许可"],["C","先准备完整商业计划"],["D","先看到别人成功完成过这件事"]], correct: "D" },
    content: () => `
      <div class="comment-timeline" aria-label="时间戳评论索引"><div class="timeline-line"></div>${[14,28,42,47,61].map((offset, index) => `<button type="button" class="comment-dot" data-audio-offset="${offset}" style="left:${(offset / 70) * 100}%" aria-label="第 ${index + 1} 条评论，跳转到 ${formatOffset(offset)}">${index + 1}</button>`).join("")}<span class="timeline-start">1:03:10</span><span class="timeline-end">1:04:20</span></div>
      <div class="timestamp-comments">
        ${timestampCommentHTML(1, "柚子哥", "1:03:24", 14, "脑海中蹦出六个字，真的吗，我不信。从第一分钟就大大疑惑于这位嘉宾有气无力的音量和每句尾向下的音调，真的是脱口秀演员吗。")}
        ${timestampCommentHTML(2, "HD724814z", "1:03:38", 28, "这里好感动，所以女孩子才应该去往各行各业，你们只要在那里，就足以给后来的女孩子勇气。")}
        ${timestampCommentHTML(3, "拉链的开口", "1:03:52", 42, "女性榜样留在牌桌上的重要性！")}
        ${timestampCommentHTML(4, "刘亦菲月子版", "1:03:57", 47, "我现在感觉到这个社会没有什么东西是真正重要的。只有你爱他，你才会觉得他重要，脱口秀也是这么一件事情。")}
        ${timestampCommentHTML(5, "Goya_CIHA", "1:04:11", 61, "因为没有相声女演员，所以没有办法去带入她们。很多时候身为女性，在一些男性主导的领域上也有一种局外人的感觉。很感谢各行各业里发光发热的女性前辈们。")}
      </div>`
  },
  {
    id: "T2-D04", featureType: "sentiment_analysis", feature: "情感分析", startSec: 4514, endSec: 4572,
    prompt: "请按需收听音频，并在 2 分钟内回答三道题。",
    q1: { text: "鸟鸟在这段中如何看待“魅力”？", options: [["A","只有有魅力的人才值得被喜欢"],["B","魅力完全由外貌决定"],["C","没有魅力的人也值得拥有好的生活体验"],["D","魅力只能通过表演训练获得"]], correct: "C" },
    q2: { text: "这段对话的情感走向更接近哪一种？", options: [["A","从中性提问转向积极肯定，最后回到反思"],["B","从愤怒持续转向更强烈的愤怒"],["C","始终是悲伤和否定"],["D","完全没有情绪变化"]], correct: "A" },
    content: () => `
      ${sentimentChartHTML([[0,0.0],[9,0.6],[25,0.5],[40,0.7],[49,0.5],[54,0.2]], 58)}
      <p class="helper">每个柱代表一句话的真实逐句情感分值；本片段没有负向句。该结果用于观察表达方向，不代表心理状态诊断。</p>`
  },
  {
    id: "T2-D05", featureType: "audio_features", feature: "音频分析特征", startSec: 2304, endSec: 2366,
    prompt: "请按需收听音频，并在 2 分钟内回答三道题。",
    q1: { text: "鸟鸟对创作的看法发生了什么变化？", options: [["A","她认为只有成熟作家才应发表作品"],["B","她开始认为青涩作品和不完整片段也可能有价值"],["C","她不再阅读卡夫卡"],["D","她认为创作必须带来痛苦"]], correct: "B" },
    q2: { text: "在这段音频中，谁的发言时长占比更高？", options: [["A","鲁豫，约占四分之三"],["B","两人完全相同"],["C","鸟鸟，约占四分之三"],["D","无法听出任何说话人切换"]], correct: "C" },
    audioSeries: [
      { t:0, speaker:"host", loudness:0.906, pitch:22.74 }, { t:8, speaker:"guest", loudness:0.801, pitch:25.77 },
      { t:23, speaker:"guest", loudness:0.734, pitch:23.35 }, { t:26, speaker:"guest", loudness:0.682, pitch:24.51 },
      { t:37, speaker:"host", loudness:0.949, pitch:22.98 }, { t:44, speaker:"guest", loudness:0.840, pitch:25.03 },
      { t:59, speaker:"guest", loudness:0.762, pitch:20.98 }
    ],
    content: () => audioFeaturePanelHTML(4)
  }
];

function formatOffset(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function keywordMarkerHTML(offset, duration, label) {
  const position = Math.max(0, Math.min(100, (offset / duration) * 100));
  return `<button type="button" class="keyword-marker" data-audio-offset="${offset}" style="left:${position}%"><span>${escapeHTML(label)}</span><i></i><time>${formatOffset(offset)}</time></button>`;
}

function timestampCommentHTML(number, username, time, offset, content) {
  return `<article class="timestamp-comment"><span class="comment-number" aria-hidden="true">${number}</span><div><header><b>${escapeHTML(username)}</b><button type="button" data-audio-offset="${offset}">${escapeHTML(time)}</button></header><p>${escapeHTML(content)}</p></div></article>`;
}

function sentimentChartHTML(points, duration) {
  const bars = points.map(([offset, score]) => {
    const direction = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
    return `<div class="sentiment-point ${direction}" style="left:${(offset / duration) * 100}%;--strength:${Math.max(3, Math.abs(score) * 70)}px"><i></i><time>${formatOffset(offset)}</time><b>${Number(score).toFixed(1)}</b></div>`;
  }).join("");
  return `<div class="sentiment-plot" aria-label="正向在中轴线上方、负向在中轴线下方的逐句情感图"><span class="sentiment-axis-label positive">正向 +1</span><span class="sentiment-axis-label neutral">中性 0</span><span class="sentiment-axis-label negative">负向 −1</span><div class="sentiment-zero-line"></div>${bars}</div>`;
}

function audioFeaturePanelHTML(index) {
  const trial = CONTENT_TRIALS[index];
  const metric = state.contentAudioMetric?.[index] || "loudness";
  const values = trial.audioSeries.map(point => Number(point[metric]));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = Math.max(0.001, maximum - minimum);
  const points = trial.audioSeries.map((point, pointIndex) => ({
    ...point,
    x: 42 + (point.t / (trial.endSec - trial.startSec)) * 536,
    y: 158 - ((Number(point[metric]) - minimum) / span) * 105,
    value: values[pointIndex]
  }));
  const lines = points.slice(1).map((point, pointIndex) => {
    const previous = points[pointIndex];
    const speaker = point.speaker === previous.speaker ? point.speaker : previous.speaker;
    return `<line class="audio-series-line ${speaker}" x1="${previous.x}" y1="${previous.y}" x2="${point.x}" y2="${point.y}"></line>`;
  }).join("");
  const dots = points.map(point => `<circle class="audio-series-dot ${point.speaker}" cx="${point.x}" cy="${point.y}" r="4"><title>${point.speaker === "host" ? "鲁豫" : "鸟鸟"} ${formatOffset(point.t)} · ${point.value.toFixed(2)}</title></circle>`).join("");
  const ticks = [0, 15, 30, 45, 62].map(offset => `<text x="${42 + (offset / 62) * 536}" y="190" text-anchor="middle">${formatOffset(offset)}</text>`).join("");
  return `<div class="audio-feature-toolbar" role="group" aria-label="音频特征切换"><button type="button" data-audio-metric="loudness" class="${metric === "loudness" ? "selected" : ""}">音量</button><button type="button" data-audio-metric="pitch" class="${metric === "pitch" ? "selected" : ""}">音高</button></div>
    <div class="audio-feature-legend"><span class="host">鲁豫</span><span class="guest">鸟鸟</span><small>${metric === "loudness" ? "openSMILE Loudness 均值" : "F0 半音值"}</small></div>
    <svg class="audio-feature-chart" viewBox="0 0 620 210" role="img" aria-label="${metric === "loudness" ? "音量" : "音高"}随时间变化折线图"><line class="chart-axis" x1="42" y1="170" x2="578" y2="170"></line><text x="6" y="58">${maximum.toFixed(2)}</text><text x="6" y="162">${minimum.toFixed(2)}</text>${lines}${dots}${ticks}</svg>
    <p class="helper">每个点为真实逐句音频特征均值，线段颜色表示该时段的主要说话人。</p>`;
}

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
let invalidNoticeActive = false;
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
    layoutArm: parseInt(token.slice(0, 2), 16) % 2,
    contentArm: parseInt(token.slice(2, 4), 16) % 2
  };
}

function loadSessionCredential() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
    if (participantIdIsValid(saved?.participantId) && /^[a-f0-9]{64}$/.test(saved?.token) && [0, 1].includes(saved?.layoutArm)) {
      if (![0, 1].includes(saved.contentArm)) saved.contentArm = parseInt(saved.token.slice(2, 4), 16) % 2;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(saved));
      return saved;
    }
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

function rankingInitialOrder(participantId) {
  const ids = RANKING_FIELDS.map(field => field.id);
  const random = seededRandom(`${participantId}-task2a-ranking`);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [ids[index], ids[target]] = [ids[target], ids[index]];
  }
  return ids;
}

function isCompleteRankingIdSet(values) {
  const expected = RANKING_FIELDS.map(field => field.id);
  return Array.isArray(values) && values.length === expected.length && new Set(values).size === expected.length && values.every(value => expected.includes(value));
}

function normalizeInformationFieldId(value) {
  if (RANKING_FIELDS.some(field => field.id === value)) return value;
  return INFORMATION_FIELD_IDS[value] || "";
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
    infoRankingInitial: rankingInitialOrder(id),
    infoRanking: [],
    rankingSelectedId: "",
    selectedFields: [],
    selectedEpisode: "",
    needsIndex: 0,
    needsResponses: {},
    needsQuestionDurations: {},
    contentIndex: 0,
    contentStarts: {},
    featureOpen: {},
    contentArm: sessionCredential.contentArm,
    contentAudioCompleted: {},
    contentTrialPageStarts: {},
    contentDeadlines: {},
    contentPlayback: {},
    contentQuestionTimes: {},
    featureUsageEvents: {},
    contentAudioMetric: {},
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
if (!isCompleteRankingIdSet(state.infoRankingInitial)) state.infoRankingInitial = rankingInitialOrder(state.participantId);
if (!Array.isArray(state.infoRanking) || state.infoRanking.some(id => !RANKING_FIELDS.some(field => field.id === id)) || new Set(state.infoRanking).size !== state.infoRanking.length) {
  if (Array.isArray(state.infoRanking) && state.infoRanking.length) state.legacyInfoRanking = [...state.infoRanking];
  if (state.answers.infoRanking && !state.answers.infoRankingLegacy) state.answers.infoRankingLegacy = state.answers.infoRanking;
  state.infoRanking = [];
}
state.rankingSelectedId = RANKING_FIELDS.some(field => field.id === state.rankingSelectedId) ? state.rankingSelectedId : "";
state.selectedFields = [...new Set((Array.isArray(state.selectedFields) ? state.selectedFields : [])
  .map(normalizeInformationFieldId)
  .filter(id => id && id !== "podcast_title"))].slice(0, 3);
state.needsIndex = Number.isInteger(state.needsIndex) ? Math.min(Math.max(state.needsIndex, 0), TASK_ONE_QUESTIONS.length - 1) : 0;
state.needsResponses ||= state.answers.needs ? { ...state.answers.needs } : {};
state.needsQuestionDurations ||= {};
state.contentArm = [0, 1].includes(state.contentArm) ? state.contentArm : sessionCredential.contentArm;
state.contentAudioCompleted ||= {};
state.contentTrialPageStarts ||= {};
state.contentDeadlines ||= {};
state.contentPlayback ||= {};
state.contentQuestionTimes ||= {};
state.featureUsageEvents ||= {};
state.contentAudioMetric ||= {};
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
  return !window.YZH_STUDY_CONFIG?.staticHosting && !window.location?.hostname?.endsWith(".github.io") && !serverSyncUnavailable && ["http:", "https:"].includes(window.location?.protocol || "");
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
          layoutArm: state.layoutArm,
          contentArm: state.contentArm
        })
      });
      if (response.status === 404 || response.status === 405) serverSyncUnavailable = true;
      if (!response.ok) return false;
      const result = await response.json();
      sessionRegistered = result.participantId === state.participantId && result.layoutArm === state.layoutArm && result.contentArm === state.contentArm;
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

function showIncompleteQuestion(number, message, target) {
  const container = target?.closest?.(".question-card, .pair-question, .scale-block") || target?.querySelector?.(".question-card, .pair-question, .scale-block") || target;
  const prefix = /^\d+$/.test(String(number)) ? `第 ${number} 题` : String(number);
  toast(`${prefix}未完成：${message}`);
  container?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  const input = container?.matches?.("input, select") ? container : container?.querySelector?.("input:not([type='hidden']), select, button");
  window.setTimeout(() => input?.focus?.(), 250);
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
  if (state.step === "needs" && state.needsIndex > 0) {
    state.needsIndex -= 1;
    state.pageEnteredAt = Date.now();
    save();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
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
  if (state.step === "infoRank") state.needsIndex = TASK_ONE_QUESTIONS.length - 1;
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
  return `<div class="section-head"><div class="section-copy"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${copy ? `<p class="lede">${copy}</p>` : ""}</div>${meta ? `<div class="section-meta">${meta}</div>` : ""}</div>`;
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
      <h1>关于播客浏览与推荐方式的用户研究</h1>
      <div class="intro-copy">
        <p>你平时是怎么找到感兴趣的播客的？在决定听哪一期时，你会关注标题、嘉宾、内容简介，还是其他听众的评论？</p>
        <p>我们希望通过这次研究，了解大家平时寻找和选择播客的习惯，以及哪些信息能帮助你更方便地找到喜欢的内容。</p>
        <p>在接下来的体验中，你将回答一些简单的问题，尝试浏览播客内容，并比较几种不同的页面设计。我们想听听你的真实感受，一起探索更方便、更舒适的播客浏览方式。</p>
        <p><strong>本研究没有标准答案，请按照自己的习惯和喜好作答。</strong></p>
      </div>
      <label class="choice" style="margin-top:20px"><input type="checkbox" id="consentCheck"><span>我已了解研究流程，并同意参与本次测试。</span></label>
      <div class="form-actions"><button class="button" id="introNext" type="button" disabled>开始</button></div>
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

const PROFILE_OPTIONS = {
  gender: [["male","男"],["female","女"]],
  listeningFrequency: [["almostDaily","几乎每天"],["weekly3to5","每周 3—5 次"],["weekly1to2","每周 1—2 次"],["monthly1to3","每月 1—3 次"],["rarely","很少收听"]],
  platforms: [["ximalaya","喜马拉雅"],["xiaoyuzhou","小宇宙"],["apple","Apple 播客"],["youtube","YouTube"],["other","其他"]],
  podcastTypes: [["business","商业"],["growthCareer","自我成长与职业探索"],["society","社会"],["stories","故事奇谈"],["humanitiesHistory","人文历史"],["technology","科技"],["health","医疗健康"],["foodLife","饮食生活"],["art","艺术"],["music","音乐"],["casualTalk","趣味闲谈"],["other","其他"]],
  listeningScenes: [["commute","通勤"],["housework","家务"],["exercise","运动"],["walking","散步"],["workStudy","工作或学习"],["beforeSleep","睡前"],["dedicated","安排专门时间认真收听"]],
  creationExperience: [["yes","有"],["no","没有"]],
  showFamiliarity: [["everyEpisode","每期都听"],["moreThanFive","听过 5 期以上"],["twoToFive","听过 2—5 期"],["oneOrTwo","听过一两次"],["never","没听过"]]
};

function renderProfile() {
  return wrap(`${sectionHeader("Before all tasks", "参与者基本信息", "", `<span class="badge">约 3 分钟</span>`)}
    <form id="profileForm" class="narrow">
      <section class="card">
        <label class="field-label" for="participantIdDisplay">参与者编号</label>
        <input class="text-input participant-id-input" id="participantIdDisplay" value="${state.participantId}" readonly aria-readonly="true">
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">1</span><span>性别</span></div>
        ${radioChoices("gender", PROFILE_OPTIONS.gender)}
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">2</span><span>年龄</span></div>
        <input class="text-input" id="participantAge" name="age" type="number" min="12" max="100" inputmode="numeric" required placeholder="请输入年龄" aria-label="请输入年龄">
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">3</span><span>播客收听频率</span></div>
        ${radioChoices("listeningFrequency", PROFILE_OPTIONS.listeningFrequency)}
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">4</span><span>常用播客平台 <small class="muted">（可多选）</small></span></div>
        ${checkboxChoices("platforms", PROFILE_OPTIONS.platforms)}
        <div class="conditional-other-field" id="platformOtherField" hidden>
          <input class="text-input other-input" id="platformOther" name="platformOther" type="text" maxlength="100" placeholder="请填写其他平台" aria-label="请填写其他平台">
        </div>
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">5</span><span>常听的播客类型 <small class="muted">（最多选 3 项）</small></span></div>
        ${limitedCheckboxChoices("podcastTypes", PROFILE_OPTIONS.podcastTypes, 3, "podcastTypeCount")}
        <div class="conditional-other-field" id="podcastTypeOtherField" hidden>
          <input class="text-input other-input" id="podcastTypeOther" name="podcastTypeOther" type="text" maxlength="100" placeholder="请填写其他播客类型" aria-label="请填写其他播客类型">
        </div>
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">6</span><span>收听播客的场景 <small class="muted">（最多选 3 项）</small></span></div>
        ${limitedCheckboxChoices("listeningScenes", PROFILE_OPTIONS.listeningScenes, 3, "listeningSceneCount")}
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">7</span><span>是否有播客创作经验</span></div>
        ${radioChoices("creationExperience", PROFILE_OPTIONS.creationExperience)}
      </section>
      <section class="card question-card">
        <div class="question-title"><span class="question-number">8</span><span>对《岩中花述》的熟悉程度</span></div>
        ${radioChoices("showFamiliarity", PROFILE_OPTIONS.showFamiliarity)}
      </section>
      <div class="form-actions"><button class="button" type="submit">提交并开始 Task 1</button></div>
    </form>`);
}

function radioChoices(name, options, required = true) {
  return `<div class="choice-list two-columns">${options.map(([value, label]) => `<label class="choice"><input type="radio" name="${name}" value="${value}" ${required ? "required" : ""}><span>${label}</span></label>`).join("")}</div>`;
}

function taskOneChoices(question, selected) {
  const selectedValues = Array.isArray(selected) ? selected : selected ? [selected] : [];
  const counterId = `${question.key}Count`;
  const inputs = question.options.map(([value, label]) => {
    const checked = selectedValues.includes(value) ? "checked" : "";
    const limitData = question.type === "checkbox" ? `data-choice-limit="${question.max}" data-choice-group="${question.key}" data-counter-id="${counterId}"` : "required";
    return `<label class="choice"><input type="${question.type}" name="${question.key}" value="${value}" ${checked} ${limitData}><span>${label}</span></label>`;
  }).join("");
  const counter = question.type === "checkbox" ? `<p class="helper" id="${counterId}">已选 ${selectedValues.length}/${question.max}</p>` : "";
  return `<div class="choice-list task-one-choice-list">${inputs}</div>${counter}`;
}

function renderNeeds() {
  const questionIndex = state.needsIndex || 0;
  const question = TASK_ONE_QUESTIONS[questionIndex];
  const selected = state.needsResponses?.[question.key];
  const selectedValues = Array.isArray(selected) ? selected : selected ? [selected] : [];
  const selectedOther = selectedValues.includes("other");
  const otherField = question.otherKey ? `<div class="conditional-other-field" id="${question.otherKey}Field" ${selectedOther ? "" : "hidden"}>
    <input class="text-input other-input" id="${question.otherKey}" name="${question.otherKey}" type="text" maxlength="150" value="${escapeHTML(state.needsResponses?.[question.otherKey] || "")}" placeholder="${question.otherPlaceholder}" aria-label="${question.otherPlaceholder}" ${selectedOther ? "required" : ""}>
  </div>` : "";
  const selectionHint = question.max ? `<small class="muted">（最多选 ${question.max} 项）</small>` : "";
  return wrap(`${sectionHeader(`Task 1 · ${questionIndex + 1}/8`, "收听播客的习惯", "请根据你平时使用播客平台的真实习惯作答。", `<span class="badge">第 ${questionIndex + 1} 题，共 8 题</span>`)}
    <form id="needsQuestionForm" class="narrow task-one-form" data-question-number="${questionIndex + 1}">
      <section class="card question-card">
        <div class="question-title"><span class="question-number">${questionIndex + 1}</span><span>${question.title}${selectionHint}</span></div>
        ${taskOneChoices(question, selected)}
        ${otherField}
      </section>
      <div class="form-actions"><button class="button" type="submit">${questionIndex === TASK_ONE_QUESTIONS.length - 1 ? "完成 Task 1" : "下一题"}</button></div>
    </form>`);
}

function renderInfoRank() {
  const rankedIds = state.infoRanking || [];
  const availableIds = state.infoRankingInitial.filter(id => !rankedIds.includes(id));
  const fieldFor = id => RANKING_FIELDS.find(field => field.id === id);
  const selectedId = state.rankingSelectedId;
  const placementCount = selectedId ? rankedIds.length + (rankedIds.includes(selectedId) ? 0 : 1) : 0;
  const pool = availableIds.length ? availableIds.map(id => {
    const field = fieldFor(id);
    return `<button class="ranking-chip ${selectedId === id ? "selected" : ""}" type="button" draggable="true" data-ranking-id="${id}" data-ranking-select="${id}" aria-pressed="${selectedId === id}">${field.label}</button>`;
  }).join("") : `<p class="ranking-empty">所有信息都已放入排序轴，你仍可继续调整。</p>`;
  const axisItems = rankedIds.length ? rankedIds.map((id, index) => {
    const field = fieldFor(id);
    return `<div class="ranking-axis-item ${selectedId === id ? "selected" : ""}" draggable="true" data-ranking-id="${id}" data-ranking-axis-index="${index}">
      <span class="ranking-position">${index + 1}</span>
      <button class="ranking-axis-label" type="button" data-ranking-select="${id}" aria-pressed="${selectedId === id}">${field.label}</button>
      <button class="ranking-remove" type="button" data-ranking-remove="${id}" aria-label="将${field.label}移回待排序区域">×</button>
    </div>`;
  }).join("") : `<div class="ranking-axis-empty">将标签拖到这里，或点击上方标签后选择放置位置</div>`;
  const placements = selectedId ? `<div class="ranking-placement-panel"><span>将“${fieldFor(selectedId).label}”放在：</span><div>${Array.from({ length: placementCount }, (_, index) => `<button type="button" data-ranking-place="${index}" aria-label="放在第 ${index + 1} 位">第 ${index + 1} 位</button>`).join("")}</div></div>` : "";
  return wrap(`${sectionHeader("Task 2-A · 信息偏好", "哪些播客信息对你最有帮助？", "假设你发现了一集感兴趣、但还没有听过的播客。<br>在决定是否收听之前，你认为哪些信息最能帮助你作出判断？<br>请将以下9项信息拖入排序区域，按照从最有帮助到最没有帮助的顺序排列。", `<span class="badge">已排列 ${rankedIds.length}/9 项</span>`)}
    <section class="card ranking-workspace">
      <div class="ranking-pool" id="rankingPool" data-ranking-pool>
        <div class="ranking-region-head"><h2>待排序的信息</h2><span>已排列 ${rankedIds.length}/9 项</span></div>
        <div class="ranking-chip-box">${pool}</div>
      </div>
      <div class="ranking-guidance"><span>← 最有帮助</span><span>拖动标签进行排序，也可以点击标签选择位置。完成后仍可调整顺序。</span><span>最没有帮助 →</span></div>
      <div class="ranking-axis" id="rankingAxis" data-ranking-axis aria-label="从最有帮助到最没有帮助的排序轴">${axisItems}</div>
      ${placements}
      <div class="ranking-footer"><b>已排列 ${rankedIds.length}/9 项</b><span>${rankedIds.length === RANKING_FIELDS.length ? "排序已完成，提交前仍可继续调整。" : "请将全部9项信息放入排序轴。"}</span></div>
      <div class="form-actions"><button class="button" id="rankSubmit" type="button" ${rankedIds.length === RANKING_FIELDS.length ? "" : "disabled"}>完成排序并继续</button></div>
    </section>`);
}

function fieldValue(episode, fieldId) {
  const values = {
    podcast_title: episode.title,
    hosts_guests: `主持人：${episode.host}；嘉宾：${episode.guest}`,
    duration: episode.duration,
    topic_tags: episode.topicTags.join("、"),
    description: episode.description,
    comments: episode.commentOverview,
    play_count: `${compactNumber(episode.playCount)}次播放`,
    similar_recommendations: episode.similar.join("；"),
    transcript: episode.transcriptExcerpt
  };
  return values[fieldId] || "";
}

function revealedFieldHTML(episode, fieldId) {
  const label = escapeHTML(INFORMATION_LABELS[fieldId]);
  if (fieldId === "comments") {
    return `<span class="revealed-field revealed-comments"><b>${label}</b><span class="comment-list">${episode.commentOverview.map(comment => `<span class="comment-item"><span class="comment-username">${escapeHTML(comment.username)}</span><span class="comment-text">${escapeHTML(comment.text)}</span></span>`).join("")}</span></span>`;
  }
  if (fieldId === "similar_recommendations") {
    return `<span class="revealed-field"><b>${label}</b><span class="similar-list">${episode.similar.map(item => `<span>${escapeHTML(item)}</span>`).join("")}</span></span>`;
  }
  const value = fieldValue(episode, fieldId);
  return `<span class="revealed-field ${value ? "" : "empty"}"><b>${label}</b><span class="revealed-value">${value ? escapeHTML(value) : "暂未提供"}</span></span>`;
}

function episodeChoiceHTML(episode) {
  return `<button class="episode-choice ${state.selectedEpisode === episode.id ? "selected" : ""}" type="button" data-episode-choice="${episode.id}">
    <span class="pod-cover">岩中<br>花述</span>
    <span><span class="episode-title">${escapeHTML(episode.title)}</span>
      ${state.selectedFields.length ? `<span class="revealed-info">${state.selectedFields.map(fieldId => {
        return revealedFieldHTML(episode, fieldId);
      }).join("")}</span>` : ""}
    </span>
  </button>`;
}

function renderInfoReveal() {
  return wrap(`${sectionHeader("Task 2-B", "你最想听哪一期播客？", "你可以选择查看最多3种信息。了解这些节目后，选出你最感兴趣的一期播客。", `<span class="badge warm">已选 ${state.selectedFields.length}/3 类信息</span>`)}
    <section class="card">
      <h3>第一步：选择你想查看的信息</h3>
      <p class="muted">播客标题会始终显示；其余信息会同时呈现在每一期节目中。</p>
      <div class="field-picker">${INFORMATION_FIELDS.filter(field => field.id !== "podcast_title").map(field => `<button class="field-chip ${state.selectedFields.includes(field.id) ? "selected" : ""}" type="button" data-field-choice="${field.id}">${field.label}</button>`).join("")}</div>
    </section>
    <section class="card">
      <h3>第二步：选择一集你最想听的节目</h3>
      <p class="muted">点击节目进行选择，确认后点击提交进入下一题。</p>
      <div class="episode-grid">${TASK2B_EPISODES.map(episodeChoiceHTML).join("")}</div>
      <div class="form-actions"><button class="button" id="infoRevealSubmit" type="button" ${state.selectedEpisode ? "" : "disabled"}>提交并继续</button></div>
    </section>`);
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
      <select id="scenarioEpisode" name="episode" required><option value="">请选择</option>${EPISODES.map(episode => `<option value="${episode.id}">${episode.id} 鲁豫对话${episode.guest}｜${episode.title}</option>`).join("")}<option value="other">其他</option></select>
      <div class="conditional-other-field" id="scenarioEpisodeOtherField" hidden>
        <input class="text-input other-input" id="scenarioEpisodeOther" name="episodeOther" type="text" maxlength="150" placeholder="请填写所选播客" aria-label="请填写所选播客">
      </div>
      <div class="interview-callout"><b>（访谈）</b>请口头描述你寻找这期节目的过程，以及过程中查看了哪些信息。</div>
      <div class="form-actions"><button class="button" type="submit">完成研究</button></div>
    </form>`);
}

function renderContentIntro() {
  return wrap(`<div class="hero">
    <section class="hero-panel">
      <div class="eyebrow">Task 2-D</div>
      <h1>辅助信息测试</h1>
      <p class="lede">接下来你将收听5段约1分钟的播客音频，完成相应测试题和评价。每段限时2分钟。</p>
      <ul class="instruction-list"><li>部分片段会提供一种辅助信息，部分片段仅显示音频。</li><li>超过2分钟将保存当前作答并进入下一部分</li></ul>
      <div class="form-actions"><button class="button" id="contentBegin" type="button">开始第 1 个片段</button></div>
    </section>
    <aside class="hero-art"><div class="hero-art-copy"><span>5 段音频</span><strong>2min测试</strong></div></aside>
  </div>`);
}

function waveformHTML() {
  const heights = [24,46,33,66,52,71,38,58,31,75,49,61,28,68,43,55,35,72,47,30,63,41,57,26];
  return `<div class="waveform" aria-hidden="true">${heights.map(height => `<i style="height:${height}px"></i>`).join("")}</div>`;
}

function audioSource(index) {
  return window.YZH_STUDY_MATERIALS?.audioSources?.[index] || "";
}

function featureEnabledFor(index) {
  return state.contentArm === 0 ? index % 2 === 0 : index % 2 === 1;
}

function optionHTML(name, question) {
  return question.options.map(([value, label]) => `<label class="option"><input type="radio" name="${name}" value="${value}" required><span>${value}. ${escapeHTML(label)}</span></label>`).join("");
}

function ensureContentTrialTiming(index = state.contentIndex) {
  const now = Date.now();
  state.contentTrialPageStarts[index] ||= now;
  state.contentDeadlines[index] ||= state.contentTrialPageStarts[index] + CONTENT_TRIAL_LIMIT_MS;
}

function renderContentTrial() {
  ensureContentTrialTiming();
  const trial = CONTENT_TRIALS[state.contentIndex];
  state.contentQuestionTimes[state.contentIndex] ||= { shownAt: Date.now() };
  const enabled = featureEnabledFor(state.contentIndex);
  const isOpen = Boolean(state.featureOpen[state.contentIndex]);
  const source = audioSource(state.contentIndex);
  return wrap(`${sectionHeader(`Task 2-D · ${state.contentIndex + 1}/5`, `片段 ${state.contentIndex + 1}`, trial.prompt, `<span class="badge warm content-timer">剩余 <b id="contentTrialTimer">02:00</b></span>`)}
    <div class="trial-layout ${enabled ? "" : "audio-only"}">
      <section class="card audio-panel">
        <div class="eyebrow">《岩中花述》S8E6 · ${String(Math.floor(trial.startSec / 60)).padStart(2,"0")}:${String(trial.startSec % 60).padStart(2,"0")}–${String(Math.floor(trial.endSec / 60)).padStart(2,"0")}:${String(trial.endSec % 60).padStart(2,"0")}</div>
        ${source ? `<audio class="audio-control" controls preload="metadata" src="${escapeHTML(source)}" data-start="${trial.startSec}" data-end="${trial.endSec}"></audio>` : `<div class="audio-placeholder"><div>${waveformHTML()}<b>音频文件缺失</b><p class="helper">请研究者检查 study-materials.js。</p></div></div>`}
        <p class="helper">可播放、暂停、拖动或重复收听。</p>
      </section>
      ${enabled ? `<section class="card feature-panel">
        <div class="feature-status"><div><div class="eyebrow">辅助信息</div><h2>${trial.feature}</h2></div><button class="feature-toggle" id="featureToggle" type="button">${isOpen ? "收起辅助信息" : `查看${trial.feature}`}</button></div>
        <div class="feature-content" id="featureContent">${isOpen ? trial.content() : `<div class="audio-placeholder"><p>点击右上角按钮查看辅助信息。</p></div>`}</div>
      </section>` : ""}
    </div>
    <form id="contentRatingForm" class="card content-questions" style="margin-top:20px" data-question-number="片段 ${state.contentIndex + 1}">
      <h2>回答问题</h2>
      <fieldset class="question-card"><legend><span class="question-number">Q1</span>${escapeHTML(trial.q1.text)}</legend><div class="options-grid single-column">${optionHTML("contentQ1", trial.q1)}</div></fieldset>
      <fieldset class="question-card"><legend><span class="question-number">Q2</span>${escapeHTML(trial.q2.text)}</legend><div class="options-grid single-column">${optionHTML("contentQ2", trial.q2)}</div></fieldset>
      <div class="scale-block"><label>Q3　在刚才的任务中，你觉得理解内容并找到问题答案有多容易？</label>${scaleHTML("contentEase", 7, "1 非常困难", "7 非常容易")}</div>
      <p class="helper content-playback-status" id="contentPlaybackStatus">本题限时 2 分钟，可在任意时间提交；超时后将保存当前作答并进入下一题。</p>
      <div class="form-actions"><button class="button" id="contentSubmit" type="submit">${state.contentIndex === CONTENT_TRIALS.length - 1 ? "完成并进入 Task 3" : "提交并进入下一题"}</button></div>
    </form>`);
}

function renderStructureIntro() {
  return wrap(`<div class="hero">
    <section class="hero-panel">
      <div class="eyebrow">Task 3</div>
      <h1>哪一种呈现形式更好？</h1>
      <p class="lede">你将完成12组二选一的选择题，每组限时1min<br>请先选择视觉上更舒适的一项，再选择更容易理解的一项</p>
      <div class="level-strip">
        <div class="level-item"><b>4 种形式</b><span>列表、网状、树状、分类</span></div>
        <div class="level-item"><b>3 种数量</b><span>5、10、15 期节目</span></div>
        <div class="level-item"><b>2 个选择</b><span>视觉舒适、内容理解</span></div>
      </div>
      <div class="notice green" style="margin-top:22px">请比较界面的组织方式本身，不需要挑选或播放节目。</div>
      <div class="form-actions"><button class="button" id="structureBegin" type="button">开始 12 组对比</button></div>
    </section>
    <aside class="hero-art"><div class="hero-art-copy"><span>A / B</span><strong>界面二选一</strong></div></aside>
  </div>`);
}

function structureCoverHTML() {
  return `<span class="t3-cover" aria-hidden="true">岩中<br>花述</span>`;
}

function structureEpisodeDetailHTML(episode) {
  return `<div class="t3-detail-origin"><i style="background:${episode.color}"></i>${escapeHTML(episode.category)} · ${escapeHTML(episode.id)}</div><h3>${escapeHTML(episode.full)}</h3><p>主持人：${escapeHTML(episode.host)}<br>嘉宾：${escapeHTML(episode.guest)}</p><div class="t3-tag-set">${episode.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join("")}</div>`;
}

function structureList(episodes) {
  return `<div class="t3-scroll t3-feed" aria-label="播客列表">${episodes.map(episode => `<button type="button" class="t3-episode-row" data-t3-episode="${episode.id}" aria-label="查看${episode.id}完整信息">${structureCoverHTML()}<span class="t3-episode-copy"><b>${episode.id} · ${escapeHTML(episode.title)}</b><small>${escapeHTML(episode.guest)} <i style="background:${episode.color}"></i><em>${escapeHTML(episode.category)}</em></small></span></button>`).join("")}</div>`;
}

function structureNetwork(episodes, count) {
  const view = STRUCTURE_NETWORK_VIEWS[count];
  const edges = view.edges.map(edge => {
    const from = view.positions[edge.a];
    const to = view.positions[edge.b];
    const opacity = Math.max(.2, Math.min(.9, .22 + edge.s * 1.65));
    const width = (1 + 9 * edge.s).toFixed(2);
    return `<line class="t3-edge" data-t3-a="${edge.a}" data-t3-b="${edge.b}" x1="${(from[0] * 3.52).toFixed(2)}" y1="${(from[1] * 5.70).toFixed(2)}" x2="${(to[0] * 3.52).toFixed(2)}" y2="${(to[1] * 5.70).toFixed(2)}" stroke-opacity="${opacity}" stroke-width="${width}"></line>`;
  }).join("");
  const nodes = episodes.map(episode => {
    const position = view.positions[episode.id];
    return `<button type="button" class="t3-net-node" style="left:${position[0]}%;top:${position[1]}%;--cat:${episode.color}" data-t3-node data-t3-episode="${episode.id}" aria-label="${episode.id} ${escapeHTML(episode.guest)}，查看完整信息"><span>${episode.id} · ${escapeHTML(episode.guest)}</span><small>${escapeHTML(episode.category)}</small></button>`;
  }).join("");
  const legend = Object.entries(STRUCTURE_PALETTE).map(([name, color]) => `<span><i style="background:${color}"></i>${escapeHTML(name)}</span>`).join("");
  return `<div class="t3-network-shell"><div class="t3-net-stage" data-t3-network><svg viewBox="0 0 352 570" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>${nodes}<div class="t3-net-foot">${episodes.length} 节点 · ${view.edges.length} 条联系</div></div><div class="t3-network-legend">${legend}<small>主题越相似，节点越近、连线越粗</small></div></div>`;
}

function structureGroupedEpisodes(episodes) {
  return STRUCTURE_CATEGORIES.map(category => ({ category, color: STRUCTURE_PALETTE[category], episodes: episodes.filter(episode => episode.category === category) })).filter(group => group.episodes.length);
}

function structureTree(episodes, instance) {
  const groups = structureGroupedEpisodes(episodes);
  return `<div class="t3-scroll t3-tree" aria-label="播客层级树"><div class="t3-root-node">${structureCoverHTML()}<div><b>岩中花述 · 播客节目</b><small>${episodes.length} 期单集 · ${groups.length} 个主题 · 主持人 陈鲁豫</small></div></div><div class="t3-tree-stack">${groups.map((group, index) => `<section class="t3-tree-section" style="--cat:${group.color}"><i class="t3-tree-branch"></i><button type="button" class="t3-topic-head" data-t3-tree-toggle="${instance}-${index}" aria-expanded="true"><i></i><b>${escapeHTML(group.category)}</b><small>${group.episodes.length} 期</small><span>⌄</span></button><div class="t3-branch-content" data-t3-tree-content="${instance}-${index}">${group.episodes.map(episode => `<button type="button" class="t3-episode-leaf" data-t3-episode="${episode.id}" aria-label="${episode.id} ${escapeHTML(episode.guest)}，查看完整信息">${structureCoverHTML()}<span><b>${episode.id} · ${escapeHTML(episode.guest)}</b><small>${escapeHTML(episode.title)}</small></span><i></i></button>`).join("")}</div></section>`).join("")}</div><p class="t3-tree-hint">点击主题收起分支；点击单集了解详情</p></div>`;
}

function structureClusters(episodes, instance) {
  const groups = structureGroupedEpisodes(episodes);
  const filters = ["全部", ...groups.map(group => group.category)].map((category, index) => `<button type="button" class="t3-category-filter ${index === 0 ? "active" : ""}" data-t3-filter="${escapeHTML(category)}" data-t3-instance="${instance}" aria-pressed="${index === 0}">${escapeHTML(category)}</button>`).join("");
  const cards = groups.map(group => `<section class="t3-category-card" data-t3-category="${escapeHTML(group.category)}" style="--cat:${group.color};--wash:${group.color}12;--line:${group.color}55"><header><i></i><b>${escapeHTML(group.category)}</b><small>${group.episodes.length} 期播客</small></header><div>${group.episodes.map(episode => `<button type="button" class="t3-category-entry" data-t3-episode="${episode.id}" aria-label="${episode.id} ${escapeHTML(episode.guest)}，查看完整信息">${structureCoverHTML()}<span><b>${episode.id} · ${escapeHTML(episode.guest)}</b><small>${escapeHTML(episode.title)}</small><em>${episode.tags.slice(0, 2).map(tag => `<i>${escapeHTML(tag)}</i>`).join("")}</em></span></button>`).join("")}</div></section>`).join("");
  return `<div class="t3-scroll t3-categories" data-t3-category-root="${instance}" aria-label="播客主题分类"><nav>${filters}</nav>${cards}<p>已按主题整理全部 ${episodes.length} 期节目</p></div>`;
}

function structureHTML(type, count, instance = `${type}-${count}`) {
  const episodes = STRUCTURE_EPISODES.slice(0, count);
  const content = type === "list" ? structureList(episodes) : type === "network" ? structureNetwork(episodes, count) : type === "tree" ? structureTree(episodes, instance) : structureClusters(episodes, instance);
  const notes = { list:"单集标题 · 嘉宾 · 主题", network:"靠近表示相关 · 点击查看详情", tree:"展开主题分支 · 点击单集查看详情", cluster:"主题分组 · 可筛选感兴趣的类别" };
  return `<div class="phone t3-phone density-${count}" data-t3-instance="${instance}"><div class="phone-screen"><div class="t3-status"><span>9:41</span><span>●● ▰</span></div><div class="t3-app-head"><b>岩中花述</b><small>${count} 期 · ${STRUCTURE_TYPES[type].label}</small></div><div class="t3-screen-note">${notes[type]}</div><div class="t3-phone-content">${content}</div></div></div>`;
}

function renderStructureTrial() {
  state.structureDeadlines ||= {};
  state.structureDeadlines[state.structureIndex] ||= Date.now() + 60000;
  const comparison = state.structureComparisons[state.structureIndex];
  const aMeta = STRUCTURE_TYPES[comparison.a.type];
  const bMeta = STRUCTURE_TYPES[comparison.b.type];
  const optionLabel = (side, condition, metadata) => `${side}：${metadata.label}结构 · ${condition.count} 期`;
  return wrap(`${sectionHeader(`Task 3 · ${state.structureIndex + 1}/12`, "选出你觉得更好的界面", "请先整体观察两个手机界面，再完成下方两项选择。", `<span class="badge">题目顺序已随机</span><span class="badge warm content-timer">剩余 <b id="structureTrialTimer">01:00</b></span>`)}
    <div class="comparison-grid">
      <section class="comparison-option"><div class="comparison-label"><b>A</b><span>${aMeta.label}结构 · ${comparison.a.count} 期</span></div><div class="phone-stage compact">${structureHTML(comparison.a.type, comparison.a.count, "A")}</div></section>
      <section class="comparison-option"><div class="comparison-label"><b>B</b><span>${bMeta.label}结构 · ${comparison.b.count} 期</span></div><div class="phone-stage compact">${structureHTML(comparison.b.type, comparison.b.count, "B")}</div></section>
    </div>
    <div class="t3-floating-detail" id="task3Detail" role="status" aria-live="polite"></div>
    <form id="structureComparisonForm" class="card comparison-form">
      <section class="pair-question"><h3>Q1　哪个界面在第一眼看上去更舒适？</h3>${radioChoices("visualChoice", [["A",optionLabel("A", comparison.a, aMeta)],["B",optionLabel("B", comparison.b, bMeta)]])}</section>
      <section class="pair-question"><h3>Q2　哪一个界面更容易找到喜欢的播客？</h3>${radioChoices("understandingChoice", [["A",optionLabel("A", comparison.a, aMeta)],["B",optionLabel("B", comparison.b, bMeta)]])}</section>
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
  if (state.step === "needs") fraction = state.needsIndex / TASK_ONE_QUESTIONS.length;
  if (state.step === "contentTrial") fraction = state.contentIndex / CONTENT_TRIALS.length;
  if (state.step === "structureTrial") fraction = state.structureIndex / state.structureComparisons.length;
  const progress = ((index + fraction + 1) / STEPS.length) * 100;
  document.querySelector("#progressBar").style.width = `${Math.min(100, progress)}%`;
  let label = STEP_LABELS[state.step] || "";
  if (state.step === "needs") label += ` ${state.needsIndex + 1}/8`;
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
  app.focus({ preventScroll: true });
}

function setScale(target, value) {
  const input = document.querySelector(`#${CSS.escape(target)}`);
  if (!input) return;
  input.value = value;
  document.querySelectorAll(`[data-scale-target="${target}"]`).forEach(button => button.classList.toggle("selected", button.dataset.scaleValue === value));
  log("scale_select", target, { value: Number(value) });
}

let task3PinnedKey = "";

function task3EpisodeById(id) {
  return STRUCTURE_EPISODES.find(episode => episode.id === id);
}

function highlightTask3Network(anchor, episodeId) {
  const network = anchor?.closest?.("[data-t3-network]");
  document.querySelectorAll("[data-t3-network]").forEach(other => {
    other.querySelectorAll("[data-t3-node]").forEach(node => node.classList.remove("dimmed", "selected"));
    other.querySelectorAll(".t3-edge").forEach(edge => edge.classList.remove("dimmed", "active"));
  });
  if (!network || !episodeId) return;
  const relatedIds = new Set([episodeId]);
  network.querySelectorAll(".t3-edge").forEach(edge => {
    const active = edge.dataset.t3A === episodeId || edge.dataset.t3B === episodeId;
    edge.classList.toggle("active", active);
    edge.classList.toggle("dimmed", !active);
    if (active) relatedIds.add(edge.dataset.t3A === episodeId ? edge.dataset.t3B : edge.dataset.t3A);
  });
  network.querySelectorAll("[data-t3-node]").forEach(node => {
    node.classList.toggle("selected", node.dataset.t3Episode === episodeId);
    node.classList.toggle("dimmed", !relatedIds.has(node.dataset.t3Episode));
  });
}

function showTask3Detail(anchor, togglePin = false) {
  if (state.step !== "structureTrial") return;
  const episode = task3EpisodeById(anchor.dataset.t3Episode);
  const instance = anchor.closest("[data-t3-instance]")?.dataset.t3Instance || "";
  const key = `${instance}:${episode?.id || ""}`;
  if (!episode) return;
  if (togglePin) {
    if (task3PinnedKey === key) return hideTask3Detail(true);
    task3PinnedKey = key;
  } else if (task3PinnedKey && task3PinnedKey !== key) return;
  const detail = document.querySelector("#task3Detail");
  if (!detail) return;
  detail.innerHTML = structureEpisodeDetailHTML(episode);
  const rect = anchor.getBoundingClientRect();
  const width = 270;
  const height = 205;
  const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.left + rect.width / 2 - width / 2));
  const preferredTop = rect.bottom + 11 + height < window.innerHeight ? rect.bottom + 11 : rect.top - height - 11;
  detail.style.left = `${left}px`;
  detail.style.top = `${Math.max(12, Math.min(window.innerHeight - height - 12, preferredTop))}px`;
  detail.classList.add("visible");
  highlightTask3Network(anchor, episode.id);
}

function hideTask3Detail(force = false) {
  if (task3PinnedKey && !force) return;
  if (force) task3PinnedKey = "";
  document.querySelector("#task3Detail")?.classList.remove("visible");
  highlightTask3Network(null, "");
}

function collectForm(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

function validateScale(ids, questionNumber = "本题评价") {
  const missing = ids.find(id => !document.querySelector(`#${CSS.escape(id)}`)?.value);
  if (missing) {
    showIncompleteQuestion(questionNumber, "请完成评价", document.querySelector(`#${CSS.escape(missing)}`)?.closest(".scale-block"));
    return false;
  }
  return true;
}

function placeRankingItem(id, requestedIndex, interaction = "click", finalIndex = false) {
  if (!RANKING_FIELDS.some(field => field.id === id)) return;
  const from = state.infoRanking.indexOf(id);
  if (from >= 0) state.infoRanking.splice(from, 1);
  let target = Math.max(0, Math.min(Number(requestedIndex), state.infoRanking.length));
  if (!finalIndex && from >= 0 && from < target) target -= 1;
  state.infoRanking.splice(target, 0, id);
  state.rankingSelectedId = "";
  log(from >= 0 ? "ranking_move" : "ranking_add", id, { from, to: target, interaction });
  save();
  render();
}

function removeRankingItem(id, interaction = "click") {
  const from = state.infoRanking.indexOf(id);
  if (from < 0) return;
  state.infoRanking.splice(from, 1);
  state.rankingSelectedId = "";
  log("ranking_remove", id, { from, interaction });
  save();
  render();
}

function bindRankingInteractions() {
  let draggedId = "";
  const clearFeedback = () => {
    document.querySelectorAll(".ranking-axis-item, .ranking-axis, .ranking-pool").forEach(element => element.classList.remove("drop-before", "drop-after", "drag-active"));
  };
  document.querySelectorAll("[data-ranking-id]").forEach(item => {
    item.addEventListener("dragstart", event => {
      draggedId = item.dataset.rankingId;
      item.classList.add("dragging");
      event.dataTransfer?.setData("text/plain", draggedId);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      log("ranking_drag_start", draggedId, { from: state.infoRanking.indexOf(draggedId) });
    });
    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      clearFeedback();
    });
  });
  document.querySelectorAll("[data-ranking-axis-index]").forEach(item => {
    item.addEventListener("dragover", event => {
      event.preventDefault();
      clearFeedback();
      const rect = item.getBoundingClientRect();
      item.classList.add(event.clientX < rect.left + rect.width / 2 ? "drop-before" : "drop-after");
    });
    item.addEventListener("drop", event => {
      event.preventDefault();
      event.stopPropagation();
      const id = draggedId || event.dataTransfer?.getData("text/plain");
      const rect = item.getBoundingClientRect();
      const target = Number(item.dataset.rankingAxisIndex) + (event.clientX >= rect.left + rect.width / 2 ? 1 : 0);
      clearFeedback();
      placeRankingItem(id, target, "drag");
    });
  });
  const axis = document.querySelector("[data-ranking-axis]");
  axis?.addEventListener("dragover", event => { event.preventDefault(); axis.classList.add("drag-active"); });
  axis?.addEventListener("dragleave", event => { if (!axis.contains(event.relatedTarget)) axis.classList.remove("drag-active"); });
  axis?.addEventListener("drop", event => {
    if (event.target.closest("[data-ranking-axis-index]")) return;
    event.preventDefault();
    const id = draggedId || event.dataTransfer?.getData("text/plain");
    clearFeedback();
    placeRankingItem(id, state.infoRanking.length, "drag");
  });
  const pool = document.querySelector("[data-ranking-pool]");
  pool?.addEventListener("dragover", event => { event.preventDefault(); pool.classList.add("drag-active"); });
  pool?.addEventListener("dragleave", event => { if (!pool.contains(event.relatedTarget)) pool.classList.remove("drag-active"); });
  pool?.addEventListener("drop", event => {
    event.preventDefault();
    const id = draggedId || event.dataTransfer?.getData("text/plain");
    clearFeedback();
    removeRankingItem(id, "drag");
  });
}

function bindContentAudio() {
  const audio = document.querySelector(".audio-control");
  if (!audio) return;
  const index = state.contentIndex;
  const trial = CONTENT_TRIALS[index];
  const playback = state.contentPlayback[index] ||= { playbackCount: 0, seekEvents: [], lastTime: trial.startSec };
  let internalSeek = false;
  const clampToClip = () => {
    if (!Number.isFinite(audio.duration)) return;
    const target = Math.min(trial.endSec, Math.max(trial.startSec, audio.currentTime || trial.startSec));
    if (Math.abs(target - audio.currentTime) > 0.05) {
      internalSeek = true;
      audio.currentTime = target;
      window.setTimeout(() => { internalSeek = false; }, 0);
    }
  };
  audio.addEventListener("loadedmetadata", () => {
    internalSeek = true;
    audio.currentTime = trial.startSec;
    window.setTimeout(() => { internalSeek = false; }, 0);
  });
  audio.addEventListener("play", () => {
    clampToClip();
    if (!state.contentStarts[index]) {
      state.contentStarts[index] = Date.now();
      playback.audioStartTime = new Date().toISOString();
      log("audio_trial_start", trial.id, { trial: index + 1, featureType: trial.featureType, featureEnabled: featureEnabledFor(index) });
    }
    playback.playbackCount += 1;
    log("audio_play", trial.id, { playbackCount: playback.playbackCount, positionSec: audio.currentTime - trial.startSec });
    save();
  });
  audio.addEventListener("seeking", () => {
    if (internalSeek) return;
    const from = playback.lastTime ?? trial.startSec;
    clampToClip();
    const event = { at: new Date().toISOString(), fromSec: Math.max(0, from - trial.startSec), toSec: Math.max(0, Math.min(trial.endSec, audio.currentTime) - trial.startSec) };
    playback.seekEvents.push(event);
    log("audio_seek", trial.id, event);
    save();
  });
  audio.addEventListener("timeupdate", () => {
    playback.lastTime = audio.currentTime;
    if (audio.currentTime < trial.endSec - 0.12 || state.contentAudioCompleted[index]) return;
    audio.pause();
    state.contentAudioCompleted[index] = true;
    state.contentQuestionTimes[index] ||= { shownAt: Date.now() };
    log("audio_segment_complete", trial.id, { listenedDurationSec: trial.endSec - trial.startSec });
    save();
    const status = document.querySelector("#contentPlaybackStatus");
    if (status) status.textContent = "音频片段已完整播放；仍可在剩余时间内检查或修改答案。";
  });
}

let contentTrialCompleting = false;

function completeContentTrial(timedOut = false) {
  if (contentTrialCompleting || state.step !== "contentTrial") return;
  const index = state.contentIndex;
  const form = document.querySelector("#contentRatingForm");
  if (!form) return;
  const data = collectForm(form);
  if (!timedOut) {
    if (!data.contentQ1) return showIncompleteQuestion("Q1", "请选择答案", form.querySelector("input[name='contentQ1']"));
    if (!data.contentQ2) return showIncompleteQuestion("Q2", "请选择答案", form.querySelector("input[name='contentQ2']"));
    if (!validateScale(["contentEase"], "Q3")) return;
  }
  contentTrialCompleting = true;
  stopCountdown();
  state.answers.contentTrials ||= {};
  const trial = CONTENT_TRIALS[index];
  const times = state.contentQuestionTimes[index] || {};
  const playback = state.contentPlayback[index] || { playbackCount: 0, seekEvents: [] };
  const pageStart = state.contentTrialPageStarts[index] || state.pageEnteredAt || Date.now();
  state.answers.contentTrials[index] = {
    taskId: "T2-D", trialId: trial.id, experimentArm: state.contentArm === 0 ? "A" : "B",
    feature: trial.feature, featureType: trial.featureType, featureEnabled: featureEnabledFor(index),
    featureOpened: (state.featureUsageEvents[index] || []).some(item => item.action === "open"), featureMaterialReady: trial.materialReady !== false,
    audioStartTime: playback.audioStartTime || (state.contentStarts[index] ? new Date(state.contentStarts[index]).toISOString() : ""),
    q1Answer: data.contentQ1 || "", q1Correct: data.contentQ1 ? data.contentQ1 === trial.q1.correct : null,
    q2Answer: data.contentQ2 || "", q2Correct: data.contentQ2 ? data.contentQ2 === trial.q2.correct : null,
    q3EaseRating: data.contentEase ? Number(data.contentEase) : null,
    q1DurationMs: times.q1AnsweredAt && times.shownAt ? times.q1AnsweredAt - times.shownAt : null,
    q2DurationMs: times.q2AnsweredAt && times.shownAt ? times.q2AnsweredAt - times.shownAt : null,
    trialTotalDurationMs: Math.max(0, Date.now() - pageStart),
    playbackCount: playback.playbackCount || 0,
    playbackSeekEvents: playback.seekEvents || [],
    featureUsageEvents: state.featureUsageEvents[index] || [],
    audioConfigured: Boolean(audioSource(index)),
    timedOut
  };
  log(timedOut ? "content_trial_timeout" : "content_trial_complete", trial.feature, state.answers.contentTrials[index]);
  if (index === CONTENT_TRIALS.length - 1) {
    save();
    contentTrialCompleting = false;
    goTo("structureIntro");
    return;
  }
  state.contentIndex += 1;
  state.pageEnteredAt = Date.now();
  ensureContentTrialTiming();
  save();
  contentTrialCompleting = false;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindContentTrialTimer() {
  stopCountdown();
  ensureContentTrialTiming();
  save({ sync: false, touch: false });
  const timer = document.querySelector("#contentTrialTimer");
  const deadline = state.contentDeadlines[state.contentIndex];
  const update = () => {
    const remainingMs = Math.max(0, deadline - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    if (timer) timer.textContent = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
    if (remainingMs <= 0) completeContentTrial(true);
  };
  update();
  if (state.step === "contentTrial" && !contentTrialCompleting) countdownTimer = window.setInterval(update, 250);
}

function completeStructureTrial(timedOut, data = {}) {
  if (state.step !== "structureTrial") return;
  stopCountdown();
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
    visualChoice: data.visualChoice || null,
    understandingChoice: data.understandingChoice || null,
    dimensionsAgree: data.visualChoice && data.understandingChoice ? data.visualChoice === data.understandingChoice : null,
    timedOut,
    durationMs: Math.min(60000, Math.max(0, Date.now() - (state.structureDeadlines[state.structureIndex] - 60000)))
  };
  log(timedOut ? "structure_comparison_timeout" : "structure_comparison_complete", comparison.id, state.answers.structureTrials[state.structureIndex]);
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

function bindStructureTrialTimer() {
  const draft = state.structureDrafts?.[state.structureIndex] || {};
  for (const name of ["visualChoice", "understandingChoice"]) {
    if (["A", "B"].includes(draft[name])) {
      const input = document.querySelector(`#structureComparisonForm input[name="${name}"][value="${draft[name]}"]`);
      if (input) input.checked = true;
    }
  }
  save({ sync: false, touch: false });
  const index = state.structureIndex;
  const deadline = state.structureDeadlines[index];
  const update = () => {
    if (state.step !== "structureTrial" || state.structureIndex !== index) return;
    const seconds = Math.ceil(Math.max(0, deadline - Date.now()) / 1000);
    const timer = document.querySelector("#structureTrialTimer");
    if (timer) timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    if (seconds === 0) completeStructureTrial(true, state.structureDrafts?.[index] || {});
  };
  countdownTimer = window.setInterval(update, 250);
  update();
}

function bindCurrentView() {
  if (state.step === "structureTrial") bindStructureTrialTimer();
  if (state.step === "infoRank") bindRankingInteractions();
  if (state.step === "contentTrial") {
    bindContentAudio();
    bindContentTrialTimer();
  }
}

function renderResearcher() {
  stopCountdown();
  const completedContent = Object.keys(state.answers.contentTrials || {}).length;
  const completedStructures = Object.keys(state.answers.structureTrials || {}).length;
  const aggregateExports = canUseServerAPI() ? `<button class="button" id="researchExportAllAnswers" type="button">导出全部答案 CSV</button><button class="button secondary" id="researchExportTask2DRaw" type="button">导出 Task 2-D 原始记录</button><button class="button secondary" id="researchExportTask2DSummary" type="button">导出 Task 2-D 汇总结果</button><button class="button secondary" id="researchExportTask3" type="button">导出 Task 3 对比 CSV</button><button class="button secondary" id="researchExportAllEvents" type="button">导出全部日志 CSV</button>` : "";
  app.innerHTML = wrap(`${sectionHeader("Researcher console", "研究执行台", `当前参与者：${state.participantId}`, `<span class="badge dark">${STEP_LABELS[state.step]}</span>`)}
    <div class="research-grid">
      <aside class="card research-nav"><button class="button secondary" id="returnParticipant" type="button">← 返回参与者视图</button><button class="button" id="researchExportCSV" type="button">导出本参与者答案 CSV</button><button class="button secondary" id="researchExportEventsCSV" type="button">导出本参与者日志 CSV</button><button class="button secondary" id="researchExportDictionary" type="button">导出数据字典 CSV</button><button class="button secondary" id="researchExportJSON" type="button">导出本参与者 JSON</button>${aggregateExports}<button class="button secondary" id="markInterrupted" type="button">标记异常中断</button></aside>
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
  const rows = [["participant_id", "study_version", "question_id", "stage", "measure", "response", "duration_ms", "metadata", "timed_out"]];
  const add = (questionId, stage, measure, response, durationMs = "", metadata = "", timedOut = "") => {
    const normalized = Array.isArray(response) ? response.join(";") : response;
    rows.push([state.participantId, STUDY_VERSION, questionId, stage, measure, normalized, durationMs, typeof metadata === "string" ? metadata : JSON.stringify(metadata), timedOut]);
  };
  const profile = state.answers.profile || {};
  add("P1-01", "Pre-interview", "participant_id", state.participantId, profile.durationMs);
  add("P1-02", "Pre-interview", "gender", profile.gender, profile.durationMs);
  add("P1-03", "Pre-interview", "age", profile.age, profile.durationMs);
  add("P1-04", "Pre-interview", "listening_frequency", profile.listeningFrequency, profile.durationMs);
  add("P1-05", "Pre-interview", "platforms", profile.platforms, profile.durationMs, { other: profile.platformOther || "" });
  add("P1-06", "Pre-interview", "podcast_types", profile.podcastTypes, profile.durationMs, { other: profile.podcastTypeOther || "" });
  add("P1-06.5", "Pre-interview", "listening_scenes", profile.listeningScenes, profile.durationMs);
  add("P1-08", "Pre-interview", "creation_experience", profile.creationExperience, profile.durationMs);
  add("P1-09", "Pre-interview", "show_familiarity", profile.showFamiliarity, profile.durationMs);

  const needs = state.answers.needs || {};
  add("T1-01", "Task 1", "listening_preference", needs.listeningPreference, needs.durationMs);
  add("T1-02", "Task 1", "discovery_start", needs.discoveryStart, needs.durationMs, { other: needs.discoveryStartOther || "" });
  add("T1-03", "Task 1", "most_wanted_information", needs.mostWantedInfo, needs.durationMs, { other: needs.mostWantedInfoOther || "" });
  add("T1-07", "Task 1", "information_need", needs.informationNeed, needs.durationMs);
  add("T1-03-duration", "Task 1", "decision_time", needs.decisionTime, needs.durationMs, { sourceQuestionId: "T1-03", note: "源表中编号重复，导出时添加 duration 后缀" });
  add("T1-04", "Task 1", "mismatch_action", needs.mismatchAction, needs.durationMs);
  add("T1-05", "Task 1", "refind_frequency", needs.refindFrequency, needs.durationMs);
  add("T1-06", "Task 1", "after_listening", needs.afterListening, needs.durationMs);

  const ranking = state.answers.infoRanking || {};
  add("T2-E01", "Task 2", "information_ranking", ranking.order, ranking.durationMs, {
    rankingSchemaVersion: 2,
    initialOrder: ranking.initialOrder || [],
    completedAt: ranking.completedAt || "",
    labels: ranking.orderLabels || []
  });
  if (isCompleteRankingIdSet(ranking.order)) {
    ranking.order.forEach((fieldId, index) => {
      const field = RANKING_FIELDS.find(item => item.id === fieldId);
      add(`T2-E01-${fieldId}`, "Task 2", "information_rank", index + 1, ranking.durationMs, {
        fieldId,
        label: field?.label || fieldId,
        initialPosition: (ranking.initialOrder || []).indexOf(fieldId) + 1
      });
    });
  }
  const legacyRanking = state.answers.infoRankingLegacy;
  if (legacyRanking?.order?.length) {
    add("T2-E01-legacy", "Task 2", "legacy_information_ranking", legacyRanking.order, legacyRanking.durationMs, {
      preservedDuringTask2ARedesign: true,
      originalStudyVersion: STUDY_VERSION
    });
  }
  const reveal = state.answers.infoReveal || {};
  add("T2-E02", "Task 2", "selected_episode", reveal.episode, reveal.durationMs, {
    selectedFields: reveal.fields || [],
    selectedFieldIds: reveal.fieldIds || (reveal.fields || []).map(label => INFORMATION_FIELD_IDS[label]).filter(Boolean)
  });
  Object.entries(state.answers.contentTrials || {}).forEach(([index, trial]) => {
    const metadata = {
      taskId: trial.taskId || "T2-D", trialId: trial.trialId || `T2-D0${Number(index) + 1}`,
      experimentArm: trial.experimentArm, featureType: trial.featureType, feature: trial.feature,
      featureEnabled: trial.featureEnabled, featureOpened: trial.featureOpened, featureMaterialReady: trial.featureMaterialReady,
      audioStartTime: trial.audioStartTime, q1DurationMs: trial.q1DurationMs, q2DurationMs: trial.q2DurationMs,
      trialTotalDurationMs: trial.trialTotalDurationMs, playbackCount: trial.playbackCount,
      playbackSeekEvents: trial.playbackSeekEvents || [], featureUsageEvents: trial.featureUsageEvents || [],
      audioConfigured: trial.audioConfigured, timedOut: typeof trial.timedOut === "boolean" ? trial.timedOut : "unknown"
    };
    const questionId = trial.trialId || `T2-D0${Number(index) + 1}`;
    add(questionId, "Task 2-D", "q1_answer", trial.q1Answer, trial.q1DurationMs, metadata, typeof trial.timedOut === "boolean" ? trial.timedOut : "unknown");
    add(questionId, "Task 2-D", "q1_correct", trial.q1Answer ? trial.q1Correct : "", trial.q1DurationMs, metadata, typeof trial.timedOut === "boolean" ? trial.timedOut : "unknown");
    add(questionId, "Task 2-D", "q2_answer", trial.q2Answer, trial.q2DurationMs, metadata, typeof trial.timedOut === "boolean" ? trial.timedOut : "unknown");
    add(questionId, "Task 2-D", "q2_correct", trial.q2Answer ? trial.q2Correct : "", trial.q2DurationMs, metadata, typeof trial.timedOut === "boolean" ? trial.timedOut : "unknown");
    add(questionId, "Task 2-D", "q3_ease_rating", trial.q3EaseRating, trial.trialTotalDurationMs, metadata, typeof trial.timedOut === "boolean" ? trial.timedOut : "unknown");
  });
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
    add(trial.questionId, "Task 3", "visual_comfort_choice", trial.visualChoice, trial.durationMs, metadata, typeof trial.timedOut === "boolean" ? trial.timedOut : "unknown");
    add(trial.questionId, "Task 3", "understanding_choice", trial.understandingChoice, trial.durationMs, { ...metadata, dimensionsAgree: trial.dimensionsAgree }, typeof trial.timedOut === "boolean" ? trial.timedOut : "unknown");
  });
  const interview = state.answers.interview || {};
  add("T4-01", "Task 4", "oral_interview_completed", interview.completed, interview.durationMs);
  const scenario = state.answers.scenario || {};
  add("T4-02", "Task 4", "selected_episode", scenario.episode, scenario.durationMs, { responseMode: "task_and_oral_interview", other: scenario.episodeOther || "" });
  return rows;
}

// The dictionary describes this questionnaire revision only; never relabel older versions.
const DATA_DICTIONARY_REVISION = "2026-11-19-current-questionnaire";
function dataDictionaryRows(version = STUDY_VERSION) {
  if (version !== STUDY_VERSION) throw new Error("没有此 study_version 的已核实数据字典");
  const rows = [["study_version", "dictionary_revision", "question_id", "stage", "measure", "answer_column", "question_text", "response_code", "response_label", "response_type", "notes"]];
  const add = (id, stage, measure, text, options, type = "single", notes = "", column = "response") => {
    for (const [code, label] of options) rows.push([version, DATA_DICTIONARY_REVISION, id, stage, measure, column, text, code, label, type, notes]);
  };
  const dynamic = (id, stage, measure, text, type, notes) => add(id, stage, measure, text, [["", "按实际填写值读取"]], type, notes);
  const profile = [
    ["P1-01", "participant_id", "参与者编号", null, "identifier"],
    ["P1-02", "gender", "性别", "gender"],
    ["P1-03", "age", "年龄", null, "number"],
    ["P1-04", "listening_frequency", "播客收听频率", "listeningFrequency"],
    ["P1-05", "platforms", "常用播客平台", "platforms", "multi"],
    ["P1-06", "podcast_types", "常听的播客类型", "podcastTypes", "multi"],
    ["P1-06.5", "listening_scenes", "收听播客的场景", "listeningScenes", "multi"],
    ["P1-08", "creation_experience", "是否有播客创作经验", "creationExperience"],
    ["P1-09", "show_familiarity", "对《岩中花述》的熟悉程度", "showFamiliarity"]
  ];
  for (const [id, measure, text, key, type = "single"] of profile) {
    if (key) add(id, "Pre-interview", measure, text, PROFILE_OPTIONS[key], type, type === "multi" ? "多选代码以分号分隔；其他文本见 metadata.other" : "");
    else dynamic(id, "Pre-interview", measure, text, type, "编号为匿名标识；年龄单位为岁");
  }
  const needs = [["T1-01", "listening_preference"], ["T1-02", "discovery_start"], ["T1-03", "most_wanted_information"], ["T1-07", "information_need"], ["T1-03-duration", "decision_time"], ["T1-04", "mismatch_action"], ["T1-05", "refind_frequency"], ["T1-06", "after_listening"]];
  TASK_ONE_QUESTIONS.forEach((q, index) => {
    const [id, measure] = needs[index];
    add(id, "Task 1", measure, q.title, q.options, q.type === "checkbox" ? "multi" : "single", "题号沿用答案表；多选以分号分隔，其他文本见 metadata.other；duration_ms 为整个 Task 1 用时，不可逐行相加");
  });
  const rankOptions = RANKING_FIELDS.map(field => [field.id, field.label]);
  add("T2-E01", "Task 2", "information_ranking", "哪些播客信息对你最有帮助？", rankOptions, "ordered_multi", "分号分隔的顺序即名次，从最有帮助到最没有帮助");
  for (const field of RANKING_FIELDS) add(`T2-E01-${field.id}`, "Task 2", "information_rank", `哪些播客信息对你最有帮助？——${field.label}`, Array.from({ length: 9 }, (_, i) => [i + 1, `第${i + 1}名`]), "rank", "1 最有帮助；9 最没有帮助；metadata.initialPosition 为初始位置");
  // A retained legacy ranking may coexist with the current answer. Do not invent its historic options.
  dynamic("T2-E01-legacy", "Task 2", "legacy_information_ranking", "历史信息排序（保留记录）", "legacy", "旧版题目和选项未核实；原始值保留，不按当前题目解释");
  for (const [id, stage, text] of [["T2-E02", "Task 2", "你最想听哪一期播客？"], ["T4-02", "Task 4", "你最终选择了哪一期？"]]) {
    const options = EPISODES.map(episode => [episode.id, `${episode.id} 鲁豫对话${episode.guest}｜${episode.title}`]);
    if (stage === "Task 4") options.push(["other", "其他"]);
    add(id, stage, "selected_episode", text, options, "single", stage === "Task 2" ? "metadata.selectedFieldIds 是查看的信息种类" : "其他节目文本见 metadata.other");
  }
  add("T2-E02", "Task 2", "selected_episode", "查看的信息种类", rankOptions, "multi", "JSON 数组，不是 response 中的节目答案", "metadata.selectedFieldIds");
  for (const trial of CONTENT_TRIALS) {
    for (const key of ["q1", "q2"]) {
      const q = trial[key];
      add(trial.id, "Task 2-D", `${key}_answer`, q.text, q.options, "single", `辅助信息：${trial.feature}；正确选项：${q.correct}；未作答为空`);
      add(trial.id, "Task 2-D", `${key}_correct`, q.text, [[true, "正确"], [false, "错误"], ["", "未作答或无法判定"]], "boolean", "未作答不计为错误");
    }
    add(trial.id, "Task 2-D", "q3_ease_rating", "在刚才的任务中，你觉得理解内容并找到问题答案有多容易？", Array.from({ length: 7 }, (_, i) => [i + 1, i === 0 ? "1 非常困难" : i === 6 ? "7 非常容易" : `${i + 1}（无单独文字标签）`]), "scale", "未作答为空；每段限时120秒");
    add(trial.id, "Task 2-D", "*", "辅助信息类型", [[trial.featureType, trial.feature]], "single", "适用于本试次全部指标行", "metadata.featureType");
    add(trial.id, "Task 2-D", "*", "实验分组", [["A", "奇数片段提供辅助信息"], ["B", "偶数片段提供辅助信息"]], "single", "分组不等于某段实际使用辅助信息；见 featureEnabled / featureOpened", "metadata.experimentArm");
  }
  for (const comparison of STRUCTURE_COMPARISONS) {
    const canonical = `标准组合：A=${STRUCTURE_TYPES[comparison.a.type].label}${comparison.a.count}期；B=${STRUCTURE_TYPES[comparison.b.type].label}${comparison.b.count}期。实际左右位置可能反转，以 metadata.displayAType/displayACount/displayBType/displayBCount 为准`;
    for (const [measure, text] of [["visual_comfort_choice", "哪个界面在第一眼看上去更舒适？"], ["understanding_choice", "哪一个界面更容易找到喜欢的播客？"]]) {
      add(comparison.id, "Task 3", measure, text, [["A", "屏幕左侧 A 界面"], ["B", "屏幕右侧 B 界面"]], "single", canonical + "；未作答为空；每组限时60秒");
    }
    for (const column of ["metadata.displayAType", "metadata.displayBType", "metadata.canonicalAType", "metadata.canonicalBType"]) add(comparison.id, "Task 3", "*", "界面组织形式", Object.entries(STRUCTURE_TYPES).map(([code, item]) => [code, item.label]), "single", canonical, column);
  }
  add("T4-01", "Task 4", "oral_interview_completed", "关于四种结构的看法（口头访谈）", [[true, "口头访谈已完成"], [false, "口头访谈未完成"], ["", "尚无记录"]], "boolean", "不记录口头访谈原文");
  add("*", "*", "*", "是否超时结束", [[true, "达到时限并超时结束"], [false, "时限内正常提交"], ["unknown", "历史数据缺少明确超时记录"], ["", "无时间限制"]], "boolean_or_unknown", "Task 2-D 和 Task 3 同一试次所有行一致；禁止根据 duration_ms 推断", "timed_out");
  add("*", "*", "*", "答案缺失", [["", "未作答或未记录；不自动判错"]], "missing", "区分空白、false 和 unknown；字典只适用于当前 study_version 的本次问卷修订，不追溯解释未核实历史文案");
  return rows;
}

function exportDataDictionary() {
  if (!researcherSessionToken) return toast("请先验证研究者访问权限");
  download(`study-${STUDY_VERSION}-data-dictionary.csv`, csvText(dataDictionaryRows()), "text/csv;charset=utf-8");
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

async function matchesResearcherCode(enteredCode, config = window.YZH_STUDY_CONFIG || {}) {
  if (config.researcherAccessCodeHash) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(enteredCode));
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    return hash === config.researcherAccessCodeHash;
  }
  return Boolean(config.researcherAccessCode && enteredCode === config.researcherAccessCode);
}

async function openResearcherAccess() {
  const configured = await loadLocalConfig();
  document.querySelector("#accessHint").textContent = configured ? "请输入研究者访问码。GitHub Pages 仅导出当前浏览器的数据。" : canUseServerAPI() ? "请输入 Sites 中配置的研究者访问令牌。" : "尚未找到本地 config.js。请先复制 config.example.js 并设置访问码。";
  accessDialog.showModal();
  window.setTimeout(() => document.querySelector("#accessCode").focus(), 50);
}

document.querySelector("#backButton").addEventListener("click", goBack);
document.querySelector("#restartButton").addEventListener("click", resetStudy);
document.querySelector("#researcherButton").addEventListener("click", openResearcherAccess);
document.querySelector("#accessCancel").addEventListener("click", () => accessDialog.close());
document.querySelector("#accessForm").addEventListener("submit", async event => {
  event.preventDefault();
  const hasConfiguredCode = Boolean(window.YZH_STUDY_CONFIG?.researcherAccessCode || window.YZH_STUDY_CONFIG?.researcherAccessCodeHash);
  const enteredCode = document.querySelector("#accessCode").value;
  if (hasConfiguredCode) {
    try {
      if (!await matchesResearcherCode(enteredCode)) return toast("访问码不正确");
    } catch {
      return toast("浏览器无法验证访问码，请使用 HTTPS 或本地服务器");
    }
  }
  if (!hasConfiguredCode) {
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

document.addEventListener("mouseover", event => {
  const target = event.target.closest?.("[data-t3-episode]");
  if (target && !target.contains(event.relatedTarget)) showTask3Detail(target);
});

document.addEventListener("mouseout", event => {
  const target = event.target.closest?.("[data-t3-episode]");
  if (target && !target.contains(event.relatedTarget)) hideTask3Detail();
});

document.addEventListener("focusin", event => {
  const target = event.target.closest?.("[data-t3-episode]");
  if (target) showTask3Detail(target);
});

document.addEventListener("focusout", event => {
  const target = event.target.closest?.("[data-t3-episode]");
  if (target && !target.contains(event.relatedTarget)) hideTask3Detail();
});

window.addEventListener("scroll", () => hideTask3Detail(), true);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && state.step === "structureTrial") hideTask3Detail(true);
});

document.addEventListener("click", event => {
  const scaleButton = event.target.closest("[data-scale-target]");
  if (scaleButton) setScale(scaleButton.dataset.scaleTarget, scaleButton.dataset.scaleValue);

  const treeToggle = event.target.closest("[data-t3-tree-toggle]");
  if (treeToggle && state.step === "structureTrial") {
    const id = treeToggle.dataset.t3TreeToggle;
    const content = document.querySelector(`[data-t3-tree-content="${CSS.escape(id)}"]`);
    const open = treeToggle.getAttribute("aria-expanded") === "true";
    treeToggle.setAttribute("aria-expanded", String(!open));
    treeToggle.querySelector("span").textContent = open ? "›" : "⌄";
    if (content) content.hidden = open;
    log("structure_tree_toggle", id, { open: !open });
    save();
    return;
  }

  const categoryFilter = event.target.closest("[data-t3-filter]");
  if (categoryFilter && state.step === "structureTrial") {
    const instance = categoryFilter.dataset.t3Instance;
    const root = document.querySelector(`[data-t3-category-root="${CSS.escape(instance)}"]`);
    const category = categoryFilter.dataset.t3Filter;
    root?.querySelectorAll("[data-t3-filter]").forEach(button => {
      const active = button === categoryFilter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    root?.querySelectorAll("[data-t3-category]").forEach(card => { card.hidden = category !== "全部" && card.dataset.t3Category !== category; });
    const footer = root?.querySelector(":scope > p");
    if (footer) footer.textContent = category === "全部" ? `已按主题整理全部 ${root.querySelectorAll("[data-t3-episode]").length} 期节目` : `正在查看「${category}」主题`;
    if (root) root.scrollTop = 0;
    log("structure_category_filter", instance, { category });
    save();
    return;
  }

  const task3Episode = event.target.closest("[data-t3-episode]");
  if (task3Episode && state.step === "structureTrial") {
    event.stopPropagation();
    showTask3Detail(task3Episode, true);
    log("structure_episode_detail", task3Episode.dataset.t3Episode, { instance: task3Episode.closest("[data-t3-instance]")?.dataset.t3Instance || "" });
    save();
    return;
  }
  if (state.step === "structureTrial" && !event.target.closest("#task3Detail")) hideTask3Detail(true);

  const timestampButton = event.target.closest("[data-audio-offset]");
  if (timestampButton && state.step === "contentTrial") {
    const audio = document.querySelector(".audio-control");
    const offset = Number(timestampButton.dataset.audioOffset);
    if (audio && Number.isFinite(offset)) {
      const targetTime = CONTENT_TRIALS[state.contentIndex].startSec + offset;
      if (audio.readyState >= 1) audio.currentTime = targetTime;
      else audio.addEventListener("loadedmetadata", () => { audio.currentTime = targetTime; }, { once: true });
      log("auxiliary_timestamp_seek", CONTENT_TRIALS[state.contentIndex].featureType, { offsetSec: offset });
      save();
    }
  }

  const audioMetricButton = event.target.closest("[data-audio-metric]");
  if (audioMetricButton && state.step === "contentTrial") {
    const metric = audioMetricButton.dataset.audioMetric;
    if (!["loudness", "pitch"].includes(metric)) return;
    state.contentAudioMetric[state.contentIndex] = metric;
    const usage = state.featureUsageEvents[state.contentIndex] ||= [];
    const metricEvent = { action: "metric_switch", metric, timestamp: new Date().toISOString(), elapsedMs: state.contentStarts[state.contentIndex] ? Date.now() - state.contentStarts[state.contentIndex] : null };
    usage.push(metricEvent);
    log("feature_metric_switch", CONTENT_TRIALS[state.contentIndex].featureType, metricEvent);
    save();
    const content = document.querySelector("#featureContent");
    if (content) content.innerHTML = audioFeaturePanelHTML(state.contentIndex);
    return;
  }

  if (event.target.id === "introNext") goTo("profile");
  const rankingSelect = event.target.closest("[data-ranking-select]");
  if (rankingSelect) {
    const id = rankingSelect.dataset.rankingSelect;
    state.rankingSelectedId = state.rankingSelectedId === id ? "" : id;
    log("ranking_select", id, { selected: state.rankingSelectedId === id, currentPosition: state.infoRanking.indexOf(id) });
    save();
    render();
    return;
  }
  const rankingRemove = event.target.closest("[data-ranking-remove]");
  if (rankingRemove) {
    removeRankingItem(rankingRemove.dataset.rankingRemove, "click");
    return;
  }
  const rankingPlace = event.target.closest("[data-ranking-place]");
  if (rankingPlace && state.rankingSelectedId) {
    placeRankingItem(state.rankingSelectedId, Number(rankingPlace.dataset.rankingPlace), "click", true);
    return;
  }
  if (event.target.id === "rankSubmit") {
    if (!isCompleteRankingIdSet(state.infoRanking)) return showIncompleteQuestion("排序任务", "请先排列全部9项信息", document.querySelector("#rankingAxis"));
    const completedAt = new Date().toISOString();
    state.answers.infoRanking = {
      order: [...state.infoRanking],
      orderLabels: state.infoRanking.map(id => RANKING_FIELDS.find(field => field.id === id)?.label || id),
      ranks: state.infoRanking.map((id, index) => ({ fieldId: id, rank: index + 1 })),
      initialOrder: [...state.infoRankingInitial],
      initialOrderLabels: state.infoRankingInitial.map(id => RANKING_FIELDS.find(field => field.id === id)?.label || id),
      durationMs: pageDuration(),
      completedAt
    };
    log("info_ranking_complete", "", state.answers.infoRanking);
    save();
    goTo("infoReveal");
  }

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
    if (!state.selectedFields.length) {
      return showIncompleteQuestion("第一步", "请至少选择一类信息", document.querySelector(".field-picker"));
    }
    state.selectedEpisode = episodeButton.dataset.episodeChoice;
    log("episode_select", state.selectedEpisode, { fieldIds: [...state.selectedFields] });
    save();
    render();
    return;
  }

  if (event.target.id === "infoRevealSubmit") {
    if (!state.selectedFields.length) {
      return showIncompleteQuestion("第一步", "请至少选择一类信息", document.querySelector(".field-picker"));
    }
    if (!state.selectedEpisode) {
      return showIncompleteQuestion("第二步", "请选择一集你最想听的节目", document.querySelector(".episode-grid"));
    }
    state.answers.infoReveal = {
      fields: state.selectedFields.map(id => INFORMATION_LABELS[id]),
      fieldIds: [...state.selectedFields],
      episode: state.selectedEpisode,
      durationMs: pageDuration()
    };
    log("info_reveal_complete", state.selectedEpisode, state.answers.infoReveal);
    save();
    goTo("contentIntro");
    return;
  }

  if (event.target.id === "contentBegin") {
    state.contentIndex = 0;
    goTo("contentTrial");
  }
  if (event.target.id === "featureToggle") {
    if (!featureEnabledFor(state.contentIndex)) return;
    state.featureOpen[state.contentIndex] = !state.featureOpen[state.contentIndex];
    const usage = state.featureUsageEvents[state.contentIndex] ||= [];
    const featureEvent = { action: state.featureOpen[state.contentIndex] ? "open" : "close", timestamp: new Date().toISOString(), elapsedMs: state.contentStarts[state.contentIndex] ? Date.now() - state.contentStarts[state.contentIndex] : null };
    usage.push(featureEvent);
    log("feature_toggle", CONTENT_TRIALS[state.contentIndex].featureType, featureEvent);
    save();
    const button = document.querySelector("#featureToggle");
    const content = document.querySelector("#featureContent");
    if (button) button.textContent = state.featureOpen[state.contentIndex] ? "收起辅助信息" : `查看${CONTENT_TRIALS[state.contentIndex].feature}`;
    if (content) content.innerHTML = state.featureOpen[state.contentIndex] ? CONTENT_TRIALS[state.contentIndex].content() : `<div class="audio-placeholder"><p>点击右上角按钮查看辅助信息。</p></div>`;
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
  if (event.target.id === "researchExportDictionary" && researcherSessionToken) exportDataDictionary();
  if (event.target.id === "researchExportAllAnswers") exportAggregateCSV("answers");
  if (event.target.id === "researchExportTask2DRaw") exportAggregateCSV("task2d-raw");
  if (event.target.id === "researchExportTask2DSummary") exportAggregateCSV("task2d-summary");
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

document.addEventListener("invalid", event => {
  event.preventDefault();
  if (invalidNoticeActive) return;
  invalidNoticeActive = true;
  window.setTimeout(() => { invalidNoticeActive = false; }, 400);
  const card = event.target.closest?.(".question-card");
  const pair = event.target.closest?.(".pair-question");
  const form = event.target.closest?.("form");
  const cardNumber = card?.querySelector?.(".question-number")?.textContent?.trim();
  const pairNumber = pair?.querySelector?.("h3")?.textContent?.match(/Q(\d+)/)?.[1];
  const questionNumber = cardNumber || pairNumber || form?.dataset?.questionNumber || "本页问题";
  showIncompleteQuestion(questionNumber, "请选择或填写答案", event.target);
}, true);

document.addEventListener("change", event => {
  if (state.step === "structureTrial" && ["visualChoice", "understandingChoice"].includes(event.target.name)) {
    state.structureDrafts ||= {};
    const draft = state.structureDrafts[state.structureIndex] ||= {};
    draft[event.target.name] = event.target.value;
    save();
  }
  if (event.target.id === "consentCheck") document.querySelector("#introNext").disabled = !event.target.checked;
  if (state.step === "contentTrial" && ["contentQ1", "contentQ2"].includes(event.target.name)) {
    const times = state.contentQuestionTimes[state.contentIndex] ||= { shownAt: Date.now() };
    const key = event.target.name === "contentQ1" ? "q1AnsweredAt" : "q2AnsweredAt";
    if (!times[key]) times[key] = Date.now();
    log("content_answer_change", `${CONTENT_TRIALS[state.contentIndex].id}-${event.target.name}`, { value: event.target.value });
    save();
  }
  if (event.target.matches("[data-choice-limit]")) {
    const limit = Number(event.target.dataset.choiceLimit);
    const group = event.target.dataset.choiceGroup;
    const selector = `[data-choice-group="${CSS.escape(group)}"]:checked`;
    const checked = [...document.querySelectorAll(selector)];
    if (checked.length > limit) {
      event.target.checked = false;
      const questionNumber = event.target.closest(".question-card")?.querySelector(".question-number")?.textContent?.trim();
      if (questionNumber) showIncompleteQuestion(questionNumber, `最多选择 ${limit} 项`, event.target);
      else toast(`最多选择 ${limit} 项`);
    }
    const count = document.querySelectorAll(selector).length;
    const counter = document.querySelector(`#${CSS.escape(event.target.dataset.counterId)}`);
    if (counter) counter.textContent = `已选 ${count}/${limit}`;
  }
  const otherFieldMap = {
    platforms: ["platformOtherField", "platformOther"],
    podcastTypes: ["podcastTypeOtherField", "podcastTypeOther"],
    discoveryStart: ["discoveryStartOtherField", "discoveryStartOther"],
    mostWantedInfo: ["mostWantedInfoOtherField", "mostWantedInfoOther"],
    episode: ["scenarioEpisodeOtherField", "scenarioEpisodeOther"]
  };
  const otherField = otherFieldMap[event.target.name];
  if (otherField) {
    const container = document.querySelector(`#${CSS.escape(otherField[0])}`);
    const input = document.querySelector(`#${CSS.escape(otherField[1])}`);
    if (container && input) {
      const otherOption = document.querySelector(`[name="${CSS.escape(event.target.name)}"][value="other"]`);
      const selectedOther = event.target.tagName === "SELECT" ? event.target.value === "other" : Boolean(otherOption?.checked);
      container.hidden = !selectedOther;
      input.required = selectedOther;
      if (!selectedOther) input.value = "";
      if (selectedOther) input.focus();
    }
  }
});

document.addEventListener("submit", event => {
  if (event.target.id === "profileForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const platforms = formData.getAll("platforms");
    const podcastTypes = formData.getAll("podcastTypes");
    const listeningScenes = formData.getAll("listeningScenes");
    if (!platforms.length) return showIncompleteQuestion(4, "请至少选择一个常用播客平台", event.target.querySelector("input[name='platforms']"));
    if (!podcastTypes.length) return showIncompleteQuestion(5, "请至少选择一种常听的播客类型", event.target.querySelector("input[name='podcastTypes']"));
    if (podcastTypes.length > 3) return showIncompleteQuestion(5, "最多选择 3 项", event.target.querySelector("input[name='podcastTypes']"));
    const platformOther = String(formData.get("platformOther") || "").trim();
    const podcastTypeOther = String(formData.get("podcastTypeOther") || "").trim();
    if (platforms.includes("other") && !platformOther) return showIncompleteQuestion(4, "请填写其他播客平台", event.target.querySelector("#platformOther"));
    if (podcastTypes.includes("other") && !podcastTypeOther) return showIncompleteQuestion(5, "请填写其他播客类型", event.target.querySelector("#podcastTypeOther"));
    if (!listeningScenes.length) return showIncompleteQuestion(6, "请至少选择一个收听场景", event.target.querySelector("input[name='listeningScenes']"));
    if (listeningScenes.length > 3) return showIncompleteQuestion(6, "最多选择 3 项", event.target.querySelector("input[name='listeningScenes']"));
    state.answers.profile = {
      participantId: state.participantId,
      gender: formData.get("gender"),
      age: Number(formData.get("age")),
      listeningFrequency: formData.get("listeningFrequency"),
      platforms,
      platformOther,
      podcastTypes,
      podcastTypeOther,
      listeningScenes,
      creationExperience: formData.get("creationExperience"),
      showFamiliarity: formData.get("showFamiliarity"),
      durationMs: pageDuration()
    };
    log("profile_complete", "", state.answers.profile);
    save();
    state.needsIndex = 0;
    goTo("needs");
  }

  if (event.target.id === "needsQuestionForm") {
    event.preventDefault();
    const questionIndex = state.needsIndex || 0;
    const question = TASK_ONE_QUESTIONS[questionIndex];
    const formData = new FormData(event.target);
    const response = question.type === "checkbox" ? formData.getAll(question.key) : formData.get(question.key);
    const responseCount = Array.isArray(response) ? response.length : response ? 1 : 0;
    if (!responseCount) return showIncompleteQuestion(questionIndex + 1, "请选择至少一个选项", event.target);
    if (question.max && responseCount > question.max) return showIncompleteQuestion(questionIndex + 1, `最多选择 ${question.max} 项`, event.target);
    const otherValue = question.otherKey ? String(formData.get(question.otherKey) || "").trim() : "";
    const includesOther = Array.isArray(response) ? response.includes("other") : response === "other";
    if (includesOther && !otherValue) return showIncompleteQuestion(questionIndex + 1, "请填写“其他”的具体内容", event.target.querySelector(".conditional-other-field"));
    state.needsResponses[question.key] = response;
    if (question.otherKey) state.needsResponses[question.otherKey] = otherValue;
    state.needsQuestionDurations[questionIndex] = pageDuration();
    log("needs_question_complete", question.key, { questionNumber: questionIndex + 1, response, other: otherValue });
    save();
    if (questionIndex < TASK_ONE_QUESTIONS.length - 1) {
      state.needsIndex += 1;
      state.pageEnteredAt = Date.now();
      save();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      state.answers.needs = {
        ...state.needsResponses,
        durationMs: Object.values(state.needsQuestionDurations).reduce((total, value) => total + Number(value || 0), 0)
      };
      log("needs_complete", "", state.answers.needs);
      save();
      goTo("infoRank");
    }
  }

  if (event.target.id === "scenarioForm") {
    event.preventDefault();
    const data = collectForm(event.target);
    data.episodeOther = String(data.episodeOther || "").trim();
    if (data.episode === "other" && !data.episodeOther) return showIncompleteQuestion("本页问题", "请填写所选播客", event.target.querySelector("#scenarioEpisodeOther"));
    state.answers.scenario = { episode: data.episode, episodeOther: data.episodeOther, durationMs: pageDuration() };
    log("scenario_complete", data.episode, state.answers.scenario);
    save();
    goTo("complete");
  }

  if (event.target.id === "contentRatingForm") {
    event.preventDefault();
    completeContentTrial(false);
  }

  if (event.target.id === "structureComparisonForm") {
    event.preventDefault();
    const data = collectForm(event.target);
    completeStructureTrial(false, data);
  }

});

save();
log("session_open", state.participantId, { version: STUDY_VERSION });
render();
