export const mockCandidates = [
  {
    id: 1,
    name: 'Priya Venkataraman',
    email: 'priya.v@techmail.com',
    title: 'Senior ML Engineer',
    location: 'San Francisco, CA',
    overallScore: 94,
    scores: { skillsMatch: 96, semanticRelevance: 93, behavioralSignal: 91, careerTrajectory: 95 },
    graphFitScore: 95,
    skillBreadthScore: 88,
    verificationStatus: 'verified',
    borderline: false,
    computePath: 'fast-llm',
    highlights: ['Led 3 production LLM pipelines at scale', 'PyTorch, distributed training expert', '6 YoE at FAANG'],
    whyRank: 'Priya\'s resume demonstrates direct alignment with 9 of 11 required competencies. Her work on distributed training infrastructure at her last role matches our stack precisely.',
    evidence: ['"Scaled ML inference pipeline from 10K to 2M req/day" — directly relevant.', '"Led 4-engineer team building real-time recommendation engine" — behavioral signal of leadership.'],
    resumeSnippet: 'Principal engineer on core ML platform team…',
  },
  {
    id: 2,
    name: 'Marcus Webb',
    email: 'mwebb@devguild.io',
    title: 'Staff Software Engineer',
    location: 'Austin, TX',
    overallScore: 89,
    scores: { skillsMatch: 88, semanticRelevance: 91, behavioralSignal: 87, careerTrajectory: 90 },
    graphFitScore: 48,
    skillBreadthScore: 47,
    verificationStatus: 'verified',
    borderline: false,
    computePath: 'fast-llm',
    highlights: ['Kubernetes, distributed systems', 'Open source contributor (12K GitHub stars)', 'Ex-Stripe'],
    whyRank: 'Marcus presents strong systems thinking and a track record of shipping at scale. Minor gap: limited direct ML experience, offset by strong systems fundamentals.',
    evidence: ['"Designed fault-tolerant event streaming architecture handling 500K events/sec" — directly relevant.', '"Mentored 8 engineers across 3 teams" — strong behavioral signal.'],
    resumeSnippet: 'Staff engineer on infrastructure team at Stripe…',
  },
  {
    id: 3,
    name: 'Yuki Tanaka',
    email: 'yuki.t@mlresearch.jp',
    title: 'Research Scientist → Industry ML',
    location: 'Remote (Tokyo, JP)',
    overallScore: 86,
    scores: {
      skillsMatch: 82,
      semanticRelevance: 89,
      behavioralSignal: 83,
      careerTrajectory: 92,
    },
    verificationStatus: 'review',
    borderline: true,
    reviewNote: 'Email on resume differs from submission — consistency check flagged.',
    highlights: ['NeurIPS 2023 paper author', 'Strong research-to-production transition signals', 'JAX, XLA expertise'],
    whyRank:
      'Yuki\'s research background shows deep theoretical foundations. The trajectory from pure research toward applied ML is a strong fit signal. However, production deployment experience is thinner than top candidates.',
    evidence: [
      '"First-authored paper on efficient attention mechanisms" — semantic relevance to LLM optimization work.',
      '"Implemented research prototype that shipped to 10M users" — bridging research/production gap.',
    ],
    debate: {
      pro: 'The NeurIPS paper demonstrates cutting-edge LLM knowledge that\'s hard to hire for. Research-to-industry transitions often produce the most rigorous engineers. Trajectory suggests fast ramp.',
      skeptic: 'Only 18 months of production experience. The role needs someone who can ship on day 60, not day 180. Research habits may require adjustment to our velocity.',
    },
    resumeSnippet: 'Research scientist at RIKEN AI Lab…',
  },
  {
    id: 4,
    name: 'Amara Okonkwo',
    email: 'amara@claratech.com',
    title: 'ML Platform Lead',
    location: 'London, UK',
    overallScore: 85,
    scores: {
      skillsMatch: 87,
      semanticRelevance: 84,
      behavioralSignal: 88,
      careerTrajectory: 82,
    },
    verificationStatus: 'verified',
    borderline: false,
    highlights: ['ML platform ownership end-to-end', 'Cross-functional leadership', 'GCP, Vertex AI certified'],
    whyRank:
      'Amara demonstrates strong platform thinking — she\'s built the tooling that other ML engineers use, not just the models themselves. This multiplier effect is exactly what the role calls for.',
    evidence: [
      '"Built internal feature store used by 40 data scientists" — platform-level impact.',
      '"Reduced model deployment time from 3 weeks to 2 days" — operational excellence signal.',
    ],
    resumeSnippet: 'Head of ML Platform at ClaraTech (Series B)…',
  },
  {
    id: 5,
    name: 'Diego Herrera',
    email: 'diego.h@growthco.mx',
    title: 'Senior Data Scientist',
    location: 'Mexico City, MX',
    overallScore: 78,
    scores: {
      skillsMatch: 76,
      semanticRelevance: 79,
      behavioralSignal: 81,
      careerTrajectory: 76,
    },
    verificationStatus: 'verified',
    borderline: true,
    highlights: ['Strong Python, SQL, experiment design', 'Product analytics focus', 'Limited LLM experience'],
    whyRank:
      'Diego\'s data science foundation is solid but the role skews toward ML engineering. His product analytics depth could be valuable in the longer term, but immediate fit is moderate.',
    evidence: [
      '"Designed A/B framework used across 8 product teams" — analytical rigor signal.',
      '"Built churn prediction model saving $2M ARR" — business impact focus.',
    ],
    debate: {
      pro: 'Strong analytical foundation, business impact orientation, and fast learner signals in resume. Could grow into the ML engineering aspects quickly.',
      skeptic: 'Zero production LLM experience and resume reads as product analytics, not ML engineering. The skill delta is significant for this role\'s requirements.',
    },
    resumeSnippet: 'Senior data scientist on growth team at GrowthCo…',
  },
  {
    id: 6,
    name: 'Sarah Chen',
    email: 'schen@aiops.dev',
    title: 'MLOps Engineer',
    location: 'Seattle, WA',
    overallScore: 82,
    scores: {
      skillsMatch: 85,
      semanticRelevance: 80,
      behavioralSignal: 82,
      careerTrajectory: 80,
    },
    verificationStatus: 'verified',
    borderline: false,
    highlights: ['MLflow, Kubeflow, Airflow expertise', 'CI/CD for ML pipelines', 'AWS SageMaker'],
    whyRank:
      'Sarah brings deep operational expertise in the ML lifecycle. Her focus on deployment reliability and monitoring fills a specific gap in the stated role requirements.',
    evidence: [
      '"Reduced model drift incidents by 70% through automated monitoring" — operational excellence.',
      '"Managed 200+ model versions in production" — scale and process maturity.',
    ],
    resumeSnippet: 'MLOps engineer at AI-first infrastructure startup…',
  },
  {
    id: 7,
    name: 'Raj Patel',
    email: 'rpatel@finml.co',
    title: 'Quantitative ML Engineer',
    location: 'New York, NY',
    overallScore: 80,
    scores: {
      skillsMatch: 79,
      semanticRelevance: 78,
      behavioralSignal: 84,
      careerTrajectory: 79,
    },
    verificationStatus: 'review',
    reviewNote: 'Phone number on resume does not match form submission — flagged for review.',
    highlights: ['Financial ML, time-series forecasting', 'C++ high-performance computing', 'Strong math foundation'],
    whyRank:
      'Raj\'s quantitative background provides strong signal on numerical reasoning. The domain shift from fintech to general ML engineering is moderate — his optimization skills transfer well.',
    evidence: [
      '"Implemented low-latency feature computation in C++ at 1μs p99" — performance engineering rigor.',
      '"Published 2 internal papers on forecasting methods" — intellectual initiative.',
    ],
    resumeSnippet: 'Quantitative ML engineer at Two Sigma…',
  },
  {
    id: 8,
    name: 'Elena Volkov',
    email: 'elena.v@deepnlp.eu',
    title: 'NLP Research Engineer',
    location: 'Berlin, DE',
    overallScore: 88,
    scores: {
      skillsMatch: 91,
      semanticRelevance: 87,
      behavioralSignal: 85,
      careerTrajectory: 89,
    },
    verificationStatus: 'verified',
    borderline: false,
    highlights: ['Fine-tuning LLMs at scale', 'RLHF implementation experience', 'Multilingual NLP'],
    whyRank:
      'Elena\'s direct LLM fine-tuning and RLHF experience is rare and precisely targeted to the role. Her multilingual NLP work adds a differentiated dimension beyond the core requirements.',
    evidence: [
      '"Fine-tuned 70B parameter model for domain-specific tasks, achieving 18% improvement" — direct LLM engineering.',
      '"Implemented custom RLHF pipeline from scratch" — rare, high-value signal.',
    ],
    resumeSnippet: 'NLP research engineer at EU AI lab → industry…',
  },
  {
    id: 9,
    name: 'Jordan Kim',
    email: 'jkim@productai.com',
    title: 'AI Product Engineer',
    location: 'Chicago, IL',
    overallScore: 71,
    scores: {
      skillsMatch: 68,
      semanticRelevance: 73,
      behavioralSignal: 75,
      careerTrajectory: 69,
    },
    verificationStatus: 'verified',
    borderline: false,
    highlights: ['Product + engineering hybrid', 'LangChain, LlamaIndex', 'Startup founding team experience'],
    whyRank:
      'Jordan sits at the product-engineering intersection. Strong on rapid prototyping and user-facing AI features, weaker on low-level ML infrastructure. Fits a product-facing variant of this role better than the core spec.',
    evidence: [
      '"Shipped 3 AI-powered features used by 50K users" — product impact signal.',
      '"Built RAG pipeline serving internal knowledge base" — applied LLM experience.',
    ],
    resumeSnippet: 'Co-founder & AI engineer at early-stage startup…',
  },
  {
    id: 10,
    name: 'Fatima Al-Rashid',
    email: 'fatima.ar@inference.ai',
    title: 'Inference Optimization Engineer',
    location: 'Dubai, UAE',
    overallScore: 91,
    scores: {
      skillsMatch: 93,
      semanticRelevance: 90,
      behavioralSignal: 88,
      careerTrajectory: 93,
    },
    verificationStatus: 'verified',
    borderline: false,
    highlights: ['vLLM, TensorRT-LLM expert', 'GPU kernel optimization', 'Cost reduction track record'],
    whyRank:
      'Fatima brings highly specialized inference optimization expertise that is directly addressable in the role spec. Her cost-per-token reduction achievements are quantified and significant. Strong trajectory.',
    evidence: [
      '"Reduced inference cost by 60% through quantization and batching" — direct financial impact.',
      '"Contributed merged PR to vLLM project" — credibility in expert community.',
    ],
    resumeSnippet: 'Inference engineer at LLM inference startup…',
  },
];

export const mockJobDescription = `Senior ML Engineer — LLM Infrastructure

We're building the next generation of LLM-powered products and need a senior engineer to own our ML infrastructure stack. This role sits at the intersection of research and production.

You'll:
• Design and maintain our model training and serving infrastructure
• Lead fine-tuning efforts for domain-specific models
• Optimize inference pipelines for cost and latency
• Collaborate with research to ship new capabilities quickly

Requirements:
• 5+ years ML engineering experience
• Production LLM experience (fine-tuning, serving, RLHF a strong plus)
• Deep familiarity with distributed training
• Strong Python; C++/CUDA experience valued
• Experience with MLOps tooling (MLflow, Kubeflow, or equivalent)`;

export const funnelStages = [
  { label: 'L1 JD Parse',          count: 10000, description: 'JD decomposed into structured requirements' },
  { label: 'L2 Retrieval',         count: 200,   description: 'Embedding + keyword search, top 200' },
  { label: 'L3 Graph Enrichment',  count: 30,    description: 'PPR graph fit + skill breadth scoring' },
  { label: 'L4 Fast LLM',          count: 30,    description: '8B model semantic scoring for all candidates' },
  { label: 'L4b Reasoning LLM',    count: 4,     description: '70B deep eval for borderline candidates' },
  { label: 'L6 Agent Debate',      count: 3,     description: 'Pro vs Skeptic debate with adjudicator' },
  { label: 'L7 Ranked',            count: 10,    description: 'Composite sort + FA*IR fairness rerank' },
];
