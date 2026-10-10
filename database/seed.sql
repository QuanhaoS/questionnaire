insert into survey_categories (id, name, display_name, sort_order) values
  ('health', 'Health and Science', 'Health and Science', 1),
  ('tech', 'Technology', 'Technology', 2),
  ('lifestyle', 'Lifestyle and Entertainment', 'Lifestyle and Entertainment', 3),
  ('news', 'News and Current Events', 'News and Current Events', 4),
  ('gov', 'Government and Public Affairs', 'Government and Public Affairs', 5),
  ('product', 'Product and Consumer', 'Product and Consumer', 6),
  ('education', 'Education and Personal Advice', 'Education and Personal Advice', 7)
on conflict (id) do update set
  name = excluded.name,
  display_name = excluded.display_name,
  sort_order = excluded.sort_order;

insert into statements (id, category_id, statement_text) values
  ('H1', 'health', 'Teenagers who maintain a consistent sleep schedule may find it easier to stay focused during the school day.'),
  ('H2', 'health', 'Drinking caffeinated beverages late in the day may affect how easily teenagers fall asleep.'),
  ('H3', 'health', 'People may remember information more clearly when it is connected to an emotional experience.'),
  ('T1', 'tech', 'Newer AI chatbots can complete some tasks more accurately than earlier versions.'),
  ('T2', 'tech', 'Frequently running multiple applications at the same time can reduce a smartphone''s battery life.'),
  ('T3', 'tech', 'Software updates can sometimes improve a device''s security without noticeably changing how the device operates.'),
  ('L1', 'lifestyle', 'Viewers can understand some movie sequels without watching every earlier movie in the series.'),
  ('L2', 'lifestyle', 'Online customer ratings can influence which restaurants people decide to visit.'),
  ('L3', 'lifestyle', 'Short-form videos can affect which entertainment trends become popular among teenagers and young adults.'),
  ('N1', 'news', 'Changes in international energy markets can affect transportation costs in the United States.'),
  ('N2', 'news', 'Social media can cause news about an event to spread before all details have been confirmed.'),
  ('N3', 'news', 'Newly discovered historical evidence can lead researchers to reconsider earlier explanations of an event.'),
  ('G1', 'gov', 'Local governments can change how public transportation services operate in response to community needs.'),
  ('G2', 'gov', 'Government agencies sometimes use online platforms to communicate policy changes to the public.'),
  ('G3', 'gov', 'Public comments can be considered before some local government policies are finalized.'),
  ('P1', 'product', 'Higher-priced products do not always receive higher customer-satisfaction ratings than lower-priced alternatives.'),
  ('P2', 'product', 'Online customer reviews can influence how consumers judge a product before purchasing it.'),
  ('P3', 'product', 'Reusable water bottles can reduce the number of single-use bottles purchased by a regular user.'),
  ('E1', 'education', 'Completing practice questions can help students identify topics they need to review before a math test.'),
  ('E2', 'education', 'Taking more advanced classes can affect both a student''s workload and the amount of academic challenge they experience.'),
  ('E3', 'education', 'Advice from friends and advice from school counselors may influence students'' educational decisions in different ways.')
on conflict (id) do update set
  category_id = excluded.category_id,
  statement_text = excluded.statement_text;

insert into sources (id, source_label, source_description) values
  ('S1', 'Relevant Expert', 'A professional with specialized education or experience directly related to this topic.'),
  ('S2', 'Professional Organization', 'An established organization that works or conducts research in this subject area.'),
  ('S3', 'News Organization', 'A professional organization that collects, reviews, and reports information to the public.'),
  ('S4', 'AI Chatbot', 'A generative AI system that produces answers using patterns found in its training data.'),
  ('S5', 'Influencer or Content Creator', 'A social media creator who regularly produces online content about different topics.'),
  ('S6', 'Friend or Family Member', 'Someone personally known to the participant who shares information based on personal knowledge or experience.'),
  ('S7', 'Online Users or Reviewers', 'A group of internet users sharing ratings, comments, opinions, or personal experiences online.')
on conflict (id) do update set
  source_label = excluded.source_label,
  source_description = excluded.source_description;

insert into balanced_conditions (id, description) values
  ('C1', 'Balanced source assignment condition 1'),
  ('C2', 'Balanced source assignment condition 2'),
  ('C3', 'Balanced source assignment condition 3'),
  ('C4', 'Balanced source assignment condition 4'),
  ('C5', 'Balanced source assignment condition 5'),
  ('C6', 'Balanced source assignment condition 6'),
  ('C7', 'Balanced source assignment condition 7')
on conflict (id) do update set description = excluded.description;

insert into condition_source_assignments (condition_id, category_id, source_id) values
  ('C1', 'health', 'S1'), ('C1', 'tech', 'S2'), ('C1', 'lifestyle', 'S3'), ('C1', 'news', 'S4'), ('C1', 'gov', 'S5'), ('C1', 'product', 'S6'), ('C1', 'education', 'S7'),
  ('C2', 'health', 'S2'), ('C2', 'tech', 'S3'), ('C2', 'lifestyle', 'S4'), ('C2', 'news', 'S5'), ('C2', 'gov', 'S6'), ('C2', 'product', 'S7'), ('C2', 'education', 'S1'),
  ('C3', 'health', 'S3'), ('C3', 'tech', 'S4'), ('C3', 'lifestyle', 'S5'), ('C3', 'news', 'S6'), ('C3', 'gov', 'S7'), ('C3', 'product', 'S1'), ('C3', 'education', 'S2'),
  ('C4', 'health', 'S4'), ('C4', 'tech', 'S5'), ('C4', 'lifestyle', 'S6'), ('C4', 'news', 'S7'), ('C4', 'gov', 'S1'), ('C4', 'product', 'S2'), ('C4', 'education', 'S3'),
  ('C5', 'health', 'S5'), ('C5', 'tech', 'S6'), ('C5', 'lifestyle', 'S7'), ('C5', 'news', 'S1'), ('C5', 'gov', 'S2'), ('C5', 'product', 'S3'), ('C5', 'education', 'S4'),
  ('C6', 'health', 'S6'), ('C6', 'tech', 'S7'), ('C6', 'lifestyle', 'S1'), ('C6', 'news', 'S2'), ('C6', 'gov', 'S3'), ('C6', 'product', 'S4'), ('C6', 'education', 'S5'),
  ('C7', 'health', 'S7'), ('C7', 'tech', 'S1'), ('C7', 'lifestyle', 'S2'), ('C7', 'news', 'S3'), ('C7', 'gov', 'S4'), ('C7', 'product', 'S5'), ('C7', 'education', 'S6')
on conflict (condition_id, category_id) do update set source_id = excluded.source_id;
