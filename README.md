# 岩中花述播客用户研究网站

这是一个可在本地运行、并已为 ChatGPT Sites 准备的播客信息设计用户研究网站。当前题目以 `Podcasts_Indicators_v2.xlsx` 为依据。

研究流程包括：

1. **参与者信息**：自动编号、性别、年龄、收听频率、常用平台、常听类型、收听场景、创作经验和《岩中花述》熟悉程度。
2. **Task 1 用户需求**：8 道结构化题目，涉及收听偏好、发现渠道、信息需要、判断时间、退出与回溯行为。
3. **Task 2 信息价值**：9 项节目级信息的完整排序、同一9项信息的逐层揭露与单集选择、5 种单集内辅助信息评价。Task 2-A 与 Task 2-B 共用稳定 ID，以支持主观排序与实际查看行为的比较。Task 2-B 的节目卡片使用项目资料库中的真实元数据、主题分析和转写节选。
4. **Task 3 呈现形式**：12 组 A/B 对比，覆盖列表、网状、树状、分类结构及 5、10、15 期数量。
5. **Task 4 访谈与真实场景**：口头讨论四种结构，并在小宇宙中完成节目查找任务。

主观解释统一标记为“（访谈）”，参与者无需在网站填写开放文本。

## 本地运行

可直接打开 `index.html`，或在项目目录启动静态服务器：

```powershell
python -m http.server 8000
```

然后访问 `http://127.0.0.1:8000/`。项目不需要安装依赖或执行构建命令。本地静态服务器不提供数据库 API，网站会继续使用浏览器本地存储。

## 正式实验材料

五个单集内测试支持独立音频文件。将已获得使用许可的音频放入 `assets/audio/`，并在 `study-materials.js` 的 `audioSources` 中填写相对路径。留空时网站使用演示波形，仅用于流程测试。

本地研究者视图可通过 `config.js` 配置；该文件已被 Git 忽略。在 ChatGPT Sites 中，研究者访问使用服务端环境变量 `RESEARCHER_EXPORT_TOKEN` 校验，不把令牌写入代码或 `.openai/hosting.json`。

## 数据记录与导出

- 参与者编号使用日期加 96 位加密随机后缀自动生成，不收集姓名或联系方式。
- 每个浏览器会话另有一个 256 位匿名密钥；密钥只保存在参与者浏览器，D1 只保存 SHA-256 哈希，不能只凭参与者编号覆盖记录。
- 进度、答案、平衡后的 A/B 位置、随机题序和行为事件先保存在浏览器 `localStorage`，在 Sites 环境中再同步到 D1 数据库。
- “答案 CSV”按题号输出结构化答案，便于统计分析。
- “行为日志 CSV”记录页面操作与时间戳。
- JSON 保留完整状态、答案与事件。
- 研究者视图提供“导出数据字典 CSV”，独立于原有统一答案 CSV，不生成实验宽表，也不改变参与者流程。
- 数据字典每行映射 `study_version + question_id + measure + answer_column + response_code` 到中文题目和选项；多选答案按分号拆分后查表。`answer_column` 通常为 `response`，也说明 `timed_out` 和用于解释实验条件的 metadata 字段；`*` 表示通用规则或试次内全部指标。
- 字典附带 `dictionary_revision`：当前问卷仍使用 `study_version=8`，此前同版本内曾修改文案，因此当前字典只核实当前修订，不保证还原同版本历史措辞。未核实的旧排序单独标为历史记录，不套用当前选项。后续修改题意或编码时应保留旧字典并明确版本，避免覆盖历史定义。
- Task 3 的 A/B 是实际屏幕位置，并非固定结构；请结合答案 metadata 中的 `displayAType/displayACount/displayBType/displayBCount` 解读。
- 研究者视图可导出当前参与者数据；Sites 版本还可导出全部答案、全部行为日志，以及将 Task 3 两项选择和真实显示组合展开后的专用 CSV。
- “重新开始”会清除当前本地记录并生成新的参与者编号。

## ChatGPT Sites

- `.openai/hosting.json` 声明逻辑 D1 绑定 `DB`。
- `index.js` 是 Sites 识别的 Worker 入口，转发到 `_worker.js`；后者提供同源保存 API、服务端研究者授权和汇总 CSV 导出。
- `migrations/0001_research_data.sql` 创建 `participants`、`answers` 和 `events` 表；`0002_anonymous_sessions_and_revisions.sql` 增加匿名会话、写入版本与幂等请求字段。
- `.env.example` 只声明所需的环境变量名称，不包含任何真实令牌。

创建站点后应先保存一个未部署版本用于检查。只有在研究者确认后才部署；Sites 的部署 URL 均为生产 URL。

## 项目文档

- [研究背景与方法](RESEARCH_CONTEXT.md)
- [技术背景与运行说明](TECHNICAL_CONTEXT.md)
- [决策记录与后续工作](DECISIONS_AND_NEXT_STEPS.md)

正式采集前仍需确认音频许可、节目元数据来源、样本与排除规则、伦理与隐私说明，并进行完整预测试。

## GitHub Pages 研究者入口

点击右上角“研究者视图”，输入单独提供的专用访问码。Pages 部署把 `pages-config.js` 作为 `config.js` 发布，只包含 SHA-256 哈希，不发布明文码。更换访问码时，应为新的专用随机码生成 SHA-256，更新该文件中的哈希后重新部署；不要使用其他服务的密码。

这是静态页面的界面入口，不是服务端安全认证。它只访问当前浏览器的参与者记录，支持答案、日志、JSON 和数据字典导出；不能读取其他参与者或其他浏览器的数据。Pages 不提供 D1 或汇总 API。正式跨参与者采集仍需 Sites/Worker 的服务端鉴权。原有本地 `config.js` 访问码配置仍可使用。

## 计时与记录约定

- 基本信息各答案行共享阶段用时；Task 1 每题使用 `needsQuestionDurations` 的独立用时，历史缺失留空，不用任务总时长代替。
- Task 2-D 的 Q1/Q2 为页面展示至首次选择的累计时间（不是独立解题时长）；Q3 行使用试次总用时。计时排除明确离开该试次及研究者查看的时间，刷新不重新发放时限。有效试次总用时最多120秒，延迟处理的时间另存 metadata 的 `wallDurationMs`、`timerDelayMs` 以便核对。Task 3 两行共享一组的总用时，最多60秒。
- 已完成的限时试次返回后只读，继续操作不会覆盖原答案或超时标记。未完成的基本信息、Task 2-D 和 Task 3 答案草稿可在刷新后恢复。
- 进入研究者视图暂停原任务计时；阶段跳转是只读预览，不写入实验答案。点击“返回参与者视图”恢复原位置和剩余时间。研究者模式下刷新也恢复原任务并排除暂停时间。
- Task 2-B `selectedFieldIds` 是提交时的信息集合，`viewedFieldIds` 是曾查看的信息集合，`completedAt` 是完成时间。新增字段只对新记录可靠，不能补回此前未保存的历史过程。

## 完整版备份与轻量版

- 完整版：`https://yundouzi.github.io/user-research-study/`，保留 Task 1–4，`study_version=8`。
- 轻量版：`https://yundouzi.github.io/user-research-study/lite/`，仅移除 Task 4，在第12组 Task 3 后结束；`study_version=9`，答案/字典无 Task 4，独立浏览器存储，不覆盖完整版记录。研究者访问码相同。
- 修改前完整版备份标签：`backup-full-study-2026-11-19`，对应提交 `db3809779322c12394d1a4eb2ead89677a8da04b`，可在 GitHub Tags 下载或按该标签检出完整源代码和部署配置。
- 本地检查轻量版可用带 `/lite/` 路径的静态部署产物；回归命令：`LITE_STUDY=1 node tests/recording-audit.test.js`。Pages 工作流自动生成两个入口，共享脚本/样式/音频，保留原有任务条件和长表格式。
