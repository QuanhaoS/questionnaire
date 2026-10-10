alter table participants enable row level security;
alter table participant_trials enable row level security;
alter table survey_item_responses enable row level security;

grant usage on schema public to anon;

grant insert on participants to anon;
grant insert on participant_trials to anon;
grant insert on survey_item_responses to anon;

grant references on balanced_conditions to anon;
grant references on survey_categories to anon;
grant references on statements to anon;
grant references on sources to anon;
grant references on participants to anon;
grant references on participant_trials to anon;

drop policy if exists "anon can insert participants" on participants;
create policy "anon can insert participants"
on participants
for insert
to anon
with check (
  consent_status in ('yes', 'no', 'not_answered')
  and completion_status in ('started', 'screened_out', 'in_progress', 'completed', 'abandoned')
);

drop policy if exists "anon can insert participant trials" on participant_trials;
create policy "anon can insert participant trials"
on participant_trials
for insert
to anon
with check (
  trial_number between 1 and 7
  and display_order between 1 and 7
);

drop policy if exists "anon can insert survey item responses" on survey_item_responses;
create policy "anon can insert survey item responses"
on survey_item_responses
for insert
to anon
with check (
  phase in ('consent', 'demographics', 'pre_source', 'post_source', 'final_check', 'debriefing')
  and response_type in ('choice', 'slider', 'text', 'timestamp', 'system')
  and (
    response_type <> 'slider'
    or (numeric_value is not null and numeric_value between 1 and 100 and interacted = true)
  )
);
