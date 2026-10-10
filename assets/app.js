(function () {
  "use strict";

  const STORAGE_KEY = "everydayInformationSurvey.v1";
  const COMPLETION_KEY = "everydayInformationSurvey.conditionBlocks.v1";

  const categories = [
    { id: "health", name: "Health and Science" },
    { id: "tech", name: "Technology" },
    { id: "lifestyle", name: "Lifestyle and Entertainment" },
    { id: "news", name: "News and Current Events" },
    { id: "gov", name: "Government and Public Affairs" },
    { id: "product", name: "Product and Consumer" },
    { id: "education", name: "Education and Personal Advice" }
  ];

  const statements = [
    { id: "H1", categoryId: "health", text: "Teenagers who maintain a consistent sleep schedule may find it easier to stay focused during the school day." },
    { id: "H2", categoryId: "health", text: "Drinking caffeinated beverages late in the day may affect how easily teenagers fall asleep." },
    { id: "H3", categoryId: "health", text: "People may remember information more clearly when it is connected to an emotional experience." },
    { id: "T1", categoryId: "tech", text: "Newer AI chatbots can complete some tasks more accurately than earlier versions." },
    { id: "T2", categoryId: "tech", text: "Frequently running multiple applications at the same time can reduce a smartphone's battery life." },
    { id: "T3", categoryId: "tech", text: "Software updates can sometimes improve a device's security without noticeably changing how the device operates." },
    { id: "L1", categoryId: "lifestyle", text: "Viewers can understand some movie sequels without watching every earlier movie in the series." },
    { id: "L2", categoryId: "lifestyle", text: "Online customer ratings can influence which restaurants people decide to visit." },
    { id: "L3", categoryId: "lifestyle", text: "Short-form videos can affect which entertainment trends become popular among teenagers and young adults." },
    { id: "N1", categoryId: "news", text: "Changes in international energy markets can affect transportation costs in the United States." },
    { id: "N2", categoryId: "news", text: "Social media can cause news about an event to spread before all details have been confirmed." },
    { id: "N3", categoryId: "news", text: "Newly discovered historical evidence can lead researchers to reconsider earlier explanations of an event." },
    { id: "G1", categoryId: "gov", text: "Local governments can change how public transportation services operate in response to community needs." },
    { id: "G2", categoryId: "gov", text: "Government agencies sometimes use online platforms to communicate policy changes to the public." },
    { id: "G3", categoryId: "gov", text: "Public comments can be considered before some local government policies are finalized." },
    { id: "P1", categoryId: "product", text: "Higher-priced products do not always receive higher customer-satisfaction ratings than lower-priced alternatives." },
    { id: "P2", categoryId: "product", text: "Online customer reviews can influence how consumers judge a product before purchasing it." },
    { id: "P3", categoryId: "product", text: "Reusable water bottles can reduce the number of single-use bottles purchased by a regular user." },
    { id: "E1", categoryId: "education", text: "Completing practice questions can help students identify topics they need to review before a math test." },
    { id: "E2", categoryId: "education", text: "Taking more advanced classes can affect both a student's workload and the amount of academic challenge they experience." },
    { id: "E3", categoryId: "education", text: "Advice from friends and advice from school counselors may influence students' educational decisions in different ways." }
  ];

  const sources = [
    { id: "S1", label: "Relevant Expert", description: "A professional with specialized education or experience directly related to this topic." },
    { id: "S2", label: "Professional Organization", description: "An established organization that works or conducts research in this subject area." },
    { id: "S3", label: "News Organization", description: "A professional organization that collects, reviews, and reports information to the public." },
    { id: "S4", label: "AI Chatbot", description: "A generative AI system that produces answers using patterns found in its training data." },
    { id: "S5", label: "Influencer or Content Creator", description: "A social media creator who regularly produces online content about different topics." },
    { id: "S6", label: "Friend or Family Member", description: "Someone personally known to the participant who shares information based on personal knowledge or experience." },
    { id: "S7", label: "Online Users or Reviewers", description: "A group of internet users sharing ratings, comments, opinions, or personal experiences online." }
  ];

  const conditionAssignments = {
    C1: { health: "S1", tech: "S2", lifestyle: "S3", news: "S4", gov: "S5", product: "S6", education: "S7" },
    C2: { health: "S2", tech: "S3", lifestyle: "S4", news: "S5", gov: "S6", product: "S7", education: "S1" },
    C3: { health: "S3", tech: "S4", lifestyle: "S5", news: "S6", gov: "S7", product: "S1", education: "S2" },
    C4: { health: "S4", tech: "S5", lifestyle: "S6", news: "S7", gov: "S1", product: "S2", education: "S3" },
    C5: { health: "S5", tech: "S6", lifestyle: "S7", news: "S1", gov: "S2", product: "S3", education: "S4" },
    C6: { health: "S6", tech: "S7", lifestyle: "S1", news: "S2", gov: "S3", product: "S4", education: "S5" },
    C7: { health: "S7", tech: "S1", lifestyle: "S2", news: "S3", gov: "S4", product: "S5", education: "S6" }
  };

  const sliderDefinitions = {
    understandability: {
      question: "How easy is this statement to understand?",
      labels: ["1 Very difficult", "50 Moderately understandable", "100 Very easy"]
    },
    neutrality: {
      question: "How neutral and objective is the wording?",
      labels: ["1 Very biased", "50 Somewhat neutral", "100 Completely neutral"]
    },
    appropriateness: {
      question: "How appropriate is this statement for a general audience?",
      labels: ["1 Not at all appropriate", "50 Moderately appropriate", "100 Completely appropriate"]
    },
    confidence_pre_source: {
      question: "Based only on what you know right now, how confident are you that this statement is accurate?",
      labels: ["1 Not at all confident", "50 Moderately confident", "100 Completely confident"]
    },
    confidence_post_source: {
      question: "Now that you have seen the possible source, how confident are you that the statement is accurate?",
      labels: ["1 Not at all confident", "50 Moderately confident", "100 Completely confident"]
    }
  };

  const app = document.getElementById("app");

  let state = loadState() || createInitialState();

  function uid(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}_${window.crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function nextConditionId() {
    let blockState;
    try {
      blockState = JSON.parse(localStorage.getItem(COMPLETION_KEY) || "{}");
    } catch (_error) {
      blockState = {};
    }
    if (!Array.isArray(blockState.queue) || blockState.queue.length === 0) {
      blockState.queue = shuffle(Object.keys(conditionAssignments));
    }
    const conditionId = blockState.queue.shift();
    localStorage.setItem(COMPLETION_KEY, JSON.stringify(blockState));
    return conditionId;
  }

  function createInitialState() {
    const participantId = uid("participant");
    const conditionId = nextConditionId();
    const selectedByCategory = {};
    for (const category of categories) {
      const options = statements.filter((statement) => statement.categoryId === category.id);
      selectedByCategory[category.id] = shuffle(options)[0];
    }

    const categoryOrder = shuffle(categories.map((category) => category.id));
    const trials = categoryOrder.map((categoryId, index) => {
      const category = categories.find((item) => item.id === categoryId);
      const statement = selectedByCategory[categoryId];
      const sourceId = conditionAssignments[conditionId][categoryId];
      return {
        id: uid("trial"),
        participant_id: participantId,
        trial_number: index + 1,
        display_order: index + 1,
        category_id: categoryId,
        category_name: category.name,
        statement_id: statement.id,
        statement_text: statement.text,
        source_id: sourceId,
        source_label: sourceById(sourceId).label,
        source_description: sourceById(sourceId).description,
        pre_source_started_at: null,
        pre_source_submitted_at: null,
        post_source_started_at: null,
        post_source_submitted_at: null,
        locked_pre_source: false
      };
    });

    return {
      version: "1.0",
      screen: "consent",
      currentTrialIndex: 0,
      participant: {
        id: participantId,
        public_token: uid("token"),
        consent_status: "not_answered",
        consented_at: null,
        age_band: "",
        education_level: "",
        gender: "",
        gender_self_describe: "",
        condition_id: conditionId,
        category_order: categoryOrder,
        completion_status: "started",
        started_at: new Date().toISOString(),
        completed_at: null
      },
      trials,
      responses: []
    };
  }

  function categoryById(id) {
    return categories.find((item) => item.id === id);
  }

  function sourceById(id) {
    return sources.find((item) => item.id === id);
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (_error) {
      return null;
    }
  }

  function resetSurvey() {
    localStorage.removeItem(STORAGE_KEY);
    state = createInitialState();
    saveState();
    render();
  }

  function replaceResponse(response) {
    const sameItem = (item) =>
      item.participant_id === response.participant_id &&
      item.trial_id === response.trial_id &&
      item.phase === response.phase &&
      item.item_key === response.item_key;
    state.responses = state.responses.filter((item) => !sameItem(item));
    state.responses.push({
      id: uid("response"),
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      ...response
    });
  }

  function recordChoice(phase, itemKey, optionValue, textValue = "", trial = null) {
    replaceResponse({
      participant_id: state.participant.id,
      trial_id: trial ? trial.id : null,
      phase,
      item_key: itemKey,
      response_type: "choice",
      numeric_value: null,
      text_value: textValue,
      option_value: optionValue,
      interacted: true
    });
  }

  function recordText(phase, itemKey, textValue, trial = null) {
    replaceResponse({
      participant_id: state.participant.id,
      trial_id: trial ? trial.id : null,
      phase,
      item_key: itemKey,
      response_type: "text",
      numeric_value: null,
      text_value: textValue,
      option_value: null,
      interacted: true
    });
  }

  function recordSlider(phase, itemKey, numericValue, trial) {
    replaceResponse({
      participant_id: state.participant.id,
      trial_id: trial.id,
      phase,
      item_key: itemKey,
      response_type: "slider",
      numeric_value: Number(numericValue),
      text_value: null,
      option_value: null,
      interacted: true
    });
  }

  function html(strings, ...values) {
    return strings.map((string, index) => `${string}${values[index] ?? ""}`).join("");
  }

  function setPanel(markup) {
    app.innerHTML = markup;
    app.querySelectorAll("[data-action]").forEach((element) => {
      element.addEventListener("click", handleAction);
    });
  }

  function progress(percent, label = "") {
    return html`
      <div class="progress-wrap">
        <div class="progress-meta">
          <span>${label}</span>
          <span>${Math.round(percent)}%</span>
        </div>
        <div class="progress-track" aria-hidden="true">
          <div class="progress-fill" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  }

  function actions(primaryLabel, primaryAction, secondary = "") {
    return html`
      <div class="actions">
        ${secondary}
        <button class="button primary" type="submit" data-action="${primaryAction}">${primaryLabel}</button>
      </div>
    `;
  }

  function render() {
    saveState();
    const screen = state.screen;
    if (screen === "consent") renderConsent();
    if (screen === "screenedOut") renderScreenedOut();
    if (screen === "demographics") renderDemographics();
    if (screen === "preSource") renderPreSource();
    if (screen === "postSource") renderPostSource();
    if (screen === "finalCheck") renderFinalCheck();
    if (screen === "debriefing") renderDebriefing();
  }

  function renderConsent() {
    setPanel(html`
      <section class="panel stack">
        ${progress(3, "Before you begin")}
        <div>
          <h2>Welcome</h2>
          <p>Every day, we come across short claims about health, technology, news, entertainment, and many other topics. Some statements may immediately sound convincing, while others may make us pause and think.</p>
          <p>In this short activity, you will read several statements and share your first impressions. There are no right or wrong answers. We are interested in how people make sense of everyday information.</p>
        </div>
        <div class="notice">
          <strong>What you will do</strong>
          <p class="muted">Read seven short statements, rate your impressions, view a possible hypothetical source, and rate your confidence again. Most people finish in about 8-12 minutes.</p>
        </div>
        <p>Taking part is completely voluntary. You may skip a question or stop at any time without penalty. We will not ask for your name, email address, student ID, or other direct identifying information.</p>
        <p>Some source labels shown during the activity are assigned hypothetically for research purposes. A source label does not necessarily mean that the statement was actually written or published by that source.</p>
        <form id="consent-form" class="question-list">
          <fieldset class="field">
            <legend>Would you like to participate?</legend>
            <label class="choice"><input type="radio" name="consent" value="yes" required> Yes, I have read the information above and agree to participate.</label>
            <label class="choice"><input type="radio" name="consent" value="no"> No, I do not wish to participate.</label>
          </fieldset>
          ${actions("Continue", "submit-consent")}
        </form>
      </section>
    `);
  }

  function renderScreenedOut() {
    setPanel(html`
      <section class="panel stack">
        <h2>Thank you</h2>
        <p>You chose not to participate. No trial responses were recorded.</p>
        <div class="actions">
          <button class="button" data-action="reset">Start over</button>
        </div>
      </section>
    `);
  }

  function renderDemographics() {
    setPanel(html`
      <section class="panel stack">
        ${progress(12, "A little about you")}
        <h2>A Little About You</h2>
        <p class="muted">These questions help us understand who took part. You may choose Prefer not to answer whenever it is offered.</p>
        <form id="demographics-form" class="question-list">
          ${selectField("age_band", "What is your age?", [
            "Under 13", "13-14", "15-16", "17-18", "19-20", "21-22", "23-24", "25-26", "27-28", "29-30", "31 or older", "Prefer not to answer"
          ], state.participant.age_band)}
          ${selectField("education_level", "What best describes your current education level?", [
            "High school student", "Undergraduate student", "Graduate student", "Not currently a student", "Other", "Prefer not to answer"
          ], state.participant.education_level)}
          ${selectField("gender", "How do you describe your gender?", [
            "Woman", "Man", "Nonbinary", "Prefer to self-describe", "Prefer not to answer"
          ], state.participant.gender)}
          <div class="field" id="gender-self-wrap">
            <label for="gender_self_describe">Self-description</label>
            <input id="gender_self_describe" name="gender_self_describe" type="text" value="${escapeHtml(state.participant.gender_self_describe)}">
          </div>
          ${actions("Begin activity", "submit-demographics")}
        </form>
      </section>
    `);
    const genderSelect = document.getElementById("gender");
    const selfWrap = document.getElementById("gender-self-wrap");
    const updateSelfDescribe = () => {
      selfWrap.classList.toggle("hidden", genderSelect.value !== "Prefer to self-describe");
    };
    genderSelect.addEventListener("change", updateSelfDescribe);
    updateSelfDescribe();
  }

  function selectField(name, label, options, value) {
    return html`
      <div class="field">
        <label for="${name}">${label}</label>
        <select id="${name}" name="${name}" required>
          <option value="">Select one</option>
          ${options.map((option) => `<option value="${escapeHtml(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
        </select>
      </div>
    `;
  }

  function currentTrial() {
    return state.trials[state.currentTrialIndex];
  }

  function renderPreSource() {
    const trial = currentTrial();
    if (!trial.pre_source_started_at) trial.pre_source_started_at = new Date().toISOString();
    setPanel(html`
      <section class="panel stack">
        ${progress(15 + state.currentTrialIndex * 10, `Statement ${trial.trial_number} of 7`)}
        ${statementMarkup(trial)}
        <form id="pre-source-form" class="question-list">
          <div id="slider-mount"></div>
          <p class="error hidden" id="slider-error">Please move each slider before continuing.</p>
          ${actions("Continue", "submit-pre-source")}
        </form>
      </section>
    `);
    mountSliders("slider-mount", ["understandability", "neutrality", "appropriateness", "confidence_pre_source"]);
  }

  function renderPostSource() {
    const trial = currentTrial();
    if (!trial.post_source_started_at) trial.post_source_started_at = new Date().toISOString();
    setPanel(html`
      <section class="panel stack">
        ${progress(20 + state.currentTrialIndex * 10, `Statement ${trial.trial_number} of 7`)}
        <div class="source-box">
          <div class="source-label">Suppose the statement you just read came from: ${escapeHtml(trial.source_label)}</div>
          <p>${escapeHtml(trial.source_description)}</p>
          <p class="muted">For this activity, the source is hypothetical.</p>
        </div>
        ${statementMarkup(trial)}
        <form id="post-source-form" class="question-list">
          <div id="slider-mount"></div>
          <p class="error hidden" id="slider-error">Please move the slider before continuing.</p>
          ${actions(state.currentTrialIndex === 6 ? "Continue to final check" : "Next statement", "submit-post-source")}
        </form>
      </section>
    `);
    mountSliders("slider-mount", ["confidence_post_source"]);
  }

  function statementMarkup(trial) {
    return html`
      <div class="statement-box">
        <div class="statement-category">Category: ${escapeHtml(trial.category_name)}</div>
        <div class="statement-text">${escapeHtml(trial.statement_text)}</div>
      </div>
    `;
  }

  function mountSliders(containerId, keys) {
    const container = document.getElementById(containerId);
    const template = document.getElementById("slider-template");
    for (const key of keys) {
      const definition = sliderDefinitions[key];
      const node = template.content.cloneNode(true);
      const field = node.querySelector("[data-slider-field]");
      const legend = node.querySelector("legend");
      const range = node.querySelector("input");
      const output = node.querySelector("output");
      const labels = node.querySelectorAll(".scale-labels span");
      field.dataset.itemKey = key;
      legend.textContent = definition.question;
      range.name = key;
      range.dataset.touched = "false";
      range.addEventListener("input", () => {
        range.dataset.touched = "true";
        output.textContent = range.value;
      });
      labels[0].textContent = definition.labels[0];
      labels[1].textContent = definition.labels[1];
      labels[2].textContent = definition.labels[2];
      container.appendChild(node);
    }
  }

  function renderFinalCheck() {
    setPanel(html`
      <section class="panel stack">
        ${progress(91, "One last check in")}
        <h2>One Last Check In</h2>
        <form id="final-check-form" class="question-list">
          <fieldset class="field">
            <legend>Before today, did you already know or suspect what this activity was designed to examine?</legend>
            <label class="choice"><input type="radio" name="prior_awareness" value="No" required> No</label>
            <label class="choice"><input type="radio" name="prior_awareness" value="Yes"> Yes</label>
            <label class="choice"><input type="radio" name="prior_awareness" value="Not sure"> Not sure</label>
          </fieldset>
          ${actions("Finish survey", "submit-final-check")}
        </form>
      </section>
    `);
  }

  function renderDebriefing() {
    state.participant.completion_status = "completed";
    if (!state.participant.completed_at) state.participant.completed_at = new Date().toISOString();
    saveState();
    const rows = buildTrialRows();
    setPanel(html`
      <section class="panel stack">
        ${progress(100, "Complete")}
        <h2>Thank you for taking part</h2>
        <p>This project examines whether the type of information source changes how confident people feel about the same information across different subject areas.</p>
        <p>The source labels were assigned for research purposes. A displayed source does not necessarily mean that the statement was actually written or published by that source.</p>
        <p>The goal is to understand reactions to different types of sources, not to test your knowledge or judge whether your answers were right or wrong.</p>
        <p>Your responses will be combined with responses from other participants when the results are analyzed. Please avoid discussing the specific purpose of the activity with people who may participate later.</p>
        <div class="summary-grid">
          <div class="summary-item"><strong>Participant token</strong>${escapeHtml(state.participant.public_token)}</div>
          <div class="summary-item"><strong>Condition</strong>${escapeHtml(state.participant.condition_id)}</div>
          <div class="summary-item"><strong>Trials recorded</strong>${rows.length}</div>
          <div class="summary-item"><strong>Item responses</strong>${state.responses.length}</div>
        </div>
        <div class="notice warning">
          <strong>Study contact:</strong> ______________________________________________<br>
          <strong>Supervising researcher or institution:</strong> _____________________________
        </div>
        <div class="actions">
          <button class="button" data-action="download-json">Download JSON</button>
          <button class="button" data-action="download-csv">Download CSV</button>
          <button class="button danger" data-action="reset">Start a new pilot response</button>
        </div>
      </section>
    `);
  }

  function handleAction(event) {
    const action = event.currentTarget.dataset.action;
    if (action === "submit-consent") submitConsent(event);
    if (action === "submit-demographics") submitDemographics(event);
    if (action === "submit-pre-source") submitPreSource(event);
    if (action === "submit-post-source") submitPostSource(event);
    if (action === "submit-final-check") submitFinalCheck(event);
    if (action === "download-json") downloadJson();
    if (action === "download-csv") downloadCsv();
    if (action === "reset") resetSurvey();
  }

  function submitConsent(event) {
    event.preventDefault();
    const form = document.getElementById("consent-form");
    if (!form.reportValidity()) return;
    const consent = new FormData(form).get("consent");
    state.participant.consent_status = consent;
    recordChoice("consent", "consent", consent);
    if (consent === "no") {
      state.participant.completion_status = "screened_out";
      state.screen = "screenedOut";
    } else {
      state.participant.consented_at = new Date().toISOString();
      state.participant.completion_status = "in_progress";
      state.screen = "demographics";
    }
    render();
  }

  function submitDemographics(event) {
    event.preventDefault();
    const form = document.getElementById("demographics-form");
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    state.participant.age_band = data.get("age_band");
    state.participant.education_level = data.get("education_level");
    state.participant.gender = data.get("gender");
    state.participant.gender_self_describe = data.get("gender_self_describe") || "";
    recordChoice("demographics", "age_band", state.participant.age_band);
    recordChoice("demographics", "education_level", state.participant.education_level);
    recordChoice("demographics", "gender", state.participant.gender);
    if (state.participant.gender === "Prefer to self-describe") {
      recordText("demographics", "gender_self_describe", state.participant.gender_self_describe);
    }
    state.screen = "preSource";
    render();
  }

  function touchedSliders(form) {
    return Array.from(form.querySelectorAll('input[type="range"]')).filter((input) => input.dataset.touched === "true");
  }

  function requireAllSliders(form) {
    const sliders = Array.from(form.querySelectorAll('input[type="range"]'));
    const touched = touchedSliders(form);
    const ok = touched.length === sliders.length;
    const error = document.getElementById("slider-error");
    if (error) error.classList.toggle("hidden", ok);
    return ok;
  }

  function submitPreSource(event) {
    event.preventDefault();
    const form = document.getElementById("pre-source-form");
    if (!requireAllSliders(form)) return;
    const trial = currentTrial();
    for (const input of touchedSliders(form)) {
      recordSlider("pre_source", input.name, input.value, trial);
    }
    trial.pre_source_submitted_at = new Date().toISOString();
    trial.locked_pre_source = true;
    state.screen = "postSource";
    render();
  }

  function submitPostSource(event) {
    event.preventDefault();
    const form = document.getElementById("post-source-form");
    if (!requireAllSliders(form)) return;
    const trial = currentTrial();
    const input = form.querySelector('input[type="range"]');
    recordSlider("post_source", input.name, input.value, trial);
    trial.post_source_submitted_at = new Date().toISOString();
    if (state.currentTrialIndex < state.trials.length - 1) {
      state.currentTrialIndex += 1;
      state.screen = "preSource";
    } else {
      state.screen = "finalCheck";
    }
    render();
  }

  function submitFinalCheck(event) {
    event.preventDefault();
    const form = document.getElementById("final-check-form");
    if (!form.reportValidity()) return;
    const prior = new FormData(form).get("prior_awareness");
    recordChoice("final_check", "prior_awareness", prior);
    state.screen = "debriefing";
    render();
  }

  function responseValue(trial, key) {
    const response = state.responses.find((item) => item.trial_id === trial.id && item.item_key === key);
    return response ? response.numeric_value : "";
  }

  function buildTrialRows() {
    return state.trials.map((trial) => ({
      participant_id: state.participant.id,
      public_token: state.participant.public_token,
      condition_id: state.participant.condition_id,
      trial_number: trial.trial_number,
      display_order: trial.display_order,
      category: trial.category_name,
      statement_id: trial.statement_id,
      statement_text: trial.statement_text,
      source_id: trial.source_id,
      source_label: trial.source_label,
      source_description: trial.source_description,
      understandability: responseValue(trial, "understandability"),
      neutrality: responseValue(trial, "neutrality"),
      appropriateness: responseValue(trial, "appropriateness"),
      confidence_pre_source: responseValue(trial, "confidence_pre_source"),
      confidence_post_source: responseValue(trial, "confidence_post_source"),
      pre_source_submitted_at: trial.pre_source_submitted_at || "",
      post_source_submitted_at: trial.post_source_submitted_at || ""
    }));
  }

  function exportPayload() {
    return {
      version: state.version,
      participant: state.participant,
      trials: state.trials,
      item_responses: state.responses,
      trial_results_wide: buildTrialRows()
    };
  }

  function downloadJson() {
    downloadFile(
      `everyday-information-survey-${state.participant.public_token}.json`,
      "application/json",
      JSON.stringify(exportPayload(), null, 2)
    );
  }

  function downloadCsv() {
    const rows = buildTrialRows();
    const headers = Object.keys(rows[0] || {});
    const csvRows = [
      headers.join(","),
      ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))
    ];
    downloadFile(
      `everyday-information-survey-${state.participant.public_token}.csv`,
      "text/csv",
      csvRows.join("\n")
    );
  }

  function downloadFile(filename, type, content) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  window.SurveyApp = {
    constants: { categories, statements, sources, conditionAssignments, sliderDefinitions },
    createInitialState,
    exportPayload: () => exportPayload(),
    resetSurvey,
    getState: () => state
  };

  render();
})();
