import React, { useState, useEffect, useRef, useMemo } from "react";

/* ============================================================
   DATASCAPE: CAMBRIDGE — workplace simulator for L6 Data
   Scientist apprentices (ST0585).
   v4: imperative movement engine (smooth, no per-frame React
   re-renders), input isolation while tasks are open, and a
   full graphics pass on offices, characters and the city map.
   ============================================================ */

const C = {
  ink: "#1B2A41", inkSoft: "#33445E", cloud: "#F2F4F7", card: "#FFFFFF",
  line: "#D7DEE8", camBlue: "#A3C1AD", teal: "#2F6F5E", tealBright: "#3D9078",
  amber: "#E9A13B", brick: "#B65C45", mist: "#6B7A92", ok: "#3E8E5A",
  bad: "#C0584F", night: "#142033",
};

const REDUCED = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SPECIALISMS = {
  engineering: { name: "Data Engineering", color: "#2F6F5E", desc: "Pipelines, storage & data quality" },
  modelling: { name: "Modelling & ML", color: "#5B5EA6", desc: "Statistics & machine learning" },
  analytics: { name: "Analytics & Communication", color: "#C2703D", desc: "Visualisation & stakeholders" },
  governance: { name: "Governance & Ethics", color: "#A6485B", desc: "GDPR, bias & responsible data" },
};

const SKINS = ["#F2D3B3", "#E0B188", "#C68B59", "#9C6B43", "#6B4A2F"];
const HAIR_COLORS = ["#241C14", "#5B3A21", "#8C6239", "#C49A4A", "#C9CDD6", "#A4452F"];
const HAIR_STYLES = ["crop", "long", "curls", "bun"];
const OUTFITS = [
  { name: "jumper", color: "#3D9078" }, { name: "hoodie", color: "#4A5B7A" },
  { name: "blazer", color: "#27364F" }, { name: "shirt", color: "#B65C45" },
];
const ACCESSORIES = ["none", "glasses", "lanyard", "headset"];

const STRANDS = {
  engineering: "Data Engineering", stats: "Statistics & Probability", ml: "Machine Learning",
  ethics: "Governance & Ethics", comms: "Analytics & Communication", synoptic: "End-to-end Practice",
};
const STRAND_TO_SPEC = { engineering: "engineering", stats: "modelling", ml: "modelling", ethics: "governance", comms: "analytics", synoptic: null };

/* ST0585 v1.1 — Data Scientist (integrated degree), Level 6.
   Codes follow provider convention (K1–K5, S1–S8, B1–B6) against the
   published standard. Descriptors are concise paraphrases — always verify
   against the published standard and your provider's own mapping. */
const KSB = {
  K1: { kind: "Knowledge", s: "Data science in context", d: "How data science relates to computer science, statistics and software engineering, and how those disciplines have shaped approaches to data systems." },
  K2: { kind: "Knowledge", s: "Governance, ethics, GDPR & bias", d: "How data science operates within governance, security and communications; how data and analysis can carry bias; how ethics, compliance and international regulation (including GDPR) affect the work." },
  K3: { kind: "Knowledge", s: "Data platforms & systems", d: "Key platforms for data and analysis: processing and storage (cloud and on-premise), database systems (relational, warehousing/OLAP, NoSQL and real-time approaches) and data-driven decision making." },
  K4: { kind: "Knowledge", s: "Analytical algorithms & ML", d: "Designing, implementing and optimising analytical algorithms as prototypes and at production scale: statistical and mathematical methods, ML/AI techniques, resource trade-offs and development standards." },
  K5: { kind: "Knowledge", s: "The data landscape", d: "Critically analysing and evaluating complex information from diverse datasets: sources, formats and structures (including unstructured data) and common patterns in real-world data." },
  S1: { kind: "Skill", s: "Reformulate problems scientifically", d: "Identify organisational problems and reformulate them as data science problems; apply scientific method through experiment design and hypothesis testing; gather requirements with stakeholders." },
  S2: { kind: "Skill", s: "Data engineering & governance", d: "Create and handle datasets for analysis: source, access, explore, profile, pipeline, combine, transform and store data, applying quality, security and privacy controls." },
  S3: { kind: "Skill", s: "Programming & tooling", d: "Use appropriate languages and tools for data manipulation, analysis, visualisation and integration; choose suitable data structures and algorithms; write reproducible, robust code to development standards." },
  S4: { kind: "Skill", s: "Statistical analysis & modelling", d: "Build models and validate results with statistical testing: statistical analysis, correlation vs causation, feature engineering, machine learning, optimisation and simulation." },
  S5: { kind: "Skill", s: "Implement & evaluate solutions", d: "Implement data solutions with relevant architectures and design patterns; evaluate cloud vs on-premise, value for money and ROI; scale systems and assess emerging approaches." },
  S6: { kind: "Skill", s: "Communicate with impact", d: "Present and disseminate outputs with high impact: tailor the message to the audience, visualise data into compelling, actionable narratives, and make recommendations to decision makers." },
  S7: { kind: "Skill", s: "Collaborative relationships", d: "Develop and maintain collaborative relationships at strategic and operational levels through organisational empathy, active listening and building trust." },
  S8: { kind: "Skill", s: "Project delivery", d: "Use appropriate project delivery techniques and tools: plan, organise and manage resources to run a small data science project and enable effective change." },
  B1: { kind: "Behaviour", s: "Inquisitive & tenacious", d: "Curiosity to explore new questions, data and techniques; tenacity to improve methods and maximise insight; creativity in approaching solutions." },
  B2: { kind: "Behaviour", s: "Empathy, ethics & teamwork", d: "Empathy and positive engagement in multi-disciplinary teams, championing ethics and diversity in data work." },
  B3: { kind: "Behaviour", s: "Adaptable & pragmatic", d: "Adaptability and dynamism across varied tasks and organisational timescales, with pragmatism in real-world scenarios." },
  B4: { kind: "Behaviour", s: "Organisational context", d: "Considering problems in the context of organisational goals." },
  B5: { kind: "Behaviour", s: "Scientific rigour & integrity", d: "An impartial, hypothesis-driven approach, rigorous analysis methods, and integrity in presenting data and conclusions truthfully and appropriately." },
  B6: { kind: "Behaviour", s: "Continuous development", d: "Keeping up to date with current thinking, maintaining personal development and collaborating with the data science community." },
};

/* ================= TASKS ================= */
const TASKS = [
  {
    id: "standup-triage", wp: "fen", strand: "engineering", xp: 90,
    title: "Stand-up: cleanse the sensor feed",
    ksb: ["S2", "K5", "B1"],
    brief: "Priya (Data Engineering Lead): \u201CMorning. The smart-building sensor feed landed overnight and it's rough — duplicate readings, missing values, three different timestamp formats. Before anyone analyses it, walk me through the order you'd clean it in.\u201D",
    challenge: { type: "order",
      q: "Put the cleansing steps into a sensible working order:",
      items: [
        "Profile the data to understand its quality issues",
        "Handle missing values (impute or remove)",
        "Remove duplicate readings",
        "Standardise formats (timestamps, units, casing)",
        "Validate the cleaned data against business rules",
      ],
      explain: "Profile first so you know what you're fixing. Then resolve missingness and duplicates, standardise formats, and validate the output before it reaches analysts. Cleaning blind wastes effort and hides problems.",
    },
  },
  {
    id: "storage-choice", wp: "fen", strand: "engineering", xp: 80,
    title: "Choose the landing zone",
    ksb: ["K3", "S5"],
    brief: "A new client streams raw JSON event logs — schema changes month to month, volumes are large, and analysts only query slices of it. Priya asks where you'd land the raw data first.",
    challenge: { type: "mcq",
      q: "Best first home for large, schema-shifting raw JSON events?",
      options: [
        "A data lake on object storage, with downstream curated tables",
        "A single shared spreadsheet",
        "A relational table with a fixed schema, rejecting non-conforming rows",
        "Email attachments archived weekly",
      ],
      answer: 0,
      explain: "Object-storage data lakes handle volume and evolving schemas cheaply; you then curate validated, structured tables downstream (raw → cleaned → curated layering). A rigid schema at ingestion drops data every time the format shifts.",
    },
  },
  {
    id: "nightly-pipeline", wp: "fen", strand: "engineering", xp: 110,
    title: "Ship the nightly pipeline",
    ksb: ["S2", "K4"],
    brief: "The team is automating the churn model end-to-end. On the whiteboard are six stages in the wrong order. Priya hands you the pen.",
    challenge: { type: "order",
      q: "Order the stages of the end-to-end ML pipeline:",
      items: [
        "Ingest raw data from source systems",
        "Cleanse and prepare the data",
        "Engineer features",
        "Train candidate models",
        "Evaluate against held-out data",
        "Deploy and monitor in production",
      ],
      explain: "Ingest → cleanse → feature engineering → train → evaluate → deploy & monitor. Monitoring is part of the job, not an afterthought: data drifts, and last month's model quietly degrades.",
    },
  },
  {
    id: "sql-sensors", wp: "fen", strand: "engineering", xp: 120,
    title: "Workstation: query the readings",
    ksb: ["S3", "K3"],
    brief: "Your workstation pings. Ticket #4112 from the facilities client: \u201CWhich buildings are using the most energy? We need average kWh per building from the cleaned sensor table.\u201D Write the query.",
    challenge: { type: "sql",
      schema: ["sensor_readings", "  building      TEXT", "  reading_time  TIMESTAMP", "  kwh           NUMERIC"],
      q: "Return each building with its average kwh. Alias optional.",
      placeholder: "SELECT ...",
      checks: [
        { re: /select/i, msg: "syntax error: expected a SELECT statement" },
        { re: /from\s+sensor_readings/i, msg: "relation not found: query must read FROM sensor_readings" },
        { re: /avg\s*\(\s*kwh\s*\)/i, msg: "hint: you need an aggregate — AVG(kwh)" },
        { re: /select[\s\S]*building/i, msg: "column missing: include building in your SELECT" },
        { re: /group\s+by\s+building/i, msg: "aggregate error: AVG over groups needs GROUP BY building" },
      ],
      result: { cols: ["building", "avg_kwh"], rows: [["Unit 4, Science Park", "318.2"], ["Riverside House", "247.9"], ["CB1 Hub", "201.4"]] },
      model: "SELECT building, AVG(kwh) AS avg_kwh\nFROM sensor_readings\nGROUP BY building;",
      explain: "Aggregations answer 'per-group' questions: AVG(kwh) collapses many readings into one number per building, and GROUP BY defines the groups. This select–aggregate–group pattern is the workhorse of analytical SQL.",
    },
  },
  {
    id: "skewed-recovery", wp: "camlife", strand: "stats", xp: 80,
    title: "Reporting recovery times",
    ksb: ["S4", "B5"],
    brief: "Dr. Okafor (Biostatistician): \u201CNine patients in the pilot recovered in about 12 days. One had complications and took 190. The exec summary needs a single 'typical recovery time'. Which number do we report?\u201D",
    challenge: { type: "mcq",
      q: "Which measure best represents typical recovery time here?",
      options: ["The mean", "The median", "The maximum", "The standard deviation"],
      answer: 1,
      explain: "The single 190-day outlier drags the mean to ~30 days — nearly triple a typical patient's experience. The median is robust to outliers, which is why skewed clinical and salary data are usually summarised with medians.",
    },
  },
  {
    id: "screening-baserate", wp: "camlife", strand: "stats", xp: 100,
    title: "The screening result",
    ksb: ["K4", "S4", "B5"],
    brief: "Dr. Okafor: \u201CA condition affects 1 in 1,000 people. Our screening test is 99% accurate. A patient has just tested positive and the clinical team is asking how worried they should be. What do you tell them?\u201D",
    challenge: { type: "mcq",
      q: "The patient tests positive. What's the sound interpretation?",
      options: [
        "They almost certainly have the condition (≈99%)",
        "It's roughly 50/50",
        "They probably do NOT have it — at this prevalence most positives are false positives",
        "The test result carries no information",
      ],
      answer: 2,
      explain: "Base rates dominate. Per 100,000 people: ~100 have it (~99 true positives), while ~1% of the 99,900 who don't (~999) test positive anyway. Only ~9% of positives are real — which is why screening positives lead to confirmatory testing, not diagnosis.",
    },
  },
  {
    id: "build-scatter", wp: "camlife", strand: "stats", xp: 110,
    title: "Build the recovery chart",
    ksb: ["S6", "S4"],
    brief: "Hana (Clinical Data Manager): \u201CThe consultants suspect older patients take longer to recover, but nobody's looked. Build me a chart from the pilot data that would actually show whether age and recovery time are related.\u201D",
    challenge: { type: "chart",
      goal: "Show the relationship between patient age and recovery time.",
      fields: ["patient_age", "recovery_days", "patient_id", "ward"],
      correct: { chart: "scatter", x: "patient_age", y: "recovery_days" },
      hint: "Relationships between two numeric variables are a job for a scatter plot — one variable per axis, one dot per patient.",
      data: {
        patient_age: [24, 31, 38, 45, 52, 58, 63, 67, 71, 74, 78, 82],
        recovery_days: [8, 9, 11, 10, 13, 15, 14, 18, 17, 21, 24, 26],
        patient_id: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112],
        ward: [1, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1],
      },
      explain: "A scatter of age (x) against recovery days (y) makes the relationship visible — here, a clear upward drift. IDs and ward numbers are identifiers, not measures: plotting them would produce patterns that mean nothing.",
    },
  },
  {
    id: "segment-customers", wp: "granta", strand: "ml", xp: 80,
    title: "Segmenting the customer base",
    ksb: ["K4", "S4"],
    brief: "Marcus (Head of Data Science): \u201CProduct wants to group our customers into natural segments based on spending behaviour. We've got transaction histories but no labels of any kind. What family of methods are we reaching for?\u201D",
    challenge: { type: "mcq",
      q: "No labels, goal is discovering natural groupings. Which approach?",
      options: ["Supervised regression", "Supervised classification", "Unsupervised clustering", "Reinforcement learning"],
      answer: 2,
      explain: "No labels plus a goal of discovering structure = unsupervised learning; clustering (k-means, hierarchical) is the standard tool. Regression predicts numbers, classification predicts known categories, RL learns from rewards.",
    },
  },
  {
    id: "fraud-overfit", wp: "granta", strand: "ml", xp: 100,
    title: "The suspicious fraud model",
    ksb: ["S4", "K4", "B5"],
    brief: "Marcus pulls up the new fraud model's results: 99% accuracy on training data, 62% on the held-out test set. \u201CBefore this goes anywhere near production — diagnose it.\u201D",
    challenge: { type: "mcq",
      q: "What's happening, and what's a sound remedy?",
      options: [
        "Underfitting — add far more model complexity",
        "Overfitting — regularise, simplify, or get more data; validate with cross-validation",
        "Data leakage — delete the test set",
        "Nothing — 99% training accuracy means it's production-ready",
      ],
      answer: 1,
      explain: "A large train–test gap is the classic overfitting signature: the model memorised noise rather than learning generalisable patterns. Regularisation, simpler models, more data, and cross-validation are the standard responses.",
    },
  },
  {
    id: "sql-fraud", wp: "granta", strand: "engineering", xp: 120,
    title: "Console: total the flagged spend",
    ksb: ["S3", "K3"],
    brief: "Tomasz (Analytics Engineer): \u201CRisk wants a list of customers and their total flagged transaction value — flagged rows only, totals per customer. The console's open, table's transactions. All yours.\u201D",
    challenge: { type: "sql",
      schema: ["transactions", "  customer_id  TEXT", "  amount       NUMERIC", "  flagged      BOOLEAN"],
      q: "Return customer_id with total flagged amount per customer.",
      placeholder: "SELECT ...",
      checks: [
        { re: /select/i, msg: "syntax error: expected a SELECT statement" },
        { re: /from\s+transactions/i, msg: "relation not found: query must read FROM transactions" },
        { re: /sum\s*\(\s*amount\s*\)/i, msg: "hint: 'total value' means SUM(amount)" },
        { re: /where[\s\S]*flagged/i, msg: "filter missing: only flagged rows count — add a WHERE on flagged" },
        { re: /group\s+by\s+customer_id/i, msg: "aggregate error: totals per customer need GROUP BY customer_id" },
      ],
      result: { cols: ["customer_id", "total_flagged"], rows: [["C-2117", "4,920.00"], ["C-0834", "3,310.50"], ["C-5562", "1,875.25"]] },
      model: "SELECT customer_id, SUM(amount) AS total_flagged\nFROM transactions\nWHERE flagged = TRUE\nGROUP BY customer_id;",
      explain: "Filter, then aggregate: WHERE keeps only flagged rows before SUM and GROUP BY total them per customer. Getting the order of filtering and aggregation right is the difference between an answer and a wrong number that looks plausible.",
    },
  },
  {
    id: "retention-policy", wp: "guildhall", strand: "ethics", xp: 80,
    title: "The retention question",
    ksb: ["K2", "B2"],
    brief: "Sandra (Data Protection Officer): \u201CThe permits team wants to keep every applicant's date of birth and home address indefinitely — quote: 'in case it's useful one day'. I'd like to hear an apprentice spot the problem before I write it up.\u201D",
    challenge: { type: "mcq",
      q: "Which GDPR principles does indefinite 'just in case' retention breach?",
      options: [
        "Data minimisation and storage limitation",
        "The right to data portability",
        "A requirement that all data must be encrypted",
        "None — lawfully collected data may be kept forever",
      ],
      answer: 0,
      explain: "GDPR requires collecting only what's needed (data minimisation) and keeping it no longer than necessary for a stated purpose (storage limitation). 'Might be useful one day' is not a purpose — retention schedules with deletion dates are the fix.",
    },
  },
  {
    id: "housing-bias", wp: "guildhall", strand: "ethics", xp: 100,
    title: "Bias in the priority model",
    ksb: ["K2", "B2", "B5"],
    brief: "Sandra: \u201CA contractor trained a housing-priority model on twenty years of historical decisions. Early output shows applicants from certain postcodes scoring oddly low. The model 'only learned from the data'. What's our first move?\u201D",
    challenge: { type: "mcq",
      q: "The model appears to replicate historical bias. Best first action?",
      options: [
        "Deploy it — historical data is objective by definition",
        "Audit predictions across groups and investigate the training data for embedded bias",
        "Remove protected attributes from the inputs and assume that solves it",
        "Reduce the model's overall accuracy to make it 'fairer'",
      ],
      answer: 1,
      explain: "Historical decisions encode historical bias, and models faithfully reproduce it. Audit outcomes across groups first. Dropping protected attributes rarely works because proxies — postcode being the textbook example — still encode them.",
    },
  },
  {
    id: "client-pitch", wp: "bridge", strand: "comms", xp: 80,
    title: "Explaining the forecast",
    ksb: ["S6", "S7"],
    brief: "Leah (Engagement Manager): \u201COur client runs market stalls — sharp business people, zero interest in jargon. You've got thirty seconds to explain why the demand-forecasting model is worth paying for. Go.\u201D",
    challenge: { type: "mcq",
      q: "Which explanation lands best with this client?",
      options: [
        "\u201CWe minimised RMSE using a gradient-boosted ensemble tuned via Bayesian optimisation.\u201D",
        "\u201CIt looks at what sold on similar days in the past and suggests how much stock to bring — less waste, fewer empty stalls.\u201D",
        "\u201CIt's too complicated to explain. Trust the algorithm.\u201D",
        "\u201CWe achieved 0.92 R² on a stratified holdout set.\u201D",
      ],
      answer: 1,
      explain: "Effective stakeholder communication translates method into the outcome the audience cares about — stock, waste, money — without distorting the truth. Jargon and 'just trust it' both lose the room (and the contract).",
    },
  },
  {
    id: "build-footfall", wp: "bridge", strand: "comms", xp: 110,
    title: "Build the footfall chart",
    ksb: ["S6", "B4"],
    brief: "Dev (Data Analyst): \u201CCouncil dashboard review is at four. They want to see how footfall near the Grand Arcade has moved month by month. The intern's sixty pie charts have been... retired. Build the right view.\u201D",
    challenge: { type: "chart",
      goal: "Show how monthly footfall has changed over time.",
      fields: ["month", "footfall_k", "sensor_id", "zone"],
      correct: { chart: "line", x: "month", y: "footfall_k" },
      hint: "Change over continuous time reads best as a line — the eye decodes slope as change. Put time on the x-axis.",
      data: {
        month: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        footfall_k: [41, 39, 44, 48, 53, 61, 66, 64, 55, 49, 45, 52],
        sensor_id: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
        zone: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      },
      explain: "Line chart, time on x, footfall on y: the trend (summer peak, winter dip, December bounce) is instantly legible. Sensor and zone IDs are identifiers — putting one on an axis would chart noise.",
    },
  },
  {
    id: "leakage-split", wp: "helix", strand: "ml", xp: 100,
    title: "The too-good test score",
    ksb: ["S4", "K4", "B5"],
    brief: "Dr. Ma (Computational Biologist): \u201CA colleague built an adverse-reaction model. They normalised the full dataset — fitted the scaler on everything — and *then* split into train and test. Test accuracy is spectacular. Review it before it reaches the safety board.\u201D",
    challenge: { type: "mcq",
      q: "What's the flaw, and what's the fix?",
      options: [
        "Data leakage — preprocessing was fitted using test data; fit the scaler on the training set only, then apply it to test",
        "Nothing — normalisation is always safe to do first",
        "Underfitting — the model needs more parameters",
        "The test set is too large; shrink it until accuracy stabilises",
      ],
      answer: 0,
      explain: "Fitting any preprocessing on the full dataset lets information from the test set leak into training, inflating scores. The rule: every fitted step — scalers, encoders, imputers, feature selection — is learned on training data only, then applied to test. Pipelines exist to enforce exactly this.",
    },
  },
  {
    id: "arm-compare", wp: "helix", strand: "stats", xp: 110,
    title: "Chart the treatment arms",
    ksb: ["S6", "S4"],
    brief: "Ines (Trial Analyst): \u201CInvestigator meeting Friday. They need to see, at a glance, how average biomarker response compares across the three treatment arms. Build the chart for slide four.\u201D",
    challenge: { type: "chart",
      goal: "Compare average biomarker response across the three treatment arms.",
      fields: ["treatment_arm", "mean_response", "patient_id", "visit_week"],
      correct: { chart: "bar", x: "treatment_arm", y: "mean_response" },
      hint: "Comparing a measure across a few categories is the bar chart's home ground — one bar per arm, heights compare directly.",
      data: {
        treatment_arm: [1, 2, 3],
        mean_response: [42, 58, 71],
        patient_id: [201, 202, 203],
        visit_week: [4, 4, 4],
      },
      explain: "Bars for categorical comparison: arm on x, mean response on y, and the dose-response pattern reads instantly. A line would imply continuity between arms that doesn't exist, and patient IDs are identifiers, not measures.",
    },
  },
  {
    id: "sql-top", wp: "cavendish", strand: "engineering", xp: 130,
    title: "Console: top three customers",
    ksb: ["S3", "K3"],
    brief: "Ticket from Finance: \u201CWho are our three biggest customers by total GPU hours on completed jobs this quarter? Largest first, please — board pack goes out Friday.\u201D",
    challenge: { type: "sql",
      schema: ["compute_jobs", "  customer_id  TEXT", "  gpu_hours    NUMERIC", "  status       TEXT  -- 'completed' / 'failed' / 'running'"],
      q: "Return the top 3 customer_ids by total gpu_hours on completed jobs, highest first.",
      placeholder: "SELECT ...",
      checks: [
        { re: /select/i, msg: "syntax error: expected a SELECT statement" },
        { re: /from\s+compute_jobs/i, msg: "relation not found: query must read FROM compute_jobs" },
        { re: /sum\s*\(\s*gpu_hours\s*\)/i, msg: "hint: 'total GPU hours' means SUM(gpu_hours)" },
        { re: /where[\s\S]*completed/i, msg: "filter missing: only completed jobs count — add a WHERE on status" },
        { re: /group\s+by\s+customer_id/i, msg: "aggregate error: totals per customer need GROUP BY customer_id" },
        { re: /order\s+by[\s\S]*desc/i, msg: "ordering missing: 'highest first' needs ORDER BY ... DESC" },
        { re: /limit\s+3/i, msg: "almost: 'top three' — cap the result with LIMIT 3" },
      ],
      result: { cols: ["customer_id", "total_hours"], rows: [["CUST-0419", "12,480"], ["CUST-1077", "9,962"], ["CUST-0233", "7,415"]] },
      model: "SELECT customer_id, SUM(gpu_hours) AS total_hours\nFROM compute_jobs\nWHERE status = 'completed'\nGROUP BY customer_id\nORDER BY total_hours DESC\nLIMIT 3;",
      explain: "Filter → aggregate → sort → cap: WHERE keeps completed jobs, SUM + GROUP BY totals per customer, ORDER BY ... DESC ranks them, LIMIT 3 takes the podium. This shape — a 'top-N per group' query — turns up in almost every analytics job.",
    },
  },
  {
    id: "batch-stream", wp: "cavendish", strand: "engineering", xp: 90,
    title: "Batch or streaming?",
    ksb: ["K3", "S5", "B3"],
    brief: "Ravi (Platform Lead): \u201CTwo clients, one afternoon. One wants temperature alerts from their GPU cluster within seconds of a spike. The other wants monthly billing rollups across millions of job records. Pick the processing pattern for each — and justify it.\u201D",
    challenge: { type: "mcq",
      q: "Which architecture pairing is right?",
      options: [
        "Streaming for the alerts (low latency on events), batch for the billing rollups (high throughput on bounded data)",
        "Batch for both — simpler is always better",
        "Streaming for both — real-time is always better",
        "Neither; export everything to spreadsheets nightly",
      ],
      answer: 0,
      explain: "Match the pattern to the latency requirement. Alerts are event-driven and worthless if late — that's streaming. Monthly rollups process a large bounded dataset where throughput and cost-efficiency matter, not seconds — that's batch. Most real platforms run both, side by side.",
    },
  },
  {
    id: "rent-features", wp: "nestwise", strand: "ml", xp: 100,
    title: "Features for the rent model",
    ksb: ["S4", "K5", "B2"],
    brief: "Yusuf (Founder, Nestwise): \u201CWe predict a fair rent for any flat in the city. The intern proposed a feature list and I want a second opinion before it goes anywhere near the model. Which set would you actually use?\u201D",
    challenge: { type: "mcq",
      q: "Which feature set is sound for a fair-rent prediction model?",
      options: [
        "Floor area, bedrooms, location, property age, distance to the station",
        "All of those PLUS the landlord's current asking rent from the listing",
        "All of those PLUS the applicant's name and nationality",
        "Just a random property ID — the model will figure it out",
      ],
      answer: 0,
      explain: "Asking rent is a proxy for the target — including it leaks the answer into the model and reproduces whatever the market is already doing wrong. Applicant name and nationality are protected characteristics: discriminatory and illegal to price on. Good features describe the property, not the answer or the person.",
    },
  },
  {
    id: "abtest-order", wp: "nestwise", strand: "stats", xp: 110,
    title: "Run the experiment properly",
    ksb: ["S1", "S4", "B5"],
    brief: "Yusuf: \u201CWe're testing whether the new estimate page converts better. Last time someone 'ran a test' they checked the numbers every hour and stopped the moment it looked good. Show me the right order of operations.\u201D",
    challenge: { type: "order",
      q: "Put the A/B test steps into the correct order:",
      items: [
        "Define the success metric and hypothesis",
        "Calculate the sample size needed",
        "Randomise users into control and variant",
        "Run for the planned duration without peeking",
        "Analyse the results with a statistical test",
        "Decide, document and share the outcome",
      ],
      explain: "Metric and hypothesis first, sample size second — otherwise you can't know when you're done. Randomisation makes groups comparable; stopping early when results 'look good' inflates false positives (optional stopping). Pre-commit, run, analyse, decide.",
    },
  },
  {
    id: "parkrun-bias", wp: "park", strand: "stats", xp: 90,
    title: "The parkrun fallacy",
    ksb: ["K5", "B5"],
    brief: "Dana (parkrun volunteer): \u201CA councillor saw our timing data and announced the city's fitness is 'well above national average'. Three hundred Saturday-morning runners, apparently, speak for a hundred and fifty thousand residents. Your verdict?\u201D",
    challenge: { type: "mcq",
      q: "What's wrong with estimating city-wide fitness from parkrun data?",
      options: [
        "Nothing — three hundred is a big enough sample",
        "Selection bias — people who choose to run on Saturday mornings aren't representative of the city",
        "The sample is too small; five hundred runners would fix it",
        "Timing chips are inaccurate, so the data is useless",
      ],
      answer: 1,
      explain: "The flaw isn't size, it's selection: parkrunners self-select for fitness, so no amount of them represents the non-running majority. A bigger biased sample is just a more confident wrong answer — representativeness beats volume.",
    },
  },
  {
    id: "quiz-night", wp: "pub", strand: "stats", xp: 80,
    title: "Round four: statistics",
    ksb: ["S4", "B5"],
    brief: "Maggie (Quizmaster): \u201CWarm-up question, no conferring. Ice cream sales and drownings rise and fall together, year after year. A tabloid says ice cream causes drowning. What does a data scientist say?\u201D",
    challenge: { type: "mcq",
      q: "Ice cream sales correlate with drownings. The best explanation?",
      options: [
        "Ice cream genuinely causes drowning",
        "Drowning reports drive ice cream sales",
        "A confounder — hot weather increases both swimming and ice cream sales",
        "Pure coincidence; correlations mean nothing",
      ],
      answer: 2,
      explain: "Classic confounding: summer heat drives both variables, creating correlation with no causal link between them. Correlation is a clue, not a verdict — always ask what third factor could move both before claiming cause.",
    },
  },
  /* ---- QUEST: The Footfall Files ---- */
  {
    id: "footfall-scope", wp: "guildhall", strand: "synoptic", xp: 100,
    title: "Footfall Files I: scope the question",
    ksb: ["S1", "B4"],
    brief: "Sandra: \u201CNew assignment — the council wants to know if Market Square is 'doing better' since the layout changed, and the traders' pitch fees may ride on the answer. Before anyone touches data: turn that vague question into an answerable one.\u201D",
    challenge: { type: "mcq",
      q: "Which scoping best reformulates 'is the market doing better?'",
      options: [
        "Compare average daily footfall by zone for 12 months before vs after the change, separating market days from non-market days, with weather noted as a caveat",
        "Ask five traders how business feels and write that up",
        "Pull every dataset the council owns and look for anything interesting",
        "Declare it better — footfall was up last Tuesday",
      ],
      answer: 0,
      explain: "A good reformulation defines the metric (footfall by zone), the comparison (before vs after, like-for-like days) and the caveats (weather) — answerable, fair and decision-ready. Anecdotes, fishing expeditions and single-day cherry-picks all fail someone whose fees depend on the answer.",
    },
  },
  {
    id: "footfall-sql", wp: "bridge", strand: "engineering", xp: 120,
    title: "Footfall Files II: crunch the numbers",
    ksb: ["S3", "K3"],
    brief: "Dev's spare laptop is signed into the council footfall warehouse. The brief from Sandra: total visits per zone, market days only — the traders will see these numbers.",
    challenge: { type: "sql",
      schema: ["footfall_counts", "  zone      TEXT", "  day_type  TEXT  -- 'market' / 'normal'", "  visits    INTEGER"],
      q: "Return each zone with total visits on market days only.",
      placeholder: "SELECT ...",
      checks: [
        { re: /select/i, msg: "syntax error: expected a SELECT statement" },
        { re: /from\s+footfall_counts/i, msg: "relation not found: query must read FROM footfall_counts" },
        { re: /sum\s*\(\s*visits\s*\)/i, msg: "hint: 'total visits' means SUM(visits)" },
        { re: /where[\s\S]*market/i, msg: "filter missing: market days only — add a WHERE on day_type" },
        { re: /group\s+by\s+zone/i, msg: "aggregate error: totals per zone need GROUP BY zone" },
      ],
      result: { cols: ["zone", "total_visits"], rows: [["Market Square N", "184,202"], ["Market Square S", "171,876"], ["Petty Cury", "143,310"]] },
      model: "SELECT zone, SUM(visits) AS total_visits\nFROM footfall_counts\nWHERE day_type = 'market'\nGROUP BY zone;",
      explain: "Filter then aggregate: WHERE keeps market days before SUM and GROUP BY total per zone. When fees ride on the output, the discipline matters double — a missing WHERE here quietly mixes in normal days and changes the story.",
    },
  },
  {
    id: "footfall-pitch", wp: "pub", strand: "comms", xp: 110,
    title: "Footfall Files III: face the traders",
    ksb: ["S6", "S7", "B4"],
    brief: "The Traders' Association meets in the back room of The Beacon. Bill: \u201CRight. You've got the numbers. We've got livelihoods. Talk.\u201D The data shows footfall up 9% overall — but down 4% in the south zone.",
    challenge: { type: "mcq",
      q: "How do you present findings that are good overall but bad for some traders?",
      options: [
        "Lead with the honest full picture: up 9% overall, down 4% in the south zone — then explain what drives the difference and what could be done about it",
        "Report only the 9% — keep the room happy",
        "Report only the south-zone decline — sympathy plays well",
        "Read out the SQL so they can verify it themselves",
      ],
      answer: 0,
      explain: "Integrity and impact together: the whole truth, framed for the audience, with the 'so what'. Cherry-picking either number misleads someone — and reading code at a room of traders communicates nothing. Trust survives bad news; it doesn't survive selective news.",
    },
  },
  /* ---- QUEST: The Punt Predictor ---- */
  {
    id: "punt-brief", wp: "puntlytics", strand: "synoptic", xp: 100,
    title: "Punt Predictor I: the founder's brief",
    ksb: ["S1", "B4"],
    brief: "Freya (Founder, Puntlytics): \u201CChauffeur companies staff by gut feel — too many punters idle on rainy Tuesdays, queues round the corner on sunny Saturdays. Investors keep asking what the 'AI' is. Tell me what we're actually building.\u201D",
    challenge: { type: "mcq",
      q: "What's the right framing of the Puntlytics product?",
      options: [
        "Predict hourly punt demand from season, weather, day type and events, so operators can staff each hour — measured against their current gut-feel baseline",
        "A large language model that chats about punting",
        "Buy more punts and see what happens",
        "A dashboard with every number we can find on it",
      ],
      answer: 0,
      explain: "Anchor on the decision (how many chauffeurs per hour), predict the quantity that drives it (hourly demand), name the inputs, and benchmark against the existing baseline — that's a fundable, testable framing. 'AI' is the method; staffing is the product.",
    },
  },
  {
    id: "punt-protocol", wp: "park", strand: "engineering", xp: 100,
    title: "Punt Predictor II: ground truth",
    ksb: ["S2", "B5"],
    brief: "Theo (Co-founder, Puntlytics), stretching after a run: \u201CModels need training data and the river doesn't publish any. So we count punts by hand for a month. Design the counting protocol — and remember, whatever we collect badly now, the model learns forever.\u201D",
    challenge: { type: "mcq",
      q: "Which manual counting protocol produces usable training data?",
      options: [
        "Fixed 15-minute counts at set stations and times, covering weekdays, weekends and weathers, with a written rule for what counts as a 'trip' and an overlap session to check counters agree",
        "Count whenever someone happens to walk past the river",
        "Only count sunny Saturday afternoons — that's when it matters",
        "Estimate from memory at the end of each week",
      ],
      answer: 0,
      explain: "Good data collection is designed, not improvised: fixed windows and stations make counts comparable; covering day types and weathers captures the variation you want to model; a written counting rule plus an inter-counter agreement check controls measurement error. Convenience sampling bakes bias into the model permanently.",
    },
  },
  {
    id: "punt-chart", wp: "puntlytics", strand: "comms", xp: 110,
    title: "Punt Predictor III: the founder's chart",
    ksb: ["S6", "S4"],
    brief: "Freya: \u201CTheo's month of counting is in. One chart for the investor deck: show how punt trips move through the day. If they can't read it in three seconds, it's out.\u201D",
    challenge: { type: "chart",
      goal: "Show how punt trips vary by hour of day.",
      fields: ["hour", "trips", "punt_id", "river_level"],
      correct: { chart: "line", x: "hour", y: "trips" },
      hint: "A pattern across consecutive hours is continuous change over time — a line, with hour on the x-axis, reads in seconds.",
      data: {
        hour: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        trips: [4, 7, 12, 18, 24, 26, 22, 17, 11, 6],
        punt_id: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
        river_level: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      },
      explain: "Line chart, hour on x, trips on y: the midday peak and evening fade are instantly legible — exactly the shape a staffing decision needs. Punt IDs and river level are constants and identifiers here; charting them would say nothing.",
    },
  },
  /* ---- QUEST: Stuck on the Cam ---- */
  {
    id: "jam-handover", wp: "puntjam", strand: "engineering", xp: 90,
    title: "Stuck on the Cam I: the handover",
    ksb: ["S2", "B3"],
    brief: "Marina (shouting across two punts): \u201CThe nightly sensor load failed at 2am — duplicate keys, the alert says. I can't get to a laptop until this jam clears. Take the handover: what's the FIRST thing you do when you get to my desk?\u201D",
    challenge: { type: "mcq",
      q: "A nightly load failed on duplicate keys. First move at the keyboard?",
      options: [
        "Profile the failure: find which keys duplicated, when they arrived, and whether the source double-sent — before touching any data",
        "Delete everything that looks duplicated and re-run",
        "Re-run the job unchanged and hope",
        "Reboot the server — it usually shakes something loose",
      ],
      answer: 0,
      explain: "Diagnose before you treat. Duplicates have causes — source retries, a double-triggered job, or genuinely repeated readings — and each needs a different fix. Blind deduplication can silently delete real data; blind re-runs can double it again.",
    },
  },
  {
    id: "jam-fix", wp: "fen", strand: "engineering", xp: 130,
    title: "Stuck on the Cam II: find the duplicates",
    ksb: ["S3", "S2"],
    brief: "Marina's monitor is full of red. Per the handover: identify exactly which (building, reading_time) pairs are duplicated in the sensor table, and how many copies of each exist. Identify first — fix after.",
    challenge: { type: "sql",
      schema: ["sensor_readings", "  building      TEXT", "  reading_time  TIMESTAMP", "  kwh           NUMERIC"],
      q: "Return each duplicated (building, reading_time) pair with its number of copies.",
      placeholder: "SELECT ...",
      checks: [
        { re: /select/i, msg: "syntax error: expected a SELECT statement" },
        { re: /from\s+sensor_readings/i, msg: "relation not found: query must read FROM sensor_readings" },
        { re: /count\s*\(/i, msg: "hint: 'how many copies' means COUNT(*)" },
        { re: /group\s+by[\s\S]*building/i, msg: "a duplicate is a repeated pair — GROUP BY must include building" },
        { re: /group\s+by[\s\S]*reading_time/i, msg: "a duplicate is a repeated pair — GROUP BY must include reading_time too" },
        { re: /having[\s\S]*count/i, msg: "filters on aggregates use HAVING, not WHERE — you're filtering on COUNT(*)" },
        { re: />\s*1/, msg: "almost: only the duplicated pairs — HAVING COUNT(*) > 1" },
      ],
      result: { cols: ["building", "reading_time", "copies"], rows: [["Unit 4, Science Park", "2026-06-11 02:00", "3"], ["Riverside House", "2026-06-11 02:00", "2"]] },
      model: "SELECT building, reading_time, COUNT(*) AS copies\nFROM sensor_readings\nGROUP BY building, reading_time\nHAVING COUNT(*) > 1;",
      explain: "The canonical duplicate hunt: GROUP BY the columns that define identity, COUNT the copies, and filter the groups with HAVING (WHERE filters rows before grouping; HAVING filters after aggregation). Now Marina knows exactly what double-arrived at 2am — and the fix can be surgical instead of destructive.",
    },
  },
  {
    id: "jam-report", wp: "puntjam", strand: "comms", xp: 100,
    title: "Stuck on the Cam III: report back",
    ksb: ["S6", "B5"],
    brief: "Back at the jam (still not moving), Marina cups her hands: \u201CBrilliant. Now — what exactly do I tell my team lead? Word it for me and I'll shout it from here.\u201D",
    challenge: { type: "mcq",
      q: "What's the status update worth sending?",
      options: [
        "Cause, action, residual risk: 'Source retried at 2am and double-sent two buildings. Duplicated pairs identified via GROUP BY/HAVING, deduplicated keeping earliest, load re-run clean. Watch the retry config tonight.'",
        "'All sorted 👍'",
        "'THE VENDOR DID THIS' in capital letters, copied to everyone",
        "Forward the full 400-line error log with no comment",
      ],
      answer: 0,
      explain: "A status update that travels: what happened, what you did, what could recur — short, honest and auditable. 'All sorted' hides the risk that bites again tomorrow; blame and raw logs make the reader do your job. Integrity plus clarity is the whole craft.",
    },
  },
  /* ---- QUEST: Gridlocked ---- */
  {
    id: "grid-handover", wp: "bikejam", strand: "ml", xp: 90,
    title: "Gridlocked I: the shouted handover",
    ksb: ["K4", "B3"],
    brief: "Priti (over two hundred bicycle bells): \u201CFraud model v3 goes to release review in ten minutes and I'm IN A JAM. Get to Granta and be my voice. First — tell me you know what evidence actually decides a go/no-go.\u201D",
    challenge: { type: "mcq",
      q: "What evidence should decide whether fraud model v3 ships?",
      options: [
        "Holdout and backtest performance against the current model, error analysis on recent fraud cases, plus a monitoring and rollback plan",
        "Training accuracy is 99% — ship it",
        "The demo looked great in the all-hands",
        "The vendor's brochure says it's state of the art",
      ],
      answer: 0,
      explain: "A release decision needs two kinds of evidence: generalisation (does it beat the incumbent on data it hasn't seen, including the cases that matter?) and operational readiness (will we notice when it degrades, and can we pull it back?). Training accuracy, demos and brochures predict none of that.",
    },
  },
  {
    id: "grid-checklist", wp: "granta", strand: "ml", xp: 120,
    title: "Gridlocked II: the release checklist",
    ksb: ["S5", "K4", "B5"],
    brief: "Granta FinTech, the release review board. Priti's checklist is half-assembled and the review starts soon. Put the release steps in the order that protects both the model and the business.",
    challenge: { type: "order",
      q: "Order the model-release steps:",
      items: [
        "Confirm holdout metrics beat the current model",
        "Review error analysis on recent fraud cases",
        "Set monitoring metrics and alert thresholds",
        "Agree the rollback plan and its owner",
        "Take the evidence to the release review for sign-off",
        "Roll out gradually, watching the dashboards",
      ],
      explain: "Evidence first (does it work, and where does it fail?), operations second (how will we know, and how do we undo?), governance third (sign-off on the evidence), then a gradual rollout. A deploy is only a reversible decision if the rollback plan exists before you need it.",
    },
  },
  {
    id: "grid-report", wp: "bikejam", strand: "comms", xp: 100,
    title: "Gridlocked III: pedal back with the news",
    ksb: ["S6", "B4"],
    brief: "Back at the jam — still solid — Priti waves you over: \u201CThe review approved it! Now write the team-channel announcement for me. One message, the whole company reads it.\u201D",
    challenge: { type: "mcq",
      q: "Which announcement goes in the team channel?",
      options: [
        "\u201CFraud model v3 rolling out gradually from 2pm. Holdout beats v2 by 4 points; alerts fire if precision drops below threshold; rollback owner: Priti. Dashboards linked.\u201D",
        "\u201CSHIPPED 🚀\u201D",
        "Nothing — people will notice eventually",
        "The full evaluation notebook, pasted in its entirety",
      ],
      answer: 0,
      explain: "A release announcement is an operational document: what's changing, when, on what evidence, how it's watched, and who pulls the cord. One emoji communicates excitement; five sentences communicate accountability. The whole company can act on the second.",
    },
  },
  /* ---- TIER 2: harder follow-ons, unlocked by completing the tier-1 task ---- */
  {
    id: "pipeline-idempotent", wp: "fen", strand: "engineering", xp: 130, tier: 2, requires: ["nightly-pipeline"],
    title: "Pipelines that survive 3am",
    ksb: ["S2", "K4"],
    brief: "Joe (Platform Engineer, the Pod): \u201CYou put the pipeline stages in order — good. Now the grown-up question. Last night's run died halfway through loading, and the on-call re-ran it. What design decision makes that re-run SAFE?\u201D",
    challenge: { type: "mcq",
      q: "A pipeline crashed mid-load and must be re-run. What makes re-runs safe by design?",
      options: [
        "Idempotency: stage into a temp table, swap atomically, and key on (source, date) so a re-run overwrites instead of duplicating",
        "A team rule that pipelines are never re-run",
        "Wrapping every step in try/except and continuing on error",
        "Running the pipeline twice every night so at least one completes",
      ],
      answer: 0,
      explain: "An idempotent pipeline produces the same result no matter how many times it runs: staging plus an atomic swap means half-finished loads never show, and natural keys make re-runs overwrite rather than append. Remember Marina's duplicate keys? That was a non-idempotent re-run. Swallowing errors and double-running both make the 3am problem worse.",
    },
  },
  {
    id: "ci-interpret", wp: "camlife", strand: "stats", xp: 130, tier: 2, requires: ["screening-baserate"],
    title: "The confidence interval verdict",
    ksb: ["S4", "B5"],
    brief: "Dr. Whitfield (Consultant Epidemiologist): \u201CYou handled base rates, so try this. A trial reports the treatment effect as +2.4 points, 95% CI [\u22120.4, +5.2]. The sponsor's press release says 'treatment shown to work'. Your verdict, for the clinicians?\u201D",
    challenge: { type: "mcq",
      q: "Effect +2.4, 95% CI [\u22120.4, +5.2]. What do you tell the clinicians?",
      options: [
        "The interval includes zero — the data are also consistent with no effect. Report the estimate WITH its uncertainty, not the headline",
        "+2.4 is positive, so the treatment works",
        "The CI means 95% of patients improve by between \u22120.4 and +5.2",
        "Keep enrolling patients until the interval excludes zero, then publish",
      ],
      answer: 0,
      explain: "A 95% CI spanning zero means the trial cannot distinguish the effect from nothing at that confidence level — 'works' is not what the data say. The interval is about the estimate, not individual patients. And extending a trial until it crosses the line is optional stopping: it manufactures false positives. Integrity means publishing the uncertainty.",
    },
  },
  {
    id: "metric-imbalance", wp: "granta", strand: "ml", xp: 130, tier: 2, requires: ["fraud-overfit"],
    title: "The 99.9% accurate trap",
    ksb: ["S4", "K4"],
    brief: "Zoe (Risk Lead): \u201CMarcus says you caught the overfit. Round two. Fraud is roughly 1 transaction in 1,000. A vendor is pitching a model that's '99.9% accurate'. The commercial team is impressed. Should I be?\u201D",
    challenge: { type: "mcq",
      q: "Fraud occurs 1-in-1,000. The vendor's model is 99.9% accurate. Impressed?",
      options: [
        "No — a model that predicts 'never fraud' is also 99.9% accurate here. Judge it on precision and recall for the fraud class instead",
        "Yes — 99.9% is excellent by any standard",
        "Yes — accuracy is the industry-standard metric for a reason",
        "Throw away most of the normal transactions so the classes are balanced, then accuracy becomes meaningful",
      ],
      answer: 0,
      explain: "With 1-in-1,000 prevalence, accuracy is dominated by the easy majority class — the do-nothing model scores 99.9% while catching zero fraud. Precision and recall on the rare class (or PR-AUC) measure what matters. Rebalancing the evaluation data is worse: it scores the model on a world that doesn't exist. Same base-rate logic as the screening task — now applied to a buying decision.",
    },
  },
  {
    id: "dashboard-critique", wp: "bridge", strand: "comms", xp: 130, tier: 2, requires: ["build-footfall"],
    title: "Charting the bad news too",
    ksb: ["S6", "B5"],
    brief: "Leah (Creative Director): \u201CDev's trend chart went down well — so the council asked for more. Month-on-month change by zone, and zones three and five FELL. The temptation in this studio will be to bury that. We won't. Build the honest chart.\u201D",
    challenge: { type: "chart",
      goal: "Show month-on-month change in footfall by zone — including the zones that fell.",
      fields: ["zone", "change_pct", "total_visits", "rank"],
      correct: { chart: "bar", x: "zone", y: "change_pct" },
      hint: "Categories with values above AND below zero — bars from a shared zero baseline show direction at a glance. A line between zones implies a continuity that isn't there.",
      data: {
        zone: [1, 2, 3, 4, 5, 6],
        change_pct: [9, 12, -4, 6, -2, 15],
        total_visits: [184, 171, 143, 98, 120, 76],
        rank: [1, 2, 3, 4, 5, 6],
      },
      explain: "Diverging bars on a zero baseline: gains rise, losses fall, and zones three and five are visible in red — no burying. Zones are categories, so a line would invent a trend between them, and charting rank or totals would answer a different question. Honest visualisation is a B5 behaviour, not just an S6 skill.",
    },
  },
  {
    id: "sql-join", wp: "cavendish", strand: "engineering", xp: 140, tier: 2, requires: ["sql-top"],
    title: "Two tables, one invoice",
    ksb: ["S3", "K3"],
    brief: "Mei (Billing Analyst): \u201CYour TOP-customers query was tidy, but it lived in one table. Real billing doesn't. Customer names live in `customers`, usage lives in `jobs` — Finance wants total completed GPU hours per customer NAME before the quarter closes.\u201D",
    challenge: { type: "sql",
      schema: ["customers", "  customer_id  INTEGER", "  name         TEXT", "  segment      TEXT", "", "jobs", "  job_id       INTEGER", "  customer_id  INTEGER", "  status       TEXT  -- 'completed' / 'failed'", "  gpu_hours    NUMERIC"],
      q: "Return each customer's name with their total completed GPU hours.",
      placeholder: "SELECT ...",
      checks: [
        { re: /select/i, msg: "syntax error: expected a SELECT statement" },
        { re: /join/i, msg: "two tables, one answer — you need a JOIN" },
        { re: /customers/i, msg: "relation missing: customer names live in the customers table" },
        { re: /jobs/i, msg: "relation missing: GPU hours live in the jobs table" },
        { re: /on[\s\S]*customer_id/i, msg: "join condition missing: ON the shared key, customer_id" },
        { re: /sum\s*\(\s*\w*\.?gpu_hours\s*\)/i, msg: "hint: 'total hours' means SUM(gpu_hours)" },
        { re: /where[\s\S]*completed/i, msg: "filter missing: completed jobs only — add a WHERE on status" },
        { re: /group\s+by[\s\S]*name/i, msg: "aggregate error: totals per customer name need GROUP BY name" },
      ],
      result: { cols: ["name", "total_hours"], rows: [["Helix Therapeutics", "12,440"], ["Granta FinTech", "9,812"], ["Camlife Biomedical", "7,305"]] },
      model: "SELECT c.name, SUM(j.gpu_hours) AS total_hours\nFROM jobs j\nJOIN customers c ON c.customer_id = j.customer_id\nWHERE j.status = 'completed'\nGROUP BY c.name;",
      explain: "The JOIN stitches usage to names on the shared key; WHERE keeps completed jobs before aggregation; GROUP BY produces one row per customer. This is the relational model earning its keep — and yes, those customer names should look familiar: half the city runs on this cluster.",
    },
  },
  {
    id: "cv-design", wp: "helix", strand: "ml", xp: 140, tier: 2, requires: ["leakage-split"],
    title: "Cross-validation, patient-shaped",
    ksb: ["S4", "K4", "B5"],
    brief: "Ines (Trial Analyst): \u201CYou caught Dr. Ma's leakage problem, so you get the sequel. New imaging model: 5,000 scans from 800 patients, several scans per patient. The intern proposes standard 5-fold cross-validation, scans shuffled at random. Approve it?\u201D",
    challenge: { type: "mcq",
      q: "5,000 scans, 800 patients, several scans each. How should the cross-validation fold?",
      options: [
        "Group the folds by patient — every scan from a patient stays in the same fold, so no patient appears on both sides",
        "Standard random 5-fold on scans — more shuffling means fairer folds",
        "Train on all scans and validate on a random sample of the training set",
        "No need for folds — the model will be tested on patients eventually anyway",
      ],
      answer: 0,
      explain: "Random folds put the same patient's scans in both train and validation — the model part-recognises the person, not the pathology, and the score inflates. Grouped (per-patient) folds measure what deployment requires: performance on unseen patients. It's the same leakage you caught before, hiding one level up in the experiment design.",
    },
  },
  {
    id: "dpia-order", wp: "guildhall", strand: "ethics", xp: 130, tier: 2, requires: ["housing-bias"],
    title: "The DPIA, in the right order",
    ksb: ["K2", "B2"],
    brief: "Ade (Information Governance Officer): \u201CThe bias audit you did was the right instinct — this is the formal tool behind it. Before the council deploys anything high-risk on personal data, we run a Data Protection Impact Assessment. Show me you know the shape of one.\u201D",
    challenge: { type: "order",
      q: "Put the DPIA steps into working order:",
      items: [
        "Describe the processing: what data, about whom, for what purpose",
        "Assess necessity and proportionality against that purpose",
        "Identify the risks to the individuals affected",
        "Design mitigations for each identified risk",
        "Get the DPO's sign-off on the residual risk",
        "Set review dates so the assessment tracks the system",
      ],
      explain: "Describe before you assess, assess before you list risks, mitigate before sign-off — and a DPIA is living documentation, so it ends with review dates, not a filing cabinet. It's the housing-bias audit you ran, systematised into something a regulator can read.",
    },
  },
  /* ---- new startup tasks ---- */
  {
    id: "grid-forecast", wp: "fenline", strand: "ml", xp: 110,
    title: "Forecasting the evening peak",
    ksb: ["S4", "K5"],
    brief: "Bea (Founder, Fenline Energy): \u201CPredict tomorrow evening's demand peak and the grid spins turbines up in time instead of in a panic. The question that decides whether our model is real: which features is it allowed to use?\u201D",
    challenge: { type: "mcq",
      q: "Which feature set is valid for predicting tomorrow evening's demand peak?",
      options: [
        "Lagged demand (yesterday, same day last week), the weather forecast, and calendar features like weekday and holidays",
        "Tomorrow's actual smart-meter readings — they're the most correlated with tomorrow's peak",
        "A few hundred random columns; the model will pick what works",
        "Just the date, as a text string",
      ],
      answer: 0,
      explain: "A forecasting feature must be knowable AT prediction time: lags, forecasts and calendars all are. Tomorrow's actual readings are the answer dressed up as an input — perfect in backtest, useless in production. The energy world calls that a leak; the grid calls it a blackout.",
    },
  },
  {
    id: "consent-design", wp: "kindly", strand: "ethics", xp: 110,
    title: "Consent worth the name",
    ksb: ["K2", "B2"],
    brief: "Noor (Founder, Kindly): \u201CWe track mood — health data, the most sensitive kind. The consent screen ships next sprint and the growth consultant wants 'maximum opt-in rates'. Which design do we ship?\u201D",
    challenge: { type: "mcq",
      q: "Which consent design is right for a mood-tracking app?",
      options: [
        "Granular opt-ins: separate, plainly-worded choices for mood analysis, research sharing and reminders — all off by default, each revocable in one tap",
        "A single pre-ticked 'I agree to everything' box — maximum opt-in rates",
        "Consent buried on page 14 of the terms and conditions",
        "Skip consent — the data is basically anonymous if you don't look hard",
      ],
      answer: 0,
      explain: "Mood data is special-category health data: consent must be specific, informed, freely given and as easy to withdraw as to give. Pre-ticked boxes and buried clauses fail every one of those tests, and 'basically anonymous' is not a legal category. The kind founders learn early: trust IS the growth strategy.",
    },
  },
  {
    id: "simpsons-cricket", wp: "park", strand: "stats", xp: 120,
    title: "The committee's averages row",
    ksb: ["S4", "K5"],
    brief: "Walt (Club scorer, 41 seasons): \u201CSettle this. Asha's batting average beats Raj's in the FIRST half of the season AND in the SECOND half. But Raj's overall season average is higher. The committee says someone's cooked the books. Have they?\u201D",
    challenge: { type: "mcq",
      q: "Better in both halves, worse overall. What's going on?",
      options: [
        "Nothing is cooked — both facts can be true. Raj played far more innings in the easy-scoring half, so the season averages weight the halves differently. Check the innings counts",
        "Impossible — the scorer has made an arithmetic error somewhere",
        "The overall average is simply wrong and should be recalculated as the average of the two halves",
        "Averages from different halves of a season can never be compared",
      ],
      answer: 0,
      explain: "Simpson's paradox: an aggregate can reverse every subgroup comparison when group sizes differ. Raj banked most of his innings on flat July pitches; his season figure is dominated by the easy half. The defence is a habit, not a formula — before comparing averages, ask what each is averaging over, and look at the counts.",
    },
  },
  {
    id: "missing-data", wp: "camlife", strand: "engineering", xp: 120,
    title: "The 12% that isn't there",
    ksb: ["S2", "S4"],
    brief: "Tessa (Clinical Data Manager, the Data Suite): \u201CThe trial export landed and 12% of the blood-pressure readings are missing. The analyst wants to 'just sort it' before the stats team sees. What's the first move?\u201D",
    challenge: { type: "mcq",
      q: "12% of readings are missing. First move?",
      options: [
        "Investigate WHY they're missing — missingness can carry meaning (sicker patients miss visits), and the mechanism determines the safe handling. Then document whatever you do",
        "Fill the gaps with zero so the pipeline stops complaining",
        "Silently delete every row with a missing value",
        "Fill with the column average so the dataset looks complete",
      ],
      answer: 0,
      explain: "Missingness is data about your data. Zero-filling invents readings; silent deletion biases the sample toward patients healthy enough to attend; mean-filling fakes completeness and crushes variance. Diagnose the mechanism first — random, or related to health? — choose handling to match, and write it down so the analysis downstream knows.",
    },
  },
  {
    id: "chart-crimes", wp: "bridge", strand: "comms", xp: 120,
    title: "Refuse the exhibit",
    ksb: ["S6", "B5"],
    brief: "Sam (Data journalist in residence, the Gallery): \u201CA client's draft shows revenue bars from £50m to £52m — with the axis starting at £50m and the headline 'REVENUE SOARS'. They say the numbers are technically correct. Your call?\u201D",
    challenge: { type: "mcq",
      q: "Truncated bars, soaring headline, technically-correct numbers. What do you do?",
      options: [
        "Rebase the bars to zero — or switch to a clearly-labelled line for the narrow range — and make the headline match the 4% reality. The visual claim must match the numeric one",
        "Ship it — the numbers themselves are accurate",
        "Make the bars 3D so nobody studies the axis too closely",
        "Compromise: start the axis at £49m instead",
      ],
      answer: 0,
      explain: "Bars encode value as length, so a truncated bar axis is a lie told by geometry while the labels stay innocent. Accurate numbers under a misleading picture still mislead — most readers take the picture. Narrow ranges can be shown honestly with a line and labelled bounds; 'soars' becomes 'edges up 4%'. Integrity is the chart matching the claim.",
    },
  },
  {
    id: "calibration-check", wp: "coverpoint", strand: "ml", xp: 120,
    title: "The investor and the 78%",
    ksb: ["S4", "K4", "B5"],
    brief: "Dec (Founder, Coverpoint): \u201CLast night we published a 78% win probability. The team lost. An investor rang this morning to say the model 'failed' and we should 'fix it'. You take the call — what do you tell him?\u201D",
    challenge: { type: "mcq",
      q: "Model said 78%; team lost; investor says it failed. Your answer?",
      options: [
        "One outcome can't falsify a probability — a calibrated 78% loses 22% of the time. Judge the model on calibration across many matches: of all our ~78% calls, about 78% should win. Here's the bucket plot",
        "He's right — 78% meant they should have won, so the model is broken",
        "Round all future predictions to 0% or 100% so we're never 'wrong' again",
        "Stop publishing probabilities before matches; only 'predict' afterwards",
      ],
      answer: 0,
      explain: "Probabilities are frequency claims, judged over many events: bucket the predictions, compare stated rates with realised rates, score with a proper rule like Brier. Rounding to certainty destroys the very information clients buy, and a single loss after a 78% call is the model working — 22% of the time, on schedule.",
    },
  },
  {
    id: "bikeshare-brief", wp: "bradfield", strand: "synoptic", xp: 200, capstone: true,
    title: "The bike-share briefing",
    ksb: ["S1", "S8", "B4"],
    brief: "Client boardroom, Bradfield Centre. The bike-share operator's COO: \u201CWe're losing money. Docks near the station empty out every morning while ones by the river overflow. Our board approved budget for 'data science'. Tell me what that actually means here.\u201D",
    challenge: { type: "mcq",
      q: "What's the strongest framing of this engagement?",
      options: [
        "Buy more bikes for every dock and observe what happens",
        "Frame it as demand forecasting + rebalancing: predict dock-level demand from trip history, weather and events; benchmark against a baseline; pilot, measure impact, report",
        "Train the largest available neural network on everything and deploy immediately",
        "Survey ten riders and write a report",
      ],
      answer: 1,
      explain: "The core skill of the standard: translate business pain into a measurable prediction/optimisation problem, ground it in relevant data, compare against a baseline, pilot, and communicate impact in business terms. Method choice comes after framing — never before.",
    },
  },
];

const RANKS = ["New Starter", "Apprentice Analyst", "Junior Data Scientist", "Data Scientist", "Senior Data Scientist", "Lead Data Scientist"];
const levelOf = (xp) => Math.min(6, Math.floor(xp / 220) + 1);
const rankOf = (xp) => RANKS[levelOf(xp) - 1];

/* ================= quests (multi-location task chains) ================= */
const QUESTS = [
  {
    id: "footfall-files", title: "The Footfall Files", color: "#A6485B", bonus: 150,
    blurb: "Market Square's pitch fees hang on the numbers. Scope the question at the Guildhall, crunch it at Bridge Insights, then face the traders at The Beacon.",
    steps: ["footfall-scope", "footfall-sql", "footfall-pitch"],
  },
  {
    id: "punt-predictor", title: "The Punt Predictor", color: "#1F8A70", bonus: 150,
    blurb: "Puntlytics says the river is predictable. Take the brief at the Hatchery, design the field count on Parker's Piece, then build the chart that wins the investors.",
    steps: ["punt-brief", "punt-protocol", "punt-chart"],
  },
  {
    id: "stuck-on-the-cam", title: "Stuck on the Cam", color: "#3D7A8C", bonus: 150,
    after: "the river is moving again — go and see",
    blurb: "Marina is wedged mid-river while her nightly pipeline fails back at the office. Take the handover at the punt jam, hunt the duplicates at FenAnalytica, then report back to the boats.",
    steps: ["jam-handover", "jam-fix", "jam-report"],
  },
  {
    id: "gridlocked", title: "Gridlocked", color: "#5E646E", bonus: 150,
    after: "Mill Road is moving again — go and see",
    blurb: "Priti is wedged in the Mill Road bike jam ten minutes before the fraud-model release review. Take the shouted handover, run the release checklist at Granta FinTech, then pedal back with the news.",
    steps: ["grid-handover", "grid-checklist", "grid-report"],
  },
];
const taskQuest = (id) => QUESTS.find((q) => q.steps.includes(id));
const questLock = (taskId, completed) => {
  for (const q of QUESTS) {
    const i = q.steps.indexOf(taskId);
    if (i > 0 && !completed.includes(q.steps[i - 1])) return TASKS.find((t) => t.id === q.steps[i - 1]);
  }
  return null;
};
/* full lock check: explicit prerequisites (tiered follow-on tasks) + quest ordering */
const taskLock = (taskId, completed) => {
  const t = TASKS.find((x) => x.id === taskId);
  if (t && t.requires) {
    for (const r of t.requires) if (!completed.includes(r)) return TASKS.find((x) => x.id === r);
  }
  return questLock(taskId, completed);
};

/* ================= WORKPLACES ================= */
const FOOT = { desk: [72, 40], meet: [150, 76], plant: [26, 26], server: [38, 64], sofa: [92, 38], kitchen: [120, 40], board: [96, 58], printer: [34, 30], cabinet: [60, 26], shelf: [26, 86], tree: [30, 30], bench: [58, 20], lamp: [12, 12], bar: [160, 40], pubtable: [54, 54], stand: [64, 40], bike: [40, 18], van: [120, 60], cone: [16, 16], stumps: [10, 10] };
const RW = 900, RH = 560, WALL = 18, TOPBAND = 48, PR = 11;
const VW = 640, VH = 440; /* camera viewport — player stays centred */

const WORKPLACES = {
  fen: {
    name: "FenAnalytica", place: "Cambridge Science Park", mp: "Science Park", mx: 790, my: 170,
    blurb: "Data platform consultancy on the Science Park.",
    rw: 1150, rh: 640,
    floor: "#EDE6D8", floorKind: "wood", accent: "#2F6F5E", wall: "#DDE6DC", wallDark: "#A9BBA8",
    spawn: { x: 450, y: 585 },
    walls: [
      { x: 640, y: TOPBAND, w: 12, h: 162 },
      { x: 640, y: 210, w: 110, h: 12 }, { x: 800, y: 210, w: 332, h: 12 },
      { x: 600, y: 380, w: 12, h: 60, glass: 1 }, { x: 600, y: 490, w: 12, h: 52, glass: 1 },
      { x: 612, y: 380, w: 270, h: 12, glass: 1 },
      { x: 882, y: 222, w: 12, h: 178 }, { x: 882, y: 460, w: 12, h: 162 },
    ],
    labels: [
      { x: 762, y: 76, t: "SERVER ROOM" }, { x: 745, y: 410, t: "MEETING ROOM" }, { x: 200, y: 76, t: "OPEN PLAN" }, { x: 1010, y: 244, t: "PLATFORM POD" },
    ],
    decor: [{ t: "rug", x: 70, y: 120, w: 320, h: 190, color: "#D8E4D4" }],
    furniture: [
      { t: "board", x: 330, y: 52 },
      { t: "server", x: 700, y: 84 }, { t: "server", x: 770, y: 84 },
      { t: "desk", x: 90, y: 150 }, { t: "desk", x: 90, y: 250 }, { t: "desk", x: 280, y: 150 }, { t: "desk", x: 280, y: 250 },
      { t: "meet", x: 660, y: 430 },
      { t: "kitchen", x: 80, y: 470 }, { t: "plant", x: 40, y: 60 }, { t: "plant", x: 560, y: 470 }, { t: "printer", x: 490, y: 130 },
      { t: "cabinet", x: 470, y: 250 }, { t: "shelf", x: 856, y: 250 },
      { t: "server", x: 920, y: 260 }, { t: "server", x: 990, y: 260 },
      { t: "desk", x: 940, y: 400 }, { t: "cabinet", x: 1040, y: 480 }, { t: "plant", x: 1100, y: 580 },
      { t: "desk", x: 90, y: 555 }, { t: "desk", x: 280, y: 555 }, { t: "sofa", x: 660, y: 560 },
    ],
    npcs: [
      { id: "priya", name: "Priya", role: "Data Engineering Lead", skin: 3, shirt: "#2F6F5E",
        lines: ["Welcome to FenAnalytica. We build and run data platforms for clients across the east of England.",
          "Grab the stand-up task and the storage question from me — the whiteboard and your workstation have the rest."],
        tasks: ["standup-triage", "storage-choice"],
        waypoints: [{ x: 220, y: 340, pause: 2600 }, { x: 400, y: 150, pause: 3200 }, { x: 160, y: 440, pause: 2800 }] },
      { id: "joe", name: "Joe", role: "Platform Engineer", skin: 0, shirt: "#3E5FA8",
        lines: ["Welcome to the pod. Everything that runs at 3am is my problem, which makes re-runs my religion.",
          "You fixed the pipeline order — now learn why mine never break twice."],
        tasks: ["pipeline-idempotent"],
        waypoints: [{ x: 974, y: 350, pause: 3000 }, { x: 1080, y: 310, pause: 2600 }, { x: 960, y: 520, pause: 2800 }] },
    ],
    ambient: [
      { skin: 0, shirt: "#7A8AA6", waypoints: [{ x: 520, y: 330, pause: 1800 }, { x: 520, y: 170, pause: 2400 }, { x: 430, y: 330, pause: 2000 }] },
    ],
    objects: [
      { id: "fen-board", x: 378, y: 132, label: "Pipeline whiteboard",
        lines: ["Six pipeline stages scribbled out of order, with 'FIX BEFORE FRIDAY' underlined twice."], tasks: ["nightly-pipeline"] },
      { id: "fen-desk", x: 316, y: 315, label: "Your workstation",
        lines: ["Your monitor glows: SQL console connected to the client warehouse. One ticket in the queue."], tasks: ["sql-sensors"] },
      { id: "marina-desk", x: 470, y: 200, label: "Marina's desk",
        lines: ["Marina's desk, exactly as the jam stranded it: a half-drunk tea, a rubber duck, and a monitor full of red. The nightly load is still failing on duplicate keys."], tasks: ["jam-fix"] },
      { id: "fen-grafana", x: 1086, y: 360, label: "Monitoring wall",
        lines: ["Four dashboards of pipeline health. Three are green. The fourth has been 'temporarily amber' since March."], tasks: [] },
      { id: "fen-handbook", x: 190, y: 330, label: "Team handbook",
        lines: ["FenAnalytica's onboarding handbook, open on a stand. Someone has annotated the pipelines chapter: 'READ THIS BEFORE TOUCHING ANYTHING AT 3AM.'"],
        read: { id: "doc-dataeng", title: "The Data Engineer's Field Guide", pages: [{ h: "Meet the data before you touch it", t: "Every dataset gets profiled before it gets used: row counts, ranges, types, missing values, duplicates. Five minutes of profiling saves five days of wrong answers.\n\nWhen something breaks \u2014 duplicates, gaps, weird spikes \u2014 the order is always: characterise the problem, find the cause, then fix. A duplicate might be a source retry, a double-triggered job, or a genuine repeat reading, and each needs a different fix. Blind deletion can destroy real data; blind re-runs can double it again.\n\nOutliers follow the same rule. A reading of 9,999 kWh might be a sensor error, a unit mix-up, or a genuinely interesting event. Investigate first. 'Delete anything that looks odd' is how datasets quietly lose their most important rows." }, { h: "Pipelines and the 3am rule", t: "A pipeline is a sequence with a logic: ingest, validate, clean, transform, load, publish. Validation comes early because bad data should fail loudly at the door, not silently downstream where dashboards are already wrong.\n\nThe 3am rule: every pipeline eventually crashes halfway, and someone will re-run it. Design for that day. An idempotent pipeline gives the same result no matter how many times it runs: stage results into a temporary table, swap atomically when complete, and key records on natural identity like (source, date) so re-runs overwrite rather than duplicate.\n\nRetries are not failures of discipline \u2014 they're inevitable. Pipelines that 'never break twice' aren't lucky; they're idempotent." }, { h: "Where data lives, how it moves", t: "Relational databases shine at transactions: many small, precise reads and writes (OLTP). Warehouses are organised for analysis: big scans, aggregations, history (OLAP). Lakes store raw data cheaply and flexibly, structure applied later \u2014 powerful, but easy to turn into a swamp without governance.\n\nChoose storage by the questions you'll ask, not by fashion. 'We need to query across five messy source formats we don't control yet' points one way; 'we need fast, consistent transactional truth' points another.\n\nMovement has the same logic. Batch processing is scheduled, cheap and simple \u2014 fine when answers can be hours old. Streaming gives seconds-fresh answers at the cost of complexity and money. The deciding question is always: how fresh must the answer be to be useful?" }, { h: "Quality is a governance job", t: "Data quality has dimensions you can name and measure: completeness (is it all there?), validity (is it in range and the right type?), consistency (does it agree with itself?), timeliness (did it arrive when needed?).\n\nGood pipelines enforce quality as code: checks at each stage, quarantine for failures, alerts that say what and where. Privacy and security live here too \u2014 minimising fields at ingestion, restricting access, logging who touched what. They're properties of the pipeline, not a policy document somewhere else.\n\nLineage closes the loop: knowing where every number came from and what happened to it on the way. When a director asks 'can we trust this figure?', lineage is the difference between an answer and a shrug." }] }, tasks: [] },
      { id: "fen-coffee", x: 140, y: 448, label: "Coffee machine",
        lines: ["The machine hums. A sticky note reads: 'data lake ≠ data swamp — curate your layers.' Free wisdom with every flat white."], tasks: [] },
      { id: "fen-servers", x: 760, y: 172, label: "Server racks",
        lines: ["Forty blinking lights and the hum of the client warehouse. A label reads: prod-cluster-02 — DO NOT UNPLUG (again)."], tasks: [] },
    ],
  },

  camlife: {
    name: "Camlife Biomedical", place: "Cambridge Biomedical Campus", mp: "Biomedical Campus", mx: 740, my: 600,
    blurb: "Clinical analytics by Addenbrooke's.",
    rw: 1100,
    floor: "#EDF1F5", floorKind: "tile", accent: "#5B5EA6", wall: "#E0E5EE", wallDark: "#A9B6CC",
    spawn: { x: 545, y: 505 },
    walls: [
      { x: 300, y: TOPBAND, w: 12, h: 164 },
      { x: 18, y: 200, w: 150, h: 12 }, { x: 218, y: 200, w: 94, h: 12 },
      { x: 640, y: 360, w: 12, h: 80, glass: 1 }, { x: 640, y: 490, w: 12, h: 52, glass: 1 },
      { x: 894, y: TOPBAND, w: 12, h: 182 }, { x: 894, y: 290, w: 12, h: 252 },
      { x: 652, y: 360, w: 242, h: 12, glass: 1 },
    ],
    labels: [
      { x: 158, y: 76, t: "QUIET ROOM" }, { x: 775, y: 390, t: "MEETING ROOM" }, { x: 480, y: 76, t: "ANALYTICS FLOOR" }, { x: 985, y: 76, t: "DATA SUITE" },
    ],
    decor: [{ t: "rug", x: 355, y: 125, w: 300, h: 185, color: "#DCE2F0" }, { t: "rug", x: 50, y: 80, w: 210, h: 95, color: "#E4E8F2" }],
    furniture: [
      { t: "board", x: 430, y: 52 },
      { t: "sofa", x: 70, y: 100 }, { t: "plant", x: 235, y: 92 },
      { t: "desk", x: 380, y: 150 }, { t: "desk", x: 380, y: 250 }, { t: "desk", x: 560, y: 150 },
      { t: "meet", x: 690, y: 430 }, { t: "kitchen", x: 360, y: 470 },
      { t: "printer", x: 160, y: 300 }, { t: "plant", x: 850, y: 80 }, { t: "cabinet", x: 700, y: 100 }, { t: "shelf", x: 800, y: 150 },
      { t: "server", x: 1010, y: 84 }, { t: "desk", x: 930, y: 150 }, { t: "desk", x: 930, y: 260 },
      { t: "cabinet", x: 1020, y: 210 }, { t: "printer", x: 1030, y: 330 }, { t: "shelf", x: 1056, y: 420 }, { t: "plant", x: 930, y: 480 },
    ],
    npcs: [
      { id: "okafor", name: "Dr. Okafor", role: "Biostatistician", skin: 4, shirt: "#5B5EA6",
        lines: ["Statistics here isn't academic — clinicians act on what we report.", "I have two judgement calls that need a careful head."],
        tasks: ["skewed-recovery", "screening-baserate"],
        waypoints: [{ x: 480, y: 330, pause: 3000 }, { x: 480, y: 190, pause: 2600 }, { x: 250, y: 330, pause: 2400 }] },
      { id: "whitfield", name: "Dr. Whitfield", role: "Consultant Epidemiologist", skin: 1, shirt: "#8C3B5E",
        lines: ["I read trial statistics for a living, which mostly means reading press releases that got them wrong.",
          "You did the base-rate exercise? Good. Then you're ready for the follow-up."],
        tasks: ["ci-interpret"],
        waypoints: [{ x: 700, y: 260, pause: 3000 }, { x: 560, y: 300, pause: 2600 }, { x: 760, y: 300, pause: 2400 }] },
      { id: "tessa", name: "Tessa", role: "Clinical Data Manager", skin: 3, shirt: "#5B5EA6",
        lines: ["Welcome to the Data Suite — where trial exports come to be honest. Today's export: 12% of the blood-pressure readings simply aren't there.",
          "Everyone has a quick fix. Quick fixes are how missing data becomes invisible bias. Want the proper version?"],
        tasks: ["missing-data"],
        waypoints: [{ x: 980, y: 220, pause: 3000 }, { x: 980, y: 350, pause: 2600 }, { x: 1040, y: 440, pause: 2400 }] },
      { id: "hana", name: "Hana", role: "Clinical Data Manager", skin: 2, shirt: "#3D7A8C",
        lines: ["I keep the pilot study data honest — every chart that leaves this floor goes past me first."],
        tasks: ["build-scatter"],
        waypoints: [{ x: 150, y: 330, pause: 2800 }, { x: 540, y: 440, pause: 3200 }, { x: 300, y: 440, pause: 2200 }] },
    ],
    ambient: [
      { skin: 1, shirt: "#8A6FA8", waypoints: [{ x: 620, y: 230, pause: 2400 }, { x: 760, y: 230, pause: 2000 }, { x: 620, y: 300, pause: 2600 }] },
    ],
    objects: [
      { id: "cl-bookshelf", x: 830, y: 150, label: "Reference shelf",
        lines: ["A well-thumbed statistics primer between lab manuals. The base-rates chapter falls open by itself \u2014 it's clearly been needed before."],
        read: { id: "doc-stats", title: "Statistics Primer", pages: [{ h: "Centre, spread and skew", t: "The mean is the balance point; the median is the middle value. On symmetric data they agree. On skewed data \u2014 recovery times, incomes, house prices \u2014 a long tail drags the mean toward the extremes while the median stays put.\n\n'Average recovery is 11 days' can be true while most patients recover in 6, because three complicated cases took two months. For skewed data, the median (with the interquartile range for spread) describes the typical case honestly.\n\nThe habit that prevents the mistake: look at the shape of the data before choosing the summary. A histogram costs nothing." }, { h: "Base rates, or why screening surprises everyone", t: "A test is 95% accurate; a condition affects 1% of people. You test positive. The chance you have it is nowhere near 95% \u2014 count it out.\n\nIn 1,000 people: about 10 have the condition, and the test catches ~9 or 10 of them. But of the 990 without it, 5% \u2014 about 50 people \u2014 get false positives. Your positive is one of ~60, of which only ~10 are real. That's roughly one in six.\n\nThe rare-ness of the condition (the base rate) matters as much as the accuracy of the test. The same logic explains why 'accuracy' flatters fraud models: when fraud is 1-in-1,000, saying 'never fraud' is 99.9% accurate and 100% useless." }, { h: "Correlation is not causation", t: "Ice cream sales and drownings rise and fall together every year. Ice cream doesn't drown anyone \u2014 hot weather drives both swimming and ice cream. A hidden third factor that moves both variables is a confounder, and it's the most common reason correlations mislead.\n\nThe other suspects: reverse causation (B causes A, not A causes B) and coincidence (test enough pairs and some correlate by luck).\n\nThe discipline: when two things move together, ask what else could move both, and what evidence would distinguish the stories. Randomised experiments exist precisely because randomisation cuts every confounder at once." }, { h: "Sampling: who's in your data?", t: "Three hundred parkrun times tell you about people who choose to run on Saturday mornings \u2014 not about the city. Self-selected samples measure the selectors.\n\nRepresentativeness beats volume, always. A bigger biased sample doesn't fix bias; it produces a more confident wrong answer. Watch for self-selection (surveys, app users, parkrunners), coverage gaps (who never appears in the data at all?) and survivorship (you only see the ones that made it).\n\nThe fix is in collection design, not analysis heroics afterwards: define the population, sample so everyone in it can appear, and document who's still missing." }, { h: "Uncertainty and experiments", t: "An estimate without uncertainty is a guess in a suit. A 95% confidence interval gives the range of effects consistent with the data. If that interval spans zero \u2014 say [\u22120.4, +5.2] \u2014 the data can't distinguish the effect from nothing, and 'proven to work' overstates it.\n\nMind the other direction too: absence of evidence isn't evidence of absence. A small trial can miss a real effect (low power). The honest read is 'plausibly between \u22120.4 and +5.2; this study can't yet tell.'\n\nExperiments earn their conclusions through discipline: define the metric and hypothesis, compute the sample size, randomise, run for the planned duration without peeking, then test. Stopping the moment results look good manufactures false positives \u2014 that's optional stopping, and it's a bug, not enthusiasm." }, { h: "When data goes missing", t: "Missing values are data about your data. The first question is never 'what do I fill them with?' — it's 'why are they missing?'\n\nMissing completely at random is the easy case. But often missingness is informative: sicker patients miss clinic visits, struggling stores stop reporting, unhappy users skip the survey. Drop or paper over those rows and you've quietly biased the dataset toward the healthy, the thriving and the content.\n\nThe quick fixes all mislead in their own way: zero-filling invents readings; silent row-deletion shrinks and biases the sample; mean-filling fakes completeness while crushing the variance. The professional sequence: investigate the mechanism, choose a handling strategy that matches it, and document what you did so every later analysis knows." }] }, tasks: [] },
      { id: "cam-window", x: 800, y: 250, label: "Window",
        lines: ["Across the campus: the hospital concourse and the biomedical labs. Half the data on this site is generated within a mile of this window."], tasks: [] },
      { id: "cam-sofa", x: 116, y: 152, label: "Quiet room sofa",
        lines: ["Someone left a journal open at a paper on survival analysis. The margins are full of pencilled question marks."], tasks: [] },
    ],
  },

  granta: {
    name: "Granta FinTech", place: "CB1 District, Station Road", mp: "CB1 · Station Rd", mx: 540, my: 615,
    blurb: "Payments scale-up by the station.",
    rw: 1100,
    floor: "#EBE2D2", floorKind: "wood", accent: "#C2703D", wall: "#E6E0D6", wallDark: "#BFB098",
    spawn: { x: 600, y: 505 },
    walls: [
      { x: 600, y: TOPBAND, w: 12, h: 150, glass: 1 },
      { x: 612, y: 198, w: 120, h: 12, glass: 1 }, { x: 782, y: 198, w: 300, h: 12, glass: 1 },
      { x: 18, y: 380, w: 140, h: 12 }, { x: 208, y: 380, w: 104, h: 12 },
      { x: 300, y: 392, w: 12, h: 150 },
    ],
    labels: [
      { x: 748, y: 76, t: "THE FISHBOWL" }, { x: 160, y: 410, t: "BREAKOUT" }, { x: 300, y: 76, t: "DATA FLOOR" }, { x: 980, y: 240, t: "RISK DESK" },
    ],
    decor: [{ t: "rug", x: 40, y: 420, w: 235, h: 105, color: "#E4D8C8" }, { t: "rug", x: 75, y: 120, w: 320, h: 190, color: "#E8DECE" }],
    furniture: [
      { t: "board", x: 400, y: 52 },
      { t: "meet", x: 660, y: 96 },
      { t: "desk", x: 100, y: 150 }, { t: "desk", x: 100, y: 250 }, { t: "desk", x: 290, y: 150 }, { t: "desk", x: 290, y: 250 },
      { t: "sofa", x: 70, y: 460 }, { t: "plant", x: 245, y: 472 },
      { t: "kitchen", x: 420, y: 470 }, { t: "printer", x: 520, y: 300 }, { t: "plant", x: 850, y: 470 }, { t: "cabinet", x: 700, y: 300 },
      { t: "desk", x: 920, y: 260 }, { t: "desk", x: 920, y: 360 }, { t: "cabinet", x: 1030, y: 300 }, { t: "plant", x: 1050, y: 470 },
      { t: "sofa", x: 880, y: 100 }, { t: "plant", x: 1040, y: 90 },
    ],
    npcs: [
      { id: "marcus", name: "Marcus", role: "Head of Data Science", skin: 1, shirt: "#C2703D",
        lines: ["Fraud, churn, segmentation — every model here moves real money, so we evaluate hard before we ship.", "Two problems on the board this week. Show me how you think."],
        tasks: ["segment-customers", "fraud-overfit"],
        waypoints: [{ x: 470, y: 220, pause: 3000 }, { x: 470, y: 330, pause: 2400 }, { x: 650, y: 320, pause: 2800 }] },
      { id: "tomasz", name: "Tomasz", role: "Analytics Engineer", skin: 0, shirt: "#5B7A52",
        lines: ["I own the warehouse. Risk team's been on at me all morning — fancy taking one off my plate?"],
        tasks: ["sql-fraud"],
        waypoints: [{ x: 210, y: 335, pause: 2600 }, { x: 380, y: 335, pause: 2200 }, { x: 380, y: 190, pause: 3000 }] },
      { id: "zoe", name: "Zoe", role: "Risk Lead", skin: 3, shirt: "#7A3B2E",
        lines: ["Risk desk. We're the people who ask 'but what does the metric hide?' at every review.",
          "Marcus says you spotted the overfit. Come and break a metric with me."],
        tasks: ["metric-imbalance"],
        waypoints: [{ x: 960, y: 320, pause: 3000 }, { x: 960, y: 440, pause: 2600 }, { x: 850, y: 440, pause: 2400 }] },
    ],
    ambient: [
      { skin: 3, shirt: "#A0522D", waypoints: [{ x: 180, y: 470, pause: 3400 }, { x: 240, y: 440, pause: 2600 }] },
    ],
    objects: [
      { id: "gr-terminal", x: 1000, y: 420, label: "Risk wiki terminal",
        lines: ["The Risk Desk's internal wiki, open on the ML practitioner's notes. Zoe's banner across the top: 'No model ships on vibes.'"],
        read: { id: "doc-ml", title: "ML Practitioner's Notes", pages: [{ h: "The map of machine learning", t: "Supervised learning uses labelled examples to predict: classification (which category) and regression (how much). Unsupervised learning finds structure without labels \u2014 clustering groups similar things, which is why 'segment our customers' is a clustering job: nobody knows the segments in advance.\n\nForecasting predicts the future of a sequence from its past \u2014 related to regression, with time's arrow adding rules of its own.\n\nChoosing the family is the first real decision, and it follows from two questions: what does the business actually want to know, and do labels for it exist?" }, { h: "Generalisation is the product", t: "A model that scores brilliantly on its training data and poorly on new data has memorised, not learned. That's overfitting, and the symptom is the gap: high training score, mediocre test score.\n\nThe defence is honest evaluation: hold out data the model never sees. And honest means really never \u2014 leakage is any route by which the answer sneaks in. Classic routes: a feature that's a proxy for the target (asking rent in a rent model), preprocessing fitted on all the data before splitting (the scaler saw the test set), and repeated units scattered across folds.\n\nThat last one is subtle: five scans per patient, random folds, and the same patient lands on both sides \u2014 the model recognises the person, not the pathology. Group your folds by the unit you must generalise to: new patients, new customers, new sites." }, { h: "Metrics that survive contact with reality", t: "Accuracy is the fraction of correct predictions \u2014 and under class imbalance it lies. Fraud at 1-in-1,000: a model that always says 'not fraud' is 99.9% accurate and catches nothing.\n\nFor rare classes, use precision (of the alarms raised, how many were real \u2014 the false-alarm cost) and recall (of the real cases, how many were caught \u2014 the miss cost), or PR-AUC to summarise both. Then attach money or harm to each error type: a missed fraud and a blocked legitimate customer cost different things.\n\nAnd never 'fix' the metric by rebalancing the evaluation data \u2014 a 50/50 test set scores the model on a world that doesn't exist." }, { h: "Features: knowable, fair, honest", t: "A feature must be available at the moment of prediction. Forecasting tomorrow's demand may use lagged demand, the weather forecast and calendar flags \u2014 never tomorrow's actuals. Using future information in training is time leakage: spectacular in backtests, worthless in production.\n\nTarget leakage is the same disease in another coat: any feature that's secretly a copy of the answer (the listing's asking rent, the discharge code that implies the diagnosis).\n\nAnd some features are off-limits regardless of predictive power: protected characteristics \u2014 and their proxies \u2014 in pricing, scoring or screening. That's a legal line and an ethical one, and 'the model found it useful' is a confession, not a defence." }, { h: "Shipping a model is a process", t: "A go/no-go decision needs two kinds of evidence. Performance evidence: holdout and backtest results against the current approach, plus error analysis on the cases that matter most. Operational evidence: monitoring metrics with alert thresholds, and a rollback plan with a named owner.\n\nThe release sequence: confirm the evidence, set the monitoring, agree the rollback, get sign-off on that evidence, then roll out gradually with eyes on the dashboards. A deploy is only a reversible decision if the rollback exists before you need it.\n\nThen tell people properly: what's changing, when, on what evidence, how it's watched, who pulls the cord. 'SHIPPED \ud83d\ude80' is a celebration; five plain sentences are accountability." }] }, tasks: [] },
      { id: "granta-sofa", x: 116, y: 512, label: "Breakout sofa",
        lines: ["A book on the cushion: 'Weapons of Math Destruction'. Several pages are dog-eared in the chapter on credit scoring."], tasks: [] },
      { id: "release-board", x: 560, y: 90, label: "Release review board",
        lines: ["The fraud model v3 release checklist, half-assembled and waiting for the review at two. A sticky note from Priti: 'DO NOT let them ship on vibes.'"], tasks: ["grid-checklist"] },
      { id: "granta-board", x: 448, y: 132, label: "Sprint board",
        lines: ["This sprint: 'fraud model v3 — DO NOT SHIP until eval review', 'customer segments for product', and a sad column titled 'tech debt'."], tasks: [] },
    ],
  },

  guildhall: {
    name: "City Data Office", place: "The Guildhall, Market Square", mp: "Market Square", mx: 430, my: 400,
    blurb: "The council's data & insight team.",
    floor: "#EFE9E2", floorKind: "carpet", accent: "#A6485B", wall: "#E8E2D8", wallDark: "#BFB29E",
    spawn: { x: 643, y: 505 },
    walls: [
      { x: 280, y: TOPBAND, w: 12, h: 160 },
      { x: 18, y: 208, w: 160, h: 12 }, { x: 228, y: 208, w: 64, h: 12 },
      { x: 300, y: 380, w: 140, h: 12 }, { x: 490, y: 380, w: 110, h: 12 },
      { x: 300, y: 392, w: 12, h: 150 }, { x: 588, y: 392, w: 12, h: 150 },
    ],
    labels: [
      { x: 150, y: 76, t: "RECORDS" }, { x: 450, y: 410, t: "COMMITTEE ROOM" }, { x: 560, y: 76, t: "INSIGHT TEAM" },
    ],
    decor: [{ t: "rug", x: 320, y: 400, w: 256, h: 130, color: "#E2D2CC" }],
    furniture: [
      { t: "board", x: 640, y: 52 },
      { t: "server", x: 70, y: 84 }, { t: "printer", x: 170, y: 100 }, { t: "cabinet", x: 80, y: 160 }, { t: "shelf", x: 250, y: 100 },
      { t: "desk", x: 370, y: 150 }, { t: "desk", x: 370, y: 250 }, { t: "desk", x: 560, y: 150 }, { t: "desk", x: 560, y: 250 },
      { t: "meet", x: 370, y: 440 },
      { t: "kitchen", x: 700, y: 470 }, { t: "plant", x: 850, y: 80 }, { t: "plant", x: 40, y: 470 },
    ],
    npcs: [
      { id: "sandra", name: "Sandra", role: "Data Protection Officer", skin: 0, shirt: "#A6485B",
        lines: ["Public-sector data touches everyone in this city — which is exactly why governance isn't paperwork, it's the job.", "I keep a couple of live cases aside for apprentices. Ready?"],
        tasks: ["retention-policy", "housing-bias", "footfall-scope"],
        waypoints: [{ x: 480, y: 330, pause: 3000 }, { x: 660, y: 190, pause: 2600 }, { x: 340, y: 330, pause: 2400 }] },
      { id: "ade", name: "Ade", role: "Information Governance Officer", skin: 4, shirt: "#6E4A8C",
        lines: ["Records, retention, risk — if it has personal data in it, it crosses my desk eventually.",
          "You handled the housing-bias audit, I hear. Time you learned the formal process behind it."],
        tasks: ["dpia-order"],
        waypoints: [{ x: 140, y: 120, pause: 3200 }, { x: 140, y: 300, pause: 2800 }, { x: 240, y: 300, pause: 2400 }] },
    ],
    ambient: [
      { skin: 2, shirt: "#6E7F66", waypoints: [{ x: 210, y: 310, pause: 2800 }, { x: 210, y: 160, pause: 3400 }, { x: 360, y: 310, pause: 2200 }] },
      { skin: 4, shirt: "#7A8AA6", waypoints: [{ x: 700, y: 310, pause: 2400 }, { x: 760, y: 440, pause: 3000 }] },
    ],
    objects: [
      { id: "gh-handbook", x: 170, y: 170, label: "Governance handbook",
        lines: ["The council's information governance handbook, in the records room where it belongs. The DPIA chapter has the most coffee rings."],
        read: { id: "doc-gov", title: "Information Governance Handbook", pages: [{ h: "Data protection, the working version", t: "The principles you'll use weekly: have a lawful basis for processing; collect data for a stated purpose and don't quietly repurpose it (purpose limitation); collect only what you need (minimisation); keep it only as long as you can justify (retention); keep it accurate and secure.\n\nSpecial category data \u2014 health, including mood; ethnicity; beliefs \u2014 gets stricter rules, usually explicit consent.\n\nConsent worth the name is specific (per purpose, not 'everything'), informed (plain words), freely given (no pre-ticked boxes, no burying on page 14) and as easy to withdraw as it was to give. Designs that maximise opt-in by obscuring choice fail legally and morally at once." }, { h: "Bias lives in the data", t: "Models learn the past \u2014 including its discrimination. Train a housing or lending model on historical decisions and it reproduces historical prejudice with a confident new interface.\n\nRemoving the protected attribute isn't enough: proxies carry it back in. Postcode can encode ethnicity; first names can encode gender. The honest approach is to audit outcomes by group \u2014 does the model's error rate or benefit differ across protected groups? \u2014 and treat fairness as something you measure, not assume.\n\nProtected characteristics are never legitimate features for pricing, scoring or screening people. Where bias is found, the work is mitigation and documentation, not deletion of the evidence." }, { h: "The DPIA: bias auditing, formalised", t: "A Data Protection Impact Assessment is required before high-risk processing of personal data \u2014 profiling people, deploying new technology on them, algorithmic prioritisation of services.\n\nIts shape follows its logic: describe the processing (what data, about whom, for what purpose); assess necessity and proportionality against that purpose; identify the risks to the individuals affected \u2014 bias and discrimination included; design mitigations for each risk; get the Data Protection Officer's sign-off on what risk remains; and set review dates.\n\nA DPIA is a living document. The system changes, the data drifts, the assessment gets revisited \u2014 it's a practice, not a filing exercise." }, { h: "Scoping: from question to problem", t: "'Is the market doing better?' isn't answerable. 'How did average daily footfall per zone change in the 12 months after the layout change versus the 12 before, comparing like-for-like day types, with weather noted as a caveat?' \u2014 that's answerable, and fair.\n\nA good reformulation pins down: the metric (what we'll measure), the comparison (against what), the period and segments, the caveats, and above all the decision the analysis serves. If pitch fees or staffing ride on the answer, the scoping IS the fairness.\n\nAnecdotes, single-day cherry-picks and 'pull everything and look for something interesting' all fail the people who depend on the answer." }] }, tasks: [] },
      { id: "gh-window", x: 60, y: 330, label: "Window over Market Square",
        lines: ["Below, the market stalls are out in force. Footfall sensors on the lamp posts feed straight into this office."], tasks: [] },
      { id: "gh-records", x: 112, y: 202, label: "Records cabinet",
        lines: ["Decades of permit files. A printed retention schedule is taped to the side — half the rows are highlighted and annotated 'DELETE BY'."], tasks: [] },
    ],
  },

  bridge: {
    name: "Bridge Insights", place: "Quayside, by the Cam", mp: "Quayside", mx: 370, my: 250,
    blurb: "Analytics agency on the riverside.",
    rw: 1100,
    floor: "#E7EBE2", floorKind: "wood", accent: "#3D7A8C", wall: "#DCE7EA", wallDark: "#A4BDC6",
    spawn: { x: 560, y: 505 },
    walls: [
      { x: 620, y: TOPBAND, w: 12, h: 160, glass: 1 }, { x: 620, y: 258, w: 12, h: 284, glass: 1 },
      { x: 882, y: TOPBAND, w: 12, h: 150 }, { x: 882, y: 248, w: 12, h: 294 },
      { x: 18, y: 420, w: 82, h: 12 }, { x: 150, y: 420, w: 90, h: 12 },
      { x: 240, y: 420, w: 12, h: 50 }, { x: 240, y: 520, w: 12, h: 22 },
    ],
    labels: [
      { x: 762, y: 76, t: "BOARDROOM" }, { x: 280, y: 76, t: "THE STUDIO" }, { x: 128, y: 448, t: "QUIET POD" }, { x: 985, y: 76, t: "THE GALLERY" },
    ],
    decor: [{ t: "rug", x: 70, y: 120, w: 320, h: 190, color: "#D6E3E8" }, { t: "rug", x: 660, y: 130, w: 200, h: 180, color: "#DDE8EC" }],
    furniture: [
      { t: "board", x: 300, y: 52 },
      { t: "desk", x: 90, y: 150 }, { t: "desk", x: 90, y: 250 }, { t: "desk", x: 280, y: 150 }, { t: "desk", x: 280, y: 250 },
      { t: "meet", x: 690, y: 180 }, { t: "sofa", x: 700, y: 440 }, { t: "plant", x: 650, y: 472 },
      { t: "sofa", x: 110, y: 460 }, { t: "kitchen", x: 380, y: 470 }, { t: "printer", x: 500, y: 150 }, { t: "plant", x: 560, y: 60 },
      { t: "sofa", x: 930, y: 90 }, { t: "cabinet", x: 1000, y: 160 }, { t: "sofa", x: 930, y: 460 },
      { t: "plant", x: 1050, y: 470 }, { t: "shelf", x: 1056, y: 250 },
    ],
    npcs: [
      { id: "leah", name: "Leah", role: "Engagement Manager", skin: 2, shirt: "#3D7A8C",
        lines: ["Half this job is analysis. The other half is making the analysis land with people who have ninety seconds and a budget meeting.", "One client situation for you to call."],
        tasks: ["client-pitch", "dashboard-critique"],
        waypoints: [{ x: 400, y: 330, pause: 3000 }, { x: 400, y: 180, pause: 2400 }, { x: 210, y: 380, pause: 2600 }] },
      { id: "samj", name: "Sam", role: "Data journalist in residence", skin: 2, shirt: "#2C5F70",
        lines: ["The Gallery is my collection: every misleading chart that's crossed this studio's desk, framed as a warning.",
          "A client just sent a new candidate for the wall. Tell me you can spot it."],
        tasks: ["chart-crimes"],
        waypoints: [{ x: 960, y: 250, pause: 3000 }, { x: 1040, y: 320, pause: 2600 }, { x: 930, y: 400, pause: 2400 }] },
      { id: "dev", name: "Dev", role: "Data Analyst", skin: 3, shirt: "#C2703D",
        lines: ["Dashboard review at four. No pressure, but the council reads these charts more carefully than the report."],
        tasks: ["build-footfall"],
        waypoints: [{ x: 250, y: 270, pause: 2600 }, { x: 520, y: 270, pause: 2200 }, { x: 520, y: 410, pause: 3000 }] },
    ],
    ambient: [
      { skin: 1, shirt: "#8A6FA8", waypoints: [{ x: 700, y: 330, pause: 3600 }, { x: 790, y: 330, pause: 2800 }] },
    ],
    objects: [
      { id: "br-shelf", x: 510, y: 240, label: "Studio bookshelf",
        lines: ["Leah's communication playbook sits between design annuals. Spine creased at 'Honest axes'."],
        read: { id: "doc-comms", title: "The Communication Playbook", pages: [{ h: "Choose the chart from the question", t: "The chart type is determined by the question, not by taste.\n\nChange over time \u2192 line: consecutive points connected because the in-between is meaningful. Comparing categories \u2192 bar: discrete things, discrete bars. Relationship between two measures \u2192 scatter: every point an observation, the pattern is the message. Parts of a whole \u2192 pie, used sparingly, few slices, and never for negative values.\n\nAnd some columns chart nothing: identifiers and constants (sensor IDs, a river level that never moves) answer no question. If a chart can't be read in three seconds, it isn't done." }, { h: "Honest axes", t: "Bars encode value as length, so bars must start at zero \u2014 a truncated axis turns a 2% difference into a visual cliff.\n\nWhen values go both ways (zones up, zones down), use diverging bars from a shared zero baseline: gains rise, losses fall, and the bad news is exactly as visible as the good. Burying the negative zones isn't simplification; it's misleading someone whose decision depends on them.\n\nSorting bars by value aids comparison; consistent scales across panels prevent accidental lies; and a line between categories invents a trend that doesn't exist \u2014 zones aren't a sequence." }, { h: "Rooms, not reports", t: "Know the audience before the first slide: traders want their livelihood addressed, clinicians want risk quantified, councillors want a defensible decision. Lead with the answer \u2014 the journey to it is for questions.\n\nMixed news gets the whole picture: footfall up 9% overall AND down 4% in the south zone, then what drives the difference, then what could be done. Cherry-picking either half misleads someone, and trust survives bad news but not selective news.\n\nTranslate, don't dilute: 'we can't yet rule out no effect' is plain English for a confidence interval spanning zero, and it's more honest than either 'it works' or 'it failed'." }, { h: "Updates that travel", t: "A status update has three sentences' worth of jobs: what happened (cause), what you did (action), what could recur (residual risk). 'All sorted \ud83d\udc4d' hides the risk that bites again tomorrow; 400 lines of forwarded logs make the reader do your job.\n\nA release announcement is the same discipline for change: what's changing, when, on what evidence, how it's monitored, who owns the rollback. The whole company can act on five plain sentences.\n\nWrite for the person who reads it cold at 9am \u2014 short, honest, actionable, and auditable six months later." }] }, tasks: [] },
      { id: "gallery-wall", x: 1000, y: 300, label: "The wall of chart crimes",
        lines: ["Framed and labelled like a rogues' gallery: 'The Tower of 2%', 'The Convenient Window', 'The Pie of Darkness'. Sam gives tours."],
        read: { id: "doc-gallery", title: "The Gallery of Misleading Charts", pages: [{ h: "Exhibit A: the truncated axis", t: "Revenue bars from \u00a350m to \u00a352m, axis starting at \u00a350m: a 4% rise drawn as a tower ten times taller than its neighbour. The numbers are technically correct; the picture is a lie.\n\nBars encode value as length, so bar axes start at zero \u2014 no exceptions for excitement. If the genuinely interesting story lives in a narrow range, switch to a line or dot plot with clearly labelled bounds, and let the headline match the numbers.\n\nThe test: cover the axis labels. If the visual impression changes when you uncover them, the chart is doing the lying for you." }, { h: "Exhibit B: the convenient window", t: "Every wiggly time series contains a flattering segment. Start the chart at the 2023 trough and growth looks heroic; start at the 2021 peak and it's a collapse. Same data, opposite stories.\n\nThe honest version shows the full available history, or justifies the window in writing ('since the relaunch'). Cherry-picking the start date is cherry-picking the conclusion.\n\nRelated crimes: smoothing until the inconvenient dip vanishes, and switching between absolute and percentage views mid-argument depending on which flatters." }, { h: "Exhibit C: double trouble", t: "Dual-axis charts let you scale either axis until the two lines cross wherever drama requires. Unless both series share real units, the crossing point is a design choice, not a finding.\n\nCumulative charts only ever go up \u2014 plotting cumulative sales to hide slowing sales is a classic. Plot the rate, not the running total, when the question is 'how are we doing lately?'\n\nAnd the 3D pie, tilted so the nearest slice looms largest: perspective distorts area, and area was the whole point. The Gallery's oldest exhibit, and still committed weekly." }] }, tasks: [] },
      { id: "br-window", x: 856, y: 380, label: "Riverside window",
        lines: ["Punts drift past Quayside below. A tourist waves. Somewhere out there is a dataset about punt traffic, and one day a client will ask for it."], tasks: [] },
      { id: "br-laptop", x: 430, y: 330, label: "Studio laptop",
        lines: ["Dev's spare laptop, signed into the council footfall warehouse. A sticky note on the lid: 'Footfall Files — zone totals, market days only. Ask Sandra for the brief first.'"], tasks: ["footfall-sql"] },
      { id: "br-board", x: 348, y: 132, label: "Studio wall",
        lines: ["Pinned: a printout titled 'CHART CRIMES' — a 3D pie, a truncated axis, a dual-axis special. Each annotated in red pen."], tasks: [] },
    ],
  },

  helix: {
    name: "Helix Therapeutics", place: "Cambridge Biomedical Campus", mp: "Biomedical Campus", mx: 940, my: 620,
    blurb: "Drug-discovery biotech on the campus.",
    floor: "#EFEDF4", floorKind: "carpet", accent: "#7A4E8C", wall: "#E6E2EE", wallDark: "#B9AFC9",
    spawn: { x: 370, y: 505 },
    walls: [
      { x: 560, y: TOPBAND, w: 12, h: 150, glass: 1 },
      { x: 572, y: 198, w: 130, h: 12, glass: 1 }, { x: 752, y: 198, w: 130, h: 12, glass: 1 },
      { x: 18, y: 380, w: 130, h: 12 }, { x: 198, y: 380, w: 114, h: 12 },
      { x: 300, y: 392, w: 12, h: 150 },
    ],
    labels: [
      { x: 730, y: 76, t: "SEQUENCING LAB" }, { x: 165, y: 408, t: "MEETING ROOM" }, { x: 330, y: 76, t: "DRY LAB" },
    ],
    decor: [{ t: "rug", x: 340, y: 120, w: 300, h: 190, color: "#E2DCEC" }],
    furniture: [
      { t: "board", x: 360, y: 52 },
      { t: "server", x: 620, y: 84 }, { t: "server", x: 690, y: 84 }, { t: "printer", x: 790, y: 100 }, { t: "cabinet", x: 760, y: 156 },
      { t: "desk", x: 120, y: 150 }, { t: "desk", x: 120, y: 250 }, { t: "desk", x: 340, y: 150 }, { t: "desk", x: 340, y: 250 },
      { t: "meet", x: 80, y: 430 },
      { t: "kitchen", x: 420, y: 470 }, { t: "plant", x: 40, y: 60 }, { t: "plant", x: 850, y: 470 }, { t: "shelf", x: 856, y: 280 },
    ],
    npcs: [
      { id: "drma", name: "Dr. Ma", role: "Computational Biologist", skin: 2, shirt: "#7A4E8C",
        lines: ["We model adverse-reaction risk from trial data. When the stakes are patients, sloppy validation isn't a style issue.",
          "I've got a model review that needs a second pair of eyes."],
        tasks: ["leakage-split"],
        waypoints: [{ x: 440, y: 320, pause: 3000 }, { x: 440, y: 180, pause: 2600 }, { x: 240, y: 320, pause: 2400 }] },
      { id: "ines", name: "Ines", role: "Trial Analyst", skin: 0, shirt: "#4E7A8C",
        lines: ["Three treatment arms, one investigator meeting on Friday. The chart on slide four decides the conversation."],
        tasks: ["arm-compare", "cv-design"],
        waypoints: [{ x: 520, y: 440, pause: 2800 }, { x: 340, y: 440, pause: 2400 }, { x: 180, y: 320, pause: 2600 }] },
    ],
    ambient: [
      { skin: 4, shirt: "#8A6FA8", waypoints: [{ x: 640, y: 300, pause: 2400 }, { x: 790, y: 300, pause: 2800 }, { x: 640, y: 420, pause: 2200 }] },
    ],
    objects: [
      { id: "hx-seq", x: 660, y: 158, label: "Sequencing rigs",
        lines: ["Two sequencers chew through the latest cohort. A whiteboard tally beside them reads 'terabytes this week: 14'. Someone has drawn a small worried face."], tasks: [] },
      { read: { id: "doc-trials", title: "Trials & Evidence Notes", pages: [{ h: "Leakage wears a lab coat", t: "Clinical data leaks in respectable-looking ways. The scaler fitted on the full dataset before splitting has already seen the test set \u2014 fit preprocessing on training data only, then apply it.\n\nRepeated measures are the subtler trap: several scans or visits per patient, randomly shuffled into folds, puts the same patient on both sides of the evaluation. The model part-recognises the person and the score inflates.\n\nThe principle that resolves every variant: split along the unit you must generalise to. Deployment means new patients \u2014 so folds group by patient, every scan of a patient staying together." }, { h: "Reading a result", t: "A trial result is an effect size with an interval, not a verdict. 'Improved 2.4 days, 95% CI [\u22120.4, +5.2]' means the data are consistent with anything from slight harm to strong benefit \u2014 including nothing.\n\nAn interval spanning zero doesn't prove no effect; the study may be underpowered. The two honest statements coexist: we can't claim benefit, and we can't claim its absence.\n\nBe suspicious of results that emerged from flexibility \u2014 extending the trial until significance, switching endpoints, slicing subgroups until one shines. Evidence is what survives a plan made in advance." }, { h: "Showing the comparison", t: "When two arms are compared, the chart's job is the clinical decision. Both arms visible at the same scale; uncertainty shown, not hidden; the metric that matters to patients, not the one that flatters.\n\nBars for arm summaries start at zero. Intervals belong on the chart \u2014 a gap between bars that the intervals swallow is a finding about uncertainty, not about the drug.\n\nThe test before it ships: could a careful reader reach the wrong conclusion faster than the right one? If yes, redesign." }] }, id: "hx-shelf", x: 820, y: 320, label: "Reference shelf",
        lines: ["Pharmacology references and one well-worn statistics text. A bookmark sits in the chapter on multiple comparisons."], tasks: [] },
    ],
  },

  cavendish: {
    name: "Cavendish Compute", place: "Cambridge Science Park", mp: "Science Park", mx: 980, my: 150,
    blurb: "Cloud & HPC provider on the park.",
    floor: "#EDE7DA", floorKind: "wood", accent: "#3E5FA8", wall: "#DEE3EC", wallDark: "#A7B4CB",
    spawn: { x: 550, y: 505 },
    walls: [
      { x: 620, y: TOPBAND, w: 12, h: 200 }, { x: 620, y: 298, w: 12, h: 244 },
      { x: 18, y: 380, w: 130, h: 12 }, { x: 198, y: 380, w: 114, h: 12 },
      { x: 300, y: 392, w: 12, h: 150 },
    ],
    labels: [
      { x: 760, y: 76, t: "SERVER HALL" }, { x: 160, y: 408, t: "BREAKOUT" }, { x: 320, y: 76, t: "PLATFORM TEAM" },
    ],
    decor: [{ t: "rug", x: 60, y: 120, w: 320, h: 190, color: "#E6DECF" }, { t: "rug", x: 40, y: 420, w: 235, h: 105, color: "#E2D8C6" }],
    furniture: [
      { t: "board", x: 340, y: 52 },
      { t: "server", x: 680, y: 84 }, { t: "server", x: 750, y: 84 }, { t: "server", x: 820, y: 84 },
      { t: "server", x: 680, y: 170 }, { t: "server", x: 750, y: 170 }, { t: "server", x: 820, y: 170 },
      { t: "desk", x: 90, y: 150 }, { t: "desk", x: 90, y: 250 }, { t: "desk", x: 280, y: 150 }, { t: "desk", x: 280, y: 250 },
      { t: "sofa", x: 70, y: 460 }, { t: "plant", x: 240, y: 470 },
      { t: "kitchen", x: 380, y: 470 }, { t: "printer", x: 480, y: 150 }, { t: "cabinet", x: 480, y: 250 }, { t: "plant", x: 850, y: 470 },
    ],
    npcs: [
      { id: "ravi", name: "Ravi", role: "Platform Lead", skin: 1, shirt: "#3E5FA8",
        lines: ["Half of Cambridge's startups train models on our racks. We sell compute — and the data plumbing that feeds it.",
          "Got an architecture call to make, and the ops console has a ticket with your name on it."],
        tasks: ["batch-stream"],
        waypoints: [{ x: 420, y: 310, pause: 3000 }, { x: 420, y: 170, pause: 2600 }, { x: 200, y: 330, pause: 2400 }] },
      { id: "mei", name: "Mei", role: "Billing Analyst", skin: 2, shirt: "#8C6239",
        lines: ["Compute is the product, billing is the truth. Finance wants customer totals and the quarter closes Friday.",
          "You've run our console before — this one needs two tables."],
        tasks: ["sql-join"],
        waypoints: [{ x: 480, y: 330, pause: 3000 }, { x: 300, y: 330, pause: 2600 }, { x: 480, y: 210, pause: 2400 }] },
    ],
    ambient: [
      { skin: 3, shirt: "#7A8AA6", waypoints: [{ x: 160, y: 470, pause: 3200 }, { x: 230, y: 440, pause: 2600 }] },
    ],
    objects: [
      { id: "cav-manual", x: 560, y: 260, label: "SQL desk reference",
        lines: ["A laminated SQL reference chained to the desk like a bank pen. The JOIN page has been laminated twice."],
        read: { id: "doc-sql", title: "SQL Desk Reference", pages: [{ h: "Anatomy of a query", t: "SELECT columns FROM table WHERE conditions ORDER BY sort LIMIT n. That one shape answers an enormous share of real questions.\n\nThe engine thinks in this order: FROM (which table), WHERE (which rows survive), SELECT (which columns to show), ORDER BY (how to sort), LIMIT (how many to keep). Reading queries in that order makes them stop being magic.\n\nThe top-N pattern: ORDER BY the measure descending, LIMIT to the count you need. 'Top three customers by spend' is one ORDER BY and one LIMIT \u2014 no loops, no exports to a spreadsheet." }, { h: "Aggregation: many rows, one answer", t: "Aggregate functions collapse rows: COUNT(*), SUM(x), AVG(x), MIN, MAX. On their own they collapse the whole table to one row.\n\nGROUP BY changes that: one output row per group. 'Average reading per building' is AVG(kwh) with GROUP BY building. The rule that catches everyone: every selected column that isn't inside an aggregate must appear in the GROUP BY.\n\nWHERE still filters individual rows \u2014 and it runs before the grouping. 'Total visits per zone on market days' filters to market days first (WHERE), then totals per zone (SUM + GROUP BY). Filter, then aggregate." }, { h: "HAVING and the duplicate hunt", t: "WHERE filters rows before grouping. HAVING filters groups after aggregation. You need HAVING the moment your condition is about an aggregate \u2014 you can't WHERE on COUNT(*), because counts don't exist until grouping has happened.\n\nThe canonical duplicate hunt: GROUP BY the columns that define identity, count the copies, keep only groups with more than one.\n\nSELECT building, reading_time, COUNT(*) FROM readings GROUP BY building, reading_time HAVING COUNT(*) > 1\n\nThis identifies exactly what's duplicated and how badly \u2014 before anyone deletes anything. Identify first; fix surgically." }, { h: "JOIN: two tables, one truth", t: "Real data is split across tables on purpose: names live in customers, usage lives in jobs, and a shared key (customer_id) ties them together. JOIN stitches them back for one question.\n\nSELECT c.name, SUM(j.gpu_hours) FROM jobs j JOIN customers c ON c.customer_id = j.customer_id WHERE j.status = 'completed' GROUP BY c.name\n\nThe ON clause states the matching rule \u2014 almost always the shared key. Aliases (j, c) keep it readable. Everything else is the grammar you already know: WHERE filters, GROUP BY aggregates. JOINs aren't new magic; they're composition." }] }, tasks: [] },
      { id: "cav-console", x: 510, y: 330, label: "Ops console",
        lines: ["The billing warehouse console blinks expectantly. One ticket from Finance, flagged 'before month-end'."], tasks: ["sql-top"] },
      { id: "cav-hall", x: 700, y: 262, label: "Server hall door",
        lines: ["A wall of racks hums behind glass. The temperature readout flicks between 21.2 and 21.4. Somewhere in there, three startups are training the same idea."], tasks: [] },
    ],
  },

  park: {
    name: "Parker's Piece", place: "Open green, city centre", mp: "City centre green", mx: 260, my: 555, icon: "park", outdoor: true,
    blurb: "Where Cambridge goes to breathe (and run).",
    rw: 1250, rh: 720,
    floor: "#CDE3BD", floorKind: "grass", accent: "#3E7D52", wall: "#A8C49A", wallDark: "#86A878",
    spawn: { x: 625, y: 660 },
    walls: [],
    labels: [{ x: 625, y: 86, t: "PARKER'S PIECE" }, { x: 300, y: 350, t: "THE CRICKET SQUARE" }],
    decor: [
      { t: "rug", plain: 1, x: 605, y: 48, w: 40, h: 654, color: "#E5DCC3" },
      { t: "rug", plain: 1, x: 18, y: 380, w: 1214, h: 40, color: "#E5DCC3" },
      { t: "oval", x: 150, y: 95, w: 360, h: 240, color: "none", stroke: "#F2EFE6", dash: "8 8" },
      { t: "oval", x: 170, y: 110, w: 320, h: 210, color: "#D8E9C2" },
      { t: "rug", plain: 1, x: 250, y: 196, w: 130, h: 26, color: "#DCCFA6" },
      { t: "rug", plain: 1, x: 256, y: 199, w: 3, h: 20, color: "#F5F2E8" },
      { t: "rug", plain: 1, x: 371, y: 199, w: 3, h: 20, color: "#F5F2E8" },
    ],
    furniture: [
      { t: "tree", x: 80, y: 80 }, { t: "tree", x: 540, y: 70 }, { t: "tree", x: 750, y: 90 }, { t: "tree", x: 900, y: 70 },
      { t: "tree", x: 1100, y: 100 }, { t: "tree", x: 1160, y: 200 }, { t: "tree", x: 1030, y: 280 }, { t: "tree", x: 80, y: 300 },
      { t: "tree", x: 90, y: 560 }, { t: "tree", x: 180, y: 620 }, { t: "tree", x: 520, y: 560 }, { t: "tree", x: 760, y: 640 },
      { t: "tree", x: 960, y: 620 }, { t: "tree", x: 1150, y: 560 }, { t: "tree", x: 900, y: 470 },
      { t: "bench", x: 500, y: 346 }, { t: "bench", x: 700, y: 346 }, { t: "bench", x: 500, y: 430 }, { t: "bench", x: 700, y: 430 },
      { t: "bench", x: 540, y: 130 },
      { t: "lamp", x: 619, y: 394 },
      { t: "stand", x: 840, y: 520 },
      { t: "stumps", x: 262, y: 203 }, { t: "stumps", x: 356, y: 203 },
    ],
    npcs: [
      { id: "dana", name: "Dana", role: "parkrun volunteer", skin: 4, shirt: "#C9483C",
        lines: ["Three hundred runners every Saturday, rain or shine. And every week someone wants to 'do something with the data'.",
          "Go on then — here's this week's data question."],
        tasks: ["parkrun-bias"],
        waypoints: [{ x: 350, y: 500, pause: 3000 }, { x: 800, y: 520, pause: 2600 }, { x: 950, y: 300, pause: 2800 }] },
      { id: "theo", name: "Theo", role: "Co-founder, Puntlytics", skin: 1, shirt: "#1F8A70",
        lines: ["Freya does the pitches, I do the legwork. Today's legwork: figuring out how we actually count punts properly."],
        tasks: ["punt-protocol"],
        waypoints: [{ x: 900, y: 180, pause: 3200 }, { x: 1080, y: 180, pause: 2600 }, { x: 1080, y: 330, pause: 2400 }] },
      { id: "walt", name: "Walt", role: "Club scorer, 41 seasons", skin: 3, shirt: "#F2EFE6",
        lines: ["Forty-one seasons scoring on this square. Jack Hobbs learned to bat right here, you know. RIGHT here.",
          "And in forty-one seasons I have never once seen a committee argue correctly about batting averages. Care to settle this year's?"],
        tasks: ["simpsons-cricket"],
        waypoints: [{ x: 470, y: 210, pause: 3400 }, { x: 440, y: 262, pause: 2800 }, { x: 505, y: 255, pause: 2600 }] },
    ],
    ambient: [
      { skin: 2, shirt: "#E9A13B", waypoints: [{ x: 100, y: 140, pause: 400 }, { x: 1130, y: 140, pause: 400 }, { x: 1130, y: 640, pause: 400 }, { x: 100, y: 640, pause: 400 }] },
      { skin: 0, shirt: "#F2EFE6", waypoints: [{ x: 404, y: 206, pause: 2200 }, { x: 372, y: 206, pause: 300 }] },
      { skin: 4, shirt: "#F2EFE6", waypoints: [{ x: 240, y: 206, pause: 2600 }, { x: 247, y: 206, pause: 800 }] },
      { skin: 1, shirt: "#F2EFE6", waypoints: [{ x: 300, y: 116, pause: 2400 }, { x: 352, y: 124, pause: 2000 }] },
      { skin: 3, shirt: "#F2EFE6", waypoints: [{ x: 430, y: 286, pause: 2600 }, { x: 392, y: 272, pause: 2200 }] },
      { skin: 2, shirt: "#F2EFE6", waypoints: [{ x: 224, y: 208, pause: 3000 }, { x: 228, y: 206, pause: 1200 }] },
    ],
    objects: [
      { id: "park-noticeboard", x: 760, y: 470, label: "Community noticeboard",
        lines: ["Between lost-cat posters and parkrun times, someone has pinned two beautifully written pages on counting things properly. Cambridge."],
        read: { id: "doc-field", title: "Field Notes: Counting Things", pages: [{ h: "Who ends up in your sample?", t: "Whatever you count by convenience, you count with bias. Stand by the river on sunny afternoons and you'll conclude punting is always busy; survey parkrunners and the city looks miraculously fit.\n\nSelf-selection means the data describes the people who showed up, not the population. More of a biased sample doesn't help \u2014 it makes the wrong answer more confident.\n\nBefore counting anything, write down: who is the population, who can my method actually see, and who is invisible to it?" }, { h: "Design the count", t: "Usable field data is designed, not improvised. Fixed windows (15 minutes) at fixed stations make counts comparable. Coverage across weekdays, weekends and weathers captures the variation you'll want to model.\n\nWrite the counting rule down: what exactly counts as one 'trip'? A punt leaving? Returning? Both? Ambiguity here becomes noise forever.\n\nAnd run overlap sessions \u2014 two counters, same window \u2014 to measure whether your counters agree. Whatever you collect badly now, the model learns forever." }] }, tasks: [] },
      { id: "park-scoreboard", x: 470, y: 160, label: "Club scoreboard",
        lines: ["A wooden scoreboard with sliding number plates, plus Walt's almanac chained beneath it. The almanac is better organised than most data warehouses."],
        read: { id: "doc-almanac", title: "The Scorer's Almanac", pages: [{ h: "Averages with hidden weights", t: "Asha averages more than Raj in the first half of the season AND in the second half \u2014 yet Raj's season average is higher. No arithmetic error. This is Simpson's paradox, and it turns on weighting.\n\nRaj played most of his innings in the second half, on flat July pitches when everyone scored heavily. His overall average is dominated by the easy half; Asha's is dragged by the hard one. Each half-season comparison is fair; the season totals weight the halves differently for each player.\n\nThe rule: before comparing two averages, ask what each one is averaging OVER. If the group sizes differ, the aggregate can reverse the story. Check the innings counts \u2014 always." }, { h: "Small samples at the crease", t: "Three innings prove nothing. A batter averaging 60 after three knocks is mostly enjoying variance; one averaging 35 over forty innings has told you something real.\n\nForm is noisy. The player of the month usually disappoints next month \u2014 not because of a curse, but because an extreme run is typically followed by a more ordinary one. Regression to the mean is arithmetic, not psychology.\n\nThe scorer's discipline applies to every dashboard you'll ever build: report the sample size next to the average, and refuse to rank anyone on three data points." }] }, tasks: [] },
      { id: "park-lamp", x: 625, y: 430, label: "Reality Checkpoint",
        lines: ["The famous lamppost at the crossing of the paths. Generations of students have passed it on the way back to reality. Someone has chalked 'CORRELATION ≠ CAUSATION' on the base."], tasks: [] },
      { id: "park-cart", x: 872, y: 574, label: "Coffee cart",
        lines: ["Flat whites for runners and one very good almond croissant. The owner keeps a tally of sales by weather. 'Rain doubles hot chocolate,' she says. 'That's data.'"], tasks: [] },
    ],
  },

  pub: {
    name: "The Beacon", place: "Bene't Street (fictional pub)", mp: "Bene't Street", mx: 220, my: 360, icon: "pub",
    blurb: "Quiz nights, trade meetings & one dartboard.",
    floor: "#E0D2B8", floorKind: "wood", accent: "#8C4A2E", wall: "#D8C8B0", wallDark: "#AB9270",
    spawn: { x: 450, y: 505 },
    walls: [
      { x: 640, y: 380, w: 12, h: 60 }, { x: 640, y: 490, w: 12, h: 52 },
      { x: 652, y: 380, w: 230, h: 12 },
    ],
    labels: [{ x: 300, y: 76, t: "THE BEACON · EST. 1953" }, { x: 770, y: 408, t: "THE SNUG" }],
    decor: [{ t: "rug", x: 90, y: 160, w: 480, h: 280, color: "#D6C2A2" }],
    furniture: [
      { t: "bar", x: 300, y: 80 },
      { t: "board", x: 110, y: 52 },
      { t: "pubtable", x: 110, y: 200 }, { t: "pubtable", x: 110, y: 360 }, { t: "pubtable", x: 300, y: 260 },
      { t: "pubtable", x: 500, y: 300 }, { t: "pubtable", x: 560, y: 180 }, { t: "pubtable", x: 180, y: 470 },
      { t: "sofa", x: 690, y: 430 }, { t: "pubtable", x: 750, y: 478 },
      { t: "plant", x: 40, y: 470 }, { t: "plant", x: 850, y: 80 },
    ],
    npcs: [
      { id: "maggie", name: "Maggie", role: "Quizmaster", skin: 0, shirt: "#6E3B8C",
        lines: ["Thursday is quiz night. Round four is 'Lies, Damned Lies and Statistics' and it's mine.", "Fancy a warm-up question?"],
        tasks: ["quiz-night"],
        waypoints: [{ x: 380, y: 200, pause: 3000 }, { x: 200, y: 300, pause: 2600 }, { x: 520, y: 320, pause: 2400 }] },
      { id: "bill", name: "Bill", role: "Market Traders' Association", skin: 3, shirt: "#5B6B3A",
        lines: ["Forty years on the market, and now the council says the numbers will decide our pitch fees. So the numbers had better be straight."],
        tasks: ["footfall-pitch"],
        waypoints: [{ x: 170, y: 420, pause: 3400 }, { x: 280, y: 420, pause: 2800 }] },
    ],
    ambient: [
      { skin: 4, shirt: "#7A8AA6", waypoints: [{ x: 500, y: 440, pause: 3000 }, { x: 420, y: 440, pause: 2600 }] },
      { skin: 1, shirt: "#A0522D", waypoints: [{ x: 620, y: 200, pause: 2800 }, { x: 620, y: 320, pause: 2400 }] },
    ],
    objects: [
      { id: "pb-quizbook", x: 728, y: 416, label: "Quiz study book",
        lines: ["Maggie's own study book, left in the snug. 'Round Four: Lies, Damned Lies' \u2014 annotated, dog-eared, dangerous."],
        read: { id: "doc-quiz", title: "The Beacon Book of Stats Trivia", pages: [{ h: "Round four favourites", t: "Ice cream sales correlate with drownings (hot weather causes both). Shark attacks correlate with ice cream too \u2014 same sun. Storks correlate with birth rates across regions (rural areas have more of each).\n\nThe pattern behind every favourite: a third factor moving both, a confounder. The quiz-winning reflex is never 'A causes B' \u2014 it's 'what causes both?'\n\nHonourable mention: with enough variables, some correlate by pure chance. Test a thousand pairs and luck guarantees fireworks." }, { h: "The pub defence kit", t: "Small samples brag loudest. Three games of darts decide nothing \u2014 variance does. The chalk ledger by the board is a monument to noise.\n\nRegression to the mean: an extreme result is usually followed by a less extreme one, no cause required. The 'curse' of the player of the month is arithmetic.\n\nAnd the gambler's fallacy: the coin doesn't remember. Five heads in a row changes nothing about the sixth. Buy your round on those three ideas alone." }] }, tasks: [] },
      { id: "pb-dart", x: 590, y: 140, label: "Dartboard",
        lines: ["A well-loved board. The chalk ledger below tracks the season: someone called 'Sigma' is three games clear at the top. Small sample, the loser keeps saying."], tasks: [] },
      { id: "pb-fire", x: 840, y: 440, label: "Snug fireplace",
        lines: ["Embers, a sleeping dog, and last week's quiz sheet abandoned on the mantel. Round four looks brutal."], tasks: [] },
    ],
  },

  nestwise: {
    name: "Nestwise", place: "The Hatchery, St John's Innovation Park", mx: 0, my: 0, hidden: true, hub: "hatchery",
    blurb: "Proptech startup — fairer rent data.",
    floor: "#F0E8DC", floorKind: "wood", accent: "#D9742B", wall: "#EFE3D5", wallDark: "#C9B49A",
    spawn: { x: 450, y: 505 },
    walls: [
      { x: 620, y: TOPBAND, w: 12, h: 150, glass: 1 },
      { x: 632, y: 198, w: 120, h: 12, glass: 1 }, { x: 802, y: 198, w: 80, h: 12, glass: 1 },
    ],
    labels: [{ x: 750, y: 76, t: "DEMO ROOM" }, { x: 300, y: 76, t: "THE FLOOR" }],
    decor: [{ t: "rug", x: 70, y: 120, w: 330, h: 190, color: "#EFE0CC" }],
    furniture: [
      { t: "board", x: 420, y: 52 },
      { t: "desk", x: 100, y: 150 }, { t: "desk", x: 100, y: 250 }, { t: "desk", x: 290, y: 150 },
      { t: "meet", x: 660, y: 90 },
      { t: "kitchen", x: 80, y: 470 }, { t: "sofa", x: 300, y: 460 }, { t: "printer", x: 470, y: 250 },
      { t: "plant", x: 560, y: 470 }, { t: "plant", x: 850, y: 470 }, { t: "shelf", x: 856, y: 300 },
    ],
    npcs: [
      { id: "yusuf", name: "Yusuf", role: "Founder, Nestwise", skin: 2, shirt: "#D9742B",
        lines: ["Three of us, one model, and a mission: rent estimates that don't bake in the city's worst habits.",
          "Investor demo in two weeks. Two things need a sharp pair of eyes."],
        tasks: ["rent-features", "abtest-order"],
        waypoints: [{ x: 250, y: 330, pause: 3000 }, { x: 430, y: 330, pause: 2600 }, { x: 430, y: 170, pause: 2400 }] },
    ],
    ambient: [
      { skin: 0, shirt: "#7A8AA6", waypoints: [{ x: 560, y: 300, pause: 2600 }, { x: 560, y: 170, pause: 2200 }] },
    ],
    objects: [
      { read: { id: "doc-nest", title: "Nestwise Crash Sheet: Features & Fairness", pages: [{ h: "Features describe the property", t: "Good rent-model features describe the flat: floor area, bedrooms, location quality, age, distance to transport. They're knowable for any property, including ones never listed before.\n\nThe listing's current asking rent is a proxy for the answer \u2014 include it and the model 'predicts' brilliantly by copying the market, errors, prejudice and all. That's target leakage.\n\nApplicant name and nationality are protected characteristics: illegal and wrong to price on, full stop \u2014 and postcode deserves caution as a proxy for them." }, { h: "Fair by audit, not by hope", t: "A model trained on past rents learns past discrimination. Removing sensitive fields isn't enough when proxies smuggle them back.\n\nThe Nestwise rule: audit estimates by area and group, publish the audit method, and treat any systematic gap as a defect with an owner. Fairness is a measured property of outputs \u2014 never an assumption about inputs." }] }, id: "nw-wall", x: 470, y: 134, label: "Sticky-note wall",
        lines: ["A galaxy of sticky notes. 'MVP', 'ship it', 'DO NOT use asking rent as a feature (AGAIN)', and one that just says 'sleep?'."], tasks: [] },
    ],
  },

  fenline: {
    name: "Fenline Energy", place: "The Hatchery, St John's Innovation Park", mx: 0, my: 0, hidden: true, hub: "hatchery",
    blurb: "Smart-grid analytics for the Fens.",
    floor: "#EFE6D2", floorKind: "wood", accent: "#946B2D", wall: "#EDE4D2", wallDark: "#C7B894",
    spawn: { x: 450, y: 505 },
    walls: [
      { x: 620, y: TOPBAND, w: 12, h: 150, glass: 1 },
      { x: 632, y: 198, w: 120, h: 12, glass: 1 }, { x: 802, y: 198, w: 80, h: 12, glass: 1 },
    ],
    labels: [{ x: 750, y: 76, t: "GRID WALL" }, { x: 300, y: 76, t: "THE FLOOR" }],
    decor: [{ t: "rug", x: 70, y: 120, w: 330, h: 190, color: "#EADCBE" }],
    furniture: [
      { t: "board", x: 400, y: 52 },
      { t: "server", x: 660, y: 84 }, { t: "server", x: 730, y: 84 },
      { t: "cabinet", x: 820, y: 150 }, { t: "printer", x: 700, y: 150 },
      { t: "desk", x: 100, y: 150 }, { t: "desk", x: 100, y: 250 }, { t: "desk", x: 290, y: 150 },
      { t: "kitchen", x: 90, y: 470 }, { t: "sofa", x: 300, y: 460 },
      { t: "plant", x: 560, y: 470 }, { t: "plant", x: 850, y: 470 }, { t: "shelf", x: 856, y: 300 },
    ],
    npcs: [
      { id: "bea", name: "Bea", role: "Founder, Fenline Energy", skin: 4, shirt: "#946B2D",
        lines: ["The grid is the biggest machine in the country and it runs on guesses. We're replacing the guesses.",
          "Tomorrow evening's demand peak — predict it well and turbines spin up in time. Want a go?"],
        tasks: ["grid-forecast"],
        waypoints: [{ x: 250, y: 330, pause: 3000 }, { x: 430, y: 330, pause: 2600 }, { x: 430, y: 170, pause: 2400 }] },
    ],
    ambient: [
      { skin: 1, shirt: "#5B6B3A", waypoints: [{ x: 560, y: 300, pause: 2600 }, { x: 560, y: 160, pause: 2200 }] },
    ],
    objects: [
      { read: { id: "doc-fcast", title: "Forecasting 101 (taped to the screen)", pages: [{ h: "Knowable at prediction time", t: "The iron rule of forecasting features: you may only use what exists at the moment of prediction. Predicting tomorrow evening's peak, you have yesterday's demand, last week's same-day demand, the weather forecast, and the calendar (weekday, holiday, big match).\n\nTomorrow's actual meter readings correlate perfectly with tomorrow's peak \u2014 and using them is time leakage: perfect in the backtest, impossible in production.\n\nIf a feature makes the model look too good, check the clock." }, { h: "Beat the baseline first", t: "Before any model: what does 'same as yesterday' score? That naive baseline is free and surprisingly strong on calm days.\n\nA forecasting model earns deployment by beating the baseline where it matters \u2014 the spikes (cold snaps, kettles at half-time), not the easy Tuesdays. Always report 'versus baseline', never accuracy alone." }] }, id: "fl-wall", x: 840, y: 110, label: "Live demand screen",
        lines: ["A wall screen of national demand ticking in real time. A pencilled line marks tonight's forecast peak. Someone has written 'kettles at half-time' next to a famous spike."], tasks: [] },
    ],
  },

  coverpoint: {
    name: "Coverpoint", place: "The Hatchery, St John's Innovation Park", mx: 0, my: 0, hidden: true, hub: "hatchery",
    blurb: "County-cricket analytics. Probabilities, not promises.",
    floor: "#EFE9DA", floorKind: "wood", accent: "#557A2E", wall: "#E7E3D2", wallDark: "#BDB89E",
    spawn: { x: 450, y: 505 },
    walls: [
      { x: 560, y: 392, w: 12, h: 150 },
      { x: 572, y: 380, w: 140, h: 12 }, { x: 762, y: 380, w: 120, h: 12 },
    ],
    labels: [{ x: 300, y: 76, t: "THE PAVILION" }, { x: 724, y: 408, t: "THE NETS" }],
    decor: [
      { t: "rug", x: 70, y: 120, w: 330, h: 190, color: "#E5DFC8" },
      { t: "rug", plain: 1, x: 584, y: 404, w: 286, h: 126, color: "#D8E9C2" },
      { t: "roadline", x: 584, y: 432, w: 286 },
      { t: "roadline", x: 584, y: 472, w: 286 },
    ],
    furniture: [
      { t: "board", x: 420, y: 52 },
      { t: "desk", x: 100, y: 150 }, { t: "desk", x: 100, y: 250 }, { t: "desk", x: 290, y: 150 },
      { t: "kitchen", x: 80, y: 470 }, { t: "sofa", x: 300, y: 460 }, { t: "printer", x: 470, y: 250 },
      { t: "plant", x: 850, y: 80 }, { t: "shelf", x: 856, y: 200 },
      { t: "stumps", x: 660, y: 470 }, { t: "stumps", x: 800, y: 470 },
    ],
    npcs: [
      { id: "dec", name: "Dec", role: "Founder, Coverpoint", skin: 1, shirt: "#557A2E",
        lines: ["We sell win probabilities to county cricket clubs. Half the job is the model. The other half is explaining what a probability IS.",
          "An investor just rang about last night's match. Come and hear what he said — you'll enjoy this."],
        tasks: ["calibration-check"],
        waypoints: [{ x: 250, y: 330, pause: 3000 }, { x: 430, y: 330, pause: 2600 }, { x: 430, y: 170, pause: 2400 }] },
    ],
    ambient: [
      { skin: 4, shirt: "#F2EFE6", waypoints: [{ x: 640, y: 450, pause: 2400 }, { x: 730, y: 450, pause: 1600 }] },
    ],
    objects: [
      { id: "cp-wall", x: 470, y: 134, label: "Win-probability wall",
        lines: ["Last season's predictions plotted against what actually happened, bucket by bucket. The dots hug the diagonal. Dec polishes this chart like a trophy."],
        read: { id: "doc-calib", title: "Probabilities Aren't Promises", pages: [{ h: "What 78% actually means", t: "The model said 78% and the team lost. Was the model wrong? One outcome can't tell you \u2014 a well-calibrated 78% loses 22% of the time, on schedule.\n\nA probability is a claim about frequency: across all the matches where we said 78%, about 78% should be wins. That's calibration, and it's checkable. Bucket the predictions (the 60s, the 70s, the 80s), then compare each bucket's predicted rate with what actually happened. Dots near the diagonal mean the numbers mean what they say.\n\nJudging a forecaster on a single result is the investor's mistake. Judge the season." }, { h: "Scoring a forecaster", t: "Good forecasts are calibrated AND sharp. Always saying 50% can be perfectly calibrated and perfectly useless; the skill is committing toward 0 or 100 and still being right at the stated rate.\n\nProper scoring rules \u2014 the Brier score is the friendly one \u2014 reward exactly that: your penalty is the squared gap between your stated probability and the outcome, averaged over many events. Crucially, your best strategy under a proper score is honesty.\n\nWhich is why rounding to 'definitely' is malpractice: it destroys the information clients pay for. Probabilities aren't promises; they're the inventory." }] }, tasks: [] },
      { id: "cp-nets", x: 700, y: 444, label: "The indoor nets",
        lines: ["A strip of astroturf, two sets of stumps, and a whiteboard of bowling speeds. Someone has written 'n=14, calm down' under an intern's economy-rate chart."], tasks: [] },
    ],
  },

  kindly: {
    name: "Kindly", place: "The Hatchery, St John's Innovation Park", mx: 0, my: 0, hidden: true, hub: "hatchery",
    blurb: "Wellbeing tech with boundaries.",
    floor: "#F4ECEF", floorKind: "carpet", accent: "#C25B8A", wall: "#F0E2E9", wallDark: "#C9A6B8",
    spawn: { x: 450, y: 505 },
    walls: [
      { x: 18, y: 380, w: 130, h: 12 }, { x: 198, y: 380, w: 114, h: 12 },
      { x: 300, y: 392, w: 12, h: 150 },
    ],
    labels: [{ x: 160, y: 408, t: "CALM CORNER" }, { x: 560, y: 76, t: "THE STUDIO" }],
    decor: [{ t: "rug", x: 350, y: 120, w: 330, h: 190, color: "#EBD9E2" }],
    furniture: [
      { t: "board", x: 640, y: 52 },
      { t: "desk", x: 380, y: 150 }, { t: "desk", x: 380, y: 250 }, { t: "desk", x: 560, y: 150 },
      { t: "sofa", x: 80, y: 450 }, { t: "plant", x: 230, y: 470 },
      { t: "kitchen", x: 600, y: 470 }, { t: "plant", x: 850, y: 80 }, { t: "shelf", x: 856, y: 250 },
    ],
    npcs: [
      { id: "noor", name: "Noor", role: "Founder, Kindly", skin: 2, shirt: "#C25B8A",
        lines: ["We build mood tracking that doesn't creep people out. Turns out that's a product feature AND a legal requirement.",
          "Our consent screen ships next sprint. Help me get it right."],
        tasks: ["consent-design"],
        waypoints: [{ x: 480, y: 330, pause: 3000 }, { x: 640, y: 330, pause: 2600 }, { x: 480, y: 170, pause: 2400 }] },
    ],
    ambient: [
      { skin: 0, shirt: "#7A8AA6", waypoints: [{ x: 200, y: 250, pause: 2600 }, { x: 200, y: 150, pause: 2200 }] },
    ],
    objects: [
      { read: { id: "doc-consent", title: "Kindly Consent Principles", pages: [{ h: "Consent worth the name", t: "Mood data is health data \u2014 special category, the most protected kind. Consent for it must be explicit, specific and informed: separate plain-language choices per purpose (improving the product, research sharing, reminders), nothing pre-ticked, nothing buried in terms and conditions.\n\nDefault is off. Each choice is revocable in one tap, and withdrawal actually deletes. 'Basically anonymous' is not a legal category.\n\nThe growth consultant is wrong about the trade-off, too: in health tech, trust is the growth strategy. Users who feel safe stay; users who feel harvested leave loudly." }] }, id: "kd-wall", x: 700, y: 130, label: "Gratitude wall",
        lines: ["Sticky notes from beta users. 'It asked before sharing. ASKED.' is having a moment. Below it, smaller: 'please add a dog mode'."], tasks: [] },
    ],
  },

  puntlytics: {
    name: "Puntlytics", place: "The Hatchery, St John's Innovation Park", mx: 0, my: 0, hidden: true, hub: "hatchery",
    blurb: "Tourism analytics for the river economy.",
    floor: "#E9F0EC", floorKind: "tile", accent: "#1F8A70", wall: "#D9E8E2", wallDark: "#A9C4BA",
    spawn: { x: 450, y: 505 },
    walls: [
      { x: 240, y: TOPBAND, w: 12, h: 140 },
      { x: 18, y: 188, w: 160, h: 12 },
    ],
    labels: [{ x: 130, y: 76, t: "KIT STORE" }, { x: 560, y: 76, t: "THE DECK" }],
    decor: [{ t: "rug", x: 300, y: 120, w: 300, h: 190, color: "#DCE9E3" }],
    furniture: [
      { t: "cabinet", x: 60, y: 90 }, { t: "printer", x: 150, y: 100 },
      { t: "board", x: 620, y: 52 },
      { t: "desk", x: 340, y: 150 }, { t: "desk", x: 340, y: 250 }, { t: "desk", x: 520, y: 150 },
      { t: "meet", x: 560, y: 400 }, { t: "kitchen", x: 740, y: 470 }, { t: "sofa", x: 80, y: 460 },
      { t: "plant", x: 40, y: 250 }, { t: "plant", x: 850, y: 80 },
    ],
    npcs: [
      { id: "freya", name: "Freya", role: "Founder, Puntlytics", skin: 0, shirt: "#1F8A70",
        lines: ["Every chauffeur company on the Cam staffs by gut feel. We think the river is predictable — and we're going to prove it."],
        tasks: ["punt-brief", "punt-chart"],
        waypoints: [{ x: 420, y: 320, pause: 3000 }, { x: 620, y: 320, pause: 2600 }, { x: 420, y: 180, pause: 2400 }] },
    ],
    ambient: [
      { skin: 3, shirt: "#3D7A8C", waypoints: [{ x: 150, y: 300, pause: 2800 }, { x: 150, y: 420, pause: 2400 }] },
    ],
    objects: [
      { read: { id: "doc-framing", title: "Freya's Framing One-Pager", pages: [{ h: "Decision \u2192 quantity \u2192 inputs \u2192 baseline \u2192 measure", t: "Every fundable data product is a decision wearing maths. Start at the decision (how many chauffeurs per hour?), name the quantity that drives it (hourly punt demand), list the inputs that exist at prediction time (season, weather, day type, events), state the baseline you must beat (the operator's gut feel), and define how success is measured against it.\n\n'AI' is the method. Staffing is the product. Investors fund the second one." }] }, id: "pl-board", x: 668, y: 134, label: "Vision wall",
        lines: ["A map of the Cam with magnets for every punt station, a printout titled 'TAM: every tourist, ever', and a sketch of a dashboard with the caption 'this but real'."], tasks: [] },
    ],
  },

  puntjam: {
    name: "The Punt Jam", place: "The River Cam, mid-jam", mp: "On the river", mx: 530, my: 148, icon: "punt", outdoor: true,
    blurb: "Two bridges, forty punts, zero movement.",
    floor: "#8FBDCB", floorKind: "water", accent: "#3D7A8C", wall: "#9DBE8F", wallDark: "#86A878",
    spawn: { x: 450, y: 500 },
    /* walkable mask: banks, two bridges, three rafted punt rows + two wedged punts */
    walk: [
      { x: 18, y: 48, w: 864, h: 104 },
      { x: 18, y: 408, w: 864, h: 134 },
      { x: 150, y: 96, w: 102, h: 368 },
      { x: 650, y: 96, w: 102, h: 368 },
      { x: 248, y: 170, w: 480, h: 44 },
      { x: 300, y: 250, w: 360, h: 44 },
      { x: 248, y: 330, w: 480, h: 44 },
      { x: 482, y: 180, w: 40, h: 118 },
      { x: 352, y: 258, w: 40, h: 118 },
    ],
    walls: [],
    labels: [
      { x: 450, y: 78, t: "THE PUNT JAM" }, { x: 201, y: 446, t: "WEST BRIDGE" }, { x: 701, y: 446, t: "EAST BRIDGE" },
    ],
    decor: [
      { t: "rug", plain: 1, x: 18, y: 48, w: 864, h: 104, color: "#CDE3BD" },
      { t: "rug", plain: 1, x: 18, y: 404, w: 864, h: 138, color: "#CDE3BD" },
      { t: "rug", plain: 1, x: 18, y: 146, w: 864, h: 7, color: "#B9A77C" },
      { t: "rug", plain: 1, x: 18, y: 404, w: 864, h: 7, color: "#B9A77C" },
      { t: "punt", x: 60, y: 244, dir: "h", v: 3 }, { t: "punt", x: 772, y: 214, dir: "h", v: 1 },
      { t: "punt", x: 248, y: 170, dir: "h", v: 0 }, { t: "punt", x: 368, y: 170, dir: "h", v: 1 }, { t: "punt", x: 488, y: 170, dir: "h", v: 2 }, { t: "punt", x: 608, y: 170, dir: "h", v: 3 },
      { t: "punt", x: 300, y: 250, dir: "h", v: 2 }, { t: "punt", x: 420, y: 250, dir: "h", v: 0 }, { t: "punt", x: 540, y: 250, dir: "h", v: 3 },
      { t: "punt", x: 248, y: 330, dir: "h", v: 1 }, { t: "punt", x: 368, y: 330, dir: "h", v: 3 }, { t: "punt", x: 488, y: 330, dir: "h", v: 0 }, { t: "punt", x: 608, y: 330, dir: "h", v: 2 },
      { t: "punt", x: 480, y: 178, dir: "v", v: 1 },
      { t: "punt", x: 350, y: 256, dir: "v", v: 2 },
      { t: "bridge", x: 150, y: 96, w: 102, h: 368 },
      { t: "bridge", x: 650, y: 96, w: 102, h: 368 },
    ],
    furniture: [
      { t: "tree", x: 70, y: 60 }, { t: "tree", x: 800, y: 58 }, { t: "tree", x: 90, y: 444 }, { t: "tree", x: 810, y: 448 },
      { t: "bench", x: 500, y: 86 }, { t: "bench", x: 330, y: 460 }, { t: "bench", x: 560, y: 460 },
      { t: "lamp", x: 444, y: 60 },
    ],
    npcs: [
      { id: "marina", name: "Marina", role: "Analyst, FenAnalytica (stranded)", skin: 2, shirt: "#2F6F5E",
        lines: ["Forty minutes. FORTY. The chauffeur says we'll be moving 'imminently' — he said that thirty-five minutes ago.",
          "And of course tonight's data load is failing back at the office. You don't fancy being my arms and legs on dry land, do you?"],
        tasks: ["jam-handover", "jam-report"],
        waypoints: [{ x: 450, y: 270, pause: 2600 }, { x: 505, y: 270, pause: 3200 }] },
      { id: "stan", name: "Stan", role: "Punt chauffeur", skin: 1, shirt: "#5B6B3A",
        lines: ["Twelve years on this river. Worst jam since the 2019 graduation week pile-up. We'll be moving imminently.",
          "Between us: nobody is moving imminently."],
        tasks: [],
        waypoints: [{ x: 640, y: 190, pause: 3400 }, { x: 668, y: 190, pause: 2800 }] },
    ],
    ambient: [
      { skin: 4, shirt: "#E9A13B", waypoints: [{ x: 540, y: 350, pause: 3400 }, { x: 575, y: 350, pause: 2800 }] },
      { skin: 0, shirt: "#8A6FA8", waypoints: [{ x: 200, y: 102, pause: 2200 }, { x: 620, y: 102, pause: 2600 }] },
      { skin: 3, shirt: "#A6485B", waypoints: [{ x: 330, y: 190, pause: 4200 }, { x: 305, y: 190, pause: 3000 }] },
    ],
    objects: [
      { id: "pj-pole", x: 200, y: 430, label: "Abandoned punt pole",
        lines: ["A punt pole, propped against the bridge and walked away from. Somewhere out in the jam, a punt is being paddled with a picnic plate."], tasks: [] },
      { id: "pj-basket", x: 320, y: 352, label: "Drifting picnic basket",
        lines: ["A picnic basket making a slow, dignified escape between two punts. The strawberries appear to have accepted their new life."], tasks: [] },
      { id: "pj-view", x: 700, y: 120, label: "East bridge view",
        lines: ["From up here the jam resolves into data: three rafted rows, two wedged punts causing the whole thing, and one chauffeur saying 'imminently'. Every queue has a bottleneck."], tasks: [] },
    ],
    clearedWhen: ["jam-handover", "jam-fix", "jam-report"],
    cleared: {
      blurb: "Flowing freely again. You did this.",
      walk: [
        { x: 18, y: 48, w: 864, h: 104 },
        { x: 18, y: 408, w: 864, h: 134 },
        { x: 150, y: 96, w: 102, h: 368 },
        { x: 650, y: 96, w: 102, h: 368 },
      ],
      labels: [
        { x: 450, y: 78, t: "THE RIVER CAM" }, { x: 201, y: 446, t: "WEST BRIDGE" }, { x: 701, y: 446, t: "EAST BRIDGE" },
      ],
      decor: [
        { t: "rug", plain: 1, x: 18, y: 48, w: 864, h: 104, color: "#CDE3BD" },
        { t: "rug", plain: 1, x: 18, y: 404, w: 864, h: 138, color: "#CDE3BD" },
        { t: "rug", plain: 1, x: 18, y: 146, w: 864, h: 7, color: "#B9A77C" },
        { t: "rug", plain: 1, x: 18, y: 404, w: 864, h: 7, color: "#B9A77C" },
        { t: "punt", x: 790, y: 214, dir: "h", v: 2 },
        { t: "punt", x: -160, y: 232, dir: "h", v: 1, drift: 42 },
        { t: "punt", x: -380, y: 314, dir: "h", v: 3, drift: 58 },
        { t: "punt", x: -640, y: 186, dir: "h", v: 0, drift: 66 },
        { t: "bridge", x: 150, y: 96, w: 102, h: 368 },
        { t: "bridge", x: 650, y: 96, w: 102, h: 368 },
      ],
      npcs: [
        { id: "marina", name: "Marina", role: "Analyst, FenAnalytica (on dry land)", skin: 2, shirt: "#2F6F5E",
          lines: ["DRY LAND. Forty-five minutes total — and the load ran clean overnight thanks to you.",
            "My team lead read your status update aloud in stand-up. 'Cause, action, residual risk.' You're a legend."],
          tasks: [],
          waypoints: [{ x: 380, y: 470, pause: 3200 }, { x: 520, y: 470, pause: 2800 }] },
        { id: "stan", name: "Stan", role: "Punt chauffeur", skin: 1, shirt: "#5B6B3A",
          lines: ["See? Moving imminently. Just like I said.", "Twelve years on this river. Never doubted it for a second."],
          tasks: [],
          waypoints: [{ x: 201, y: 160, pause: 3600 }, { x: 201, y: 260, pause: 3000 }] },
      ],
      ambient: [
        { skin: 0, shirt: "#8A6FA8", waypoints: [{ x: 200, y: 102, pause: 2200 }, { x: 620, y: 102, pause: 2600 }] },
        { skin: 4, shirt: "#E9A13B", waypoints: [{ x: 700, y: 430, pause: 2800 }, { x: 560, y: 430, pause: 2400 }] },
      ],
      objects: [
        { id: "pj-pole", x: 200, y: 430, label: "The punt pole",
          lines: ["Still propped against the bridge. Its owner came back for the punt but not, apparently, for the pole. Some data points are just like that."], tasks: [] },
        { id: "pj-view", x: 700, y: 120, label: "East bridge view",
          lines: ["Punts gliding through at a steady clip. Remove the bottleneck and the whole queue drains — same as any pipeline. Somewhere downstream, a picnic basket sails on."], tasks: [] },
      ],
    },
  },

  bikejam: {
    name: "The Bike Jam", place: "Mill Road, by the railway bridge", mp: "Mill Road", mx: 560, my: 260, icon: "bike", outdoor: true,
    blurb: "One broken-down van, two hundred bells.",
    floor: "#C9C4BC", floorKind: "tile", accent: "#C2703D", wall: "#B7B2A6", wallDark: "#948F84",
    spawn: { x: 450, y: 500 },
    walls: [],
    labels: [
      { x: 450, y: 78, t: "MILL ROAD — BIKE JAM" }, { x: 198, y: 140, t: "CROSSING" }, { x: 768, y: 140, t: "CROSSING" },
    ],
    decor: [
      { t: "rug", plain: 1, x: 18, y: 150, w: 864, h: 260, color: "#5E646E" },
      { t: "roadline", x: 18, y: 280, w: 864 },
      { t: "zebra", x: 170, y: 158, w: 56, h: 246 },
      { t: "zebra", x: 740, y: 158, w: 56, h: 246 },
      { t: "rug", plain: 1, x: 18, y: 146, w: 864, h: 6, color: "#8C8F96" },
      { t: "rug", plain: 1, x: 18, y: 408, w: 864, h: 6, color: "#8C8F96" },
    ],
    furniture: [
      { t: "tree", x: 60, y: 60 }, { t: "tree", x: 820, y: 58 }, { t: "tree", x: 70, y: 448 }, { t: "tree", x: 830, y: 452 },
      { t: "lamp", x: 140, y: 64 }, { t: "lamp", x: 760, y: 452 },
      { t: "bench", x: 380, y: 86 }, { t: "bench", x: 500, y: 460 },
      { t: "van", x: 580, y: 230 },
      { t: "cone", x: 556, y: 212 }, { t: "cone", x: 552, y: 300 }, { t: "cone", x: 708, y: 206 }, { t: "cone", x: 706, y: 298 },
      { t: "bike", x: 240, y: 186, v: 0 }, { t: "bike", x: 308, y: 186, v: 3 }, { t: "bike", x: 376, y: 186, v: 1 }, { t: "bike", x: 444, y: 186, v: 5 }, { t: "bike", x: 512, y: 186, v: 2 },
      { t: "bike", x: 274, y: 224, v: 4 }, { t: "bike", x: 342, y: 224, v: 1 }, { t: "bike", x: 410, y: 224, v: 0 }, { t: "bike", x: 478, y: 224, v: 3 },
      { t: "bike", x: 240, y: 268, v: 2 }, { t: "bike", x: 308, y: 268, v: 5 }, { t: "bike", x: 376, y: 268, v: 4 }, { t: "bike", x: 444, y: 268, v: 1 },
      { t: "bike", x: 274, y: 306, v: 3 }, { t: "bike", x: 342, y: 306, v: 0 }, { t: "bike", x: 410, y: 306, v: 2 }, { t: "bike", x: 478, y: 306, v: 5 }, { t: "bike", x: 546, y: 306, v: 1 },
      { t: "bike", x: 240, y: 348, v: 1 }, { t: "bike", x: 308, y: 348, v: 4 }, { t: "bike", x: 376, y: 348, v: 3 }, { t: "bike", x: 444, y: 348, v: 0 }, { t: "bike", x: 512, y: 348, v: 2 },
    ],
    npcs: [
      { id: "priti", name: "Priti", role: "ML Engineer, Granta FinTech (very late)", skin: 0, shirt: "#C2703D",
        lines: ["Release review for fraud model v3 in TEN MINUTES and I am physically inside a bicycle sculpture.",
          "You know Granta, right? Be my voice in that room — I'll talk you through exactly what they need to hear."],
        tasks: ["grid-handover", "grid-report"],
        waypoints: [{ x: 412, y: 254, pause: 2800 }, { x: 348, y: 254, pause: 3400 }] },
    ],
    ambient: [
      { skin: 4, shirt: "#5B5EA6", waypoints: [{ x: 120, y: 250, pause: 3600 }, { x: 120, y: 300, pause: 3000 }] },
      { skin: 2, shirt: "#3D7A8C", waypoints: [{ x: 200, y: 102, pause: 2400 }, { x: 640, y: 102, pause: 2800 }] },
      { skin: 1, shirt: "#A6485B", waypoints: [{ x: 380, y: 452, pause: 2600 }, { x: 240, y: 452, pause: 3000 }] },
    ],
    objects: [
      { id: "bj-van", x: 640, y: 302, label: "Broken-down van",
        lines: ["Hazards blinking, bonnet up, driver on the phone saying 'twenty minutes' in the exact tone of a man who said 'twenty minutes' twenty minutes ago. The whole jam radiates from this one van."], tasks: [] },
      { id: "bj-sign", x: 250, y: 432, label: "Roadworks sign",
        lines: ["'TEMPORARY DELAY — RECOVERY VEHICLE EN ROUTE.' Someone has added, in marker: 'single point of failure'."], tasks: [] },
      { id: "bj-bell", x: 600, y: 100, label: "The bell chorus",
        lines: ["Two hundred stationary cyclists, and every few seconds someone rings a bell anyway. Optimism, measured in dings per minute. Current rate: high."], tasks: [] },
    ],
    clearedWhen: ["grid-handover", "grid-checklist", "grid-report"],
    cleared: {
      blurb: "Van towed, road open, bells triumphant.",
      labels: [
        { x: 450, y: 78, t: "MILL ROAD — FLOWING" }, { x: 198, y: 140, t: "CROSSING" }, { x: 768, y: 140, t: "CROSSING" },
      ],
      decor: [
        { t: "rug", plain: 1, x: 18, y: 150, w: 864, h: 260, color: "#5E646E" },
        { t: "roadline", x: 18, y: 280, w: 864 },
        { t: "zebra", x: 170, y: 158, w: 56, h: 246 },
        { t: "zebra", x: 740, y: 158, w: 56, h: 246 },
        { t: "rug", plain: 1, x: 18, y: 146, w: 864, h: 6, color: "#8C8F96" },
        { t: "rug", plain: 1, x: 18, y: 408, w: 864, h: 6, color: "#8C8F96" },
        { t: "rug", plain: 1, x: 596, y: 252, w: 86, h: 5, color: "#3F444C" },
        { t: "rug", plain: 1, x: 610, y: 268, w: 86, h: 5, color: "#3F444C" },
        { t: "cyclist", x: -60, y: 200, drift: 15, c: "#3D7A8C" },
        { t: "cyclist", x: -260, y: 336, drift: 20, c: "#A6485B" },
        { t: "cyclist", x: 940, y: 250, drift: 18, driftTo: -1060, flip: 1, c: "#5B6B3A" },
        { t: "cyclist", x: 1180, y: 372, drift: 24, driftTo: -1060, flip: 1, c: "#C2703D" },
      ],
      furniture: [
        { t: "tree", x: 60, y: 60 }, { t: "tree", x: 820, y: 58 }, { t: "tree", x: 70, y: 448 }, { t: "tree", x: 830, y: 452 },
        { t: "lamp", x: 140, y: 64 }, { t: "lamp", x: 760, y: 452 },
        { t: "bench", x: 380, y: 86 }, { t: "bench", x: 500, y: 460 },
        { t: "cone", x: 744, y: 428 }, { t: "cone", x: 758, y: 434 }, { t: "cone", x: 736, y: 440 },
      ],
      npcs: [
        { id: "priti", name: "Priti", role: "ML Engineer, Granta FinTech", skin: 0, shirt: "#C2703D",
          lines: ["Made it for the last five minutes — and your evidence had already carried the room. v3 is rolling out gradually, dashboards green.",
            "Marcus wants to know if you're free next sprint. I told him you're usually stuck in traffic."],
          tasks: [],
          waypoints: [{ x: 380, y: 470, pause: 3400 }, { x: 540, y: 470, pause: 2800 }] },
      ],
      ambient: [
        { skin: 2, shirt: "#3D7A8C", waypoints: [{ x: 200, y: 102, pause: 2400 }, { x: 640, y: 102, pause: 2800 }] },
        { skin: 1, shirt: "#A6485B", waypoints: [{ x: 380, y: 452, pause: 2600 }, { x: 240, y: 452, pause: 3000 }] },
      ],
      objects: [
        { id: "bj-sign", x: 250, y: 432, label: "Roadworks sign",
          lines: ["'WORKS COMPLETE — THANK YOU FOR YOUR PATIENCE.' The marker annotation has been updated: 'bottleneck removed, throughput restored'."], tasks: [] },
        { id: "bj-bell", x: 600, y: 100, label: "The bell chorus",
          lines: ["The bells now ring in motion, dopplering past in both directions. Dings per minute: unchanged. Dings per mile: vastly improved."], tasks: [] },
      ],
    },
  },

  bradfield: {
    name: "Bradfield Centre", place: "Cambridge Science Park", mp: "Science Park", mx: 880, my: 290, locked: true,
    blurb: "Client boardroom — final briefing.",
    floor: "#ECE8E0", floorKind: "carpet", accent: "#1B2A41", wall: "#E2DFDA", wallDark: "#B6B0A6",
    spawn: { x: 450, y: 505 },
    walls: [
      { x: 240, y: TOPBAND, w: 12, h: 140 },
      { x: 18, y: 188, w: 160, h: 12 },
      { x: 660, y: 380, w: 12, h: 60 }, { x: 660, y: 490, w: 12, h: 52 },
      { x: 672, y: 380, w: 210, h: 12 },
    ],
    labels: [
      { x: 130, y: 76, t: "REFRESHMENTS" }, { x: 520, y: 76, t: "BOARDROOM" }, { x: 775, y: 408, t: "RECEPTION" },
    ],
    decor: [{ t: "rug", x: 330, y: 200, w: 300, h: 180, color: "#DDD6C8" }],
    furniture: [
      { t: "board", x: 480, y: 52 },
      { t: "kitchen", x: 56, y: 96 },
      { t: "meet", x: 400, y: 250 },
      { t: "plant", x: 40, y: 470 }, { t: "plant", x: 850, y: 80 }, { t: "plant", x: 850, y: 470 },
      { t: "sofa", x: 700, y: 444 }, { t: "shelf", x: 856, y: 250 },
    ],
    npcs: [
      { id: "coo", name: "The COO", role: "Bike-share operator (client)", skin: 1, shirt: "#1B2A41",
        lines: ["So you're the data scientist. Good. I have a board meeting in an hour and a scheme that bleeds money every morning rush."],
        tasks: ["bikeshare-brief"],
        waypoints: [{ x: 420, y: 210, pause: 3600 }, { x: 560, y: 210, pause: 3200 }] },
    ],
    ambient: [
      { skin: 0, shirt: "#7A8AA6", waypoints: [{ x: 140, y: 310, pause: 3000 }, { x: 140, y: 140, pause: 2600 }] },
    ],
    objects: [
      { id: "brad-binder", x: 820, y: 290, label: "Capstone briefing binder",
        lines: ["A binder labelled 'HOW TO RUN A PROJECT THAT SURVIVES CONTACT WITH REALITY'. The COO's handwriting."],
        read: { id: "doc-capstone", title: "Capstone Briefing Binder", pages: [{ h: "The end-to-end shape", t: "Every full project runs the same arc. Scope: turn the vague ask into a metric, a comparison and the decision it serves. Audit the data: sources, quality, gaps, lawful basis. Choose the method \u2014 and a baseline to beat. Name the risks before they name you: bias, leakage, privacy, the question changing under you.\n\nThen pilot small, measure against the baseline, and report with uncertainty attached. The arc is the same for a bike-share brief or a national rollout; only the stakes change." }, { h: "What good looks like", t: "Every claim traceable to data someone can inspect. Uncertainty stated in plain words, not hidden in a footnote. A recommendation the decision-maker can act on Monday.\n\nAnd the professional habit underneath it all: when you don't know, say so, and say what would settle it. That sentence has saved more careers than any model." }] }, tasks: [] },
      { id: "brad-board", x: 528, y: 132, label: "Projector screen",
        lines: ["Slide 1 of 1: a map of dock stations, red in the north, green by the river. Underneath: 'Q2 losses: do not show board'."], tasks: [] },
    ],
  },
};

const HUBS = {
  hatchery: {
    name: "The Hatchery", place: "St John's Innovation Park, Milton Road", mx: 1010, my: 400,
    blurb: "Startup incubator — five startups, shared desks, one heroic coffee machine. Step inside and pick a startup to visit.",
    units: ["nestwise", "puntlytics", "fenline", "kindly", "coverpoint"],
  },
};

/* ================= storage =================
   Progress is saved in the browser via localStorage, so it persists
   across visits whether the game is opened as a single HTML file or
   served from a static host (e.g. GitHub Pages). The async interface
   is kept so the rest of the app is unchanged. A portable download/
   upload "save file" path is also offered in My record as a backup
   (and as a fallback for browsers that block localStorage). */
const SAVE_KEY = "dq2-save";
const STORAGE_OK = (() => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const probe = "__dq2_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch { return false; }
})();
const IS_FILE_PROTOCOL = typeof window !== "undefined" && window.location && window.location.protocol === "file:";
const store = {
  async get(k) {
    if (!STORAGE_OK) return null;
    try { const r = window.localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; }
  },
  async set(k, v) {
    if (!STORAGE_OK) return false;
    try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; }
  },
  async remove(k) {
    if (!STORAGE_OK) return false;
    try { window.localStorage.removeItem(k); return true; } catch { return false; }
  },
};

/* ================= avatar (portrait, v2 art) ================= */
function Avatar({ cfg, size = 110 }) {
  const skin = SKINS[cfg.skin] ?? SKINS[0];
  const hc = HAIR_COLORS[cfg.hairColor] ?? HAIR_COLORS[0];
  const outfit = OUTFITS[cfg.outfit] ?? OUTFITS[0];
  const darker = (hex, f = 0.78) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
    return `rgb(${r},${g},${b})`;
  };
  const skinD = darker(skin, 0.82), hairD = darker(hc, 0.7), hairB = darker(hc, 0.86), outD = darker(outfit.color, 0.72);
  return (
    <svg width={size} height={size * 1.22} viewBox="0 0 120 148" aria-label="Your avatar">
      <defs>
        <radialGradient id="av-skin" cx="0.42" cy="0.34" r="0.85">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.32" /><stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.10" />
        </radialGradient>
        <linearGradient id="av-cloth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" /><stop offset="1" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="142" rx="34" ry="5" fill="rgba(20,32,51,0.14)" />

      {cfg.hairStyle === 1 && (
        <g>{/* long hair: the mass sits BEHIND the body, falling past the shoulders */}
          <path d="M60 15 Q29 15 27 50 Q24 84 28 112 Q31 128 44 126 Q60 131 76 126 Q89 128 92 112 Q96 84 93 50 Q91 15 60 15 Z" fill={hairB} />
          <path d="M31 52 Q28 84 31 110" stroke={hairD} strokeWidth="2" opacity="0.35" fill="none" strokeLinecap="round" />
          <path d="M89 52 Q92 84 89 110" stroke={hairD} strokeWidth="2" opacity="0.35" fill="none" strokeLinecap="round" />
        </g>
      )}

      {/* shoulders / torso */}
      <path d="M28 142 Q28 96 42 86 Q50 80 60 80 Q70 80 78 86 Q92 96 92 142 Z" fill={outfit.color} stroke={outD} strokeWidth="2" />
      <path d="M28 142 Q28 96 42 86 Q50 80 60 80 Q70 80 78 86 Q92 96 92 142 Z" fill="url(#av-cloth)" />
      {/* sleeves shading */}
      <path d="M33 100 Q30 118 30 142 L40 142 Q38 116 41 98 Z" fill={outD} opacity="0.35" />
      <path d="M87 100 Q90 118 90 142 L80 142 Q82 116 79 98 Z" fill={outD} opacity="0.35" />

      {/* outfit details */}
      {cfg.outfit === 0 && (
        <g>{/* jumper: ribbed crew collar */}
          <path d="M46 84 Q60 92 74 84 L72 78 Q60 85 48 78 Z" fill={outD} />
          <path d="M48 81 v4 M53 83 v4 M58 84 v4 M63 84 v4 M68 82 v4" stroke={outfit.color} strokeWidth="1.4" />
        </g>
      )}
      {cfg.outfit === 1 && (
        <g>{/* hoodie: hood behind neck + drawstrings */}
          <path d="M40 90 Q38 78 48 76 L60 82 L72 76 Q82 78 80 90 Q70 84 60 84 Q50 84 40 90 Z" fill={outD} />
          <path d="M52 88 q-1 12 1 20 M68 88 q1 12 -1 20" stroke="#E8ECF2" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <circle cx="53" cy="109" r="2" fill="#D5DBE6" /><circle cx="67" cy="109" r="2" fill="#D5DBE6" />
        </g>
      )}
      {cfg.outfit === 2 && (
        <g>{/* blazer: shirt + lapels */}
          <path d="M50 80 L60 112 L70 80 Z" fill="#F6F8FB" stroke="#D5DBE6" strokeWidth="1" />
          <path d="M50 80 L60 92 L56 104 L46 90 Z" fill={outfit.color} stroke={outD} strokeWidth="1.4" />
          <path d="M70 80 L60 92 L64 104 L74 90 Z" fill={outfit.color} stroke={outD} strokeWidth="1.4" />
          <circle cx="60" cy="118" r="1.6" fill={outD} />
        </g>
      )}
      {cfg.outfit === 3 && (
        <g>{/* shirt: collar + buttons */}
          <path d="M48 80 L56 90 L60 84 L64 90 L72 80 L66 77 L60 82 L54 77 Z" fill="#FFF" stroke={outD} strokeWidth="1.2" />
          <circle cx="60" cy="98" r="1.6" fill={outD} /><circle cx="60" cy="110" r="1.6" fill={outD} />
          <path d="M60 84 L60 142" stroke={outD} strokeWidth="1" opacity="0.5" />
        </g>
      )}

      {/* neck */}
      <path d="M52 68 h16 v12 q-8 5 -16 0 Z" fill={skinD} />
      <path d="M52 70 q8 6 16 0 v4 q-8 5 -16 0 Z" fill="rgba(0,0,0,0.10)" />

      {/* ears */}
      <circle cx="36" cy="50" r="5" fill={skin} stroke={skinD} strokeWidth="1.4" />
      <circle cx="84" cy="50" r="5" fill={skin} stroke={skinD} strokeWidth="1.4" />
      <path d="M34.5 50 q1.5 -2 3 0" stroke={skinD} strokeWidth="1" fill="none" />
      <path d="M82.5 50 q1.5 -2 3 0" stroke={skinD} strokeWidth="1" fill="none" />

      {/* head */}
      <ellipse cx="60" cy="48" rx="24" ry="25" fill={skin} stroke={skinD} strokeWidth="1.6" />
      <ellipse cx="60" cy="48" rx="24" ry="25" fill="url(#av-skin)" />

      {/* hair styles */}
      {cfg.hairStyle === 0 && (
        <g>{/* crop */}
          <path d="M36 46 Q35 21 60 21 Q85 21 84 46 Q80 30 60 30 Q40 30 36 46 Z" fill={hc} />
          <path d="M36 46 q-1 5 1 9 q2 -7 3 -10 Z M84 46 q1 5 -1 9 q-2 -7 -3 -10 Z" fill={hc} />
          <path d="M44 26 Q55 22 68 25" stroke="#FFFFFF" strokeWidth="2.4" opacity="0.28" fill="none" strokeLinecap="round" />
        </g>
      )}
      {cfg.hairStyle === 1 && (
        <g>{/* long — front layer only: crown cap + soft tucks framing the face to the jaw */}
          <path d="M36 46 Q34 19 60 19 Q86 19 84 46 Q80 28 60 28 Q40 28 36 46 Z" fill={hc} />
          <path d="M36 44 Q32 60 35 76 Q39 83 43 76 Q40 60 41 50 Z" fill={hc} />
          <path d="M84 44 Q88 60 85 76 Q81 83 77 76 Q80 60 79 50 Z" fill={hc} />
          <path d="M60 20 L59 30" stroke={hairD} strokeWidth="1.6" opacity="0.5" strokeLinecap="round" />
          <path d="M38 52 Q36 64 38 74" stroke={hairD} strokeWidth="1.4" opacity="0.4" fill="none" strokeLinecap="round" />
          <path d="M82 52 Q84 64 82 74" stroke={hairD} strokeWidth="1.4" opacity="0.4" fill="none" strokeLinecap="round" />
          <path d="M44 24 Q56 20 70 23" stroke="#FFFFFF" strokeWidth="2.4" opacity="0.28" fill="none" strokeLinecap="round" />
        </g>
      )}
      {cfg.hairStyle === 2 && (
        <g fill={hc}>{/* curls */}
          <circle cx="42" cy="30" r="10" /><circle cx="56" cy="24" r="11" /><circle cx="70" cy="26" r="10" /><circle cx="80" cy="35" r="8" />
          <circle cx="36" cy="40" r="8" /><circle cx="84" cy="44" r="7" /><circle cx="36" cy="52" r="6" /><circle cx="84" cy="54" r="6" />
          <circle cx="48" cy="22" r="6" fill={hairD} opacity="0.5" /><circle cx="66" cy="21" r="5" fill={hairD} opacity="0.5" />
          <circle cx="50" cy="26" r="3" fill="#FFFFFF" opacity="0.22" /><circle cx="64" cy="24" r="2.6" fill="#FFFFFF" opacity="0.22" />
        </g>
      )}
      {cfg.hairStyle === 3 && (
        <g>{/* bun */}
          <circle cx="60" cy="15" r="10" fill={hc} />
          <circle cx="60" cy="15" r="10" fill="none" stroke={hairD} strokeWidth="1.4" />
          <path d="M54 12 q6 -4 12 0" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.3" fill="none" />
          <path d="M36 48 Q34 21 60 21 Q86 21 84 48 Q80 29 60 29 Q40 29 36 48 Z" fill={hc} />
          <path d="M37 46 q-2 8 1 13 l4 -2 q-2 -6 -1 -12 Z M83 46 q2 8 -1 13 l-4 -2 q2 -6 1 -12 Z" fill={hc} />
        </g>
      )}

      {/* face */}
      <path d="M48 41 q4 -3 8 -1" stroke={hairD} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M64 40 q4 -2 8 1" stroke={hairD} strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="52" cy="48" rx="2.8" ry="3.4" fill="#241F18" />
      <ellipse cx="68" cy="48" rx="2.8" ry="3.4" fill="#241F18" />
      <circle cx="53" cy="46.8" r="1" fill="#FFFFFF" />
      <circle cx="69" cy="46.8" r="1" fill="#FFFFFF" />
      <path d="M58 53 q2 2 4 0" stroke={skinD} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M52 60 Q60 66 68 60" stroke="#3A2E22" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="45" cy="56" rx="4" ry="2.4" fill="#E58C7B" opacity="0.28" />
      <ellipse cx="75" cy="56" rx="4" ry="2.4" fill="#E58C7B" opacity="0.28" />

      {/* accessories */}
      {cfg.accessory === 1 && (
        <g stroke="#262220" strokeWidth="2.2" fill="rgba(255,255,255,0.14)">
          <rect x="44.5" y="42" width="15" height="12" rx="5" /><rect x="60.5" y="42" width="15" height="12" rx="5" />
          <path d="M59.5 47 L60.5 47" /><path d="M44.5 47 L38 45" /><path d="M75.5 47 L82 45" />
        </g>
      )}
      {cfg.accessory === 2 && (
        <g>
          <path d="M50 82 L56 106 M70 82 L64 106" stroke="#C0392B" strokeWidth="3.4" strokeLinecap="round" />
          <rect x="54" y="104" width="12" height="16" rx="2" fill="#F5F2EA" stroke={C.ink} strokeWidth="1.5" />
          <rect x="56.5" y="108" width="7" height="2.4" fill={C.mist} /><rect x="56.5" y="112" width="7" height="2.4" fill={C.mist} />
          <circle cx="60" cy="117" r="0.8" fill={C.mist} />
        </g>
      )}
      {cfg.accessory === 3 && (
        <g>
          <path d="M36 40 Q36 16 60 16 Q84 16 84 40" stroke="#1d1a14" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <rect x="31" y="40" width="9" height="15" rx="4" fill="#1d1a14" />
          <rect x="80" y="40" width="9" height="15" rx="4" fill="#1d1a14" />
          <circle cx="35.5" cy="47" r="2" fill="#3D9078" />
          <path d="M84 52 Q92 58 82 63" stroke="#1d1a14" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <circle cx="82" cy="63" r="2" fill="#1d1a14" />
        </g>
      )}
    </svg>
  );
}

/* in-scene character body (drawn at origin, feet at y≈22) */
function CharBody({ skin, shirt, hair = "#2A2118", trousers = "#3A4254", hstyle = 0 }) {
  return (
    <g>
      {/* legs */}
      <rect x="-7" y="10" width="5.5" height="11" rx="2.5" fill={trousers} />
      <rect x="1.5" y="10" width="5.5" height="11" rx="2.5" fill={trousers} />
      <ellipse cx="-4.2" cy="21.5" rx="3.6" ry="2" fill="#23293A" />
      <ellipse cx="4.2" cy="21.5" rx="3.6" ry="2" fill="#23293A" />
      {/* arms */}
      <path d="M-9.5 -2 q-3 6 -1.5 12" stroke={shirt} strokeWidth="4.6" strokeLinecap="round" fill="none" />
      <path d="M9.5 -2 q3 6 1.5 12" stroke={shirt} strokeWidth="4.6" strokeLinecap="round" fill="none" />
      <circle cx="-11.2" cy="10.5" r="2.4" fill={skin} />
      <circle cx="11.2" cy="10.5" r="2.4" fill={skin} />
      {/* long hair: back mass behind the torso */}
      {hstyle === 1 && (
        <g>
          <path d="M0 -25 Q-11 -25 -11.6 -14 Q-12.2 -2 -10.4 6.5 Q-9.2 10 -4.5 9 L4.5 9 Q9.2 10 10.4 6.5 Q12.2 -2 11.6 -14 Q11 -25 0 -25 Z" fill={hair} />
          <path d="M0 -25 Q-11 -25 -11.6 -14 Q-12.2 -2 -10.4 6.5 Q-9.2 10 -4.5 9 L4.5 9 Q9.2 10 10.4 6.5 Q12.2 -2 11.6 -14 Q11 -25 0 -25 Z" fill="rgba(0,0,0,0.15)" />
        </g>
      )}
      {/* torso */}
      <path d="M-9.5 12 L-8.5 -3 Q-7 -8 0 -8 Q7 -8 8.5 -3 L9.5 12 Q0 15 -9.5 12 Z" fill={shirt} stroke="rgba(20,30,50,0.35)" strokeWidth="1.2" />
      <path d="M-8.5 -2 Q0 1 8.5 -2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" fill="none" />
      {/* head */}
      <circle cx="0" cy="-15" r="9.5" fill={skin} stroke="rgba(20,30,50,0.4)" strokeWidth="1.2" />
      <path d="M-9.5 -16 Q-9.5 -25.5 0 -25.5 Q9.5 -25.5 9.5 -16 Q5.5 -21.5 0 -21.5 Q-5.5 -21.5 -9.5 -16 Z" fill={hair} />
      <path d="M-9.5 -16 q-0.8 4 0.8 6" stroke={hair} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      {hstyle === 1 && (
        <g fill={hair}>{/* long: front layer — deeper cap + short tucks to the jaw */}
          <path d="M-9.5 -16 Q-9.5 -26.5 0 -26.5 Q9.5 -26.5 9.5 -16 Q5.5 -22 0 -22 Q-5.5 -22 -9.5 -16 Z" />
          <path d="M-9.6 -17 Q-11.2 -11.5 -9.8 -7 Q-8.4 -5 -7 -7.2 Q-8 -11.5 -7.6 -14.5 Z" />
          <path d="M9.6 -17 Q11.2 -11.5 9.8 -7 Q8.4 -5 7 -7.2 Q8 -11.5 7.6 -14.5 Z" />
        </g>
      )}
      {hstyle === 2 && (
        <g fill={hair}>{/* curls: extra volume */}
          <circle cx="-7" cy="-22" r="4" /><circle cx="0" cy="-25" r="4.5" /><circle cx="7" cy="-22" r="4" />
          <circle cx="-9.5" cy="-15" r="3" /><circle cx="9.5" cy="-15" r="3" />
        </g>
      )}
      {hstyle === 3 && <circle cx="0" cy="-26.5" r="3.6" fill={hair} />/* bun */}
      <circle cx="3" cy="-15" r="1.25" fill="#1d1a14" />
      <circle cx="7" cy="-15" r="1.25" fill="#1d1a14" />
      <path d="M3.5 -10.8 q2 1.6 4 0" stroke="#1d1a14" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* head-and-shoulders portrait bust used in dialogue */
function Bust({ skin, shirt, hair = "#3A2C1E", hstyle = 0 }) {
  return (
    <svg viewBox="0 0 80 86" style={{ width: "100%", display: "block" }} aria-hidden="true">
      <defs>
        <linearGradient id="bust-cloth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" /><stop offset="1" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {/* long hair: back mass behind the shoulders */}
      {hstyle === 1 && (
        <g>
          <path d="M40 10 Q17 10 15 35 Q10 58 11 80 Q13 87 24 85 L56 85 Q67 87 69 80 Q70 58 65 35 Q63 10 40 10 Z" fill={hair} />
          <path d="M40 10 Q17 10 15 35 Q10 58 11 80 Q13 87 24 85 L56 85 Q67 87 69 80 Q70 58 65 35 Q63 10 40 10 Z" fill="rgba(0,0,0,0.16)" />
          <path d="M17 38 Q14 58 15 78" stroke="rgba(0,0,0,0.22)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M63 38 Q66 58 65 78" stroke="rgba(0,0,0,0.22)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      )}
      {/* shoulders */}
      <path d="M9 86 Q9 64 23 57 Q31 53 40 53 Q49 53 57 57 Q71 64 71 86 Z" fill={shirt} stroke="rgba(20,30,50,0.35)" strokeWidth="1.6" />
      <path d="M9 86 Q9 64 23 57 Q31 53 40 53 Q49 53 57 57 Q71 64 71 86 Z" fill="url(#bust-cloth)" />
      <path d="M31 55 Q40 60 49 55" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" />
      {/* neck */}
      <path d="M33 44 h14 v10 q-7 4 -14 0 Z" fill={skin} />
      <path d="M33 46 q7 5 14 0 v3 q-7 4 -14 0 Z" fill="rgba(0,0,0,0.10)" />
      {/* ears */}
      <circle cx="20" cy="36" r="4.5" fill={skin} stroke="rgba(20,30,50,0.3)" strokeWidth="1.2" />
      <circle cx="60" cy="36" r="4.5" fill={skin} stroke="rgba(20,30,50,0.3)" strokeWidth="1.2" />
      {/* head */}
      <ellipse cx="40" cy="34" rx="20" ry="21" fill={skin} stroke="rgba(20,30,50,0.35)" strokeWidth="1.6" />
      {/* hair */}
      {hstyle === 0 && (
        <path d="M21 32 Q20 12 40 12 Q60 12 59 32 Q55 19 40 19 Q25 19 21 32 Z" fill={hair} />
      )}
      {hstyle === 1 && (
        <g>{/* front layer: cap + jaw-length tucks */}
          <path d="M21 32 Q20 12 40 12 Q60 12 59 32 Q55 19 40 19 Q25 19 21 32 Z" fill={hair} />
          <path d="M21 30 Q18 42 20.5 55 Q23.5 60 26.5 55 Q24 42 25 34 Z" fill={hair} />
          <path d="M59 30 Q62 42 59.5 55 Q56.5 60 53.5 55 Q56 42 55 34 Z" fill={hair} />
          <path d="M40 13 L39.5 21" stroke="rgba(0,0,0,0.28)" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M30 14 Q40 11 51 13" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.22" fill="none" strokeLinecap="round" />
        </g>
      )}
      {hstyle === 2 && (
        <g fill={hair}>
          <circle cx="26" cy="20" r="9" /><circle cx="40" cy="15" r="10" /><circle cx="54" cy="19" r="9" />
          <circle cx="20" cy="30" r="7" /><circle cx="60" cy="30" r="7" />
        </g>
      )}
      {hstyle === 3 && (
        <g fill={hair}>
          <circle cx="40" cy="9" r="8" />
          <path d="M21 32 Q20 12 40 12 Q60 12 59 32 Q55 19 40 19 Q25 19 21 32 Z" />
        </g>
      )}
      {/* face */}
      <path d="M30 28 q3 -2.5 7 -1" stroke="rgba(40,30,20,0.7)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M43 27 q4 -1.5 7 1" stroke="rgba(40,30,20,0.7)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="33" cy="34" rx="2.3" ry="2.8" fill="#241F18" />
      <ellipse cx="47" cy="34" rx="2.3" ry="2.8" fill="#241F18" />
      <circle cx="33.8" cy="33" r="0.9" fill="#FFFFFF" />
      <circle cx="47.8" cy="33" r="0.9" fill="#FFFFFF" />
      <path d="M38 39.5 q2 1.6 4 0" stroke="rgba(0,0,0,0.25)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M33 45 Q40 50 47 45" stroke="#3A2E22" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="27" cy="41" rx="3.2" ry="2" fill="#E58C7B" opacity="0.25" />
      <ellipse cx="53" cy="41" rx="3.2" ry="2" fill="#E58C7B" opacity="0.25" />
    </svg>
  );
}

/* pin icon shown when inspecting an object rather than a person */
function SpotIcon({ accent }) {
  return (
    <svg viewBox="0 0 80 86" style={{ width: "100%", display: "block" }} aria-hidden="true">
      <ellipse cx="40" cy="76" rx="14" ry="4" fill="rgba(20,32,51,0.18)" />
      <path d="M40 12 C26 12 18 23 18 35 C18 52 40 74 40 74 C40 74 62 52 62 35 C62 23 54 12 40 12 Z"
        fill={accent} stroke="rgba(20,30,50,0.3)" strokeWidth="2" />
      <circle cx="40" cy="34" r="11" fill="#FFFFFF" />
      <text x="40" y="39.5" textAnchor="middle" fontSize="15" fontWeight="800" fill={accent} fontFamily="'Sora', sans-serif">i</text>
    </svg>
  );
}

/* deterministic hair for each NPC so faces stay consistent everywhere */
const npcLook = (id) => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return { hstyle: h % 4, hair: HAIR_COLORS[Math.floor(h / 5) % HAIR_COLORS.length] };
};

/* which NPC hands out a given task (for the task-brief portrait) */
const taskGiver = (task) => {
  const wp = WORKPLACES[task.wp];
  return (wp.npcs || []).find((n) => (n.tasks || []).includes(task.id)) || null;
};

/* ================= furniture (art pass) ================= */
function Furniture({ f, accent, p }) {
  const [w, h] = FOOT[f.t];
  switch (f.t) {
    case "desk":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          {/* chair */}
          <ellipse cx={w / 2} cy={h + 16} rx="11" ry="5" fill="rgba(20,30,50,0.16)" />
          <circle cx={w / 2} cy={h + 13} r="9" fill="#4E5C76" stroke="#39455C" strokeWidth="1.5" />
          <path d={`M${w / 2 - 8} ${h + 8} a9 6 0 0 1 16 0`} fill="#5C6B88" />
          {/* desk */}
          <rect x="3" y="6" width={w} height={h} rx="5" fill="rgba(20,30,50,0.18)" />
          <rect width={w} height={h} rx="5" fill={`url(#${p}wood2)`} stroke="#B9AD93" strokeWidth="1.4" />
          <rect x="2" y="2" width={w - 4} height="4" rx="2" fill="rgba(255,255,255,0.4)" />
          {/* monitor */}
          <rect x={w / 2 - 15} y="4" width="30" height="19" rx="2.5" fill="#1C2536" stroke="#0F1726" />
          <rect x={w / 2 - 12} y="7" width="24" height="13" rx="1" fill={accent} opacity="0.9" />
          <rect x={w / 2 - 12} y="7" width="24" height="5" rx="1" fill="#FFFFFF" opacity="0.25" />
          <rect x={w / 2 - 5} y="23" width="10" height="3.5" rx="1.5" fill="#8C97A8" />
          {/* keyboard, papers, mug */}
          <rect x={w / 2 - 12} y="29" width="24" height="7" rx="2" fill="#E6EAF1" stroke="#C2CAD6" />
          <rect x="7" y="9" width="15" height="11" rx="1.5" fill="#F6F4EE" stroke="#D8D2C2" transform="rotate(-6 14 14)" />
          <circle cx={w - 11} cy="13" r="4.5" fill="#FFFFFF" stroke="#C2CAD6" />
          <circle cx={w - 11} cy="13" r="2.4" fill="#8C6239" />
        </g>
      );
    case "meet":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          {[0.18, 0.5, 0.82].map((q, i) => (
            <g key={i}>
              <circle cx={w * q} cy={-11} r="8" fill="#D9DFE8" stroke="#AEB9C8" strokeWidth="1.4" />
              <path d={`M${w * q - 7} -16 a8 5 0 0 1 14 0`} fill="#C3CCDA" />
              <circle cx={w * q} cy={h + 11} r="8" fill="#D9DFE8" stroke="#AEB9C8" strokeWidth="1.4" />
              <path d={`M${w * q - 7} ${h + 16} a8 5 0 0 0 14 0`} fill="#C3CCDA" />
            </g>
          ))}
          <rect x="4" y="7" width={w} height={h} rx="16" fill="rgba(20,30,50,0.18)" />
          <rect width={w} height={h} rx="16" fill={`url(#${p}tabletop)`} stroke="#B9C6C2" strokeWidth="1.6" />
          <path d={`M14 ${h - 10} Q${w * 0.45} ${h * 0.25} ${w - 14} 10`} stroke="#FFFFFF" strokeWidth="7" opacity="0.28" fill="none" strokeLinecap="round" />
          <rect x={w / 2 - 24} y={h / 2 - 10} width="48" height="20" rx="4" fill="#FFFFFF" stroke="#C9D2DE" />
          <circle cx={w / 2} cy={h / 2} r="3" fill="#5F6B80" />
          <rect x={w / 2 + 30} y={h / 2 - 6} width="11" height="14" rx="2" fill="#F6F4EE" stroke="#D8D2C2" />
        </g>
      );
    case "plant":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <ellipse cx="13" cy="25" rx="13" ry="4.5" fill="rgba(20,30,50,0.16)" />
          <path d="M5 24 h16 l-2.5 -10 h-11 Z" fill="#B0623F" stroke="#8C4A2E" strokeWidth="1.2" />
          <rect x="4" y="13" width="18" height="3" rx="1.5" fill="#C97B52" />
          <path d="M13 14 q-9 -7 -7 -16 q8 4 9 14 Z" fill="#3E7D52" />
          <path d="M13 14 q9 -8 8 -17 q-9 4 -10 15 Z" fill="#4C9163" />
          <path d="M13 14 q-1 -12 3 -17 q4 7 -1 17 Z" fill="#356B46" />
        </g>
      );
    case "server":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <rect x="3" y="5" width={w} height={h} rx="4" fill="rgba(20,30,50,0.22)" />
          <rect width={w} height={h} rx="4" fill="#222E44" stroke="#101826" strokeWidth="1.5" />
          <rect x="1.5" y="1.5" width={w - 3} height="4" rx="2" fill="rgba(255,255,255,0.12)" />
          {[10, 22, 34, 46].map((yy, i) => (
            <g key={yy}>
              <rect x="5" y={yy} width={w - 10} height="8" rx="2" fill="#2F3D58" stroke="#1B2740" strokeWidth="0.8" />
              <rect x="8" y={yy + 2.5} width="10" height="3" rx="1.5" fill="#1B2740" />
              <circle cx={w - 11} cy={yy + 4} r="2" fill={i % 2 ? C.amber : "#4CD17E"}>
                {!REDUCED && <animate attributeName="opacity" values="1;0.25;1" dur={`${1.4 + i * 0.5}s`} repeatCount="indefinite" />}
              </circle>
            </g>
          ))}
        </g>
      );
    case "sofa":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <rect x="3" y="6" width={w} height={h} rx="10" fill="rgba(20,30,50,0.16)" />
          <rect x="-4" y="-6" width={w + 8} height="14" rx="7" fill={accent} opacity="0.92" />
          <rect width={w} height={h} rx="9" fill={accent} />
          <rect x="4" y="3" width={w / 2 - 6} height={h - 12} rx="6" fill="#FFFFFF" opacity="0.28" />
          <rect x={w / 2 + 2} y="3" width={w / 2 - 6} height={h - 12} rx="6" fill="#FFFFFF" opacity="0.28" />
          <rect x="-6" y="-2" width="10" height={h + 4} rx="5" fill={accent} stroke="rgba(0,0,0,0.15)" />
          <rect x={w - 4} y="-2" width="10" height={h + 4} rx="5" fill={accent} stroke="rgba(0,0,0,0.15)" />
        </g>
      );
    case "kitchen":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <rect x="3" y="6" width={w} height={h} rx="5" fill="rgba(20,30,50,0.16)" />
          <rect width={w} height={h} rx="5" fill={`url(#${p}counter)`} stroke="#C5BBA6" strokeWidth="1.4" />
          <rect x="2" y="2" width={w - 4} height="4" rx="2" fill="rgba(255,255,255,0.5)" />
          {/* coffee machine */}
          <rect x="10" y="7" width="24" height="24" rx="3.5" fill="#36415A" stroke="#222C40" />
          <rect x="14" y="11" width="16" height="8" rx="1.5" fill="#9FB4D6" />
          <rect x="19" y="21" width="6" height="6" rx="1" fill="#1E2638" />
          <circle cx="30.5" cy="24" r="1.6" fill="#4CD17E" />
          {/* sink */}
          <rect x="44" y="9" width="26" height="18" rx="4" fill="#C7CFDA" stroke="#9FAABB" />
          <rect x="48" y="13" width="18" height="10" rx="3" fill="#A9B4C4" />
          <path d="M57 9 v-4 h6" stroke="#8C97A8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {/* fruit bowl + mugs */}
          <ellipse cx="86" cy="17" rx="10" ry="6" fill="#E0D6C0" stroke="#C5BBA6" />
          <circle cx="82" cy="15" r="3" fill="#C94F3D" /><circle cx="89" cy="14" r="3" fill="#7FA84C" /><circle cx="86" cy="18" r="3" fill="#E5A33B" />
          <circle cx="104" cy="14" r="4" fill="#FFFFFF" stroke="#C2CAD6" />
          <circle cx="108" cy="24" r="4" fill="#FFFFFF" stroke="#C2CAD6" />
        </g>
      );
    case "board":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <rect x="2" y="4" width={w} height="56" rx="4" fill="rgba(20,30,50,0.14)" />
          <rect width={w} height="56" rx="4" fill="#FDFDFB" stroke="#9FA9B8" strokeWidth="2" />
          <rect x="3" y="3" width={w - 6} height="50" rx="2" fill="none" stroke="#E4E8EE" />
          {/* doodles: a tiny line chart + bars + notes */}
          <path d="M9 30 l9 -8 l8 4 l9 -11 l8 5" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="50" y="22" width="5" height="12" fill={C.amber} opacity="0.8" />
          <rect x="58" y="16" width="5" height="18" fill={C.amber} opacity="0.8" />
          <rect x="66" y="26" width="5" height="8" fill={C.amber} opacity="0.8" />
          <path d="M10 42 h28 M10 47 h20" stroke="#8C97A8" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M58 44 l7 6 l11 -12" stroke={C.brick} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx={w - 9} cy="9" r="3" fill={C.brick} />
          <circle cx={w - 18} cy="9" r="3" fill={C.teal} />
          {/* pen tray */}
          <rect x={w / 2 - 16} y="56" width="32" height="5" rx="2" fill="#C2CAD6" />
        </g>
      );
    case "printer":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <rect x="2" y="4" width={w} height={h} rx="4" fill="rgba(20,30,50,0.14)" />
          <rect width={w} height={h} rx="4" fill="#DDE2EA" stroke="#A9B3C2" strokeWidth="1.4" />
          <rect x="5" y="-5" width={w - 10} height="9" rx="1.5" fill="#FFFFFF" stroke="#A9B3C2" />
          <rect x="5" y={h / 2} width={w - 10} height="5" rx="2" fill="#B9C2D0" />
          <circle cx={w - 8} cy="8" r="2.4" fill="#4CD17E" />
        </g>
      );
    case "cabinet":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <rect x="2" y="4" width={w} height={h} rx="3" fill="rgba(20,30,50,0.14)" />
          <rect width={w} height={h} rx="3" fill={`url(#${p}wood2)`} stroke="#A8997C" strokeWidth="1.4" />
          <line x1={w / 2} y1="2" x2={w / 2} y2={h - 2} stroke="#A8997C" strokeWidth="1.4" />
          <rect x={w / 4 - 4} y={h / 2 - 2} width="8" height="4" rx="2" fill="#8C7B5E" />
          <rect x={(3 * w) / 4 - 4} y={h / 2 - 2} width="8" height="4" rx="2" fill="#8C7B5E" />
        </g>
      );
    case "shelf":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <rect x="2" y="3" width={w} height={h} rx="3" fill="rgba(20,30,50,0.14)" />
          <rect width={w} height={h} rx="3" fill={`url(#${p}wood2)`} stroke="#A8997C" strokeWidth="1.4" />
          {[14, 36, 58].map((yy) => (
            <g key={yy}>
              <line x1="2" y1={yy + 12} x2={w - 2} y2={yy + 12} stroke="#A8997C" strokeWidth="1.4" />
              {[4, 9, 14, 19].map((bx, i) => (
                <rect key={bx} x={bx} y={yy} width="4" height="12" rx="0.8"
                  fill={["#A6485B", "#2F6F5E", "#C2703D", "#5B5EA6"][i]} opacity="0.85" />
              ))}
            </g>
          ))}
        </g>
      );
    case "tree":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <ellipse cx="15" cy="31" rx="17" ry="5.5" fill="rgba(30,50,30,0.20)" />
          <rect x="12.5" y="13" width="5" height="17" rx="2" fill="#7A5230" />
          <circle cx="8" cy="8" r="10" fill="#4C8A4F" />
          <circle cx="22" cy="6" r="11" fill="#5C9C5C" />
          <circle cx="15" cy="-3" r="9" fill="#3F7A45" />
          <circle cx="11" cy="2" r="3.5" fill="#FFFFFF" opacity="0.16" />
        </g>
      );
    case "bench":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <ellipse cx="29" cy="22" rx="30" ry="4" fill="rgba(30,50,30,0.16)" />
          <rect x="4" y="12" width="5" height="9" fill="#6B5538" />
          <rect x="49" y="12" width="5" height="9" fill="#6B5538" />
          <rect x="0" y="-6" width="58" height="6" rx="2" fill="#A9844F" stroke="#7A5E33" strokeWidth="1" />
          <rect x="0" y="4" width="58" height="9" rx="2.5" fill="#BD9659" stroke="#7A5E33" strokeWidth="1.2" />
          <line x1="19" y1="4" x2="19" y2="13" stroke="#7A5E33" strokeWidth="1" />
          <line x1="39" y1="4" x2="39" y2="13" stroke="#7A5E33" strokeWidth="1" />
        </g>
      );
    case "lamp":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <ellipse cx="6" cy="13" rx="9" ry="3.5" fill="rgba(30,50,30,0.20)" />
          <circle cx="6" cy="-26" r="13" fill="#FFE9A8" opacity="0.30" />
          <rect x="2" y="6" width="8" height="6" rx="1.5" fill="#2E3B2E" />
          <rect x="4.5" y="-22" width="3" height="30" fill="#2E3B2E" />
          <path d="M0 -22 h12" stroke="#2E3B2E" strokeWidth="2" />
          <path d="M2 -32 L10 -32 L8.5 -23 L3.5 -23 Z" fill="#FFE9A8" stroke="#2E3B2E" strokeWidth="1.6" />
          <path d="M3 -34 h6 l-3 -4 Z" fill="#2E3B2E" />
        </g>
      );
    case "bar":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          {[0.2, 0.5, 0.8].map((q, i) => (
            <g key={i}>
              <ellipse cx={w * q} cy={h + 18} rx="9" ry="3.5" fill="rgba(40,28,12,0.20)" />
              <circle cx={w * q} cy={h + 14} r="8" fill="#8C5E3C" stroke="#5E3D24" strokeWidth="1.4" />
            </g>
          ))}
          <rect x="3" y="6" width={w} height={h} rx="5" fill="rgba(40,28,12,0.22)" />
          <rect width={w} height={h} rx="5" fill={`url(#${p}wood2)`} stroke="#7A5E33" strokeWidth="1.6" />
          <rect x="2" y="2" width={w - 4} height="5" rx="2.5" fill="rgba(255,255,255,0.45)" />
          {[28, 44, 60].map((tx) => (
            <g key={tx}>
              <rect x={tx} y="9" width="5" height="12" rx="2" fill="#3A3A3A" />
              <circle cx={tx + 2.5} cy="8" r="3.5" fill="#C9483C" stroke="#7E2D26" />
            </g>
          ))}
          <rect x="86" y="12" width="10" height="13" rx="1.5" fill="#E8B84A" opacity="0.9" stroke="#B98A2C" />
          <rect x="102" y="12" width="10" height="13" rx="1.5" fill="#E8B84A" opacity="0.9" stroke="#B98A2C" />
          <circle cx="132" cy="18" r="7" fill="#EDE2CC" stroke="#B9A276" />
          <circle cx="132" cy="18" r="3.5" fill="#7FA84C" />
        </g>
      );
    case "pubtable":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <ellipse cx="27" cy="55" rx="26" ry="6" fill="rgba(40,28,12,0.18)" />
          <circle cx="6" cy="-2" r="7" fill="#8C5E3C" stroke="#5E3D24" strokeWidth="1.4" />
          <circle cx="50" cy="56" r="7" fill="#8C5E3C" stroke="#5E3D24" strokeWidth="1.4" />
          <circle cx="27" cy="27" r="26" fill={`url(#${p}wood2)`} stroke="#7A5E33" strokeWidth="1.6" />
          <circle cx="27" cy="27" r="19" fill="none" stroke="#7A5E33" strokeWidth="0.8" opacity="0.5" />
          <rect x="18" y="16" width="8" height="11" rx="1.5" fill="#E8B84A" stroke="#B98A2C" />
          <circle cx="36" cy="32" r="5" fill="#FFFFFF" stroke="#C2CAD6" />
          <path d="M14 36 q5 4 10 0" stroke="#8C6239" strokeWidth="1.6" fill="none" />
        </g>
      );
    case "stand":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <ellipse cx="32" cy="43" rx="34" ry="5" fill="rgba(30,50,30,0.18)" />
          <rect x="2" y="10" width="60" height="26" rx="4" fill="#EDE2CC" stroke="#A9844F" strokeWidth="1.4" />
          <circle cx="14" cy="40" r="6" fill="#3A3A3A" stroke="#1E1E1E" />
          <circle cx="50" cy="40" r="6" fill="#3A3A3A" stroke="#1E1E1E" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${i * 13 - 1} -4 h13 l-2 9 h-9 Z`} fill={i % 2 ? "#FFFFFF" : "#C9483C"} stroke="#A93B30" strokeWidth="0.6" />
          ))}
          <rect x="-2" y="-6" width="68" height="4" rx="2" fill="#A93B30" />
          <rect x="8" y="16" width="14" height="12" rx="1.5" fill="#36415A" />
          <circle cx="40" cy="20" r="4" fill="#FFFFFF" stroke="#C2CAD6" />
          <circle cx="51" cy="22" r="4" fill="#FFFFFF" stroke="#C2CAD6" />
          <text x="32" y="33" textAnchor="middle" fontSize="6" fill="#7A5E33" fontFamily="monospace">COFFEE</text>
        </g>
      );
    case "bike": {
      const bc = ["#B65C45", "#3D7A8C", "#5B5EA6", "#5B6B3A", "#A6485B", "#27364F"][(f.v || 0) % 6];
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <ellipse cx="20" cy="19" rx="20" ry="3.5" fill="rgba(20,32,51,0.18)" />
          <circle cx="9" cy="11" r="7.5" fill="none" stroke="#2A2F38" strokeWidth="2.2" />
          <circle cx="31" cy="11" r="7.5" fill="none" stroke="#2A2F38" strokeWidth="2.2" />
          <circle cx="9" cy="11" r="1.6" fill="#2A2F38" /><circle cx="31" cy="11" r="1.6" fill="#2A2F38" />
          <path d="M9 11 L16 3 L26 3 L31 11 M16 3 L20 11 L9 11 M20 11 L26 3" stroke={bc} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
          <path d="M26 3 L25 -0.5 M23 -0.5 h5 M16 3 L15 0" stroke="#2A2F38" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="12" y="-2" width="6.5" height="2.6" rx="1.3" fill="#2A2F38" />
        </g>
      );
    }
    case "van":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <rect x="4" y="6" width={w} height={h} rx="7" fill="rgba(20,32,51,0.25)" />
          <rect x="-4" y="9" width="7" height="15" rx="2" fill="#23262C" /><rect x="-4" y="36" width="7" height="15" rx="2" fill="#23262C" />
          <rect x={w - 3} y="9" width="7" height="15" rx="2" fill="#23262C" /><rect x={w - 3} y="36" width="7" height="15" rx="2" fill="#23262C" />
          <rect width={w} height={h} rx="6" fill="#F2F2EF" stroke="#9AA0A8" strokeWidth="1.6" />
          <rect x="6" y="6" width="78" height={h - 12} rx="4" fill="#E4E4DF" stroke="#C9CCC9" />
          <rect x="38" y="22" width="18" height="16" rx="2" fill="#CFCFC8" stroke="#B5B8B4" />
          <rect x="96" y="5" width="16" height={h - 10} rx="3" fill="#9FB4D6" stroke="#7E94B5" />
          <text x="46" y="48" textAnchor="middle" fontSize="8" fontWeight="700" fill="#9AA0A8" fontFamily="'Sora', sans-serif" letterSpacing="1">DELIVERY</text>
          {[[3, 3], [3, h - 3], [w - 3, 3], [w - 3, h - 3]].map(([hx, hy], i) => (
            <circle key={i} cx={hx} cy={hy} r="3" fill="#F2A33C" stroke="#C97E1C" strokeWidth="1">
              {!REDUCED && <animate attributeName="opacity" values="1;0.15" calcMode="discrete" dur="1.1s" repeatCount="indefinite" />}
            </circle>
          ))}
        </g>
      );
    case "cone":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <ellipse cx="8" cy="10" rx="9" ry="3.5" fill="rgba(20,32,51,0.18)" />
          <circle cx="8" cy="8" r="7.5" fill="#E8762C" stroke="#B5521A" strokeWidth="1.4" />
          <circle cx="8" cy="8" r="4.4" fill="#FFFFFF" />
          <circle cx="8" cy="8" r="2" fill="#E8762C" />
        </g>
      );
    case "stumps":
      return (
        <g transform={`translate(${f.x},${f.y})`}>
          <ellipse cx="5" cy="11" rx="9" ry="2.6" fill="rgba(30,50,30,0.18)" />
          <rect x="-0.5" y="-7" width="2.6" height="17" rx="1.2" fill="#E8D9A8" stroke="#B9A26A" strokeWidth="0.8" />
          <rect x="3.7" y="-7" width="2.6" height="17" rx="1.2" fill="#E8D9A8" stroke="#B9A26A" strokeWidth="0.8" />
          <rect x="7.9" y="-7" width="2.6" height="17" rx="1.2" fill="#E8D9A8" stroke="#B9A26A" strokeWidth="0.8" />
          <rect x="-1" y="-8.6" width="12" height="2" rx="1" fill="#C9A14B" />
        </g>
      );
    default: return null;
  }
}

/* decor items: rugs, stone bridges and punts (visual only, no collision) */
const PUNT_CUSH = ["#B65C45", "#3D7A8C", "#5B5EA6", "#E9A13B"];
function PuntBoat({ v = 0 }) {
  return (
    <g>
      <ellipse cx="60" cy="40" rx="56" ry="9" fill="rgba(15,45,60,0.25)" />
      <path d="M6 8 Q0 22 6 36 L20 41 H100 L114 36 Q120 22 114 8 L100 3 H20 Z" fill="#A9844F" stroke="#6E512F" strokeWidth="1.8" />
      <path d="M9 10 Q4 22 9 34 L21 38 H99 L111 34 Q116 22 111 10 L99 6 H21 Z" fill="#C9B286" />
      {[34, 52, 70, 88].map((lx) => <line key={lx} x1={lx} y1="7" x2={lx} y2="37" stroke="#A9844F" strokeWidth="1.2" opacity="0.7" />)}
      <rect x="24" y="10" width="16" height="24" rx="3" fill={PUNT_CUSH[v % 4]} stroke="rgba(0,0,0,0.18)" />
      <rect x="74" y="10" width="16" height="24" rx="3" fill={PUNT_CUSH[(v + 2) % 4]} stroke="rgba(0,0,0,0.18)" />
      {v % 4 === 0 && (
        <g>{/* picnic basket */}
          <rect x="48" y="14" width="16" height="12" rx="2.5" fill="#B98A4A" stroke="#7A5A2E" strokeWidth="1.2" />
          <path d="M48 19 h16" stroke="#7A5A2E" strokeWidth="1" /><path d="M52 14 q4 -5 8 0" stroke="#7A5A2E" strokeWidth="1.6" fill="none" />
        </g>
      )}
      {v % 4 === 1 && <line x1="16" y1="34" x2="106" y2="12" stroke="#6E512F" strokeWidth="2.4" strokeLinecap="round" />}
      {v % 4 === 2 && (
        <g>{/* sun hat + bottle */}
          <circle cx="56" cy="20" r="7" fill="#E8D9A8" stroke="#C2AE6E" strokeWidth="1.4" /><circle cx="56" cy="20" r="3.4" fill="#D9C684" />
          <rect x="66" y="24" width="4.5" height="9" rx="2" fill="#3E7D52" />
        </g>
      )}
      {v % 4 === 3 && (
        <g>{/* guidebook + thermos */}
          <rect x="50" y="16" width="12" height="9" rx="1" fill="#A6485B" transform="rotate(-8 56 20)" />
          <rect x="64" y="22" width="5" height="11" rx="2.4" fill="#8C97A8" />
        </g>
      )}
    </g>
  );
}
function Drift({ d, children }) {
  if (!d.drift || REDUCED) return children;
  return (
    <g>
      <animateTransform attributeName="transform" type="translate" from="0 0" to={`${d.driftTo ?? 1040} 0`} dur={`${d.drift}s`} repeatCount="indefinite" />
      {children}
    </g>
  );
}
function CyclistFig({ c = "#B65C45" }) {
  return (
    <g>
      <ellipse cx="24" cy="18" rx="22" ry="3.5" fill="rgba(20,32,51,0.16)" />
      <circle cx="10" cy="10" r="8" fill="none" stroke="#2A2F38" strokeWidth="2.2" />
      <circle cx="38" cy="10" r="8" fill="none" stroke="#2A2F38" strokeWidth="2.2" />
      <path d="M10 10 L19 0 L31 0 L38 10 M19 0 L24 10 L10 10" stroke={c} strokeWidth="2.4" fill="none" strokeLinejoin="round" />
      <path d="M31 0 L30 -4 M27 -4 h7" stroke="#2A2F38" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 0 L24 10 M19 0 L17 -3" stroke="#2A2F38" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 -4 Q22 -16 31 -13 L30 -5" fill="none" stroke="#27364F" strokeWidth="4.6" strokeLinecap="round" />
      <circle cx="16" cy="-15" r="5" fill="#E0B188" stroke="rgba(20,30,50,0.4)" strokeWidth="1.2" />
      <path d="M11 -17 a5.5 5.5 0 0 1 10 -1.5" fill="none" stroke="#C9483C" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 10 L29 3 M24 10 L20 16" stroke="#27364F" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  );
}
function DecorItem({ d }) {
  if (d.t === "roadline") {
    return <line x1={d.x} y1={d.y} x2={d.x + d.w} y2={d.y} stroke="#F2F2EE" strokeWidth="4" strokeDasharray="26 22" opacity="0.85" />;
  }
  if (d.t === "zebra") {
    return (
      <g>
        {Array.from({ length: Math.floor(d.h / 22) }).map((_, i) => (
          <rect key={i} x={d.x} y={d.y + i * 22} width={d.w} height="13" rx="2" fill="#EDEDE8" opacity="0.92" />
        ))}
      </g>
    );
  }
  if (d.t === "oval") {
    return <ellipse cx={d.x + d.w / 2} cy={d.y + d.h / 2} rx={d.w / 2} ry={d.h / 2}
      fill={d.color === "none" ? "none" : d.color} stroke={d.stroke || "none"} strokeWidth="2.5" strokeDasharray={d.dash || undefined} />;
  }
  if (d.t === "cyclist") {
    return (
      <Drift d={d}>
        <g transform={`translate(${d.x},${d.y}) scale(${d.flip ? -1 : 1},1)`}>
          <CyclistFig c={d.c} />
        </g>
      </Drift>
    );
  }
  if (d.t === "bridge") {
    return (
      <g>
        <rect x={d.x - 8} y={d.y + 6} width={d.w + 16} height={d.h} fill="rgba(15,45,60,0.18)" rx="8" />
        <rect x={d.x} y={d.y} width={d.w} height={d.h} rx="6" fill="#DAD3C2" />
        {Array.from({ length: Math.floor(d.h / 38) }).map((_, i) => (
          <line key={i} x1={d.x + 4} y1={d.y + 22 + i * 38} x2={d.x + d.w - 4} y2={d.y + 22 + i * 38} stroke="rgba(90,80,60,0.18)" strokeWidth="1.4" />
        ))}
        <rect x={d.x - 7} y={d.y - 4} width={11} height={d.h + 8} rx="4" fill="#B3A88F" stroke="#8C8268" strokeWidth="1.2" />
        <rect x={d.x + d.w - 4} y={d.y - 4} width={11} height={d.h + 8} rx="4" fill="#B3A88F" stroke="#8C8268" strokeWidth="1.2" />
        <rect x={d.x - 7} y={d.y - 4} width={11} height={4} fill="rgba(255,255,255,0.4)" />
        <rect x={d.x + d.w - 4} y={d.y - 4} width={11} height={4} fill="rgba(255,255,255,0.4)" />
      </g>
    );
  }
  if (d.t === "punt") {
    const boat = d.dir === "v"
      ? <g transform={`translate(${d.x + 22},${d.y + 62}) rotate(90) translate(-60,-22)`}><PuntBoat v={d.v || 0} /></g>
      : <g transform={`translate(${d.x},${d.y})`}><PuntBoat v={d.v || 0} /></g>;
    return <Drift d={d}>{boat}</Drift>;
  }
  /* default: rug */
  return (
    <g>
      <rect x={d.x} y={d.y} width={d.w} height={d.h} rx={d.plain ? 0 : 10} fill={d.color} />
      {!d.plain && <rect x={d.x + 5} y={d.y + 5} width={d.w - 10} height={d.h - 10} rx="7" fill="none" stroke="rgba(20,32,51,0.10)" strokeWidth="2" strokeDasharray="6 5" />}
    </g>
  );
}

/* ================= reader (theory library) ================= */
function Reader({ doc, accent, onClose, onRead }) {
  const [page, setPage] = useState(0);
  const last = doc.pages.length - 1;
  useEffect(() => { if (page === last && onRead) onRead(doc.id); }, [page, last]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setPage((p) => Math.min(last, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last, onClose]);
  const p = doc.pages[page];
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(16,26,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, padding: 14, borderRadius: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "#FBF8F1", width: "min(96%, 560px)", maxHeight: "92%", display: "flex", flexDirection: "column",
          borderRadius: 14, borderTop: `6px solid ${accent}`, boxShadow: "0 22px 60px rgba(10,18,32,0.5)", padding: "16px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, color: C.ink, fontSize: 15 }}>📖 {doc.title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 19, cursor: "pointer", color: C.mist }} aria-label="Close reader">✕</button>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: C.mist, letterSpacing: "0.12em", margin: "2px 0 8px" }}>
          PAGE {page + 1} OF {doc.pages.length}
        </div>
        <div style={{ overflowY: "auto", flex: 1, paddingRight: 6 }}>
          <h4 style={{ fontFamily: "'Sora', sans-serif", color: accent, margin: "2px 0 8px", fontSize: 15 }}>{p.h}</h4>
          {p.t.split("\n\n").map((para, i) => (
            <p key={i} style={{ fontSize: 13.5, lineHeight: 1.75, color: "#3A3428", margin: "0 0 10px" }}>{para}</p>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: "1px solid #E3DCC9" }}>
          <button style={{ ...btnGhost, opacity: page === 0 ? 0.4 : 1 }} disabled={page === 0} onClick={() => setPage(page - 1)}>‹ Prev</button>
          <div style={{ display: "flex", gap: 5 }}>
            {doc.pages.map((_, i) => (
              <span key={i} onClick={() => setPage(i)} style={{ width: 8, height: 8, borderRadius: 4, cursor: "pointer",
                background: i === page ? accent : "#D8D0BC" }} />
            ))}
          </div>
          {page < last
            ? <button style={btnPrimary} onClick={() => setPage(page + 1)}>Next ›</button>
            : <button style={btnPrimary} onClick={onClose}>✓ Done</button>}
        </div>
      </div>
    </div>
  );
}

/* ================= office scene (imperative engine) ================= */
function buildObstacles(wp) {
  const fur = wp.furniture.map((f) => {
    const [w, h] = FOOT[f.t];
    return { x: f.x, y: f.y, w, h };
  });
  return [...fur, ...wp.walls];
}

function OfficeScene({ wpKey, cfg, progress, onStartTask, onExit, suspended, exitLabel, onMarkRead }) {
  const baseWp = WORKPLACES[wpKey];
  /* scenes can transform once a quest is done (e.g. jams clearing) — evaluated on entry */
  const wp = useMemo(() => (
    baseWp.cleared && baseWp.clearedWhen && baseWp.clearedWhen.every((id) => progress.completed.includes(id))
      ? { ...baseWp, ...baseWp.cleared }
      : baseWp
  ), [wpKey]);
  const SRW = wp.rw || RW, SRH = wp.rh || RH; /* per-scene room size */
  const P = wpKey + "-"; // gradient id prefix
  const obstacles = useMemo(() => buildObstacles(wp), [wp]);

  const playerRef = useRef(null);
  const actors = useMemo(() => [
    ...wp.npcs.map((n) => ({ ...n, kind: "npc" })),
    ...wp.ambient.map((a, i) => ({ ...a, id: "amb" + i, kind: "ambient" })),
  ], [wp]);
  const actorState = useRef(null);
  if (actorState.current === null) {
    const init = {};
    actors.forEach((n) => {
      init[n.id] = { x: n.waypoints[0].x, y: n.waypoints[0].y, wi: 0, pauseUntil: performance.now() + (n.waypoints[0].pause || 2000), facing: 1, moving: false };
    });
    actorState.current = init;
  }

  const els = useRef({}); // id -> {root, body} DOM nodes
  const keys = useRef({});
  const target = useRef(null);
  const pendingId = useRef(null);
  const [dialog, setDialog] = useState(null);
  const dialogRef = useRef(dialog); dialogRef.current = dialog;
  const suspendedRef = useRef(suspended); suspendedRef.current = suspended;
  const [readDoc, setReadDoc] = useState(null);
  const readRef = useRef(null); readRef.current = readDoc;
  const [nearId, setNearId] = useState(null);
  const nearIdRef = useRef(null);
  const svgRef = useRef(null);
  const joy = useRef({ x: 0, y: 0, active: false });
  const joyBase = useRef(null);
  const knob = useRef(null);
  const tapStart = useRef(null);
  const targetEl = useRef(null);
  const camEl = useRef(null);
  const cam = useRef({ x: 0, y: 0 });
  const isTouch = typeof window !== "undefined" && (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

  const collides = (x, y) => {
    if (x < WALL + PR || x > SRW - WALL - PR || y < WALL + PR + 30 || y > SRH - WALL - PR) return true;
    /* walkable-mask scenes (e.g. the punt jam): outside every walk rect = water = blocked */
    if (wp.walk && !wp.walk.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)) return true;
    for (const o of obstacles) {
      if (x + PR > o.x && x - PR < o.x + o.w && y + PR > o.y && y - PR < o.y + o.h) return true;
    }
    return false;
  };

  /* never spawn inside geometry: spiral out to the nearest free spot */
  const safeSpawn = (x, y) => {
    if (!collides(x, y)) return { x, y };
    for (let r = 12; r < 320; r += 12) {
      for (let a = 0; a < 12; a++) {
        const nx = x + r * Math.cos((a * Math.PI) / 6), ny = y + r * Math.sin((a * Math.PI) / 6);
        if (!collides(nx, ny)) return { x: nx, y: ny };
      }
    }
    return { x: SRW / 2, y: SRH / 2 };
  };
  if (playerRef.current === null) playerRef.current = { ...safeSpawn(wp.spawn.x, wp.spawn.y), facing: 1, moving: false };

  /* pick a free standing spot next to a tapped npc/object */
  const approach = (x, y) => {
    const p = playerRef.current;
    const cands = [[-40, 24], [40, 24], [-40, -28], [40, -28], [0, 46], [0, -46], [-54, 0], [54, 0]]
      .sort((a, b) => Math.hypot(x + a[0] - p.x, y + a[1] - p.y) - Math.hypot(x + b[0] - p.x, y + b[1] - p.y));
    for (const [ox, oy] of cands) if (!collides(x + ox, y + oy)) return { x: x + ox, y: y + oy };
    return { x, y };
  };

  const findActor = (id) => {
    const n = wp.npcs.find((x) => x.id === id);
    if (n) { const s = actorState.current[id]; return { ...n, kind: "npc", lx: s.x, ly: s.y }; }
    const o = wp.objects.find((x) => x.id === id);
    if (o) return { ...o, kind: "object", lx: o.x, ly: o.y };
    return null;
  };

  const computeNear = () => {
    const p = playerRef.current;
    let best = null, bd = 1e9;
    for (const n of wp.npcs) {
      const s = actorState.current[n.id];
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < 60 && d < bd) { bd = d; best = n.id; }
    }
    for (const o of wp.objects) {
      const d = Math.hypot(o.x - p.x, o.y - p.y);
      if (d < 56 && d < bd) { bd = d; best = o.id; }
    }
    return best;
  };

  /* keyboard */
  useEffect(() => {
    const isTyping = (e) => {
      const t = e.target;
      return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    };
    const down = (e) => {
      if (isTyping(e) || suspendedRef.current || readRef.current) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      keys.current[e.key.toLowerCase()] = true;
      if ((e.key.toLowerCase() === "e" || e.key === "Enter") && !dialogRef.current && nearIdRef.current) {
        setDialog(findActor(nearIdRef.current));
      }
      if (e.key === "Escape") setDialog(null);
    };
    const up = (e) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [wpKey]);

  /* main loop — writes transforms directly to the DOM */
  useEffect(() => {
    let raf, last = performance.now();
    const apply = (id, s, bobT) => {
      const e = els.current[id];
      if (!e || !e.root) return;
      /* only touch the DOM when something actually changed — redundant
         setAttribute calls invalidate paint even with identical values */
      const rt = `translate(${s.x.toFixed(1)},${s.y.toFixed(1)})`;
      if (e._rt !== rt) { e._rt = rt; e.root.setAttribute("transform", rt); }
      const bob = s.moving && !REDUCED ? -Math.abs(Math.sin(bobT * 0.014)) * 2.2 : 0;
      if (e.body) {
        const bt = `scale(${s.facing},1) translate(0,${bob.toFixed(2)})`;
        if (e._bt !== bt) { e._bt = bt; e.body.setAttribute("transform", bt); }
      }
    };
    const frame = (now) => {
      const dt = Math.min(40, now - last) / 16.7; last = now;
      const dlg = dialogRef.current;
      const susp = suspendedRef.current || !!readRef.current;
      const p = playerRef.current;
      p.moving = false;
      if ((dlg || susp) && joy.current.active) {
        joy.current = { x: 0, y: 0, active: false };
        if (knob.current) knob.current.style.transform = "translate(0px,0px)";
      }
      if (!dlg && !susp) {
        let vx = 0, vy = 0;
        const k = keys.current;
        if (k["arrowleft"] || k["a"]) vx -= 1;
        if (k["arrowright"] || k["d"]) vx += 1;
        if (k["arrowup"] || k["w"]) vy -= 1;
        if (k["arrowdown"] || k["s"]) vy += 1;
        if (joy.current.active && (joy.current.x || joy.current.y)) { vx += joy.current.x; vy += joy.current.y; }
        if (vx || vy) target.current = null;
        if (!vx && !vy && target.current) {
          const dx = target.current.x - p.x, dy = target.current.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 5) target.current = null;
          else { vx = dx / d; vy = dy / d; }
        }
        if (vx || vy) {
          const len = Math.hypot(vx, vy) || 1;
          const sp = 3.4 * dt;
          const nx = p.x + (vx / len) * sp, ny = p.y + (vy / len) * sp;
          let moved = false;
          const stuck = collides(p.x, p.y); /* failsafe: never trap the player inside geometry */
          if (stuck || !collides(nx, p.y)) { p.x = nx; moved = true; } else if (target.current) target.current = null;
          if (stuck || !collides(p.x, ny)) { p.y = ny; moved = true; } else if (target.current) target.current = null;
          if (vx !== 0) p.facing = vx > 0 ? 1 : -1;
          p.moving = moved;
        }
      }
      apply("player", p, now);

      /* camera: world scrolls, player stays centred */
      cam.current.x = p.x - VW / 2; cam.current.y = p.y - VH / 2;
      if (camEl.current) {
        const ct = `translate(${(VW / 2 - p.x).toFixed(1)},${(VH / 2 - p.y).toFixed(1)})`;
        if (camEl.current.dataset.t !== ct) { camEl.current.dataset.t = ct; camEl.current.setAttribute("transform", ct); }
      }

      /* npc schedules */
      for (const a of actors) {
        const s = actorState.current[a.id];
        const talking = dlg && dlg.id === a.id;
        s.moving = false;
        if (!talking && now >= s.pauseUntil) {
          const wpt = a.waypoints[(s.wi + 1) % a.waypoints.length];
          const dx = wpt.x - s.x, dy = wpt.y - s.y;
          const d = Math.hypot(dx, dy);
          if (d < 3) {
            s.wi = (s.wi + 1) % a.waypoints.length;
            s.pauseUntil = now + (wpt.pause || 2000);
          } else {
            const sp = 1.1 * dt;
            s.x += (dx / d) * sp; s.y += (dy / d) * sp;
            if (Math.abs(dx) > 0.5) s.facing = dx > 0 ? 1 : -1;
            s.moving = true;
          }
        }
        apply(a.id, s, now + a.id.length * 97);
      }

      /* proximity — re-render only when the nearest thing changes */
      const ni = computeNear();
      if (ni !== nearIdRef.current) { nearIdRef.current = ni; setNearId(ni); }

      /* auto-open after walking to a tapped target */
      if (pendingId.current && ni === pendingId.current && !dlg && !susp) {
        const act = findActor(pendingId.current);
        pendingId.current = null; target.current = null;
        if (act) setDialog(act);
      }

      /* tap-target marker */
      if (targetEl.current) {
        const t = target.current;
        if (t && !dlg && !susp) {
          targetEl.current.setAttribute("transform", `translate(${t.x},${t.y})`);
          targetEl.current.setAttribute("opacity", "1");
        } else {
          targetEl.current.setAttribute("opacity", "0");
        }
      }
    };
    const loop = (now) => {
      try { frame(now); } catch (err) { /* one bad frame must never kill the engine */ }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [wpKey, actors]);

  const toRoom = (e) => {
    const svg = svgRef.current; if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * VW + cam.current.x, y: ((e.clientY - r.top) / r.height) * VH + cam.current.y };
  };

  const handleTap = (e) => {
    if (dialog || suspended || readDoc) return;
    const pt = toRoom(e); if (!pt) return;
    const p = playerRef.current;
    for (const n of wp.npcs) {
      const s = actorState.current[n.id];
      if (Math.hypot(s.x - pt.x, s.y - pt.y) < 42) {
        if (Math.hypot(s.x - p.x, s.y - p.y) < 60) { setDialog(findActor(n.id)); return; }
        pendingId.current = n.id;
        target.current = approach(s.x, s.y);
        return;
      }
    }
    for (const o of wp.objects) {
      if (Math.hypot(o.x - pt.x, o.y - pt.y) < 38) {
        if (Math.hypot(o.x - p.x, o.y - p.y) < 56) { setDialog(findActor(o.id)); return; }
        pendingId.current = o.id;
        target.current = approach(o.x, o.y);
        return;
      }
    }
    pendingId.current = null;
    target.current = pt;
  };

  /* tap gesture: down + up without drift, so page scrolls never become walk targets */
  const onTapDown = (e) => { tapStart.current = { x: e.clientX, y: e.clientY, t: performance.now() }; };
  const onTapUp = (e) => {
    const s = tapStart.current; tapStart.current = null;
    if (!s) return;
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 14 && performance.now() - s.t < 700) handleTap(e);
  };

  /* virtual joystick (touch devices) */
  const moveKnob = (e) => {
    const b = joyBase.current; if (!b) return;
    const r = b.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const max = r.width / 2 - 16;
    const d = Math.hypot(dx, dy);
    if (d > max) { dx = (dx / d) * max; dy = (dy / d) * max; }
    joy.current.x = dx / max; joy.current.y = dy / max;
    if (knob.current) knob.current.style.transform = `translate(${dx}px,${dy}px)`;
  };
  const endJoy = () => {
    joy.current = { x: 0, y: 0, active: false };
    if (knob.current) knob.current.style.transform = "translate(0px,0px)";
  };

  const taskDone = (id) => progress.completed.includes(id);
  const setEl = (id, part) => (node) => {
    if (!els.current[id]) els.current[id] = {};
    els.current[id][part] = node;
    if (part === "root" && node && !node.dataset.init) {
      const s = id === "player" ? playerRef.current : actorState.current[id];
      if (s) node.setAttribute("transform", `translate(${s.x},${s.y})`);
      node.dataset.init = "1";
    }
  };
  const nearActor = nearId ? findActor(nearId) : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, color: C.ink }}>{wp.name}</div>
          <div style={{ fontSize: 12.5, color: C.mist }}>{wp.place} · {wp.blurb}</div>
        </div>
        <button onClick={onExit} style={btnGhost}>{exitLabel || "← Back to city map"}</button>
      </div>

      <div style={{ position: "relative" }}>
        <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`}
          onPointerDown={onTapDown} onPointerUp={onTapUp}
          style={{ width: "100%", display: "block", borderRadius: 16, boxShadow: "0 18px 44px rgba(20,32,51,0.22)", cursor: "pointer", touchAction: "manipulation" }}>
          <defs>
            <linearGradient id={P + "wood"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={wp.floor} /><stop offset="1" stopColor={wp.floor} stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id={P + "wood2"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F4EEDF" /><stop offset="1" stopColor="#E3D9C2" />
            </linearGradient>
            <linearGradient id={P + "counter"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F0EADD" /><stop offset="1" stopColor="#E2D9C4" />
            </linearGradient>
            <linearGradient id={P + "tabletop"} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#EAF2EE" /><stop offset="1" stopColor="#D8E5DF" />
            </linearGradient>
            <linearGradient id={P + "winlight"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFF8E0" stopOpacity="0.55" /><stop offset="1" stopColor="#FFF8E0" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={P + "lamp"}>
              <stop offset="0" stopColor="#FFF6D8" stopOpacity="0.5" /><stop offset="1" stopColor="#FFF6D8" stopOpacity="0" />
            </radialGradient>
            <pattern id={P + "planks"} width="120" height="22" patternUnits="userSpaceOnUse">
              <rect width="120" height="22" fill="none" />
              <line x1="0" y1="21.5" x2="120" y2="21.5" stroke="rgba(120,90,50,0.12)" strokeWidth="1" />
              <line x1="60" y1="0" x2="60" y2="22" stroke="rgba(120,90,50,0.10)" strokeWidth="1" />
            </pattern>
            <pattern id={P + "tiles"} width="56" height="56" patternUnits="userSpaceOnUse">
              <rect width="56" height="56" fill="none" />
              <path d="M0 0 H56 V56" fill="none" stroke="rgba(60,80,120,0.10)" strokeWidth="1.2" />
            </pattern>
            <pattern id={P + "carpet"} width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1" fill="rgba(90,70,60,0.10)" />
              <circle cx="10" cy="10" r="1" fill="rgba(90,70,60,0.08)" />
              <circle cx="17" cy="3" r="1" fill="rgba(90,70,60,0.08)" />
              <circle cx="24" cy="10" r="1" fill="rgba(90,70,60,0.10)" />
              <circle cx="3" cy="17" r="1" fill="rgba(90,70,60,0.08)" />
              <circle cx="10" cy="24" r="1" fill="rgba(90,70,60,0.10)" />
              <circle cx="17" cy="17" r="1" fill="rgba(90,70,60,0.10)" />
              <circle cx="24" cy="24" r="1" fill="rgba(90,70,60,0.08)" />
            </pattern>
            <pattern id={P + "grass"} width="52" height="52" patternUnits="userSpaceOnUse">
              <path d="M4 22 q1 -5 2 -6 M8 24 q1 -4 2 -5 M18 20 q1 -5 2 -6 M22 25 q1 -4 2 -5" stroke="rgba(50,90,40,0.18)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              <path d="M4 22 q1 -5 2 -6 M8 24 q1 -4 2 -5 M18 20 q1 -5 2 -6 M22 25 q1 -4 2 -5" stroke="rgba(50,90,40,0.18)" strokeWidth="1.4" fill="none" strokeLinecap="round" transform="translate(26,4)" />
              <path d="M4 22 q1 -5 2 -6 M8 24 q1 -4 2 -5 M18 20 q1 -5 2 -6 M22 25 q1 -4 2 -5" stroke="rgba(50,90,40,0.18)" strokeWidth="1.4" fill="none" strokeLinecap="round" transform="translate(3,28)" />
              <path d="M4 22 q1 -5 2 -6 M8 24 q1 -4 2 -5 M18 20 q1 -5 2 -6 M22 25 q1 -4 2 -5" stroke="rgba(50,90,40,0.18)" strokeWidth="1.4" fill="none" strokeLinecap="round" transform="translate(28,30)" />
            </pattern>
            <pattern id={P + "water"} width="64" height="24" patternUnits="userSpaceOnUse">
              <path d="M0 12 q8 -5 16 0 t16 0 t16 0 t16 0" stroke="rgba(255,255,255,0.28)" strokeWidth="1.6" fill="none" />
              <path d="M-8 22 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0" stroke="rgba(20,60,80,0.10)" strokeWidth="1.4" fill="none" />
            </pattern>
          </defs>

          {/* world group — translated by the camera so the player stays centred */}
          <g ref={(el) => { camEl.current = el; if (el && !el.dataset.init) { const p0 = playerRef.current; el.setAttribute("transform", `translate(${VW / 2 - p0.x},${VH / 2 - p0.y})`); el.dataset.init = "1"; } }}>

          {/* exterior ground beyond the office */}
          <rect x={-VW} y={-VH} width={SRW + VW * 2} height={SRH + VH * 2} fill="#ADB9AE" />
          <rect x="10" y="14" width={SRW} height={SRH} rx="20" fill="rgba(20,32,51,0.22)" />

          {/* outer wall + floor */}
          <rect width={SRW} height={SRH} rx="16" fill={wp.wall} />
          <rect x="3" y="3" width={SRW - 6} height={SRH - 6} rx="14" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
          <rect x={WALL} y={TOPBAND} width={SRW - WALL * 2} height={SRH - WALL - TOPBAND} rx="6" fill={`url(#${P}wood)`} />
          <rect x={WALL} y={TOPBAND} width={SRW - WALL * 2} height={SRH - WALL - TOPBAND} rx="6"
            fill={`url(#${P}${wp.floorKind === "wood" ? "planks" : wp.floorKind === "tile" ? "tiles" : wp.floorKind === "grass" ? "grass" : wp.floorKind === "water" ? "water" : "carpet"})`} />
          {!wp.outdoor && (<g>
          {/* inner wall shadow */}
          <rect x={WALL} y={TOPBAND} width={SRW - WALL * 2} height="10" fill="rgba(20,32,51,0.10)" />
          <rect x={WALL} y={TOPBAND} width="8" height={SRH - WALL - TOPBAND} fill="rgba(20,32,51,0.05)" />

          {/* windows + light spill */}
          {Array.from({ length: Math.max(1, Math.floor((SRW - 190) / 150) + 1) }, (_, i) => 80 + i * 150).map((wx) => (
            <g key={wx}>
              <polygon points={`${wx},${TOPBAND} ${wx + 70},${TOPBAND} ${wx + 96},150 ${wx - 26},150`} fill={`url(#${P}winlight)`} />
              <rect x={wx - 3} y={5} width="76" height="34" rx="5" fill="#8FB6CC" stroke="#7396AA" strokeWidth="1.5" />
              <rect x={wx} y={8} width="70" height="28" rx="3" fill="#BFDCEC" />
              <path d={`M${wx + 4} 32 q16 -18 30 -22`} stroke="#FFFFFF" strokeWidth="5" opacity="0.55" fill="none" />
              <line x1={wx + 35} y1="8" x2={wx + 35} y2="36" stroke="#7396AA" strokeWidth="1.5" />
              <path d={`M${wx + 8} 30 l7 -8 l5 8 M${wx + 44} 30 l6 -9 l5 9`} stroke="#6E93A8" strokeWidth="1.6" fill="none" opacity="0.7" />
            </g>
          ))}

          {/* ceiling light pools */}
          {[210, 420].flatMap((ly) => Array.from({ length: Math.floor((SRW - 350) / 250) + 1 }, (_, i) => [200 + i * 250, ly])).map(([lx, ly], i) => (
            <circle key={i} cx={lx} cy={ly} r="95" fill={`url(#${P}lamp)`} />
          ))}
          </g>)}

          {/* rugs, banks, bridges & punts */}
          {(wp.decor || []).map((d, i) => <DecorItem key={i} d={d} />)}

          {/* internal walls (solid + glass) */}
          {wp.walls.map((w, i) => w.glass ? (
            <g key={i}>
              <rect x={w.x} y={w.y} width={w.w} height={w.h} fill="#BCD8E2" opacity="0.5" />
              <rect x={w.x} y={w.y} width={w.w} height={w.h} fill="none" stroke="#7FA2B0" strokeWidth="1.6" />
              {w.w > w.h
                ? [0.25, 0.5, 0.75].map((q) => <line key={q} x1={w.x + w.w * q} y1={w.y} x2={w.x + w.w * q} y2={w.y + w.h} stroke="#7FA2B0" strokeWidth="1.2" />)
                : [0.25, 0.5, 0.75].map((q) => <line key={q} x1={w.x} y1={w.y + w.h * q} x2={w.x + w.w} y2={w.y + w.h * q} stroke="#7FA2B0" strokeWidth="1.2" />)}
            </g>
          ) : (
            <g key={i}>
              <rect x={w.x + 2} y={w.y + 3} width={w.w} height={w.h} fill="rgba(20,32,51,0.14)" />
              <rect x={w.x} y={w.y} width={w.w} height={w.h} fill={wp.wallDark} />
              <rect x={w.x} y={w.y} width={w.w} height={Math.min(3.5, w.h)} fill="rgba(255,255,255,0.5)" />
            </g>
          ))}

          {/* room labels */}
          {wp.labels.map((l, i) => (
            <text key={i} x={l.x} y={l.y} textAnchor="middle" fontSize="10" letterSpacing="2.5"
              fill="rgba(27,42,65,0.26)" fontFamily="'Sora', sans-serif" fontWeight="700">{l.t}</text>
          ))}

          {/* entrance */}
          <rect x={wp.spawn.x - 36} y={SRH - WALL - 10} width="72" height="10" rx="4" fill={wp.accent} opacity="0.45" />
          <rect x={wp.spawn.x - 36} y={SRH - WALL - 10} width="72" height="10" rx="4" fill="none" stroke={wp.accent} opacity="0.6" />
          <text x={wp.spawn.x} y={SRH - WALL - 16} textAnchor="middle" fontSize="8.5" letterSpacing="1.5" fill="rgba(27,42,65,0.4)" fontFamily="'Sora', sans-serif" fontWeight="700">ENTRANCE</text>

          {/* furniture */}
          {wp.furniture.map((f, i) => <Furniture key={i} f={f} accent={wp.accent} p={P} />)}

          {/* object hotspots */}
          {wp.objects.map((o) => {
            const remaining = (o.tasks || []).filter((t) => !taskDone(t) && !taskLock(t, progress.completed)).length;
            const isNear = nearId === o.id;
            return (
              <g key={o.id}>
                <circle cx={o.x} cy={o.y} r="14" fill={wp.accent} opacity={isNear ? 0.32 : 0.14} />
                <circle cx={o.x} cy={o.y} r="14" fill="none" stroke={wp.accent} strokeWidth="1.6" strokeDasharray="3 3" opacity="0.8" />
                {remaining > 0 && (
                  <g transform={`translate(${o.x},${o.y - 27})`}>
                    <circle r="9.5" fill={C.amber} stroke="#B97A1F" strokeWidth="1.6">
                      {!REDUCED && <animate attributeName="cy" values="0;-4;0" dur="1.6s" repeatCount="indefinite" />}
                    </circle>
                    <text textAnchor="middle" y="4" fontSize="11.5" fontWeight="700" fill="#3B2A07">!</text>
                  </g>
                )}
                {remaining === 0 && o.read && !(progress.read || {})[o.read.id] && (
                  <g transform={`translate(${o.x},${o.y - 27})`}>
                    <circle r="9.5" fill="#FFFFFF" stroke={wp.accent} strokeWidth="1.6" />
                    <text textAnchor="middle" y="3.5" fontSize="10">📖</text>
                  </g>
                )}
                {isNear && !dialog && (
                  <g transform={`translate(${o.x},${o.y + 36})`}>
                    <rect x="-70" y="-12" width="140" height="22" rx="11" fill={C.ink} opacity="0.92" />
                    <text textAnchor="middle" y="3" fontSize="10.5" fill="#FFFFFF" fontFamily="'Sora', sans-serif">{o.label} — E / tap</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* actors (positions driven imperatively) */}
          {actors.map((a) => {
            const remaining = a.kind === "npc" ? (a.tasks || []).filter((t) => !taskDone(t) && !taskLock(t, progress.completed)).length : 0;
            return (
              <g key={a.id} ref={setEl(a.id, "root")}>
                <ellipse cx="0" cy="21" rx="12" ry="4.5" fill="rgba(20,30,50,0.25)" />
                <g ref={setEl(a.id, "body")}>
                  <CharBody skin={SKINS[a.skin]} shirt={a.shirt} />
                </g>
                {a.kind === "npc" && (
                  <g>
                    <rect x="-26" y="27" width="52" height="14" rx="7" fill="rgba(255,255,255,0.85)" stroke="rgba(27,42,65,0.15)" />
                    <text y="37" textAnchor="middle" fontSize="9" fill={C.ink} fontFamily="'Sora', sans-serif" fontWeight="700">{a.name}</text>
                  </g>
                )}
                {remaining > 0 && (
                  <g transform="translate(0,-42)">
                    <circle r="9.5" fill={C.amber} stroke="#B97A1F" strokeWidth="1.6">
                      {!REDUCED && <animate attributeName="cy" values="0;-4;0" dur="1.6s" repeatCount="indefinite" />}
                    </circle>
                    <text textAnchor="middle" y="4" fontSize="11.5" fontWeight="700" fill="#3B2A07">!</text>
                  </g>
                )}
                {nearId === a.id && !dialog && (
                  <g transform="translate(0,52)">
                    <rect x="-70" y="-12" width="140" height="22" rx="11" fill={C.ink} opacity="0.92" />
                    <text textAnchor="middle" y="3" fontSize="10.5" fill="#FFFFFF" fontFamily="'Sora', sans-serif">Talk to {a.name || "them"} — E / tap</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* player */}
          <g ref={setEl("player", "root")}>
            <ellipse cx="0" cy="21" rx="12" ry="4.5" fill="rgba(20,30,50,0.28)" />
            <circle cx="0" cy="2" r="20" fill="none" stroke={SPECIALISMS[cfg.spec].color} strokeWidth="1.6" opacity="0.45" strokeDasharray="4 5" />
            <g ref={setEl("player", "body")}>
              <CharBody skin={SKINS[cfg.skin]} shirt={OUTFITS[cfg.outfit].color} hair={HAIR_COLORS[cfg.hairColor]} hstyle={cfg.hairStyle} />
            </g>
          </g>

          {/* tap-to-walk target marker (driven by the loop) */}
          <g ref={targetEl} opacity="0" pointerEvents="none">
            <circle r="11" fill="none" stroke={wp.accent} strokeWidth="2.2" opacity="0.9">
              {!REDUCED && <animate attributeName="r" values="13;5;13" dur="1s" repeatCount="indefinite" />}
            </circle>
            <circle r="2.6" fill={wp.accent} />
          </g>
          </g>{/* end camera world group */}
        </svg>

        {/* virtual joystick for touch screens */}
        {isTouch && !dialog && !suspended && !readDoc && (
          <div
            ref={joyBase}
            onPointerDown={(e) => {
              e.preventDefault();
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
              joy.current.active = true;
              moveKnob(e);
            }}
            onPointerMove={(e) => { if (joy.current.active) moveKnob(e); }}
            onPointerUp={endJoy}
            onPointerCancel={endJoy}
            style={{ position: "absolute", left: 14, bottom: 14, width: 110, height: 110, borderRadius: "50%",
              background: "rgba(27,42,65,0.16)", border: "2px solid rgba(255,255,255,0.6)",
              touchAction: "none", zIndex: 5, userSelect: "none" }}>
            <div ref={knob} style={{ position: "absolute", left: 33, top: 33, width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.9)", boxShadow: "0 3px 10px rgba(20,32,51,0.4)", pointerEvents: "none",
              border: `2.5px solid ${wp.accent}` }} />
          </div>
        )}

        {nearActor && !dialog && !suspended && !readDoc && (
          <button onClick={() => setDialog(nearActor)}
            style={{ position: "absolute", right: 14, bottom: 14, ...btnPrimary, borderRadius: 999, boxShadow: "0 8px 20px rgba(20,32,51,0.3)" }}>
            {nearActor.kind === "npc" ? `Talk to ${nearActor.name}` : nearActor.label}
          </button>
        )}

        {dialog && (
          <div className="dlg-card" style={{ position: "absolute", left: "50%", bottom: 16, transform: "translateX(-50%)", width: "min(92%, 580px)",
            background: C.card, borderRadius: 14, border: `1px solid ${C.line}`, borderLeft: `5px solid ${wp.accent}`,
            boxShadow: "0 18px 44px rgba(20,32,51,0.32)", padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* speaker portrait */}
              <div style={{ flex: "0 0 84px", width: 84, borderRadius: 12, overflow: "hidden",
                background: `linear-gradient(180deg, ${wp.accent}26, ${wp.accent}0D)`, border: `1.5px solid ${C.line}`, paddingTop: 6 }}>
                {dialog.kind === "npc"
                  ? <Bust skin={SKINS[dialog.skin]} shirt={dialog.shirt} {...npcLook(dialog.id)} />
                  : <SpotIcon accent={wp.accent} />}
                <div style={{ textAlign: "center", fontSize: 10, fontFamily: "'Sora', sans-serif", fontWeight: 700, color: C.inkSoft,
                  background: "rgba(255,255,255,0.75)", padding: "3px 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {dialog.kind === "npc" ? dialog.name : "···"}
                </div>
              </div>
              {/* speech */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, color: C.ink }}>
                    {dialog.kind === "npc" ? dialog.name : dialog.label}
                    {dialog.role && <span style={{ fontWeight: 400, color: C.mist, fontSize: 12.5 }}> · {dialog.role}</span>}
                  </div>
                  <button onClick={() => setDialog(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.mist }} aria-label="Close">✕</button>
                </div>
                {dialog.lines.map((l, i) => <p key={i} style={{ fontSize: 14, lineHeight: 1.6, color: C.inkSoft, margin: "8px 0 0" }}>{l}</p>)}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {dialog.read && (
                <button style={btnPrimary} onClick={() => { const d = dialog.read; setDialog(null); setReadDoc(d); }}>
                  📖 Read: {dialog.read.title}{(progress.read || {})[dialog.read.id] ? " ✓" : ""}
                </button>
              )}
              {(dialog.tasks || []).map((tid) => {
                const t = TASKS.find((x) => x.id === tid);
                const done = taskDone(tid);
                const lockPrev = !done && taskLock(tid, progress.completed);
                return (
                  <button key={tid} disabled={done || !!lockPrev} onClick={() => { setDialog(null); onStartTask(t); }}
                    style={{ ...(done || lockPrev ? btnGhost : btnPrimary), opacity: done || lockPrev ? 0.6 : 1, textAlign: "left" }}>
                    {done ? `✓ ${t.title}` : lockPrev ? `🔒 ${t.title} — first: "${lockPrev.title}" (${WORKPLACES[lockPrev.wp].name})` : `Start: ${t.tier ? "★ " : ""}${t.title} (+${t.xp} XP)`}
                  </button>
                );
              })}
              {(dialog.tasks || []).length === 0 && !dialog.read && <span style={{ fontSize: 12.5, color: C.mist }}>Nothing to action here — just ambience.</span>}
            </div>
              </div>
            </div>
          </div>
        )}
        {readDoc && <Reader doc={readDoc} accent={wp.accent} onClose={() => setReadDoc(null)} onRead={onMarkRead} />}
      </div>
      <p style={{ color: C.mist, fontSize: 12.5, textAlign: "center", marginTop: 10 }}>
        {isTouch
          ? "Drag the joystick (bottom-left) to walk, or tap a spot to head there. Tap a colleague and you'll walk over — tap again up close to talk."
          : "WASD / arrows to move, or click a spot to walk there. Colleagues move around the office — catch them, or click them and you'll walk over. E / click to interact."}
      </p>
    </div>
  );
}

/* ================= city map ================= */
function Tree({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx="0" cy="14" rx="11" ry="3.5" fill="rgba(40,60,40,0.18)" />
      <rect x="-1.6" y="2" width="3.2" height="11" fill="#8C6239" />
      <circle cx="-5" cy="-2" r="8" fill="#5E8C58" />
      <circle cx="5" cy="-4" r="9" fill="#6FA065" />
      <circle cx="0" cy="-10" r="8" fill="#557F4F" />
    </g>
  );
}

function CityMap({ progress, onEnter, onEnterHub, capstoneUnlocked }) {
  const taskCount = (k) => TASKS.filter((t) => t.wp === k);
  /* pannable world: 1100x700 inside an 860x560 viewport */
  const CW = 1100, CH = 700, PVW = 860, PVH = 560;
  const pan = React.useRef({ x: -120, y: -70 });
  const worldEl = React.useRef(null);
  const drag = React.useRef(null);
  const movedRef = React.useRef(false);
  const svgEl = React.useRef(null);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const applyPan = () => { if (worldEl.current) worldEl.current.setAttribute("transform", `translate(${pan.current.x},${pan.current.y})`); };
  const onDown = (e) => {
    movedRef.current = false;
    drag.current = { sx: e.clientX, sy: e.clientY, px: pan.current.x, py: pan.current.y };
    /* NB: do NOT setPointerCapture here — capturing the pointer on the <svg>
       reroutes the subsequent click to the <svg>, so the marker <g onClick>
       never fires with a mouse (touch still delivers the tap, which is why this
       only broke on desktop). Drag still works via bubbled pointermove. */
  };
  const onMove = (e) => {
    const d = drag.current; if (!d) return;
    const r = svgEl.current.getBoundingClientRect();
    const scale = PVW / r.width;
    const dx = (e.clientX - d.sx) * scale, dy = (e.clientY - d.sy) * scale;
    if (Math.abs(dx) + Math.abs(dy) > 8) movedRef.current = true;
    pan.current.x = clamp(d.px + dx, PVW - CW, 0);
    pan.current.y = clamp(d.py + dy, PVH - CH, 0);
    applyPan();
  };
  const onUp = () => { drag.current = null; };
  const enter = (k, locked) => { if (!movedRef.current && !locked) onEnter(k); };
  return (
    <div>
      <svg ref={svgEl} viewBox={`0 0 ${PVW} ${PVH}`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}
        style={{ width: "100%", display: "block", borderRadius: 16, boxShadow: "0 18px 44px rgba(20,32,51,0.22)", touchAction: "none", userSelect: "none", cursor: "grab" }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#BBD9E8" /><stop offset="0.7" stopColor="#DCEAE2" /><stop offset="1" stopColor="#E6EDE4" />
          </linearGradient>
          <linearGradient id="riv" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7FB3C2" /><stop offset="0.5" stopColor="#92C4D0" /><stop offset="1" stopColor="#7FB3C2" />
          </linearGradient>
          <linearGradient id="bface" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#E8EDF3" />
          </linearGradient>
          <radialGradient id="sun">
            <stop offset="0" stopColor="#FFF3C4" stopOpacity="0.9" /><stop offset="1" stopColor="#FFF3C4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g ref={(el) => { worldEl.current = el; if (el && !el.dataset.init) { el.setAttribute("transform", `translate(${pan.current.x},${pan.current.y})`); el.dataset.init = "1"; } }}>
        <rect width={CW} height={CH} fill="url(#sky)" />
        <circle cx="920" cy="42" r="100" fill="url(#sun)" />

        {/* clouds */}
        <g fill="#FFFFFF" opacity="0.8">
          <g>
            {!REDUCED && <animateTransform attributeName="transform" type="translate" from="-160 0" to="1150 0" dur="80s" repeatCount="indefinite" />}
            <ellipse cx="60" cy="36" rx="34" ry="11" /><ellipse cx="86" cy="30" rx="22" ry="9" />
          </g>
          <g opacity="0.65">
            {!REDUCED && <animateTransform attributeName="transform" type="translate" from="1150 0" to="-200 0" dur="105s" repeatCount="indefinite" />}
            <ellipse cx="200" cy="66" rx="28" ry="9" /><ellipse cx="222" cy="60" rx="16" ry="7" />
          </g>
        </g>

        {/* skyline silhouette */}
        <g opacity="0.45" fill="#92ABB9">
          <path d="M0 96 h60 l8-14 8 14 h30 v-22 l6-9 6 9 v22 h24 l10-16 10 16 h40 v-30 h6 v-8 l5-8 5 8 v8 h6 v30 h16 v-18 h10 v18 h36 l8-12 8 12 h60 v-26 h5 v-10 l4-7 4 7 v10 h5 v26 h30 l12-18 12 18 h52 v-20 h8 v20 h44 l8-12 8 12 h46 v-16 h10 v16 h34 l10-15 10 15 h60 l9-13 9 13 h38 v-19 h9 v19 h42 l11-16 11 16 h70 v-24 h7 v24 h58 l9-12 9 12 h88 v86 H0 Z" />
        </g>
        <text x="20" y="34" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="17" fill={C.ink} letterSpacing="1">CAMBRIDGE</text>
        <text x="20" y="52" fontFamily="'JetBrains Mono', monospace" fontSize="10.5" fill={C.mist}>drag to explore · tap a workplace to enter</text>

        <rect y="100" width={CW} height={CH - 100} fill="#E3EBE0" />

        {/* greens + trees */}
        <ellipse cx="260" cy="520" rx="140" ry="64" fill="#CBDFC3" />
        <ellipse cx="260" cy="520" rx="140" ry="64" fill="none" stroke="#B9D2B0" strokeWidth="3" strokeDasharray="2 7" />
        <text x="196" y="524" fontSize="10.5" fill="#6E8A66" fontFamily="'JetBrains Mono', monospace">Parker's Piece</text>
        <ellipse cx="620" cy="320" rx="105" ry="50" fill="#CBDFC3" />
        <text x="568" y="324" fontSize="10.5" fill="#6E8A66" fontFamily="'JetBrains Mono', monospace">Midsummer Common</text>
        <Tree x={150} y={486} /><Tree x={356} y={548} s={0.85} /><Tree x={220} y={566} s={0.7} />
        <Tree x={566} y={296} s={0.8} /><Tree x={690} y={344} s={0.9} /><Tree x={664} y={196} s={0.7} />
        <Tree x={70} y={330} s={0.8} /><Tree x={1010} y={420} s={0.85} /><Tree x={680} y={150} s={0.75} />
        <Tree x={140} y={640} s={0.9} /><Tree x={1030} y={520} s={0.8} /><Tree x={64} y={598} s={0.75} />

        {/* roads */}
        <g stroke="#F7F8F6" strokeWidth="15" strokeLinecap="round">
          <path d="M120 700 Q260 540 370 430 Q470 330 560 270 Q680 195 820 160 Q920 136 1040 110" fill="none" />
          <path d="M252 552 Q300 640 420 636 Q480 633 540 615 Q650 580 740 600 Q840 622 940 620" fill="none" />
          <path d="M560 270 Q700 290 820 280 Q940 270 1100 300" fill="none" />
        </g>
        <g stroke="#C3CCD8" strokeWidth="1.5" strokeDasharray="9 9" opacity="0.9">
          <path d="M120 700 Q260 540 370 430 Q470 330 560 270 Q680 195 820 160 Q920 136 1040 110" fill="none" />
          <path d="M252 552 Q300 640 420 636 Q480 633 540 615 Q650 580 740 600 Q840 622 940 620" fill="none" />
          <path d="M560 270 Q700 290 820 280 Q940 270 1100 300" fill="none" />
        </g>

        {/* the Backs: college silhouette along the river (scenery only) */}
        <g fill="#B9C9C0" opacity="0.9">
          <path d="M400 116 v18 h54 v-18 l-6 0 v-8 l-4 -6 -4 6 v8 h-8 v-12 l-5 -7 -5 7 v12 h-8 v-8 l-4 -6 -4 6 v8 Z" />
          <rect x="340" y="124" width="44" height="12" rx="1" />
          <path d="M340 124 l8 -7 8 7 M356 124 l8 -7 8 7" stroke="#A3B5AB" strokeWidth="1.4" fill="none" />
        </g>
        <text x="372" y="152" fontSize="9" fill="#7E948A" fontFamily="'JetBrains Mono', monospace">the Backs</text>

        {/* River Cam */}
        <path d="M0 330 Q150 296 270 252 Q380 212 440 168 Q500 122 610 104 Q760 82 1100 76"
          fill="none" stroke="url(#riv)" strokeWidth="26" strokeLinecap="round" />
        <path d="M0 330 Q150 296 270 252 Q380 212 440 168 Q500 122 610 104 Q760 82 1100 76"
          fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 14" opacity="0.85">
          {!REDUCED && <animate attributeName="stroke-dashoffset" from="0" to="-68" dur="6s" repeatCount="indefinite" />}
        </path>
        <text x="26" y="316" fontSize="11" fill="#3F6E7C" fontFamily="'JetBrains Mono', monospace">River Cam</text>
        <g transform="translate(290,232) rotate(-18)">
          <path d="M0 0 q16 -7 32 0 l-5 6 q-11 -4 -22 0 Z" fill="#B98A4A" stroke="#8F6730" strokeWidth="1" />
          <line x1="26" y1="-2" x2="31" y2="-19" stroke="#7A5A2E" strokeWidth="2" />
          <circle cx="16" cy="-1" r="2.6" fill="#3D7A8C" />
        </g>
        <path d="M430 162 q17 -17 36 0" fill="none" stroke="#A6906F" strokeWidth="6" />
        <path d="M430 162 q17 -17 36 0" fill="none" stroke="#C4B292" strokeWidth="2" />

        {/* district tags */}
        <text x="870" y="58" fontSize="9.5" letterSpacing="2" fill="#7E948A" fontFamily="'Sora', sans-serif" fontWeight="700" opacity="0.8">SCIENCE PARK ↗</text>
        <text x="800" y="688" fontSize="9.5" letterSpacing="2" fill="#7E948A" fontFamily="'Sora', sans-serif" fontWeight="700" opacity="0.8">BIOMEDICAL CAMPUS</text>

        {/* workplaces — pseudo-3D buildings */}
        {Object.entries(WORKPLACES).map(([k, wp]) => {
          if (wp.hidden) return null;
          const ts = taskCount(k);
          const done = ts.filter((t) => progress.completed.includes(t.id)).length;
          const locked = wp.locked && !capstoneUnlocked;
          const allDone = ts.length > 0 && done === ts.length;
          const edge = allDone ? C.ok : locked ? "#AEB9C8" : "#5E7C92";
          return (
            <g key={k} transform={`translate(${wp.mx},${wp.my})`} onClick={() => enter(k, locked)}
              style={{ cursor: locked ? "not-allowed" : "pointer" }} opacity={locked ? 0.6 : 1}>
              {!locked && !allDone && (
                <circle r="26" fill="none" stroke={C.amber} strokeWidth="2">
                  {!REDUCED && <>
                    <animate attributeName="r" values="22;33;22" dur="2.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.85;0;0.85" dur="2.6s" repeatCount="indefinite" />
                  </>}
                </circle>
              )}
              {wp.icon === "park" ? (
                <g transform="translate(0,-8)">
                  <ellipse cx="2" cy="24" rx="30" ry="7" fill="rgba(20,32,51,0.15)" />
                  <rect x="-3" y="2" width="6" height="20" rx="2" fill="#7A5230" />
                  <circle cx="-10" cy="-5" r="12" fill="#4C8A4F" />
                  <circle cx="9" cy="-8" r="13" fill="#5C9C5C" />
                  <circle cx="0" cy="-17" r="10" fill="#3F7A45" />
                  <rect x="16" y="14" width="22" height="5" rx="2" fill="#A9844F" stroke="#7A5E33" strokeWidth="0.8" />
                  <rect x="18" y="19" width="3" height="5" fill="#6B5538" /><rect x="33" y="19" width="3" height="5" fill="#6B5538" />
                </g>
              ) : wp.icon === "punt" ? (
                <g transform="translate(0,-20)">
                  <ellipse cx="0" cy="16" rx="36" ry="6" fill="rgba(20,60,80,0.25)" />
                  <path d="M-30 2 L-22 -6 H22 L30 2 L24 10 H-24 Z" fill="#A9844F" stroke="#6E512F" strokeWidth="1.6" />
                  <rect x="-18" y="-2" width="36" height="8" rx="2" fill="#C9B286" />
                  <rect x="-13" y="-1" width="9" height="6" rx="1.5" fill="#B65C45" />
                  <rect x="2" y="-1" width="9" height="6" rx="1.5" fill="#3D7A8C" />
                  <circle cx="24" cy="-13" r="4.5" fill="#E0B188" stroke="rgba(20,30,50,0.4)" strokeWidth="1.2" />
                  <path d="M24 -8 L24 2" stroke="#27364F" strokeWidth="5" strokeLinecap="round" />
                  <line x1="31" y1="-24" x2="21" y2="9" stroke="#6E512F" strokeWidth="2" />
                  <path d="M-46 18 q6 -4 12 0 M34 20 q6 -4 12 0" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" fill="none" />
                </g>
              ) : wp.icon === "bike" ? (
                <g transform="translate(0,-16)">
                  <ellipse cx="2" cy="19" rx="38" ry="6" fill="rgba(20,32,51,0.2)" />
                  {/* queued bike behind — it is a jam, after all */}
                  <g opacity="0.45" transform="translate(26,5) scale(0.78)">
                    <circle cx="-13" cy="6" r="9" fill="none" stroke="#2A2F38" strokeWidth="2.6" />
                    <circle cx="13" cy="6" r="9" fill="none" stroke="#2A2F38" strokeWidth="2.6" />
                    <path d="M-13 6 L-5 -5 L7 -5 L13 6 M-5 -5 L-1 6 L-13 6 M-1 6 L7 -5" stroke="#5B6B3A" strokeWidth="2.6" fill="none" strokeLinejoin="round" />
                  </g>
                  {/* front bike */}
                  <circle cx="-14" cy="7" r="10" fill="none" stroke="#2A2F38" strokeWidth="2.8" />
                  <circle cx="14" cy="7" r="10" fill="none" stroke="#2A2F38" strokeWidth="2.8" />
                  <circle cx="-14" cy="7" r="1.8" fill="#2A2F38" />
                  <circle cx="14" cy="7" r="1.8" fill="#2A2F38" />
                  <path d="M-14 7 L-5 -6 L8 -6 L14 7 M-5 -6 L-1 7 L-14 7 M-1 7 L8 -6" stroke="#C2703D" strokeWidth="2.8" fill="none" strokeLinejoin="round" />
                  <path d="M8 -6 L7 -10 M3.5 -10 h7 M-5 -6 L-6.5 -9.5" stroke="#2A2F38" strokeWidth="2.2" strokeLinecap="round" />
                  <rect x="-10.5" y="-11.5" width="8" height="3" rx="1.5" fill="#2A2F38" />
                  {/* a hopeful bell */}
                  <path d="M24 -13 q3 -2 5 0 M26 -17 q3 -2 5 0" stroke="#E9A13B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                </g>
              ) : wp.icon === "pub" ? (
                <g transform="translate(-24,-36)">
                  <ellipse cx="26" cy="48" rx="30" ry="7" fill="rgba(20,32,51,0.18)" />
                  <rect x="2" y="14" width="48" height="32" rx="2" fill="#EFE3CF" stroke="#8C6A4A" strokeWidth="1.6" />
                  <polygon points="-2,16 26,-2 54,16" fill="#7E4A30" stroke="#5E3620" strokeWidth="1.4" />
                  <rect x="38" y="-4" width="6" height="12" fill="#9A8576" />
                  <rect x="9" y="22" width="10" height="10" rx="1.5" fill="#F5C66B" stroke="#B98A2C" />
                  <rect x="33" y="22" width="10" height="10" rx="1.5" fill="#F5C66B" stroke="#B98A2C" />
                  <rect x="21" y="30" width="10" height="16" rx="1.5" fill="#5E3620" />
                  <path d="M52 18 h8" stroke="#5E3620" strokeWidth="2" />
                  <rect x="56" y="18" width="12" height="14" rx="2" fill={wp.accent} stroke="#5E3620" strokeWidth="1.2" />
                  <circle cx="62" cy="25" r="3.5" fill="#F5C66B" />
                </g>
              ) : (
                <g transform="translate(-28,-34)">
                  <ellipse cx="30" cy="48" rx="34" ry="8" fill="rgba(20,32,51,0.18)" />
                  <polygon points="50,4 62,12 62,46 50,44" fill="#C6D0DC" stroke={edge} strokeWidth="1.4" />
                  <rect x="2" y="4" width="48" height="40" rx="2.5" fill="url(#bface)" stroke={edge} strokeWidth="1.8" />
                  <polygon points="2,4 14,-4 62,4 50,12" fill={locked ? "#B9C2CE" : wp.accent} opacity="0.9" stroke={edge} strokeWidth="1.2" />
                  {[9, 22, 35].map((wx) => <rect key={wx} x={wx} y="12" width="8.5" height="8.5" rx="1.4" fill="#9FB9CC" />)}
                  {[9, 22, 35].map((wx) => <rect key={"b" + wx} x={wx} y="25" width="8.5" height="8.5" rx="1.4" fill="#BFD8E8" />)}
                  <rect x="21" y="30" width="11" height="14" rx="1.5" fill={locked ? "#8C97A8" : C.amber} />
                  <rect x="-7" y="-12" width="20" height="20" rx="5" fill={locked ? "#8C97A8" : wp.accent} stroke="#FFFFFF" strokeWidth="2" />
                  <text x="3" y="2" textAnchor="middle" fontSize="10" fontWeight="800" fill="#FFFFFF" fontFamily="'Sora', sans-serif">{wp.name[0]}</text>
                </g>
              )}
              <g transform="translate(0,32)">
                <rect x="-74" y="0" width="148" height="35" rx="9" fill="#FFFFFF" stroke={C.line} />
                <rect x="-74" y="0" width="4" height="35" rx="2" fill={locked ? "#AEB9C8" : wp.accent} />
                <text textAnchor="middle" y="14" fontSize="11.5" fontWeight="700" fill={C.ink} fontFamily="'Sora', sans-serif">{wp.name}</text>
                <text textAnchor="middle" y="27" fontSize="9" fill={C.mist} fontFamily="'JetBrains Mono', monospace">
                  {locked ? "🔒 finish placements" : `${wp.mp || wp.place} · ${done}/${ts.length}${allDone ? " ✓" : ""}`}
                </text>
              </g>
            </g>
          );
        })}

        {/* incubator hub */}
        {Object.entries(HUBS).map(([k, h]) => {
          const ts = TASKS.filter((t) => h.units.includes(t.wp));
          const done = ts.filter((t) => progress.completed.includes(t.id)).length;
          const allDone = ts.length > 0 && done === ts.length;
          return (
            <g key={k} transform={`translate(${h.mx},${h.my})`} onClick={() => { if (!movedRef.current) onEnterHub(k); }} style={{ cursor: "pointer" }}>
              {!allDone && (
                <circle r="26" fill="none" stroke={C.amber} strokeWidth="2">
                  {!REDUCED && <>
                    <animate attributeName="r" values="22;33;22" dur="2.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.85;0;0.85" dur="2.6s" repeatCount="indefinite" />
                  </>}
                </circle>
              )}
              <g transform="translate(-30,-36)">
                <ellipse cx="32" cy="50" rx="36" ry="8" fill="rgba(20,32,51,0.18)" />
                <rect x="22" y="0" width="40" height="46" rx="2.5" fill="#DCE4ED" stroke="#5E7C92" strokeWidth="1.6" />
                {[28, 40, 52].map((wx) => <rect key={wx} x={wx} y="6" width="7" height="7" rx="1.2" fill="#9FB9CC" />)}
                {[28, 40, 52].map((wx) => <rect key={"b" + wx} x={wx} y="17" width="7" height="7" rx="1.2" fill="#BFD8E8" />)}
                <rect x="0" y="12" width="36" height="34" rx="2.5" fill="url(#bface)" stroke="#5E7C92" strokeWidth="1.8" />
                <rect x="0" y="12" width="36" height="6" fill="#D9742B" opacity="0.9" />
                {[5, 16, 27].map((wx) => <rect key={wx} x={wx} y="22" width="6.5" height="6.5" rx="1.2" fill="#9FB9CC" />)}
                <rect x="13" y="33" width="10" height="13" rx="1.5" fill={C.amber} />
                <rect x="-8" y="-10" width="22" height="22" rx="6" fill="#1F8A70" stroke="#FFFFFF" strokeWidth="2" />
                <text x="3" y="6" textAnchor="middle" fontSize="12">🚀</text>
              </g>
              <g transform="translate(0,32)">
                <rect x="-74" y="0" width="148" height="35" rx="9" fill="#FFFFFF" stroke={C.line} />
                <rect x="-74" y="0" width="4" height="35" rx="2" fill="#D9742B" />
                <text textAnchor="middle" y="14" fontSize="11.5" fontWeight="700" fill={C.ink} fontFamily="'Sora', sans-serif">{h.name}</text>
                <text textAnchor="middle" y="27" fontSize="9" fill={C.mist} fontFamily="'JetBrains Mono', monospace">
                  {h.units.length} startups · {done}/{ts.length}{allDone ? " ✓" : ""}
                </text>
              </g>
            </g>
          );
        })}
        </g>
      </svg>
    </div>
  );
}

/* ================= shared buttons ================= */
const btnPrimary = {
  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13.5, cursor: "pointer",
  background: C.teal, color: "#FFFFFF", border: `1.5px solid ${C.teal}`, padding: "10px 18px", borderRadius: 9,
};
const btnGhost = {
  fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
  background: "#FFFFFF", color: C.ink, border: `1.5px solid ${C.line}`, padding: "10px 18px", borderRadius: 9,
};

function XPBar({ xp }) {
  const lvl = levelOf(xp);
  const into = xp - (lvl - 1) * 220;
  const pct = lvl >= 6 ? 100 : Math.min(100, (into / 220) * 100);
  return (
    <div style={{ minWidth: 170 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.mist, fontFamily: "'JetBrains Mono', monospace" }}>
        <span>L{lvl} · {rankOf(xp)}</span><span>{xp} XP</span>
      </div>
      <div style={{ height: 8, background: "#E3E9F1", borderRadius: 5, marginTop: 3 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${C.teal}, ${C.tealBright})`, borderRadius: 5, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

/* ================= challenges ================= */
function MCQ({ ch, onComplete }) {
  const [pick, setPick] = useState(null);
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 12, color: C.ink }}>{ch.q}</div>
      {ch.options.map((o, i) => {
        const chosen = pick === i;
        let border = C.line;
        if (result && chosen) border = result === "right" ? C.ok : C.bad;
        else if (chosen) border = C.teal;
        return (
          <button key={i} onClick={() => { if (result !== "right") { setPick(i); setResult(null); } }}
            style={{ display: "block", width: "100%", textAlign: "left", margin: "7px 0", padding: "11px 14px",
              borderRadius: 10, cursor: "pointer", fontSize: 14, lineHeight: 1.55,
              background: chosen ? "rgba(47,111,94,0.06)" : "#FFFFFF", border: `2px solid ${border}`, color: C.inkSoft }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", marginRight: 8, color: C.teal, fontWeight: 700 }}>{String.fromCharCode(65 + i)}</span>{o}
          </button>
        );
      })}
      {result === "wrong" && <div style={{ color: C.bad, fontSize: 13, marginTop: 8 }}>Not quite — think it through and try again.</div>}
      {result === "right" && (
        <div style={{ background: "rgba(62,142,90,0.09)", border: `1.5px solid ${C.ok}`, borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: 13.5, lineHeight: 1.6, color: C.inkSoft }}>
          <strong>Why this matters:</strong> {ch.explain}
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        {result !== "right" ? (
          <button style={btnPrimary} disabled={pick === null}
            onClick={() => { const right = pick === ch.answer; setAttempts(attempts + 1); setResult(right ? "right" : "wrong"); }}>
            Submit answer
          </button>
        ) : (
          <button style={btnPrimary} onClick={() => onComplete(attempts === 1)}>Log the work →</button>
        )}
      </div>
    </div>
  );
}

function Ordering({ ch, onComplete }) {
  const shuffled = useMemo(() => {
    const arr = ch.items.map((t, i) => ({ t, i }));
    for (let k = arr.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [arr[k], arr[j]] = [arr[j], arr[k]]; }
    return arr;
  }, [ch]);
  const [seq, setSeq] = useState([]);
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const remaining = shuffled.filter((x) => !seq.includes(x.i));
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 8, color: C.ink }}>{ch.q}</div>
      <div style={{ fontSize: 12, color: C.mist, marginBottom: 8 }}>Tap steps in order. Tap a chosen step to remove it.</div>
      <div style={{ minHeight: 46, border: `2px dashed ${C.line}`, borderRadius: 10, padding: 8, marginBottom: 12, background: "#FAFBFD" }}>
        {seq.length === 0 && <span style={{ color: C.mist, fontSize: 13 }}>Your sequence appears here…</span>}
        {seq.map((idx, p) => (
          <button key={idx} onClick={() => { setSeq(seq.filter((s) => s !== idx)); setResult(null); }}
            style={{ display: "block", width: "100%", textAlign: "left", margin: "4px 0", padding: "9px 12px", borderRadius: 8,
              background: "rgba(47,111,94,0.07)", border: `1.5px solid ${C.camBlue}`, cursor: "pointer", fontSize: 13.5, color: C.inkSoft }}>
            <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: C.teal }}>{p + 1}.</strong> {ch.items[idx]}
          </button>
        ))}
      </div>
      {remaining.map(({ t, i }) => (
        <button key={i} onClick={() => { setSeq([...seq, i]); setResult(null); }}
          style={{ display: "block", width: "100%", textAlign: "left", margin: "5px 0", padding: "10px 12px", borderRadius: 8,
            background: "#FFFFFF", border: `1.5px solid ${C.line}`, cursor: "pointer", fontSize: 13.5, color: C.inkSoft }}>
          {t}
        </button>
      ))}
      {result === "wrong" && <div style={{ color: C.bad, fontSize: 13, marginTop: 8 }}>That order would break in production. Rearrange and resubmit.</div>}
      {result === "right" && (
        <div style={{ background: "rgba(62,142,90,0.09)", border: `1.5px solid ${C.ok}`, borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: 13.5, lineHeight: 1.6, color: C.inkSoft }}>
          <strong>Why this matters:</strong> {ch.explain}
        </div>
      )}
      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        {result !== "right" ? (
          <>
            <button style={btnPrimary} disabled={seq.length !== ch.items.length}
              onClick={() => { const right = seq.every((v, i) => v === i); setAttempts(attempts + 1); setResult(right ? "right" : "wrong"); }}>
              Submit order
            </button>
            <button style={btnGhost} onClick={() => { setSeq([]); setResult(null); }}>Reset</button>
          </>
        ) : (
          <button style={btnPrimary} onClick={() => onComplete(attempts === 1)}>Log the work →</button>
        )}
      </div>
    </div>
  );
}

function SqlConsole({ ch, onComplete }) {
  const [text, setText] = useState("");
  const [output, setOutput] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  const run = () => {
    setAttempts(attempts + 1);
    for (const c of ch.checks) {
      if (!c.re.test(text)) { setOutput({ type: "err", msg: c.msg }); return; }
    }
    setOutput({ type: "ok" });
  };
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 8, color: C.ink }}>{ch.q}</div>
      <div style={{ background: "#0F1726", borderRadius: 12, padding: "14px 16px", ...mono }}>
        <div style={{ color: "#5E7290", fontSize: 11, marginBottom: 6 }}>— schema —</div>
        {ch.schema.map((l, i) => (
          <div key={i} style={{ color: i === 0 ? "#7FD1A8" : "#9FB4D6", fontSize: 12.5, whiteSpace: "pre" }}>{l}</div>
        ))}
        <div style={{ color: "#5E7290", fontSize: 11, margin: "10px 0 6px" }}>— query —</div>
        <textarea value={text} onChange={(e) => { setText(e.target.value); if (output) setOutput(null); }}
          placeholder={ch.placeholder} rows={4} spellCheck={false}
          style={{ width: "100%", boxSizing: "border-box", background: "#0A101C", color: "#D7E3F4", border: "1.5px solid #24314A",
            borderRadius: 8, padding: "10px 12px", fontSize: 13.5, resize: "vertical", outline: "none", ...mono }} />
        {output?.type === "err" && (
          <div style={{ color: "#F08A7E", fontSize: 12.5, marginTop: 8 }}>ERROR: {output.msg}</div>
        )}
        {output?.type === "ok" && (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: "#7FD1A8", fontSize: 12.5, marginBottom: 6 }}>✓ query OK — {ch.result.rows.length} rows returned</div>
            <table style={{ borderCollapse: "collapse", fontSize: 12.5, color: "#D7E3F4", width: "100%" }}>
              <thead>
                <tr>{ch.result.cols.map((c) => <th key={c} style={{ textAlign: "left", padding: "5px 10px", borderBottom: "1px solid #2C3B58", color: "#9FB4D6" }}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {ch.result.rows.map((r, i) => (
                  <tr key={i}>{r.map((v, j) => <td key={j} style={{ padding: "5px 10px", borderBottom: "1px solid #1B2740" }}>{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {output?.type === "ok" && (
        <div style={{ background: "rgba(62,142,90,0.09)", border: `1.5px solid ${C.ok}`, borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: 13.5, lineHeight: 1.6, color: C.inkSoft }}>
          <strong>Why this matters:</strong> {ch.explain}
          <div style={{ marginTop: 8, fontSize: 12, color: C.mist }}>Model answer:</div>
          <pre style={{ ...mono, fontSize: 12, background: "#F2F4F7", borderRadius: 8, padding: "8px 10px", margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{ch.model}</pre>
        </div>
      )}
      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        {output?.type !== "ok" ? (
          <button style={btnPrimary} disabled={!text.trim()} onClick={run}>Run query ▸</button>
        ) : (
          <button style={btnPrimary} onClick={() => onComplete(attempts === 1)}>Log the work →</button>
        )}
      </div>
    </div>
  );
}

function hashVals(name, n = 12) {
  const out = [];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  for (let i = 0; i < n; i++) { h = (h * 73 + 19) % 211; out.push(20 + (h % 60)); }
  return out;
}

function ChartPreview({ ch, chart, xf, yf }) {
  const W = 340, H = 170, padL = 34, padB = 26, padT = 12, padR = 10;
  const xs = ch.data[xf] || hashVals(xf || "x");
  const ys = ch.data[yf] || hashVals(yf || "y");
  const n = Math.min(xs.length, ys.length);
  const yMaxR = Math.max(...ys.slice(0, n)), yMinR = Math.min(...ys.slice(0, n), 0);
  const span = (yMaxR - yMinR) || 1;
  const yTop = yMaxR + span * 0.12, yBot = yMinR < 0 ? yMinR - span * 0.12 : 0;
  const xMin = Math.min(...xs.slice(0, n)), xMax = Math.max(...xs.slice(0, n));
  const px = (v) => padL + ((v - xMin) / (xMax - xMin || 1)) * (W - padL - padR);
  const pi = (i) => padL + (i / (n - 1)) * (W - padL - padR);
  const py = (v) => H - padB - ((v - yBot) / (yTop - yBot || 1)) * (H - padB - padT);
  const axis = (
    <g stroke="#C9D2DE" strokeWidth="1">
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} />
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} />
    </g>
  );
  let body = null;
  if (!chart || !xf || !yf) {
    body = <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="12" fill={C.mist}>pick a chart type and both axes…</text>;
  } else if (chart === "line") {
    const d = ys.slice(0, n).map((v, i) => `${i === 0 ? "M" : "L"}${pi(i)},${py(v)}`).join(" ");
    body = <>{axis}<path d={d} fill="none" stroke={C.teal} strokeWidth="2.5" />{ys.slice(0, n).map((v, i) => <circle key={i} cx={pi(i)} cy={py(v)} r="2.6" fill={C.teal} />)}</>;
  } else if (chart === "bar") {
    const bw = (W - padL - padR) / n - 5;
    const y0 = py(0);
    body = <>{axis}
      {yMinR < 0 && <line x1={padL} y1={y0} x2={W - padR} y2={y0} stroke="#9AA7B8" strokeWidth="1" strokeDasharray="3 3" />}
      {ys.slice(0, n).map((v, i) => (
        <rect key={i} x={padL + 3 + i * (bw + 5)} y={Math.min(py(v), y0)} width={bw}
          height={Math.max(2, Math.abs(py(v) - y0))} rx="2" fill={v < 0 ? "#A6485B" : C.teal} opacity="0.85" />
      ))}</>;
  } else if (chart === "scatter") {
    body = <>{axis}{xs.slice(0, n).map((xv, i) => <circle key={i} cx={px(xv)} cy={py(ys[i])} r="4" fill={C.teal} opacity="0.8" />)}</>;
  } else if (chart === "pie") {
    const vals = ys.slice(0, 6).map((v) => Math.abs(v));
    const total = vals.reduce((a, b) => a + b, 0) || 1;
    let ang = -Math.PI / 2;
    const cx = W / 2, cy = H / 2, r = 58;
    const cols = ["#2F6F5E", "#C2703D", "#5B5EA6", "#A6485B", "#3D7A8C", "#E9A13B"];
    body = vals.map((v, i) => {
      const a2 = ang + (v / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(ang), y1 = cy + r * Math.sin(ang);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const large = a2 - ang > Math.PI ? 1 : 0;
      const path = <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`} fill={cols[i % 6]} stroke="#FFF" />;
      ang = a2; return path;
    });
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", background: "#FAFBFD", border: `1.5px solid ${C.line}`, borderRadius: 10 }}>
      {body}
      {xf && chart !== "pie" && <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="10" fill={C.mist} fontFamily="'JetBrains Mono', monospace">{xf}</text>}
      {yf && chart !== "pie" && <text x={10} y={H / 2} textAnchor="middle" fontSize="10" fill={C.mist} fontFamily="'JetBrains Mono', monospace" transform={`rotate(-90 10 ${H / 2})`}>{yf}</text>}
    </svg>
  );
}

function ChartBuilder({ ch, onComplete }) {
  const [chart, setChart] = useState(null);
  const [xf, setXf] = useState(null);
  const [yf, setYf] = useState(null);
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const chip = (label, active, onClick, key) => (
    <button key={key} onClick={() => { onClick(); setResult(null); }}
      style={{ padding: "6px 13px", borderRadius: 16, cursor: "pointer", fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace",
        background: active ? C.teal : "#FFFFFF", color: active ? "#FFF" : C.inkSoft,
        border: `1.5px solid ${active ? C.teal : C.line}`, fontWeight: active ? 700 : 400 }}>
      {label}
    </button>
  );
  const lab = { fontFamily: "'Sora', sans-serif", fontWeight: 700, color: C.ink, fontSize: 11.5, letterSpacing: "0.08em", margin: "12px 0 6px" };
  const row = { display: "flex", gap: 7, flexWrap: "wrap" };
  const submit = () => {
    setAttempts(attempts + 1);
    const c = ch.correct;
    if (chart !== c.chart) { setResult({ ok: false, msg: ch.hint }); return; }
    if (xf !== c.x || yf !== c.y) {
      setResult({ ok: false, msg: "Right chart — but check your axes. Which field belongs on x, and which fields are real measures rather than identifiers?" });
      return;
    }
    setResult({ ok: true });
  };
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 4, color: C.ink }}>Goal: {ch.goal}</div>
      <div style={lab}>CHART TYPE</div>
      <div style={row}>{["line", "bar", "scatter", "pie"].map((t) => chip(t, chart === t, () => setChart(t), t))}</div>
      <div style={lab}>X AXIS</div>
      <div style={row}>{ch.fields.map((f) => chip(f, xf === f, () => setXf(f), "x" + f))}</div>
      <div style={lab}>Y AXIS</div>
      <div style={row}>{ch.fields.map((f) => chip(f, yf === f, () => setYf(f), "y" + f))}</div>
      <div style={{ marginTop: 14 }}>
        <ChartPreview ch={ch} chart={chart} xf={xf} yf={yf} />
      </div>
      {result && !result.ok && <div style={{ color: C.bad, fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>{result.msg}</div>}
      {result?.ok && (
        <div style={{ background: "rgba(62,142,90,0.09)", border: `1.5px solid ${C.ok}`, borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: 13.5, lineHeight: 1.6, color: C.inkSoft }}>
          <strong>Why this matters:</strong> {ch.explain}
        </div>
      )}
      <div style={{ marginTop: 14 }}>
        {!result?.ok ? (
          <button style={btnPrimary} disabled={!chart || !xf || !yf} onClick={submit}>Add to dashboard ▸</button>
        ) : (
          <button style={btnPrimary} onClick={() => onComplete(attempts === 1)}>Log the work →</button>
        )}
      </div>
    </div>
  );
}

/* ================= task modal ================= */
function TaskModal({ task, boostSpec, onClose, onComplete }) {
  const [stage, setStage] = useState("brief");
  const boosted = STRAND_TO_SPEC[task.strand] === boostSpec;
  const reward = Math.round(task.xp * (boosted ? 1.2 : 1));
  const wp = WORKPLACES[task.wp];
  const done = (ft) => { onComplete(task, reward + (ft ? 20 : 0), ft); setStage("done"); };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(16,26,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: C.card, maxWidth: 640, width: "100%", maxHeight: "88vh", overflowY: "auto", borderRadius: 16,
          borderTop: `5px solid ${wp.accent}`, boxShadow: "0 24px 70px rgba(10,18,32,0.45)", padding: "24px 26px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.teal, letterSpacing: "0.12em" }}>
              {STRANDS[task.strand].toUpperCase()}{task.tier ? ` · TIER ${task.tier}` : ""} · {reward} XP{boosted ? " (SPECIALISM BONUS)" : ""}
            </div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", margin: "6px 0 2px", fontSize: 21, color: C.ink }}>{task.title}</h2>
            <div style={{ fontSize: 12.5, color: C.mist }}>{wp.name} · {wp.place}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.mist }} aria-label="Close task">✕</button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0 14px" }}>
          {task.ksb.map((k) => (
            <span key={k} title={KSB[k] ? `${KSB[k].kind}: ${KSB[k].d}` : k}
              style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", background: "#EEF2F7", color: C.inkSoft, padding: "3px 9px", borderRadius: 10, border: `1px solid ${C.line}` }}>
              <strong style={{ color: C.teal }}>{k}</strong>{KSB[k] ? ` · ${KSB[k].s}` : ""}
            </span>
          ))}
        </div>
        {stage === "brief" && (
          <>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
              {taskGiver(task) && (
                <div style={{ flex: "0 0 84px", width: 84, borderRadius: 12, overflow: "hidden",
                  background: `linear-gradient(180deg, ${wp.accent}26, ${wp.accent}0D)`, border: `1.5px solid ${C.line}`, paddingTop: 6 }}>
                  <Bust skin={SKINS[taskGiver(task).skin]} shirt={taskGiver(task).shirt} {...npcLook(taskGiver(task).id)} />
                  <div style={{ textAlign: "center", fontSize: 10, fontFamily: "'Sora', sans-serif", fontWeight: 700, color: C.inkSoft,
                    background: "rgba(255,255,255,0.75)", padding: "3px 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {taskGiver(task).name}
                  </div>
                </div>
              )}
              <p style={{ lineHeight: 1.7, fontSize: 14.5, color: C.inkSoft, background: "#F7F9FB", border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", margin: 0, flex: 1 }}>{task.brief}</p>
            </div>
            <button style={btnPrimary} onClick={() => setStage("challenge")}>Take the task</button>
          </>
        )}
        {stage === "challenge" && (
          <div style={{ marginTop: 6 }}>
            {task.challenge.type === "mcq" && <MCQ ch={task.challenge} onComplete={done} />}
            {task.challenge.type === "order" && <Ordering ch={task.challenge} onComplete={done} />}
            {task.challenge.type === "sql" && <SqlConsole ch={task.challenge} onComplete={done} />}
            {task.challenge.type === "chart" && <ChartBuilder ch={task.challenge} onComplete={done} />}
          </div>
        )}
        {stage === "done" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 36 }}>✅</div>
            <h3 style={{ fontFamily: "'Sora', sans-serif", margin: "8px 0 4px", color: C.ink }}>Task signed off</h3>
            <p style={{ fontSize: 14, color: C.mist }}>"{task.title}" is logged in your apprenticeship record under <strong>{STRANDS[task.strand]}</strong>.</p>
            <button style={btnPrimary} onClick={onClose}>Back to the office</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= profile / leaderboard ================= */
/* ================= hatchery lobby ================= */
function Lobby({ hubKey, progress, onEnterUnit, onBack }) {
  const h = HUBS[hubKey];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, color: C.ink }}>{h.name}</div>
          <div style={{ fontSize: 12.5, color: C.mist }}>{h.place}</div>
        </div>
        <button onClick={onBack} style={btnGhost}>← Back to city map</button>
      </div>
      <div style={{ background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 16, padding: "18px 20px", boxShadow: "0 14px 38px rgba(20,32,51,0.12)" }}>
        <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 14 }}>{h.blurb}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.15em", color: C.mist, marginBottom: 10 }}>BUILDING DIRECTORY</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {h.units.map((u, i) => {
            const wp = WORKPLACES[u];
            const ts = TASKS.filter((t) => t.wp === u);
            const done = ts.filter((t) => progress.completed.includes(t.id)).length;
            return (
              <button key={u} onClick={() => onEnterUnit(u)}
                style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer", padding: "14px 16px",
                  background: "#FAFBFD", border: `1.5px solid ${C.line}`, borderLeft: `5px solid ${wp.accent}`, borderRadius: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.mist, minWidth: 56 }}>UNIT {i + 1}.0{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, color: C.ink, fontSize: 15 }}>{wp.name}</div>
                  <div style={{ fontSize: 12.5, color: C.mist }}>{wp.blurb}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: done === ts.length && ts.length ? C.ok : C.teal, fontWeight: 700 }}>{done}/{ts.length}{done === ts.length && ts.length ? " ✓" : ""}</div>
                  <div style={{ fontSize: 11.5, color: C.teal, fontWeight: 700 }}>Enter →</div>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 11.5, color: C.mist, marginTop: 14 }}>Hot-desking floor · meeting pods bookable at reception · please do not feed the founders after 6pm.</div>
      </div>
    </div>
  );
}

/* ================= quests tab ================= */
function QuestsTab({ progress }) {
  const locName = (wpKey) => {
    const wp = WORKPLACES[wpKey];
    return wp.hub ? `${HUBS[wp.hub].name} · ${wp.name}` : wp.name;
  };
  return (
    <div style={{ paddingTop: 8 }}>
      <h3 style={{ fontFamily: "'Sora', sans-serif", color: C.ink, marginTop: 0 }}>Quests</h3>
      <p style={{ color: C.mist, fontSize: 12.5, marginTop: -6 }}>Longer assignments that take you across the city. Steps unlock in order — finish all three for a bonus.</p>
      {QUESTS.map((q) => {
        const doneN = q.steps.filter((s) => progress.completed.includes(s)).length;
        const complete = doneN === q.steps.length;
        const nextIdx = q.steps.findIndex((s) => !progress.completed.includes(s));
        return (
          <div key={q.id} style={{ background: "#FFFFFF", border: `1.5px solid ${complete ? C.ok : C.line}`, borderLeft: `5px solid ${q.color}`,
            borderRadius: 14, padding: "16px 18px", marginBottom: 14, boxShadow: "0 8px 24px rgba(20,32,51,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: C.ink }}>{q.title}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: complete ? C.ok : C.mist, fontWeight: 700 }}>
                {complete ? `✓ COMPLETE · +${q.bonus} XP banked` : `${doneN}/${q.steps.length} steps · +${q.bonus} XP on completion`}
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, margin: "6px 0 10px" }}>{q.blurb}</p>
            {q.steps.map((sid, i) => {
              const t = TASKS.find((x) => x.id === sid);
              const sDone = progress.completed.includes(sid);
              const isNext = i === nextIdx;
              return (
                <div key={sid} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "6px 0",
                  borderTop: i > 0 ? `1px dashed ${C.line}` : "none", opacity: sDone || isNext ? 1 : 0.55 }}>
                  <span style={{ fontSize: 13 }}>{sDone ? "✅" : isNext ? "➜" : "🔒"}</span>
                  <span style={{ fontSize: 13.5, color: C.ink, fontWeight: isNext ? 700 : 400, flex: 1 }}>{t.title}</span>
                  <span style={{ fontSize: 11.5, color: isNext ? q.color : C.mist, fontFamily: "'JetBrains Mono', monospace", fontWeight: isNext ? 700 : 400 }}>{locName(t.wp)}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ================= placement record export ================= */
const ACTIVITY_DESC = {
  mcq: "Scenario judgement exercise set in a workplace brief; selected and justified the sound professional approach.",
  order: "Process-sequencing exercise; arranged a real workflow into the correct working order.",
  sql: "Wrote and ran a SQL query against a mock warehouse console, iterating on database-style error feedback until correct.",
  chart: "Built a data visualisation against a stated goal by selecting the chart type and axis mappings, with live preview.",
};

function buildReport(cfg, progress) {
  const today = new Date().toISOString().slice(0, 10);
  const doneTasks = TASKS.filter((t) => progress.completed.includes(t.id))
    .sort((a, b) => (progress.log?.[a.id] || "").localeCompare(progress.log?.[b.id] || ""));
  const L = [];
  L.push("# Placement record — Datascape: Cambridge");
  L.push("");
  L.push(`**Apprentice:** ${cfg.name}  `);
  L.push(`**Specialism:** ${SPECIALISMS[cfg.spec].name}  `);
  L.push(`**Progress:** Level ${levelOf(progress.xp)} (${rankOf(progress.xp)}), ${progress.xp} XP — ${doneTasks.length}/${TASKS.length} activities complete  `);
  L.push(`**Generated:** ${today}  `);
  L.push(`**Mapped against:** ST0585 v1.1 — Data Scientist (integrated degree), Level 6`);
  L.push("");
  L.push("---");
  L.push("");
  L.push("## A. Activity log");
  L.push("");
  if (doneTasks.length === 0) L.push("*No activities completed yet.*");
  doneTasks.forEach((t, i) => {
    const wp = WORKPLACES[t.wp];
    L.push(`### ${i + 1}. ${t.title}`);
    L.push(`- **Employer:** ${wp.name} — ${wp.place}`);
    L.push(`- **Date completed:** ${progress.log?.[t.id] || "(not recorded)"}`);
    L.push(`- **Strand:** ${STRANDS[t.strand]}${t.capstone ? " (capstone)" : ""}`);
    const tq = taskQuest(t.id);
    if (tq) L.push(`- **Quest:** ${tq.title} (step ${tq.steps.indexOf(t.id) + 1} of ${tq.steps.length})`);
    if (t.tier) L.push(`- **Tier:** ${t.tier} — follow-on task building on prior work`);
    L.push(`- **KSBs evidenced:** ${t.ksb.map((k) => `${k} — ${KSB[k]?.s || k}`).join("; ")}`);
    if (t.requires) L.push(`- **Builds on:** ${t.requires.map((r) => TASKS.find((x) => x.id === r)?.title || r).join("; ")}${t.tier ? ` (tier ${t.tier})` : ""}`);
    L.push(`- **Activity:** ${ACTIVITY_DESC[t.challenge.type] || "Workplace exercise."}`);
    L.push(`- **Learning point:** ${t.challenge.explain}`);
    L.push("");
  });
  L.push("---");
  L.push("");
  L.push("## Quests");
  L.push("");
  QUESTS.forEach((q) => {
    const d = q.steps.filter((s) => progress.completed.includes(s)).length;
    L.push(`- **${q.title}** — ${d}/${q.steps.length} steps${d === q.steps.length ? ` complete (+${q.bonus} XP bonus earned)` : " complete"}`);
  });
  L.push("");
  L.push("---");
  L.push("");
  L.push("## B. KSB coverage matrix");
  L.push("");
  let currentKind = "";
  Object.entries(KSB).forEach(([code, meta]) => {
    if (meta.kind !== currentKind) { currentKind = meta.kind; L.push(`### ${currentKind}`); L.push(""); }
    const evid = doneTasks.filter((t) => t.ksb.includes(code));
    const avail = TASKS.filter((t) => t.ksb.includes(code));
    L.push(`**${code} — ${meta.s}.** ${meta.d}`);
    if (evid.length) L.push(`Evidence: ${evid.map((t) => `${t.title} (${WORKPLACES[t.wp].name}, ${progress.log?.[t.id] || "—"})`).join("; ")}`);
    else if (avail.length) L.push(`Evidence: *none yet — ${avail.length} Datascape ${avail.length === 1 ? "activity addresses" : "activities address"} this KSB.*`);
    else L.push("Evidence: *not addressed by Datascape activities — evidence this KSB through workplace projects and provider coursework.*");
    L.push("");
  });
  L.push("---");
  L.push("");
  L.push("## Notes for tutors and skills coaches");
  L.push("");
  L.push("- Datascape: Cambridge is a learning game. Activities are short formative exercises, not workplace evidence; treat this record as a study log and discussion prompt, not EPA portfolio evidence in itself.");
  L.push("- KSB codes follow the common provider convention (K1–K5, S1–S8, B1–B6) against the published ST0585 v1.1 standard. Descriptors are paraphrased — always verify mappings against the published standard and your provider's own tracking.");
  L.push("- KSBs marked as not addressed (for example K1 and B6) require evidence from real workplace activity, study and community engagement.");
  L.push("- The occupational standard is © Crown copyright, reusable under the Open Government Licence v3.0.");
  return L.join("\n");
}

function ExportOverlay({ text, onClose }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef(null);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); setCopied(true); } catch {}
      document.body.removeChild(ta);
    }
    setTimeout(() => setCopied(false), 2200);
  };
  const download = () => {
    try {
      const blob = new Blob([text], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "datascape-placement-record.md";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {}
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(16,26,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: C.card, maxWidth: 680, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", borderRadius: 16,
          borderTop: `5px solid ${C.teal}`, boxShadow: "0 24px 70px rgba(10,18,32,0.45)", padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <h3 style={{ fontFamily: "'Sora', sans-serif", color: C.ink, margin: 0 }}>Placement record export</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.mist }} aria-label="Close export">✕</button>
        </div>
        <pre ref={preRef} style={{ flex: 1, overflow: "auto", background: "#F7F9FB", border: `1px solid ${C.line}`, borderRadius: 10,
          padding: "14px 16px", fontSize: 12, lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "pre-wrap", color: C.inkSoft, margin: 0 }}>{text}</pre>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button style={btnPrimary} onClick={download}>Download .md</button>
          <button style={btnGhost} onClick={copy}>{copied ? "✓ Copied" : "Copy to clipboard"}</button>
        </div>
        <p style={{ fontSize: 11, color: C.mist, marginTop: 10, marginBottom: 0 }}>
          Markdown format — paste into your provider's tracker, OneFile/portfolio notes, or share with your skills coach.
        </p>
      </div>
    </div>
  );
}

/* ================= profile / leaderboard ================= */
function Profile({ progress, cfg, onEdit, onReset, onLoad }) {
  const [exportText, setExportText] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [dataMsg, setDataMsg] = useState(null);
  useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(t);
  }, [confirmReset]);
  const downloadSave = () => {
    try {
      const blob = new Blob([JSON.stringify({ cfg, progress }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `datascape-save-${(cfg.name || "player").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDataMsg("Save file downloaded.");
    } catch { setDataMsg("Couldn't create a file in this browser."); }
  };
  const onPickFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const ok = onLoad && onLoad(data);
        setDataMsg(ok ? "Save loaded." : "That file isn't a valid Datascape save.");
      } catch { setDataMsg("Couldn't read that file."); }
    };
    reader.onerror = () => setDataMsg("Couldn't read that file.");
    reader.readAsText(file);
  };
  const byStrand = Object.keys(STRANDS).map((s) => {
    const ts = TASKS.filter((t) => t.strand === s);
    const done = ts.filter((t) => progress.completed.includes(t.id)).length;
    return { s, done, total: ts.length };
  }).filter((r) => r.total > 0);
  const ksbCovered = (code) => TASKS.some((t) => progress.completed.includes(t.id) && t.ksb.includes(code));
  const ksbAvailable = (code) => TASKS.some((t) => t.ksb.includes(code));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, paddingTop: 8 }}>
      <div style={{ textAlign: "center", flex: "0 0 190px" }}>
        <div style={{ background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 10px 4px", boxShadow: "0 8px 24px rgba(20,32,51,0.08)" }}>
          <Avatar cfg={cfg} size={120} />
        </div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, color: C.ink, marginTop: 10 }}>{cfg.name}</div>
        <div style={{ color: SPECIALISMS[cfg.spec].color, fontSize: 12.5, fontWeight: 600 }}>{SPECIALISMS[cfg.spec].name}</div>
        <div style={{ color: C.mist, fontSize: 12, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>L{levelOf(progress.xp)} · {rankOf(progress.xp)}</div>
        <button style={{ ...btnPrimary, marginTop: 14, width: "100%" }} onClick={() => setExportText(buildReport(cfg, progress))}>
          Export placement record
        </button>
        <button style={{ ...btnGhost, marginTop: 8, width: "100%" }} onClick={onEdit}>
          ✏️ Edit avatar
        </button>

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}`, textAlign: "left" }}>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 12.5, color: C.inkSoft, marginBottom: 8, textAlign: "center" }}>Save &amp; data</div>
          {!STORAGE_OK && (
            <div style={{ background: "#FCF1E7", border: `1px solid ${C.amber}`, color: C.inkSoft, borderRadius: 8, padding: "8px 10px", fontSize: 11.5, lineHeight: 1.5, marginBottom: 8 }}>
              ⚠️ This browser isn't keeping saves between visits. Use <strong>Download save file</strong> to keep your progress, and <strong>Load save file</strong> to pick up where you left off.
            </div>
          )}
          <button style={{ ...btnGhost, width: "100%" }} onClick={downloadSave}>
            ⬇️ Download save file
          </button>
          <label style={{ ...btnGhost, marginTop: 8, width: "100%", display: "block", textAlign: "center", boxSizing: "border-box" }}>
            ⬆️ Load save file
            <input type="file" accept="application/json,.json" onChange={onPickFile} style={{ display: "none" }} />
          </label>
          <button
            onClick={() => { if (confirmReset) { setConfirmReset(false); onReset && onReset(); } else setConfirmReset(true); }}
            style={{ ...btnGhost, marginTop: 8, width: "100%", borderColor: C.bad,
              color: confirmReset ? "#FFFFFF" : C.bad, background: confirmReset ? C.bad : "#FFFFFF" }}>
            {confirmReset ? "Tap again to erase everything" : "🗑️ Reset / start again"}
          </button>
          {dataMsg && <div style={{ fontSize: 11.5, color: C.mist, marginTop: 8, textAlign: "center" }}>{dataMsg}</div>}
        </div>
      </div>
      <div style={{ flex: "1 1 320px" }}>
        <h3 style={{ fontFamily: "'Sora', sans-serif", color: C.ink, marginTop: 0 }}>Apprenticeship record</h3>
        <p style={{ color: C.mist, fontSize: 12.5, marginTop: -6 }}>Strands map to areas of the ST0585 Data Scientist standard. Complete every task in a strand to close it off.</p>
        {byStrand.map(({ s, done, total }) => (
          <div key={s} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: C.inkSoft }}>
              <span>{STRANDS[s]} {done === total && <span style={{ color: C.ok, fontWeight: 700 }}>✓ complete</span>}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.mist }}>{done}/{total}</span>
            </div>
            <div style={{ height: 8, background: "#E3E9F1", borderRadius: 5, marginTop: 4 }}>
              <div style={{ width: `${(done / total) * 100}%`, height: "100%", borderRadius: 5, background: done === total ? C.ok : C.teal, transition: "width 0.5s" }} />
            </div>
          </div>
        ))}
        <h4 style={{ fontFamily: "'Sora', sans-serif", color: C.ink, margin: "18px 0 4px", fontSize: 14 }}>KSB coverage — ST0585 v1.1</h4>
        <p style={{ color: C.mist, fontSize: 12, margin: "0 0 8px" }}>Filled = evidenced by a completed activity · outlined = available in Datascape · faded = needs real workplace evidence.</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(KSB).map(([code, meta]) => {
            const cov = ksbCovered(code), avail = ksbAvailable(code);
            return (
              <span key={code} title={`${meta.s}: ${meta.d}`}
                style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", padding: "4px 10px", borderRadius: 12, fontWeight: 700,
                  background: cov ? C.teal : "#FFFFFF", color: cov ? "#FFF" : avail ? C.inkSoft : C.mist,
                  border: `1.5px solid ${cov ? C.teal : avail ? C.line : "#E8ECF1"}`, opacity: avail ? 1 : 0.55 }}>
                {code}
              </span>
            );
          })}
        </div>
        <div style={{ fontSize: 11.5, color: C.mist, marginTop: 16, lineHeight: 1.6 }}>
          KSB codes follow the provider convention (K1–K5, S1–S8, B1–B6) against the published ST0585 v1.1 standard; descriptors are paraphrased. Verify all mappings with your provider before using anything as evidence — the export includes full details and caveats. Your game saves automatically in this browser after every completed task (look for the ✓ saved flash in the header). To move your progress to another device — or keep a backup — use Download / Load save file above.
        </div>
      </div>
      {exportText && <ExportOverlay text={exportText} onClose={() => setExportText(null)} />}
    </div>
  );
}

/* ================= builder & title ================= */
function Builder({ cfg, setCfg, onDone, doneLabel }) {
  const row = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 };
  const lab = { fontFamily: "'Sora', sans-serif", fontWeight: 700, color: C.ink, fontSize: 12, letterSpacing: "0.08em", marginTop: 16 };
  const swatch = (color, active, onClick, key) => (
    <button key={key} onClick={onClick} aria-label="option"
      style={{ width: 30, height: 30, borderRadius: "50%", background: color, cursor: "pointer",
        border: active ? `3px solid ${C.ink}` : `2px solid ${C.line}` }} />
  );
  const chip = (label, active, onClick, key) => (
    <button key={key} onClick={onClick}
      style={{ padding: "6px 14px", borderRadius: 16, cursor: "pointer", fontSize: 13,
        background: active ? C.teal : "#FFFFFF", color: active ? "#FFF" : C.inkSoft,
        border: `1.5px solid ${active ? C.teal : C.line}`, fontWeight: active ? 700 : 400 }}>
      {label}
    </button>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 30, justifyContent: "center", alignItems: "flex-start", paddingTop: 18 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 16, padding: "24px 44px 8px", boxShadow: "0 10px 30px rgba(20,32,51,0.1)" }}>
          <Avatar cfg={cfg} size={165} />
        </div>
        <div style={{ marginTop: 10, fontWeight: 700, color: SPECIALISMS[cfg.spec].color, fontFamily: "'Sora', sans-serif", fontSize: 13.5 }}>
          {SPECIALISMS[cfg.spec].name}
        </div>
        <div style={{ color: C.mist, fontSize: 12 }}>{SPECIALISMS[cfg.spec].desc}</div>
      </div>
      <div style={{ maxWidth: 460, flex: "1 1 320px" }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", color: C.ink, margin: 0 }}>Day one: set up your profile</h2>
        <p style={{ color: C.mist, fontSize: 13, marginTop: 4 }}>Build your apprentice and pick a specialism — it earns +20% XP on matching tasks.</p>
        <div style={lab}>NAME</div>
        <input value={cfg.name} maxLength={20} onChange={(e) => setCfg({ ...cfg, name: e.target.value })}
          placeholder="e.g. Sam"
          style={{ marginTop: 6, width: "100%", boxSizing: "border-box", background: "#FFFFFF", border: `1.5px solid ${C.line}`,
            color: C.ink, padding: "10px 12px", borderRadius: 9, fontSize: 15, outline: "none" }} />
        <div style={lab}>SKIN</div>
        <div style={row}>{SKINS.map((c, i) => swatch(c, cfg.skin === i, () => setCfg({ ...cfg, skin: i }), i))}</div>
        <div style={lab}>HAIR STYLE</div>
        <div style={row}>{HAIR_STYLES.map((s, i) => chip(s, cfg.hairStyle === i, () => setCfg({ ...cfg, hairStyle: i }), i))}</div>
        <div style={lab}>HAIR COLOUR</div>
        <div style={row}>{HAIR_COLORS.map((c, i) => swatch(c, cfg.hairColor === i, () => setCfg({ ...cfg, hairColor: i }), i))}</div>
        <div style={lab}>WORKWEAR</div>
        <div style={row}>{OUTFITS.map((o, i) => chip(o.name, cfg.outfit === i, () => setCfg({ ...cfg, outfit: i }), i))}</div>
        <div style={lab}>ACCESSORY</div>
        <div style={row}>{ACCESSORIES.map((a, i) => chip(a, cfg.accessory === i, () => setCfg({ ...cfg, accessory: i }), i))}</div>
        <div style={lab}>SPECIALISM</div>
        <div style={row}>
          {Object.entries(SPECIALISMS).map(([k, s]) => (
            <button key={k} onClick={() => setCfg({ ...cfg, spec: k })}
              style={{ flex: "1 1 180px", textAlign: "left", cursor: "pointer", padding: "10px 12px", borderRadius: 10,
                background: cfg.spec === k ? "rgba(47,111,94,0.06)" : "#FFFFFF",
                border: `1.5px solid ${cfg.spec === k ? s.color : C.line}` }}>
              <div style={{ fontFamily: "'Sora', sans-serif", color: s.color, fontSize: 13, fontWeight: 700 }}>{s.name}</div>
              <div style={{ color: C.mist, fontSize: 11.5, marginTop: 2 }}>{s.desc}</div>
            </button>
          ))}
        </div>
        <button style={{ ...btnPrimary, marginTop: 24, width: "100%" }} disabled={!cfg.name.trim()} onClick={onDone}>
          {cfg.name.trim() ? (doneLabel || "Start your placement →") : "Enter a name to continue"}
        </button>
      </div>
    </div>
  );
}

function Title({ onStart, hasSave, onReset, onLoad }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [loadMsg, setLoadMsg] = useState(null);
  useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(t);
  }, [confirmReset]);
  const onPickFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const ok = onLoad && onLoad(data);
        if (!ok) setLoadMsg("That file isn't a valid Datascape save.");
      } catch { setLoadMsg("Couldn't read that file."); }
    };
    reader.onerror = () => setLoadMsg("Couldn't read that file.");
    reader.readAsText(file);
  };
  return (
    <div style={{ textAlign: "center", paddingTop: 48 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", color: C.teal, fontSize: 12, letterSpacing: "0.35em" }}>L6 DATA SCIENTIST · ST0585</div>
      <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, color: C.ink, fontSize: "clamp(38px, 7.5vw, 64px)", margin: "10px 0 2px", letterSpacing: "-0.02em" }}>
        Datascape<span style={{ color: C.teal }}>:</span> Cambridge
      </h1>
      <p style={{ color: C.mist, maxWidth: 560, margin: "14px auto 26px", lineHeight: 1.7, fontSize: 15 }}>
        A workplace simulator for data science apprentices. Walk the floors of employers
        across the city — the Science Park, the Biomedical Campus, CB1, the Guildhall —
        catch colleagues between meetings, run real queries, build real charts,
        and grow your apprenticeship record.
      </p>
      <button style={{ ...btnPrimary, fontSize: 15, padding: "12px 26px" }} onClick={onStart}>
        {hasSave ? "Continue placement" : "Start day one"}
      </button>

      <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <label style={{ ...btnGhost, cursor: "pointer", display: "inline-block" }}>
          ⬆️ Load save file
          <input type="file" accept="application/json,.json" onChange={onPickFile} style={{ display: "none" }} />
        </label>
      </div>
      {loadMsg && <div style={{ fontSize: 12, color: C.mist, marginTop: 8 }}>{loadMsg}</div>}

      {hasSave && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => { if (confirmReset) { setConfirmReset(false); onReset && onReset(); } else setConfirmReset(true); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Sora', sans-serif",
              fontWeight: 600, fontSize: 13, color: confirmReset ? C.bad : C.mist,
              textDecoration: "underline", textUnderlineOffset: 3 }}>
            {confirmReset ? "Tap again to erase your progress and start over" : "Start again from scratch"}
          </button>
        </div>
      )}

      {(!STORAGE_OK || IS_FILE_PROTOCOL) && (
        <div style={{ maxWidth: 520, margin: "18px auto 0", background: "#FCF1E7", border: `1px solid ${C.amber}`,
          color: C.inkSoft, borderRadius: 10, padding: "10px 14px", fontSize: 12.5, lineHeight: 1.55, textAlign: "left" }}>
          {!STORAGE_OK ? (
            <>⚠️ This browser isn’t storing saved games, so progress won’t persist between visits. Use <strong>Load save file</strong> above and <strong>Download save file</strong> (in <em>My record</em>) to carry it over — or serve the game over http(s).</>
          ) : (
            <>⚠️ You’ve opened the game as a local <code>file://</code> page. Many browsers don’t keep <code>localStorage</code> between launches when run this way, so you may always land here on “Start day one”. Use <strong>Download / Load save file</strong> to keep progress.</>
          )}
        </div>
      )}
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 90,
      background: C.ink, color: "#FFFFFF", fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
      padding: "11px 22px", borderRadius: 10, boxShadow: "0 12px 32px rgba(10,18,32,0.4)" }}>
      {msg}
    </div>
  );
}

/* ================= root ================= */
const DEFAULT_CFG = { name: "", skin: 1, hairStyle: 0, hairColor: 1, outfit: 0, accessory: 0, spec: "engineering" };
const DEFAULT_PROGRESS = { xp: 0, completed: [], log: {}, read: {} };

export default function App() {
  const [screen, setScreen] = useState("title");
  const [tab, setTab] = useState("city");
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [inOffice, setInOffice] = useState(null);
  const [hub, setHub] = useState(null);
  const [saved, setSaved] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    (async () => {
      const save = await store.get(SAVE_KEY);
      if (save?.cfg?.name) {
        setCfg({ ...DEFAULT_CFG, ...save.cfg });
        setProgress({ ...DEFAULT_PROGRESS, ...save.progress });
        setHasSave(true);
      }
    })();
  }, []);

  const persist = (nc, np) => {
    store.set(SAVE_KEY, { cfg: nc, progress: np }).then((ok) => {
      if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    });
  };

  /* Start again: wipe the saved game and return to a clean title screen. */
  const resetSave = () => {
    store.remove(SAVE_KEY);
    setCfg(DEFAULT_CFG);
    setProgress(DEFAULT_PROGRESS);
    setHasSave(false);
    setInOffice(null); setHub(null); setActiveTask(null);
    setTab("city"); setScreen("title");
  };

  /* Load a previously downloaded save file back into the running game. */
  const loadSaveFromData = (data) => {
    if (!data || !data.cfg || !data.cfg.name) return false;
    const nc = { ...DEFAULT_CFG, ...data.cfg };
    const np = { ...DEFAULT_PROGRESS, ...data.progress };
    setCfg(nc); setProgress(np); setHasSave(true);
    setInOffice(null); setHub(null); setActiveTask(null);
    setTab("city"); setScreen("world");
    persist(nc, np);
    return true;
  };
  const capstoneUnlocked = TASKS.filter((t) => !t.capstone).every((t) => progress.completed.includes(t.id)) || levelOf(progress.xp) >= 5;

  const markRead = (docId) => {
    setProgress((prev) => {
      if ((prev.read || {})[docId]) return prev;
      const next = { ...prev, read: { ...(prev.read || {}), [docId]: true } };
      persist(cfg, next);
      return next;
    });
  };
  const completeTask = (task, reward, firstTry) => {
    if (progress.completed.includes(task.id)) return;
    const next = {
      xp: progress.xp + reward,
      completed: [...progress.completed, task.id],
      log: { ...(progress.log || {}), [task.id]: new Date().toISOString().slice(0, 10) },
    };
    /* quest progression & bonus */
    let questMsg = "";
    const q = taskQuest(task.id);
    if (q) {
      if (q.steps.every((s) => next.completed.includes(s))) {
        next.xp += q.bonus;
        questMsg = ` — 🏆 QUEST COMPLETE: ${q.title} (+${q.bonus} XP)${q.after ? `; ${q.after}` : ""}`;
      } else {
        const i = q.steps.indexOf(task.id);
        const nt = TASKS.find((t) => t.id === q.steps[i + 1]);
        if (nt) {
          const nwp = WORKPLACES[nt.wp];
          questMsg = ` — quest continues at ${nwp.hub ? HUBS[nwp.hub].name : nwp.name}`;
        }
      }
    }
    const promoted = levelOf(next.xp) > levelOf(progress.xp);
    setProgress(next); persist(cfg, next);
    setToast(`+${reward} XP${firstTry ? " (first-time bonus)" : ""}${questMsg}${promoted ? ` — promoted to ${rankOf(next.xp)}!` : ""}`);
    setTimeout(() => setToast(null), 4500);
  };

  const tabBtn = (key, label) => (
    <button key={key} onClick={() => { setTab(key); setInOffice(null); setHub(null); }}
      style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, cursor: "pointer", padding: "9px 14px",
        background: "none", border: "none", borderBottom: `2.5px solid ${tab === key ? C.teal : "transparent"}`,
        color: tab === key ? C.ink : C.mist, fontWeight: 700 }}>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, #F6F8FA 0%, ${C.cloud} 100%)`, color: C.ink, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        button:focus-visible { outline: 2.5px solid ${C.teal}; outline-offset: 2px; }
        .dlg-card { animation: dlg-in 0.18s ease-out; }
        @keyframes dlg-in { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @media (prefers-reduced-motion: reduce) { .dlg-card { animation: none; } }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px 16px 60px" }}>
        {screen === "title" && <Title hasSave={hasSave} onStart={() => setScreen(hasSave ? "world" : "builder")} onReset={resetSave} onLoad={loadSaveFromData} />}
        {screen === "builder" && <Builder cfg={cfg} setCfg={setCfg} doneLabel={hasSave ? "Save changes →" : undefined}
          onDone={() => { persist(cfg, progress); setHasSave(true); setScreen("world"); }} />}

        {screen === "world" && (
          <>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 48, height: 56, overflow: "hidden", borderRadius: 10, border: `2px solid ${SPECIALISMS[cfg.spec].color}`, background: "#FFFFFF" }}>
                  <Avatar cfg={cfg} size={48} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15.5 }}>{cfg.name}</div>
                  <div style={{ fontSize: 11.5, color: SPECIALISMS[cfg.spec].color, fontWeight: 600 }}>{SPECIALISMS[cfg.spec].name}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.ok, fontWeight: 700,
                  opacity: saved ? 1 : 0, transition: "opacity 0.4s" }}>✓ saved</span>
                <XPBar xp={progress.xp} />
              </div>
            </header>

            <nav style={{ borderBottom: `1px solid ${C.line}`, marginBottom: 14, display: "flex", gap: 4, overflowX: "auto" }}>
              {tabBtn("city", "City")}
              {tabBtn("quests", "Quests")}
              {tabBtn("record", "My record")}
            </nav>

            {tab === "city" && !inOffice && !hub && (
              <>
                <CityMap progress={progress} capstoneUnlocked={capstoneUnlocked}
                  onEnter={(k) => setInOffice(k)} onEnterHub={(k) => setHub(k)} />
                <p style={{ color: C.mist, fontSize: 13, textAlign: "center", marginTop: 10 }}>
                  Drag the map to explore the city, then tap a workplace to walk in. The Bradfield Centre briefing unlocks once every other placement task is complete — or at Senior level.
                </p>
              </>
            )}
            {tab === "city" && !inOffice && hub && (
              <Lobby hubKey={hub} progress={progress} onEnterUnit={(u) => setInOffice(u)} onBack={() => setHub(null)} />
            )}
            {tab === "city" && inOffice && (
              <OfficeScene key={inOffice} wpKey={inOffice} cfg={cfg} progress={progress}
                suspended={!!activeTask}
                exitLabel={hub ? `← Back to ${HUBS[hub].name}` : undefined}
                onStartTask={(t) => setActiveTask(t)} onExit={() => setInOffice(null)} onMarkRead={markRead} />
            )}
            {tab === "quests" && <QuestsTab progress={progress} />}
            {tab === "record" && <Profile progress={progress} cfg={cfg} onEdit={() => setScreen("builder")} onReset={resetSave} onLoad={loadSaveFromData} />}
          </>
        )}
      </div>

      {activeTask && (
        <TaskModal task={activeTask} boostSpec={cfg.spec}
          onClose={() => setActiveTask(null)} onComplete={completeTask} />
      )}
      <Toast msg={toast} />
    </div>
  );
}
