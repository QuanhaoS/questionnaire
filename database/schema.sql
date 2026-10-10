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
