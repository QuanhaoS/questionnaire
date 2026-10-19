alter table participants enable row level security;
alter table participant_trials enable row level security;
alter table survey_item_responses enable row level security;
alter table survey_submissions enable row level security;
alter view trial_results_wide set (security_invoker = true);

grant usage on schema public to anon;

revoke all on table participants, participant_trials, survey_item_responses,
  survey_submissions, trial_results_wide, submission_item_responses,
  submission_trial_results_wide from anon, authenticated;

grant insert on survey_submissions to anon;

drop policy if exists "anon can insert participants" on participants;
drop policy if exists "anon can insert participant trials" on participant_trials;
drop policy if exists "anon can insert survey item responses" on survey_item_responses;
drop policy if exists "anon can insert survey submissions" on survey_submissions;
create policy "anon can insert survey submissions"
on survey_submissions
for insert
to anon
with check (
  payload->'participant'->>'id' = participant_id::text
  and payload->'participant'->>'public_token' = public_token
  and payload->'participant'->>'consent_status' = 'yes'
  and payload->'participant'->>'completion_status' = 'completed'
);
