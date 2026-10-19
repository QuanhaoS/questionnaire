create extension if not exists pgcrypto;

create table if not exists survey_categories (
  id text primary key,
  name text not null unique,
  display_name text not null,
  sort_order integer not null unique
);

create table if not exists statements (
  id text primary key,
  category_id text not null references survey_categories(id),
  statement_text text not null,
  active boolean not null default true,
  unique (id, category_id)
);

create table if not exists sources (
  id text primary key,
  source_label text not null,
  source_description text not null,
  active boolean not null default true
);

create table if not exists balanced_conditions (
  id text primary key,
  description text
);

create table if not exists condition_source_assignments (
  condition_id text not null references balanced_conditions(id) on delete cascade,
  category_id text not null references survey_categories(id),
  source_id text not null references sources(id),
  primary key (condition_id, category_id),
  unique (condition_id, source_id)
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  public_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  consent_status text not null default 'not_answered'
    check (consent_status in ('not_answered', 'yes', 'no')),
  consented_at timestamptz,
  age_band text,
  education_level text,
  gender text,
  gender_self_describe text,
  condition_id text references balanced_conditions(id),
  category_order jsonb not null default '[]'::jsonb,
  completion_status text not null default 'started'
    check (completion_status in ('started', 'screened_out', 'in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists participant_trials (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  trial_number integer not null check (trial_number between 1 and 7),
  display_order integer not null check (display_order between 1 and 7),
  category_id text not null references survey_categories(id),
  statement_id text not null references statements(id),
  source_id text not null references sources(id),
  pre_source_started_at timestamptz,
  pre_source_submitted_at timestamptz,
  post_source_started_at timestamptz,
  post_source_submitted_at timestamptz,
  locked_pre_source boolean not null default false,
  created_at timestamptz not null default now(),
  unique (participant_id, trial_number),
  unique (participant_id, display_order),
  unique (participant_id, category_id),
  unique (participant_id, source_id),
  unique (id, participant_id),
  foreign key (statement_id, category_id) references statements(id, category_id)
);

create table if not exists survey_item_responses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  trial_id uuid references participant_trials(id) on delete cascade,
  phase text not null check (phase in ('consent', 'demographics', 'pre_source', 'post_source', 'final_check', 'debriefing')),
  item_key text not null,
  response_type text not null check (response_type in ('choice', 'slider', 'text', 'timestamp', 'system')),
  numeric_value integer,
  text_value text,
  option_value text,
  interacted boolean not null default true,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (
    response_type <> 'slider'
    or (numeric_value is not null and numeric_value between 1 and 100 and interacted = true)
  ),
  foreign key (trial_id, participant_id) references participant_trials(id, participant_id) on delete cascade
);

create index if not exists idx_participants_condition on participants(condition_id);
create index if not exists idx_trials_participant on participant_trials(participant_id);
create index if not exists idx_trials_statement on participant_trials(statement_id);
create index if not exists idx_trials_source on participant_trials(source_id);
create index if not exists idx_item_responses_participant on survey_item_responses(participant_id);
create index if not exists idx_item_responses_trial on survey_item_responses(trial_id);
create index if not exists idx_item_responses_item_key on survey_item_responses(item_key);

create unique index if not exists idx_unique_trial_item_response
  on survey_item_responses(participant_id, trial_id, phase, item_key)
  where trial_id is not null;

create unique index if not exists idx_unique_participant_item_response
  on survey_item_responses(participant_id, phase, item_key)
  where trial_id is null;

create or replace view trial_results_wide as
select
  p.id as participant_id,
  p.public_token,
  p.condition_id,
  t.trial_number,
  t.display_order,
  c.display_name as category,
  t.statement_id,
  s.statement_text,
  t.source_id,
  src.source_label,
  src.source_description,
  max(r.numeric_value) filter (where r.item_key = 'understandability') as understandability,
  max(r.numeric_value) filter (where r.item_key = 'neutrality') as neutrality,
  max(r.numeric_value) filter (where r.item_key = 'appropriateness') as appropriateness,
  max(r.numeric_value) filter (where r.item_key = 'confidence_pre_source') as confidence_pre_source,
  max(r.numeric_value) filter (where r.item_key = 'confidence_post_source') as confidence_post_source,
  t.pre_source_submitted_at,
  t.post_source_submitted_at
from participant_trials t
join participants p on p.id = t.participant_id
join survey_categories c on c.id = t.category_id
join statements s on s.id = t.statement_id
join sources src on src.id = t.source_id
left join survey_item_responses r on r.trial_id = t.id
group by
  p.id,
  p.public_token,
  p.condition_id,
  t.trial_number,
  t.display_order,
  c.display_name,
  t.statement_id,
  s.statement_text,
  t.source_id,
  src.source_label,
  src.source_description,
  t.pre_source_submitted_at,
  t.post_source_submitted_at;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists participants_set_updated_at on participants;
create trigger participants_set_updated_at
before update on participants
for each row execute function set_updated_at();

create table if not exists survey_submissions (
  participant_id uuid primary key,
  public_token text not null unique,
  payload jsonb not null,
  submitted_at timestamptz not null default now(),
  constraint survey_submission_shape check (
    jsonb_typeof(payload) = 'object'
    and payload->'participant'->>'id' = participant_id::text
    and payload->'participant'->>'public_token' = public_token
    and payload->'participant'->>'consent_status' = 'yes'
    and payload->'participant'->>'completion_status' = 'completed'
    and case when jsonb_typeof(payload->'trials') = 'array'
      then jsonb_array_length(payload->'trials') = 7 else false end
    and case when jsonb_typeof(payload->'item_responses') = 'array'
      then jsonb_array_length(payload->'item_responses') > 0 else false end
    and case when jsonb_typeof(payload->'trial_results_wide') = 'array'
      then jsonb_array_length(payload->'trial_results_wide') = 7 else false end
    and octet_length(payload::text) <= 262144
  )
);

create or replace view submission_item_responses with (security_invoker = true) as
select
  s.participant_id,
  s.public_token,
  r.item->>'id' as response_id,
  r.item->>'trial_id' as trial_id,
  r.item->>'phase' as phase,
  r.item->>'item_key' as item_key,
  r.item->>'response_type' as response_type,
  case when r.item->>'numeric_value' ~ '^[0-9]{1,3}$'
    then (r.item->>'numeric_value')::integer end as numeric_value,
  r.item->>'text_value' as text_value,
  r.item->>'option_value' as option_value,
  r.item->>'interacted' as interacted,
  r.item->>'submitted_at' as item_submitted_at,
  s.submitted_at
from survey_submissions s
cross join lateral jsonb_array_elements(s.payload->'item_responses') as r(item);

create or replace view submission_trial_results_wide with (security_invoker = true) as
select
  s.participant_id,
  s.public_token,
  t.item->>'condition_id' as condition_id,
  t.item->>'trial_number' as trial_number,
  t.item->>'display_order' as display_order,
  t.item->>'category' as category,
  t.item->>'statement_id' as statement_id,
  t.item->>'statement_text' as statement_text,
  t.item->>'source_id' as source_id,
  t.item->>'source_label' as source_label,
  t.item->>'source_description' as source_description,
  case when t.item->>'understandability' ~ '^[0-9]{1,3}$'
    then (t.item->>'understandability')::integer end as understandability,
  case when t.item->>'neutrality' ~ '^[0-9]{1,3}$'
    then (t.item->>'neutrality')::integer end as neutrality,
  case when t.item->>'appropriateness' ~ '^[0-9]{1,3}$'
    then (t.item->>'appropriateness')::integer end as appropriateness,
  case when t.item->>'confidence_pre_source' ~ '^[0-9]{1,3}$'
    then (t.item->>'confidence_pre_source')::integer end as confidence_pre_source,
  case when t.item->>'confidence_post_source' ~ '^[0-9]{1,3}$'
    then (t.item->>'confidence_post_source')::integer end as confidence_post_source,
  t.item->>'pre_source_submitted_at' as pre_source_submitted_at,
  t.item->>'post_source_submitted_at' as post_source_submitted_at,
  s.submitted_at
from survey_submissions s
cross join lateral jsonb_array_elements(s.payload->'trial_results_wide') as t(item);
