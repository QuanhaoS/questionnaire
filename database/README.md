# 数据库说明

这个目录提供 PostgreSQL/Supabase 兼容的数据库结构，用来保存问卷中每一项的结果。

## 文件

- `schema.sql`：建表、索引、约束和分析视图。
- `seed.sql`：导入 statement library、source library 和 C1-C7 balanced conditions。
- `supabase-rls.sql`：只允许公网静态网页匿名插入 `survey_submissions`，同时禁止匿名读取数据。

## 表结构

- `survey_categories`：7 个问卷类别。
- `statements`：每个类别下的候选 statement。
- `sources`：7 种 source type 和参与者可见描述。
- `balanced_conditions`：C1-C7 条件。
- `condition_source_assignments`：每个 condition 下 category 到 source 的映射。
- `survey_submissions`：当前公网问卷实际写入的唯一答卷表，每位参与者一行，完整答卷保存在 JSONB `payload` 中。
- `submission_item_responses`：从 JSONB 展开每项回答的分析视图。
- `submission_trial_results_wide`：从 JSONB 展开 7 个 trial 的宽表视图。
- `participants`、`participant_trials`、`survey_item_responses` 和 `trial_results_wide`：保留的关系化模型，不向匿名访问者授权；当前公网问卷不会写入这些表。

## 本地启动

在项目根目录运行：

```bash
docker compose up -d
```

数据库连接信息：

```text
host: localhost
port: 5432
database: everyday_information_survey
user: survey_admin
password: survey_dev_password
```

## Supabase 使用

在 Supabase 项目中：

1. 打开 SQL Editor。
2. 先运行 `schema.sql`。
3. 再运行 `seed.sql`。
4. 再运行 `supabase-rls.sql`。
5. 在前端配置 `assets/config.js` 中的 Supabase URL 和 `sb_publishable_...` key，并将 `enableRemoteSubmit` 设为 `true`。
6. 不要把 secret 或旧版 service role key 放进前端或 GitHub。

`assets/config.js` 使用的是 publishable key。这个 key 可以出现在浏览器里，但必须依赖 Row Level Security 限制权限。`supabase-rls.sql` 只给匿名用户插入 `survey_submissions` 的权限，不给读取、更新或删除权限；分析视图也不向匿名用户开放。一次提交只写一行，按 `participant_id` 去重，失败后可安全重试。

当前 `questionnaire` Supabase 项目已包含两条部署测试答卷，正式分析时请按 `public_token` 排除：`codex_test_20261018`、`token_cbaa6cf7-fba9-4727-83ff-6eceb8e22b3e`。后一条是通过完整网页流程提交的，包含 40 项回答和 7 个 trial。

## 每一项结果如何保存

每一个可回答项目都在 `survey_submissions.payload.item_responses` 数组里保留独立记录。只有整份问卷完成时才上传；填写过程先存在参与者浏览器的 `localStorage`，中途退出不会在 Supabase 留下部分答卷。

例如一个 trial 的 pre-source 页面会保存：

- `understandability`
- `neutrality`
- `appropriateness`
- `confidence_pre_source`

post-source 页面会保存：

- `confidence_post_source`

demographics 会保存：

- `age_band`
- `education_level`
- `gender`
- `gender_self_describe`

final check 会保存：

- `prior_awareness`

研究者可以直接查询 `submission_item_responses` 查看每项结果，或查询 `submission_trial_results_wide` 导出每个 trial 一行的评分。

## 查询与导出

```sql
select participant_id, public_token, submitted_at
from survey_submissions
order by submitted_at desc;
```

```sql
select *
from submission_item_responses
order by participant_id, item_submitted_at;
```

```sql
select *
from submission_trial_results_wide
order by participant_id, trial_number;
```

在 Supabase SQL Editor 运行查询后，可以下载结果为 CSV。以上视图只为研究者在控制台查询，公开网页没有读取权限。
