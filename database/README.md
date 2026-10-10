# 数据库说明

这个目录提供 PostgreSQL/Supabase 兼容的数据库结构，用来保存问卷中每一项的结果。

## 文件

- `schema.sql`：建表、索引、约束和分析视图。
- `seed.sql`：导入 statement library、source library 和 C1-C7 balanced conditions。
- `supabase-rls.sql`：允许公网静态网页匿名插入问卷结果，同时禁止匿名读取数据。

## 表结构

- `survey_categories`：7 个问卷类别。
- `statements`：每个类别下的候选 statement。
- `sources`：7 种 source type 和参与者可见描述。
- `balanced_conditions`：C1-C7 条件。
- `condition_source_assignments`：每个 condition 下 category 到 source 的映射。
- `participants`：参与者级信息和完成状态。
- `participant_trials`：每位参与者实际看到的 7 个 trial。
- `survey_item_responses`：逐项保存所有回答，包括 demographics、pre-source sliders、post-source confidence 和 final check。
- `trial_results_wide`：方便导出分析的宽表视图。

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
5. 在前端配置 `assets/config.js` 中的 Supabase URL 和 publishable/anon key。
6. 不要把 service role key 放进前端或 GitHub。

`assets/config.js` 使用的是 publishable/anon key。这个 key 可以出现在浏览器里，但必须依赖 Row Level Security 限制权限。`supabase-rls.sql` 只给匿名用户插入权限，不给读取、更新或删除权限。

## 每一项结果如何保存

每一个可回答项目都写入 `survey_item_responses`。

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

这样做的好处是：以后增减题目时不用大改表结构；做统计分析时可以直接查询 `trial_results_wide`。

## 插入示例

```sql
insert into participants (consent_status, consented_at, completion_status)
values ('yes', now(), 'in_progress')
returning id, public_token;
```

```sql
insert into participant_trials (
  participant_id,
  trial_number,
  display_order,
  category_id,
  statement_id,
  source_id,
  pre_source_started_at
) values (
  '00000000-0000-0000-0000-000000000000',
  1,
  1,
  'health',
  'H1',
  'S1',
  now()
);
```

```sql
insert into survey_item_responses (
  participant_id,
  trial_id,
  phase,
  item_key,
  response_type,
  numeric_value,
  interacted
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'pre_source',
  'understandability',
  'slider',
  82,
  true
);
```

## 导出分析数据

```sql
select *
from trial_results_wide
order by participant_id, trial_number;
```

这个视图会把每个 trial 的 5 个核心评分整理成一行，适合导出 CSV 后做统计分析。
