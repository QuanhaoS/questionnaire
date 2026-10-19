# Everyday Information Survey 可分享问卷方案

## version1.1 已实现

本项目现在包含一个 GitHub Pages + Supabase-ready 的 `version1.1`。

v1.1 新增：

- GitHub Pages 自动部署工作流：[.github/workflows/pages.yml](/Users/sunquanhao/Documents/ChatGPT/Elly/.github/workflows/pages.yml)
- Supabase 前端配置文件：[assets/config.js](/Users/sunquanhao/Documents/ChatGPT/Elly/assets/config.js)
- Supabase RLS 权限脚本：[database/supabase-rls.sql](/Users/sunquanhao/Documents/ChatGPT/Elly/database/supabase-rls.sql)
- 数据库兼容 UUID，用于直接写入 PostgreSQL/Supabase。
- 完成问卷后一次性提交到 Supabase 的 `survey_submissions`；如果未配置 Supabase，继续保留本地 JSON/CSV 下载。

### GitHub Pages 发布

代码已经包含 GitHub Actions Pages workflow。推送到 `main` 后，GitHub 会尝试部署静态站点。

如果第一次没有自动发布，到 GitHub repo 页面设置：

1. 打开 `Settings`。
2. 打开 `Pages`。
3. `Build and deployment` 的 `Source` 选择 `GitHub Actions`。
4. 回到 `Actions` 页面，重新运行 `Deploy static survey to GitHub Pages`。

发布成功后的地址通常是：

```text
https://quanhaos.github.io/questionnaire/
```

### Supabase 自动保存配置

在 Supabase SQL Editor 按顺序运行：

1. `database/schema.sql`
2. `database/seed.sql`
3. `database/supabase-rls.sql`

然后编辑 `assets/config.js`：

```js
window.SURVEY_CONFIG = {
  enableRemoteSubmit: true,
  supabaseUrl: "https://YOUR_PROJECT_ID.supabase.co",
  supabasePublishableKey: "YOUR_SUPABASE_PUBLISHABLE_KEY"
};
```

注意：

- 不要把 Supabase secret 或旧版 `service_role` key 放进 `assets/config.js`。
- `assets/config.js` 只能放 `sb_publishable_...` key；它会出现在公开网页中。
- `database/supabase-rls.sql` 只允许匿名插入 `survey_submissions` 一张答卷表，不允许匿名读取、更新或删除，也撤销匿名访问分析视图的权限。
- 完成页显示 `Submitted to Supabase` 才表示远程保存成功；失败后可重试或下载 JSON/CSV。
- 每项结果保存在该行的 `payload.item_responses` 中；研究者可查询 `submission_item_responses` 和 `submission_trial_results_wide` 视图。

研究者在 [Supabase Table Editor](https://supabase.com/dashboard/project/rchpslitiywvtpypmeuv/editor) 查看 `survey_submissions`；逐项导出 SQL 见 [database/README.md](/Users/sunquanhao/Documents/ChatGPT/Elly/database/README.md)。正式招募前仍需补齐页面上的研究联系人、机构信息并确认同意文本和未成年人参与规则；当前部署适合 pilot。

## version1.0 已实现

本项目也保留了 `version1.0` 的本地 pilot 能力。

入口文件：

- [index.html](/Users/sunquanhao/Documents/ChatGPT/Elly/index.html)

核心文件：

- [assets/app.js](/Users/sunquanhao/Documents/ChatGPT/Elly/assets/app.js)：问卷流程、随机化、逐项记录、JSON/CSV 导出。
- [assets/styles.css](/Users/sunquanhao/Documents/ChatGPT/Elly/assets/styles.css)：问卷界面样式。
- [tests/test_static_survey.py](/Users/sunquanhao/Documents/ChatGPT/Elly/tests/test_static_survey.py)：静态结构和数据一致性测试。
- [VERSION](/Users/sunquanhao/Documents/ChatGPT/Elly/VERSION)：当前版本号。

本地运行：

```bash
python3 -m http.server 8000
```

然后打开：

```text
http://localhost:8000
```

也可以直接双击打开 `index.html` 进行本地 pilot。

运行测试：

```bash
python3 -m unittest discover -s tests
```

v1.0 已包含：

- 参与者同意页面。
- 人口学信息页面。
- 7 个 trial 的随机呈现。
- 每个类别随机抽取 1 条 statement。
- 每位参与者使用 C1-C7 中一个 condition，并保证 7 种 source 在该参与者内不重复。
- pre-source 页面 4 个 slider。
- post-source 页面 1 个 confidence slider。
- slider 必须实际移动后才允许继续，视觉默认 50 不会被静默记录。
- source reveal 后不提供返回修改 pre-source confidence 的入口。
- final check 和 debriefing。
- 浏览器 `localStorage` 自动保存进度。
- 完成后可下载 JSON 和 CSV。
- 导出字段对齐 [database/schema.sql](/Users/sunquanhao/Documents/ChatGPT/Elly/database/schema.sql) 和 `trial_results_wide` 视图。

注意：v1.0 是本地可运行和可 pilot 的静态版本。正式线上收数时，建议把保存逻辑从 `localStorage` 接到 Supabase/PostgreSQL 后端 API，或使用 Qualtrics/LimeSurvey 并按本项目数据库 schema 做数据备份。

## 当前输入

- 调查文件：`/Users/sunquanhao/Downloads/Everyday_Information_Survey_Friendly.docx`
- 分享对话链接：`https://chatgpt.com/share/e/6ac5fbe9-896c-8327-94d2-18eb01dd8d2f`

说明：该分享链接当前显示“Sign in to view this conversation / This workspace requires single sign-on”，我无法直接读取对话内容。因此，本方案主要基于 Word 调查文件本身整理；如果后续补充对话文本，可以把其中对目标平台、样式、研究限制或发布方式的偏好并入本 README。

## 目标

把 `Everyday Information Survey` 从 Word 文档转换成一个可以通过链接分享、在手机和电脑上填写、并能导出结构化数据的在线调查问卷。

问卷需要保留原文档的研究设计：

- 参与者先阅读欢迎、隐私和同意说明。
- 参与者填写年龄、教育程度和性别。
- 每位参与者看到 7 个类别，每个类别抽取 1 条 statement。
- 7 个类别的显示顺序随机。
- 每位参与者看到 7 种 source type，每种 source 只出现 1 次。
- 参与者先给 statement 打分，再看到 hypothetical source，再给同一 statement 再次打分。
- source 出现后不能回头修改第一次 confidence rating。
- 最后显示 check-in 与 debriefing。
- 研究者设置指南、statement library、source library 和 assignment logic 不能直接展示给参与者。

## 推荐方案

优先使用 Qualtrics 或 LimeSurvey 搭建正式问卷，而不是 Google Forms。

原因是这份问卷不是简单表单，它需要：

- 按参与者随机抽取 statement。
- 对 7 个 source type 做 without replacement assignment。
- 在每个 trial 里锁定前测 confidence。
- 记录 condition ID、statement ID、source ID、category、display order。
- 保存中途退出或刷新后的部分数据。
- 控制 post-source 页面不显示前一次 confidence。

Google Forms 可以做基础问卷，但不适合实现这些随机化、条件分配和试次级数据记录。Qualtrics 是最稳的 no-code / low-code 路线；如果没有 Qualtrics，可选 LimeSurvey；如果需要完全定制界面和数据控制，则做一个自定义 Web 问卷。

## 问卷结构

### Block 1 Consent

使用文档中的 Section 1。

公开显示：

- Welcome
- What you will do
- Your choice and privacy
- About the source labels
- Would you like to participate

逻辑：

- 选择 `Yes`：进入 demographic block。
- 选择 `No`：结束问卷，不进入 trial，也不记录 trial response。

发布前必须补齐：

- Study contact
- Supervising researcher or institution
- 已批准的 consent language

### Block 2 Demographics

使用文档中的 Section 2。

字段：

- `age_band`
- `education_level`
- `gender`
- `gender_self_describe`

建议：

- 除非研究审批允许，不收集姓名、邮箱、学生 ID、精确位置、浏览器指纹。
- 年龄选项包含 18 岁以下群体，正式发布前必须确认是否已有 parental permission 和 youth assent 流程。如果没有，应把 eligibility 限制为 18 岁或以上。

### Block 3 Trial Loop

每位参与者完成 7 个 trial。

每个 trial 包含两个页面。

Trial Screen 1:

- `Statement [X] of 7`
- Category
- Statement
- Understandability slider, 1-100
- Neutrality slider, 1-100
- Appropriateness slider, 1-100
- Pre-source confidence slider, 1-100

Trial Screen 2:

- Source type
- Source description
- 标明 source is hypothetical
- 重复同一 statement
- Post-source confidence slider, 1-100

关键规则：

- slider 必须要求参与者实际拖动后才能点 Next。
- 不要把视觉居中的 50 自动记录成回答。
- post-source 页面不能显示 pre-source confidence。
- source reveal 后不能回到上一页修改 pre-source confidence。
- 每页提交后立即保存 response。

### Block 4 Final Check

使用 Section 4：

- Before today, did you already know or suspect what this activity was designed to examine?

字段：

- `prior_awareness`

### Block 5 Debriefing

使用 Section 5。

公开显示：

- Thank you for taking part
- 研究目的说明
- source labels were assigned for research purposes
- responses will be combined
- 避免与未来参与者讨论具体目的
- contact / supervisor information

## 数据模型

建议用 PostgreSQL 或 Supabase 搭建数据库。项目里已经准备了可直接运行的数据库文件：

- [database/schema.sql](/Users/sunquanhao/Documents/ChatGPT/Elly/database/schema.sql)：建表、索引、约束和分析视图。
- [database/seed.sql](/Users/sunquanhao/Documents/ChatGPT/Elly/database/seed.sql)：导入 statement library、source library 和 C1-C7 condition。
- [database/README.md](/Users/sunquanhao/Documents/ChatGPT/Elly/database/README.md)：数据库使用说明。
- [docker-compose.yml](/Users/sunquanhao/Documents/ChatGPT/Elly/docker-compose.yml)：本地 PostgreSQL 开发环境。

当前公网收集使用 `survey_submissions`：每位参与者一行，JSONB `payload` 保留参与者信息、7 个 trial 与全部逐项回答；`submission_item_responses` 和 `submission_trial_results_wide` 是仅供研究者查询的分析视图。原有 `participants`、`participant_trials`、`survey_item_responses` 关系表保留作本地或后端扩展，但不对匿名访问者开放。

本地启动方式：

```bash
docker compose up -d
```

Supabase 使用方式：

1. 在 Supabase SQL Editor 先运行 `database/schema.sql`。
2. 再运行 `database/seed.sql`。
3. 运行 `database/supabase-rls.sql`，只授权匿名插入 `survey_submissions`。
4. 前端只配置 publishable key，不要暴露 secret 或 service role key。

建议每个 trial 保存一行分析视图，另有 participant-level metadata 和 item-level 原始记录。

Participant-level 字段：

- `participant_id`
- `consent`
- `age_band`
- `education_level`
- `gender`
- `gender_self_describe`
- `condition_id`
- `category_order`
- `started_at`
- `completed_at`
- `completion_status`

Trial-level 字段：

- `participant_id`
- `trial_number`
- `category`
- `statement_id`
- `statement_text`
- `source_id`
- `source_label`
- `source_description`
- `display_order`
- `understandability`
- `neutrality`
- `appropriateness`
- `confidence_pre_source`
- `confidence_post_source`
- `screen1_submitted_at`
- `screen2_submitted_at`

## Randomization 方案

### Statement assignment

每位参与者：

1. 从 7 个 category 中各抽 1 条 statement。
2. 保留抽中的 `statement_id` 和完整文本。
3. 随机打乱 7 个 category 的呈现顺序。

### Source assignment

使用文档里的 C1-C7 balanced condition。

做法：

1. 每 7 个完成参与者作为一个 block。
2. 在每个 block 内随机排列 C1-C7。
3. 给每位参与者分配一个 condition。
4. condition 决定每个 category 对应哪个 source。
5. category 呈现顺序仍然单独随机。

这样可以保证：

- 每位参与者看到所有 7 种 source，且每种只出现一次。
- 每 7 个完成样本中，每种 source 在每个 category 上都平衡一次。

## Qualtrics 实施路线

### 1. 建立 Survey Flow

建议结构：

1. Consent block
2. Demographics block
3. Embedded Data 初始化
4. Trial block loop
5. Final check block
6. Debriefing block

Embedded Data 至少包括：

- `participant_id`
- `condition_id`
- `category_order`
- `statement_id_1` 到 `statement_id_7`
- `source_id_1` 到 `source_id_7`
- `category_1` 到 `category_7`

### 2. 导入题库

把 Word 里的 `Statement Library` 转成 CSV：

```csv
category,statement_id,statement_text
Health and Science,H1,Teenagers who maintain a consistent sleep schedule may find it easier to stay focused during the school day.
...
```

把 `Source Library` 转成 CSV：

```csv
source_id,source_label,source_description
S1,Relevant Expert,A professional with specialized education or experience directly related to this topic.
...
```

### 3. 写随机化逻辑

如果使用 Qualtrics，可用 JavaScript 在进入 trial 前生成 assignment，并写入 Embedded Data。

核心逻辑：

```js
const categories = ["Health", "Tech", "Lifestyle", "News", "Gov", "Product", "Education"];
const conditions = {
  C1: ["S1", "S2", "S3", "S4", "S5", "S6", "S7"],
  C2: ["S2", "S3", "S4", "S5", "S6", "S7", "S1"],
  C3: ["S3", "S4", "S5", "S6", "S7", "S1", "S2"],
  C4: ["S4", "S5", "S6", "S7", "S1", "S2", "S3"],
  C5: ["S5", "S6", "S7", "S1", "S2", "S3", "S4"],
  C6: ["S6", "S7", "S1", "S2", "S3", "S4", "S5"],
  C7: ["S7", "S1", "S2", "S3", "S4", "S5", "S6"]
};
```

实际生产版需要把 condition 分配与 completed participant count 连接起来；如果平台不方便可靠地按完成数分配，就用预生成 participant links 或外部 assignment service。

### 4. 设计 slider

每个 slider：

- 范围 1-100。
- 初始状态不记录值。
- 参与者交互后才启用 Next。
- 显示左、中、右标签。

标签：

- 1 Very difficult / 50 Moderately understandable / 100 Very easy
- 1 Very biased / 50 Somewhat neutral / 100 Completely neutral
- 1 Not at all appropriate / 50 Moderately appropriate / 100 Completely appropriate
- 1 Not at all confident / 50 Moderately confident / 100 Completely confident

### 5. 防止回退修改

在 trial screen 2 打开后：

- 禁用浏览器回退或隐藏 Back button。
- 保存 screen 1 responses。
- 不在 screen 2 展示 screen 1 confidence。

Qualtrics 中可以用 block/page break、Back button 设置和 JavaScript 配合实现。

## 自定义 Web App 备选路线

如果需要完全控制样式、逻辑、保存和分享链接，建议做一个轻量 Web 问卷。

推荐栈：

- Frontend：Next.js 或 React
- 数据库：Supabase Postgres 或 Firebase
- 部署：Vercel
- 导出：CSV

页面：

- `/survey/start`
- `/survey/demographics`
- `/survey/trial/:trialNumber/pre`
- `/survey/trial/:trialNumber/post`
- `/survey/check`
- `/survey/debrief`

优点：

- 随机化和平衡逻辑完全可控。
- 可以逐页保存，减少刷新丢失。
- 可以生成稳定 share link。
- 可以严格控制不收集额外识别信息。

成本：

- 需要开发、部署和安全配置。
- 需要自己做数据导出和访问权限。
- 研究审批时要说明托管平台和数据存储方式。

## 上线前检查清单

- [ ] 确认 consent language 与研究审批版本一致。
- [ ] 补齐 study contact 和 supervising researcher / institution。
- [ ] 决定是否允许 18 岁以下参与；如果允许，准备 parental permission 和 youth assent。
- [ ] 确认平台是否自动记录 IP、地理位置、设备信息或浏览器信息。
- [ ] 如果平台会记录这些信息，隐私说明里不能简单写 anonymous。
- [ ] 确认 researcher setup guide 不会出现在参与者界面。
- [ ] 确认每位参与者只看到 7 条 statement。
- [ ] 确认每个 source type 每位参与者只出现一次。
- [ ] 确认 slider 未交互时不能进入下一页。
- [ ] 确认 source reveal 后不能修改 pre-source confidence。
- [ ] 确认导出数据包含 statement ID、source ID、category、display order、condition ID。
- [ ] 在手机和电脑上各 pilot 至少 3 次。
- [ ] 检查中途刷新、中途退出、重复打开链接时的数据行为。

## 建议交付物

第一阶段，先完成可发布 MVP：

- 一个可分享调查链接。
- 一份导出字段说明。
- 一份 pilot 测试记录。
- 一份平台隐私和数据存储说明。

第二阶段，再根据 pilot 结果优化：

- 调整 slider 交互。
- 优化手机端排版。
- 检查题目耗时是否稳定在 8-12 分钟。
- 检查 source label 是否过度提示研究目的。

## 我的建议

如果目标是尽快得到一个可靠、可分享、适合研究收数的版本，优先用 Qualtrics 搭建。它最符合这份 Word 文件里的随机化、锁定回答、嵌入数据和导出需求。

如果目标是长期复用、完全控制界面和数据，或未来要做多版本实验，则直接开发自定义 Web App。当前这份调查逻辑清楚，适合转成一个轻量定制问卷，但开发成本会高于 Qualtrics。
