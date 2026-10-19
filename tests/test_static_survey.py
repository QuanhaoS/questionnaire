from html.parser import HTMLParser
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ScriptParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.stylesheets = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and attrs.get("src"):
            self.scripts.append(attrs["src"])
        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.stylesheets.append(attrs.get("href"))


class StaticSurveyTests(unittest.TestCase):
    def test_html_references_existing_assets(self):
        parser = ScriptParser()
        parser.feed((ROOT / "index.html").read_text())
        for src in parser.scripts:
            self.assertTrue((ROOT / src).exists(), src)
        for href in parser.stylesheets:
            self.assertTrue((ROOT / href).exists(), href)

    def test_seed_data_counts_are_complete(self):
        seed = (ROOT / "database" / "seed.sql").read_text()
        statements_block = seed.split("insert into statements", 1)[1].split("on conflict", 1)[0]
        sources_block = seed.split("insert into sources", 1)[1].split("on conflict", 1)[0]
        assignments_block = seed.split("insert into condition_source_assignments", 1)[1].split("on conflict", 1)[0]

        statements = re.findall(r"\('([A-Z][0-9])',\s*'([^']+)'", statements_block)
        sources = re.findall(r"\('(S[0-9])',", sources_block)
        assignments = re.findall(r"\('(C[0-9])',\s*'([^']+)',\s*'(S[0-9])'\)", assignments_block)

        self.assertEqual(len(statements), 21)
        self.assertEqual(len({item[0] for item in statements}), 21)
        self.assertEqual(len(sources), 7)
        self.assertEqual(len(set(sources)), 7)
        self.assertEqual(len(assignments), 49)

        for condition_id in {item[0] for item in assignments}:
            rows = [item for item in assignments if item[0] == condition_id]
            self.assertEqual(len({item[1] for item in rows}), 7)
            self.assertEqual(len({item[2] for item in rows}), 7)

    def test_app_has_required_survey_controls(self):
        app_js = (ROOT / "assets" / "app.js").read_text()
        for key in [
            "understandability",
            "neutrality",
            "appropriateness",
            "confidence_pre_source",
            "confidence_post_source",
            "prior_awareness",
        ]:
            self.assertIn(key, app_js)
        self.assertIn("localStorage", app_js)
        self.assertIn("Download CSV", app_js)
        self.assertIn("Download JSON", app_js)
        self.assertIn("submitPayloadToSupabase", app_js)
        self.assertIn("/rest/v1/", app_js)
        self.assertEqual(app_js.count('await supabaseInsert("survey_submissions"'), 1)
        self.assertEqual(app_js.count("await supabaseInsert("), 1)
        self.assertIn('Prefer: "return=minimal"', app_js)
        self.assertNotIn("resolution=ignore-duplicates", app_js)

    def test_pages_workflow_exists(self):
        workflow = (ROOT / ".github" / "workflows" / "pages.yml").read_text()
        self.assertIn("actions/configure-pages", workflow)
        self.assertIn("actions/upload-pages-artifact", workflow)
        self.assertIn("actions/deploy-pages", workflow)
        self.assertIn('branches: ["main"]', workflow)

    def test_supabase_config_and_rls_exist(self):
        config = (ROOT / "assets" / "config.js").read_text()
        schema = (ROOT / "database" / "schema.sql").read_text()
        rls = (ROOT / "database" / "supabase-rls.sql").read_text()
        self.assertIn("enableRemoteSubmit", config)
        self.assertIn("enableRemoteSubmit: true", config)
        self.assertIn("supabaseUrl", config)
        self.assertIn("supabasePublishableKey", config)
        self.assertIn("create table if not exists survey_submissions", schema)
        self.assertIn("create or replace view submission_item_responses", schema)
        self.assertIn("create or replace view submission_trial_results_wide", schema)
        self.assertIn("enable row level security", rls)
        self.assertIn("grant insert on survey_submissions to anon", rls)
        self.assertNotIn("grant insert on participants to anon", rls)
        self.assertNotIn("grant insert on participant_trials to anon", rls)
        self.assertNotIn("grant insert on survey_item_responses to anon", rls)
        self.assertIn("submission_trial_results_wide from anon, authenticated", rls)
        self.assertNotIn("service_role", config)

    def test_readme_mentions_versions(self):
        readme = (ROOT / "README.md").read_text()
        self.assertIn("version1.0", readme.lower().replace(" ", ""))
        self.assertIn("version1.1", readme.lower().replace(" ", ""))


if __name__ == "__main__":
    unittest.main()
