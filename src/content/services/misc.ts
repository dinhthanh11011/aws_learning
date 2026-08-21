import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

/** Migration & transfer, cost management, ML, media, and cross-cutting foundations. */
export const miscServices: Service[] = [
  /* ── Migration & Transfer ───────────────────────────────────────────────── */
  {
    slug: 'dms',
    name: 'AWS Database Migration Service',
    abbr: 'DMS',
    category: 'migration',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Migrates and continuously replicates databases with minimal downtime.',
    whatItIs:
      'A replication instance reads from a source database and writes to a target, either as a one-off full load or as full load plus ongoing change data capture, which is what keeps downtime to a cutover window. *Homogeneous* migrations (Oracle → Oracle) need only DMS. *Heterogeneous* migrations (Oracle → Aurora PostgreSQL) also need the Schema Conversion Tool to translate schemas, procedures and views.',
    whenToUse: [
      'Migrating a database to AWS with near-zero downtime',
      'Engine changes, paired with SCT for schema conversion',
      'Continuous replication into a data lake or warehouse',
      'Consolidating several databases into one target',
    ],
    whenNotToUse: [
      'Analytics ETL — Glue',
      'Backups and point-in-time restore — AWS Backup or native snapshots',
      'Moving files rather than databases — DataSync',
    ],
    keyNumbers: [
      { label: 'Modes', value: 'Full load · full load + CDC · CDC only' },
      { label: 'Homogeneous', value: 'Same engine — DMS alone' },
      { label: 'Heterogeneous', value: 'Different engine — DMS plus the Schema Conversion Tool' },
      {
        label: 'Targets',
        value: 'RDS, Aurora, Redshift, DynamoDB, S3, OpenSearch, Kinesis and more',
      },
      {
        label: 'DMS Serverless',
        value: 'Auto-scaling replication capacity with no instance to size',
      },
    ],
    examTraps: [
      'SCT is only needed when the engine changes. A same-engine migration needs DMS on its own — a distinction the exam tests directly.',
      'CDC is what makes "minimal downtime" possible: keep replicating while the old system runs, then cut over.',
      'DMS can write to S3, which makes it a legitimate answer for "continuously land database changes in our data lake".',
    ],
    confusedWith: [
      {
        slug: 'glue',
        difference: 'Glue transforms data for analytics; DMS replicates a database faithfully.',
      },
      {
        slug: 'datasync',
        difference: 'DataSync moves files and objects; DMS moves database records.',
      },
    ],
    pricing:
      'Per replication instance-hour plus log storage; DMS Serverless bills per capacity unit-hour.',
    docsUrl: `${D}/dms/latest/userguide/Welcome.html`,
    related: ['rds', 'aurora', 'redshift', 's3', 'application-migration-service'],
  },
  {
    slug: 'datasync',
    name: 'AWS DataSync',
    category: 'migration',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Fast, scheduled, validated transfer of files and objects into or within AWS.',
    whatItIs:
      'An agent-based (on premises) or agentless (AWS-to-AWS) transfer service that moves data between NFS, SMB, HDFS, self-managed object stores and AWS storage — S3, EFS, FSx — with encryption, integrity validation, scheduling and incremental transfer built in. It saturates the network link far better than a hand-rolled script.',
    whenToUse: [
      'One-off or recurring migration of file shares into S3, EFS or FSx',
      'Scheduled synchronisation between on premises and AWS',
      'AWS-to-AWS movement between Regions, accounts or storage services',
      'Transfers where integrity validation matters',
    ],
    whenNotToUse: [
      'Ongoing protocol access from on-premises applications — Storage Gateway',
      'Petabyte-scale where the network would take months — Snow Family',
      'Database replication — DMS',
    ],
    keyNumbers: [
      { label: 'Sources', value: 'NFS · SMB · HDFS · self-managed object storage · other clouds' },
      { label: 'Destinations', value: 'S3 (any storage class) · EFS · FSx' },
      {
        label: 'Features',
        value: 'Incremental transfer · integrity validation · scheduling · bandwidth throttling',
      },
      { label: 'On-premises requirement', value: 'A DataSync agent VM' },
    ],
    examTraps: [
      'DataSync *moves* data; Storage Gateway *serves* data over a local protocol. "Migrate" means DataSync; "existing application keeps writing to a share" means Storage Gateway.',
      'DataSync can write directly to a cold S3 storage class, saving a lifecycle transition.',
      'For AWS-to-AWS transfers no agent is needed.',
    ],
    confusedWith: [
      { slug: 'storage-gateway', difference: 'Transfer service versus permanent protocol bridge.' },
      { slug: 'snow-family', difference: 'Over the network versus physically shipped devices.' },
      {
        slug: 'transfer-family',
        difference:
          'DataSync is a bulk transfer engine you schedule; Transfer Family is an SFTP/FTPS endpoint your partners connect to.',
      },
    ],
    pricing: 'Per GB transferred.',
    docsUrl: `${D}/datasync/latest/userguide/what-is-datasync.html`,
    related: ['storage-gateway', 'snow-family', 's3', 'efs', 'fsx', 'transfer-family'],
  },
  {
    slug: 'snow-family',
    name: 'AWS Snow Family',
    category: 'migration',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Physical devices shipped to you for offline data transfer and edge compute.',
    whatItIs:
      'Ruggedised appliances AWS ships to your site. You copy data onto them and ship them back, where the contents are loaded into S3. Snowball Edge comes in Storage Optimized and Compute Optimized variants and can also run EC2 instances and Lambda functions at the edge; Snowmobile is a shipping container for exabyte-scale moves.',
    whenToUse: [
      'Datasets so large that transferring over the network would take weeks or months',
      'Sites with poor, expensive or no connectivity',
      'Edge compute in disconnected environments — ships, mines, military',
      'A rule of thumb: if the transfer would take more than about a week over your link, consider Snow',
    ],
    whenNotToUse: [
      'Ongoing synchronisation — DataSync',
      'Datasets small enough to transfer in hours or days',
      'Anything urgent — shipping takes days',
    ],
    keyNumbers: [
      { label: 'Snowball Edge Storage Optimized', value: '~80 TB usable', volatile: true },
      {
        label: 'Snowball Edge Compute Optimized',
        value: '~28 TB NVMe, with EC2 and GPU options',
        volatile: true,
      },
      { label: 'Snowmobile', value: 'Up to 100 PB in a shipping container' },
      { label: 'Encryption', value: 'Always encrypted with KMS; keys never travel on the device' },
      { label: 'Turnaround', value: 'Days to weeks including shipping' },
    ],
    examTraps: [
      'The deciding factor is transfer *time*, not just size. Work out how long the dataset would take over the stated bandwidth — the exam gives you the numbers to do this.',
      'Snow devices are for one-off bulk transfer. Recurring transfer is DataSync.',
      'Snowball Edge can run compute, which is the answer to "process data in a disconnected location before shipping it".',
      'Direct Connect is the wrong answer to a one-off migration — the lead time exceeds the migration.',
    ],
    confusedWith: [
      { slug: 'datasync', difference: 'Offline shipping versus network transfer.' },
      {
        slug: 'direct-connect',
        difference: 'A permanent network link versus a one-time physical move.',
      },
    ],
    pricing: 'Per job plus per day of device retention, plus shipping. No data transfer-in charge.',
    docsUrl: `${D}/snowball/latest/developer-guide/whatisedge.html`,
    related: ['datasync', 's3', 'storage-gateway', 'direct-connect'],
  },
  {
    slug: 'transfer-family',
    name: 'AWS Transfer Family',
    category: 'migration',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Managed SFTP, FTPS, FTP and AS2 endpoints backed by S3 or EFS.',
    whatItIs:
      'Fully managed file-transfer protocol endpoints. Partners keep using their existing SFTP client and credentials; the files land directly in S3 or EFS. It exists so you can decommission an SFTP server without asking every partner to change how they work.',
    whenToUse: [
      'External partners upload via SFTP and cannot change their process',
      'Replacing a self-managed SFTP server',
      'B2B document exchange over AS2',
    ],
    whenNotToUse: [
      'Bulk internal migration — DataSync',
      'Anything that can call the S3 API directly',
    ],
    keyNumbers: [
      { label: 'Protocols', value: 'SFTP · FTPS · FTP · AS2' },
      { label: 'Backends', value: 'S3 · EFS' },
      {
        label: 'Identity',
        value: 'Service-managed users, Active Directory, or a custom Lambda identity provider',
      },
      { label: 'Cost note', value: 'Charged per endpoint-hour whether or not anyone connects' },
    ],
    examTraps: [
      'The tell is a named legacy protocol — SFTP or FTPS — plus "partners must not change anything".',
      'The per-hour endpoint charge is constant, which matters in cost questions comparing it with occasional S3 uploads.',
      'A custom identity provider backed by Lambda is how you authenticate against an existing user database.',
    ],
    confusedWith: [
      {
        slug: 'datasync',
        difference: 'An endpoint partners connect to versus a transfer job you schedule.',
      },
      {
        slug: 'storage-gateway',
        difference: 'Internet-facing protocol endpoint versus an on-premises caching appliance.',
      },
    ],
    pricing: 'Per protocol endpoint-hour plus per GB uploaded and downloaded.',
    docsUrl: `${D}/transfer/latest/userguide/what-is-aws-transfer-family.html`,
    related: ['s3', 'efs', 'datasync', 'directory-service'],
  },
  {
    slug: 'application-migration-service',
    name: 'AWS Application Migration Service',
    abbr: 'MGN',
    category: 'migration',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Lift-and-shift servers into EC2 by continuous block-level replication.',
    whatItIs:
      'Installs an agent on source servers, continuously replicates their disks into a staging area in AWS, then converts and launches them as native EC2 instances at cutover — minimising downtime and requiring no application changes.',
    whenToUse: [
      'Rehosting physical, virtual or other-cloud servers as EC2',
      'Large-scale lift-and-shift with a short cutover window',
    ],
    whenNotToUse: [
      'Re-architecting into containers or serverless',
      'Databases specifically — DMS is purpose-built',
    ],
    keyNumbers: [
      { label: 'Replication', value: 'Continuous, block-level, agent-based' },
      { label: 'Output', value: 'Native EC2 instances' },
    ],
    examTraps: [
      'MGN is the current answer for server rehosting; older material calls it CloudEndure Migration or SMS.',
      'MGN produces native EC2 instances; VMware Cloud on AWS keeps them as VMware VMs.',
    ],
    confusedWith: [
      { slug: 'dms', difference: 'Whole servers versus database contents.' },
      { slug: 'vmware-cloud', difference: 'Replatform to EC2 versus keep running under VMware.' },
    ],
    pricing: 'Free for 90 days per server; you pay for the staging and target resources.',
    docsUrl: `${D}/mgn/latest/ug/what-is-application-migration-service.html`,
    related: ['dms', 'ec2', 'vmware-cloud'],
  },

  /* ── Cloud Financial Management ─────────────────────────────────────────── */
  {
    slug: 'cost-explorer',
    name: 'AWS Cost Explorer',
    category: 'cost',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Visualise and forecast spend, and get commitment recommendations.',
    whatItIs:
      'An interactive view of historical and forecast cost and usage, sliced by service, account, Region, tag, instance type or purchase option. It also produces Reserved Instance and Savings Plans purchase recommendations based on your actual usage, and Rightsizing recommendations for EC2.',
    whenToUse: [
      'Finding out where the money is going',
      "Forecasting next month's bill",
      'Deciding whether to buy Savings Plans or Reserved Instances',
      'Analysing spend by cost allocation tag',
    ],
    whenNotToUse: [
      'Alerting when spend crosses a threshold — Budgets',
      'Line-item-level billing analysis — the Cost and Usage Report',
      'Instance-type right-sizing depth — Compute Optimizer',
    ],
    keyNumbers: [
      { label: 'History', value: 'Up to 12 months of history and 12 months of forecast' },
      { label: 'Granularity', value: 'Monthly, daily, and hourly (hourly is a paid option)' },
      { label: 'Recommendations', value: 'Savings Plans, Reserved Instances, and EC2 rightsizing' },
      {
        label: 'Cost allocation tags',
        value: 'Must be activated before they appear, and are not retroactive',
      },
    ],
    examTraps: [
      'Cost allocation tags are not retroactive. Activating them today does not reclassify last month — a detail worth remembering.',
      'Cost Explorer *analyses*; Budgets *alerts*. Questions offering both are testing that verb.',
      'Purchase recommendations come from Cost Explorer, not Trusted Advisor or Compute Optimizer.',
    ],
    confusedWith: [
      {
        slug: 'budgets',
        difference: 'Analysis and forecast versus threshold alerting and actions.',
      },
      {
        slug: 'cost-and-usage-report',
        difference: 'A curated console view versus the raw, complete line-item dataset.',
      },
    ],
    pricing: 'Free in the console; the API and hourly granularity are charged per request.',
    docsUrl: `${D}/cost-management/latest/userguide/ce-what-is.html`,
    related: [
      'budgets',
      'cost-and-usage-report',
      'savings-plans',
      'compute-optimizer',
      'trusted-advisor',
    ],
  },
  {
    slug: 'budgets',
    name: 'AWS Budgets',
    category: 'cost',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Set cost, usage, RI or Savings Plans thresholds and get alerted — or act.',
    whatItIs:
      'Threshold monitors on cost, usage, Reserved Instance coverage or Savings Plans utilisation, with alerts on actual *or forecast* breach. Budget Actions go further: they can apply an IAM or SCP restriction, or stop EC2 and RDS instances, when a threshold is crossed.',
    whyItExists:
      'Renting by the hour means a mistake keeps costing money quietly for as long as nobody looks, and the bill arrives a month after the decision that caused it. A forgotten NAT gateway or an oversized instance is invisible until it is expensive. Budgets exists to close that feedback loop to hours instead of weeks — which matters most to a learner, because the thing that makes people afraid to practise in a real account is not the cost but the not knowing.',
    whenToUse: [
      'Alerting before the bill becomes a surprise — the first thing to configure in any account',
      'Per-team or per-project spend limits, by tag or account',
      'Automatically stopping non-production resources when a budget is exceeded',
      'Monitoring commitment utilisation',
    ],
    whenNotToUse: ['Detailed spend analysis — Cost Explorer'],
    keyNumbers: [
      { label: 'Budget types', value: 'Cost · Usage · Savings Plans · Reservation' },
      { label: 'Alert basis', value: 'Actual or forecast spend' },
      { label: 'Budget Actions', value: 'Apply an IAM policy or SCP, or stop EC2/RDS instances' },
      { label: 'Free tier', value: 'The first two budgets are free' },
    ],
    examTraps: [
      'Forecast-based alerts warn you before the money is spent — the better answer when the requirement is "notify us before we exceed".',
      'Budget Actions are the answer to "automatically prevent further spending", not just notify.',
      'Billing data and Budgets live in the management account for an organisation.',
    ],
    confusedWith: [
      { slug: 'cost-explorer', difference: 'Alerting and enforcement versus analysis.' },
      {
        slug: 'cloudwatch',
        difference:
          'CloudWatch billing alarms are the older, coarser mechanism; Budgets is richer and supports actions.',
      },
    ],
    pricing: 'First two budgets free, then a small per-budget-day charge.',
    docsUrl: `${D}/cost-management/latest/userguide/budgets-managing-costs.html`,
    related: ['cost-explorer', 'cost-and-usage-report', 'organizations', 'sns'],
  },
  {
    slug: 'cost-and-usage-report',
    name: 'AWS Cost and Usage Report',
    abbr: 'CUR',
    category: 'cost',
    families: ['saa'],
    tier: 3,
    oneLiner: 'The complete, line-item billing dataset delivered to S3.',
    whatItIs:
      'The most granular billing data AWS produces — every line item, every hour, every resource, with tags and pricing metadata — delivered to an S3 bucket, typically queried with Athena or loaded into Redshift or QuickSight.',
    whenToUse: [
      'Custom chargeback or showback reporting',
      'Analysis beyond what Cost Explorer can express',
      'Feeding a third-party cost-management tool',
    ],
    whenNotToUse: ['Quick answers — Cost Explorer is far faster to use'],
    keyNumbers: [
      { label: 'Delivery', value: 'To S3, hourly or daily, in CSV or Parquet' },
      { label: 'Granularity', value: 'Per line item, per resource, per hour' },
      { label: 'Typical query path', value: 'Athena over the CUR in S3' },
    ],
    examTraps: [
      'The tell is "most detailed", "line item", "custom reporting" or "query the billing data with SQL".',
    ],
    confusedWith: [
      {
        slug: 'cost-explorer',
        difference: 'Raw complete dataset versus a curated interactive view.',
      },
    ],
    pricing: 'Free; you pay for S3 storage and the queries you run.',
    docsUrl: `${D}/cur/latest/userguide/what-is-cur.html`,
    related: ['cost-explorer', 'athena', 's3', 'quick-suite'],
  },
  {
    slug: 'savings-plans',
    name: 'Savings Plans & Reserved Instances',
    category: 'cost',
    families: ['saa'],
    tier: 1,
    oneLiner: 'Commit to steady usage for up to ~72% off — the main compute cost lever.',
    whatItIs:
      'Two ways to pre-commit. *Savings Plans* commit to a dollar-per-hour spend for one or three years: Compute Savings Plans are the most flexible (any instance family, Region, OS, and they cover Fargate and Lambda), EC2 Instance Savings Plans are cheaper but locked to a family and Region, and SageMaker Savings Plans cover SageMaker. *Reserved Instances* commit to specific instance attributes, and Convertible RIs can be exchanged. RIs can also be sold on the Marketplace; Savings Plans cannot.',
    whenToUse: [
      'Predictable, steady-state workloads running most of the time',
      'Baseline capacity, with Spot or On-Demand handling the peaks above it',
      'RDS, Redshift, ElastiCache and OpenSearch, which use Reserved Instances rather than Savings Plans',
    ],
    whenNotToUse: [
      'Interruptible batch work — Spot is far cheaper',
      'Genuinely unpredictable or short-lived workloads — a commitment you cannot use is wasted money',
      'Workloads you plan to re-architect within the term',
    ],
    keyNumbers: [
      {
        label: 'Discount',
        value: 'Up to ~72% versus On-Demand for a 3-year all-upfront commitment',
      },
      { label: 'Terms', value: '1 or 3 years · No Upfront, Partial Upfront, or All Upfront' },
      {
        label: 'Compute Savings Plans',
        value: 'Most flexible — any family, size, Region, OS, tenancy; covers Fargate and Lambda',
      },
      {
        label: 'EC2 Instance Savings Plans',
        value: 'Bigger discount, locked to one family in one Region',
      },
      {
        label: 'Standard vs Convertible RI',
        value: 'Standard discounts more; Convertible can be exchanged for different attributes',
      },
      { label: 'Sharing', value: 'Both apply across an Organizations family by default' },
      {
        label: 'Resale',
        value: 'Standard RIs can be sold on the Marketplace; Savings Plans cannot',
      },
    ],
    examTraps: [
      'Compute Savings Plans covering Fargate and Lambda is a commonly missed fact — they are not EC2-only.',
      'Savings Plans cannot be sold or cancelled. If flexibility to exit matters, Convertible RIs are the answer.',
      'The classic cost-optimised architecture is a Savings Plan or RI for the steady baseline, Spot for the elastic burst, and On-Demand for the rest.',
      'For RDS, Redshift, ElastiCache and OpenSearch, the mechanism is Reserved Instances — Savings Plans do not apply.',
      'Commitments are shared across the organisation by default, which is one of the practical reasons to consolidate billing.',
    ],
    confusedWith: [
      {
        slug: 'spot',
        difference:
          'Commitment with guaranteed capacity versus no commitment with interruption risk.',
      },
      {
        slug: 'cost-explorer',
        difference: 'Cost Explorer recommends which plan to buy; the plan is the purchase itself.',
      },
    ],
    pricing: 'A commitment that reduces the effective rate on covered usage.',
    docsUrl: `${D}/savingsplans/latest/userguide/what-is-savings-plans.html`,
    related: ['ec2', 'spot', 'cost-explorer', 'lambda', 'fargate', 'organizations'],
  },

  /* ── Machine Learning ───────────────────────────────────────────────────── */
  {
    slug: 'sagemaker',
    name: 'Amazon SageMaker AI',
    category: 'ml',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Build, train and deploy your own machine learning models.',
    whatItIs:
      'The full ML platform: notebooks, managed training jobs, hyperparameter tuning, model registry, and real-time, serverless, asynchronous or batch inference endpoints. On the Associate exam it is the answer whenever a *custom* model is required, as opposed to a ready-made AI API.',
    whenToUse: ['You need a model trained on your own data', 'End-to-end ML lifecycle management'],
    whenNotToUse: [
      'A standard task — transcription, translation, OCR, image labelling — that a purpose-built AI service already does',
    ],
    keyNumbers: [
      {
        label: 'Inference options',
        value: 'Real-time · Serverless · Asynchronous · Batch transform',
      },
    ],
    examTraps: [
      'If a named managed service already does the task (Rekognition, Transcribe, Comprehend), SageMaker is the over-engineered wrong answer.',
      'Serverless inference is the answer to "intermittent inference traffic, do not pay for idle endpoints".',
    ],
    confusedWith: [
      {
        slug: 'comprehend',
        difference: 'Pre-trained API for a standard task versus training your own model.',
      },
    ],
    pricing:
      'Per instance-hour for notebooks, training and endpoints, or per inference for serverless.',
    docsUrl: `${D}/sagemaker/latest/dg/whatis.html`,
    related: ['comprehend', 'rekognition', 's3', 'q-developer'],
  },
  {
    slug: 'comprehend',
    name: 'Amazon Comprehend',
    category: 'ml',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Natural language processing: sentiment, entities, key phrases, PII, language.',
    whatItIs:
      'A pre-trained NLP API that extracts sentiment, entities, key phrases, syntax, language and PII from text, with Comprehend Medical for clinical text.',
    whenToUse: [
      'Sentiment analysis of reviews or support tickets',
      'Entity and key-phrase extraction from documents',
      'Detecting and redacting PII in text',
    ],
    whenNotToUse: ['Custom models beyond its customisation features — SageMaker'],
    keyNumbers: [
      {
        label: 'Capabilities',
        value: 'Sentiment · entities · key phrases · language · PII · topic modelling',
      },
    ],
    examTraps: [
      'Text *meaning* is Comprehend. Text *from* audio is Transcribe; text *from* images is Textract.',
    ],
    confusedWith: [
      {
        slug: 'textract',
        difference:
          'Textract extracts text from documents; Comprehend interprets text you already have.',
      },
    ],
    pricing: 'Per unit of text analysed.',
    docsUrl: `${D}/comprehend/latest/dg/what-is.html`,
    related: ['textract', 'transcribe', 'translate', 'macie', 'sagemaker'],
  },
  {
    slug: 'rekognition',
    name: 'Amazon Rekognition',
    category: 'ml',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Image and video analysis: objects, faces, text, moderation.',
    whatItIs:
      'A pre-trained vision API for label detection, face detection and comparison, celebrity recognition, text in images, and unsafe-content moderation, over images and stored or streaming video.',
    whenToUse: [
      'Auto-tagging a media library',
      'Content moderation of user uploads',
      'Face-based verification',
      'Detecting text in images',
    ],
    whenNotToUse: ['Structured data extraction from forms and tables — Textract'],
    keyNumbers: [{ label: 'Inputs', value: 'Images, stored video, and Kinesis Video Streams' }],
    examTraps: [
      'Rekognition reads text *in a photo*; Textract reads *documents* with structure. Both find text — the exam distinguishes them by the input type.',
    ],
    confusedWith: [
      {
        slug: 'textract',
        difference: 'General images and video versus documents, forms and tables.',
      },
    ],
    pricing: 'Per image or per minute of video analysed.',
    docsUrl: `${D}/rekognition/latest/dg/what-is.html`,
    related: ['textract', 'kinesis-video-streams', 's3', 'lambda'],
  },
  {
    slug: 'textract',
    name: 'Amazon Textract',
    category: 'ml',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Extracts text, forms and tables from scanned documents.',
    whatItIs:
      'OCR that understands document structure — key–value pairs from forms, cells from tables, and specialised extraction for invoices, receipts and identity documents.',
    whenToUse: [
      'Digitising invoices, forms, contracts or receipts',
      'Replacing manual data entry from scans',
    ],
    whenNotToUse: [
      'Photos and video — Rekognition',
      'Interpreting the meaning of the resulting text — Comprehend',
    ],
    keyNumbers: [
      {
        label: 'Modes',
        value: 'Synchronous for single pages · asynchronous for multi-page documents',
      },
    ],
    examTraps: [
      'The tell is "forms", "tables", "invoices" or "scanned documents" — structure, not just characters.',
    ],
    confusedWith: [
      { slug: 'rekognition', difference: 'Documents with structure versus general images.' },
    ],
    pricing: 'Per page processed, by feature.',
    docsUrl: `${D}/textract/latest/dg/what-is.html`,
    related: ['comprehend', 'rekognition', 's3', 'lambda', 'step-functions'],
  },
  {
    slug: 'transcribe',
    name: 'Amazon Transcribe',
    category: 'ml',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Speech to text, batch or streaming.',
    whatItIs:
      'Automatic speech recognition with speaker identification, custom vocabularies, PII redaction and a medical variant.',
    whenToUse: [
      'Captioning and subtitles',
      'Call-centre transcription and analytics',
      'Making audio searchable',
    ],
    whenNotToUse: ['Text to speech — that is Polly, the inverse'],
    keyNumbers: [{ label: 'Modes', value: 'Batch and real-time streaming' }],
    examTraps: ['Transcribe is audio → text. Polly is text → audio. Do not mix the direction.'],
    confusedWith: [{ slug: 'polly', difference: 'Opposite directions of the same conversion.' }],
    pricing: 'Per second of audio.',
    docsUrl: `${D}/transcribe/latest/dg/what-is.html`,
    related: ['polly', 'translate', 'comprehend', 's3'],
  },
  {
    slug: 'polly',
    name: 'Amazon Polly',
    category: 'ml',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Text to lifelike speech, with SSML control.',
    whatItIs:
      'Speech synthesis in many languages and voices, including neural voices, with SSML for pronunciation and prosody, and speech marks for lip-sync or highlighting.',
    whenToUse: [
      'Read-aloud features and accessibility',
      'Voice responses in an application',
      'Generating audio versions of articles',
    ],
    whenNotToUse: ['Speech recognition — Transcribe'],
    keyNumbers: [
      { label: 'Features', value: 'Standard and neural voices · SSML · lexicons · speech marks' },
    ],
    examTraps: ['Text → audio. The inverse is Transcribe.'],
    confusedWith: [{ slug: 'transcribe', difference: 'Opposite directions.' }],
    pricing: 'Per character synthesised.',
    docsUrl: `${D}/polly/latest/dg/what-is.html`,
    related: ['transcribe', 'lex', 'translate'],
  },
  {
    slug: 'translate',
    name: 'Amazon Translate',
    category: 'ml',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Neural machine translation between languages.',
    whatItIs:
      'Real-time and batch translation across many language pairs, with custom terminology for brand and domain terms.',
    whenToUse: ['Localising user-generated content', 'Multilingual chat and support'],
    whenNotToUse: ['Sentiment or entity analysis — Comprehend'],
    keyNumbers: [
      {
        label: 'Features',
        value: 'Real-time and batch · custom terminology · active custom translation',
      },
    ],
    examTraps: [
      'A common pipeline chains Transcribe → Translate → Polly for cross-language audio.',
    ],
    confusedWith: [{ slug: 'comprehend', difference: 'Translation versus interpretation.' }],
    pricing: 'Per million characters.',
    docsUrl: `${D}/translate/latest/dg/what-is.html`,
    related: ['comprehend', 'transcribe', 'polly'],
  },
  {
    slug: 'lex',
    name: 'Amazon Lex',
    category: 'ml',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Conversational interfaces — chatbots and voice bots.',
    whatItIs:
      'Builds bots from intents, utterances and slots, with the same speech and language understanding technology behind Alexa, usually fulfilled by a Lambda function.',
    whenToUse: [
      'Customer-service chatbots',
      'Voice or text self-service flows',
      'Contact-centre automation with Amazon Connect',
    ],
    whenNotToUse: ['Document search — Kendra'],
    keyNumbers: [
      { label: 'Concepts', value: 'Intents · utterances · slots · fulfilment via Lambda' },
    ],
    examTraps: [
      'Lex is conversation; Kendra is search. Both answer questions, but only Lex holds a dialogue.',
    ],
    confusedWith: [
      {
        slug: 'kendra',
        difference: 'Dialogue and intent fulfilment versus ranked document retrieval.',
      },
    ],
    pricing: 'Per text or speech request.',
    docsUrl: `${D}/lexv2/latest/dg/what-is.html`,
    related: ['polly', 'lambda', 'kendra'],
  },
  {
    slug: 'kendra',
    name: 'Amazon Kendra',
    category: 'ml',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Natural-language enterprise search across your document repositories.',
    whatItIs:
      'An ML-powered search service with connectors to S3, SharePoint, Salesforce, Confluence and databases, returning direct answers rather than only a list of links, with access control respected per user.',
    whenToUse: [
      '"Search our internal documentation in plain English"',
      'Unified search across many content repositories',
    ],
    whenNotToUse: [
      'Application-level search over your own indexed data — OpenSearch is cheaper and more controllable',
    ],
    keyNumbers: [
      {
        label: 'Connectors',
        value: 'S3 · SharePoint · Salesforce · Confluence · databases and more',
      },
    ],
    examTraps: [
      'Kendra is natural-language *enterprise document* search. OpenSearch is a search engine you index yourself, and costs much less.',
    ],
    confusedWith: [
      {
        slug: 'opensearch',
        difference: 'Turnkey NLP document search versus a general-purpose search engine.',
      },
    ],
    pricing: 'Per index-hour by edition plus connector scans.',
    docsUrl: `${D}/kendra/latest/dg/what-is-kendra.html`,
    related: ['opensearch', 'lex', 's3'],
  },

  /* ── Media ──────────────────────────────────────────────────────────────── */
  {
    slug: 'elastic-transcoder',
    name: 'Amazon Elastic Transcoder',
    category: 'media',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Legacy media transcoding service for converting video formats.',
    whatItIs:
      'Converts media files in S3 into formats and bitrates suited to different devices, using pipelines and presets. AWS Elemental MediaConvert is its modern successor for new work.',
    whenToUse: ['Simple format conversion of files in S3'],
    whenNotToUse: ['New projects — AWS Elemental MediaConvert has broader features'],
    keyNumbers: [{ label: 'Concepts', value: 'Pipelines · jobs · presets' }],
    examTraps: [
      'It appears in the SAA in-scope list, so recognise it as "video transcoding" and move on.',
    ],
    confusedWith: [
      {
        slug: 'kinesis-video-streams',
        difference: 'Transcoding stored files versus ingesting live video streams.',
      },
    ],
    pricing: 'Per minute of output.',
    docsUrl: `${D}/elastictranscoder/latest/developerguide/introduction.html`,
    related: ['s3', 'kinesis-video-streams', 'lambda'],
  },
  {
    slug: 'kinesis-video-streams',
    name: 'Amazon Kinesis Video Streams',
    category: 'media',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Ingests, stores and indexes live video from cameras and devices.',
    whatItIs:
      'Securely streams video from millions of devices into AWS, with time-indexed durable storage and APIs for playback and frame-level access, commonly paired with Rekognition Video for analysis.',
    whenToUse: [
      'Security cameras, dashcams, drones and other device video',
      'Real-time computer vision on live video',
      'WebRTC two-way streaming',
    ],
    whenNotToUse: [
      'Video-on-demand delivery to viewers — S3 plus CloudFront',
      'Non-video data — Kinesis Data Streams',
    ],
    keyNumbers: [{ label: 'Playback', value: 'HLS, DASH and WebRTC' }],
    examTraps: [
      'The tell is *live* video ingestion from devices. Serving stored video to viewers is S3 plus CloudFront.',
    ],
    confusedWith: [
      {
        slug: 'kinesis-data-streams',
        difference: 'Video-specific ingestion and indexing versus generic record streaming.',
      },
    ],
    pricing: 'Per GB ingested, stored and consumed.',
    docsUrl: `${D}/kinesisvideostreams/latest/dg/what-is-kinesis-video.html`,
    related: ['kinesis-data-streams', 'rekognition', 's3', 'cloudfront'],
  },

  /* ── Cross-cutting foundations ──────────────────────────────────────────── */
  {
    slug: 'global-infrastructure',
    name: 'AWS Global Infrastructure',
    category: 'network',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner:
      'Regions, Availability Zones and edge locations — the geography every design rests on.',
    whatItIs:
      'A *Region* is a geographic area containing multiple isolated *Availability Zones*, each one or more discrete data centres with independent power, cooling and networking, connected to its siblings by low-latency links. *Edge locations* (hundreds of them) serve CloudFront and Global Accelerator. *Local Zones* extend a Region closer to a metro area; *Wavelength Zones* sit inside carrier networks. Nearly every resilience question is really a question about which of these boundaries a failure crosses.',
    whyItExists:
      'Every other AWS service is placed somewhere, and almost every design question is really about where — which failures a copy survives, which laws apply to it, and how far light has to travel to reach it. This entry exists because that vocabulary has to come first: Region, AZ and edge location are the coordinate system the rest of the atlas is written in, and a learner without it reads every resilience answer as a list of product names.',
    whenToUse: [
      'Multi-AZ for high availability within a Region — the default for anything production',
      'Multi-Region for disaster recovery, data residency, or global latency',
      'Edge locations for latency to end users',
      'Region choice driven by compliance, latency to users, service availability and price',
    ],
    whenNotToUse: [
      'Multi-Region complexity where multi-AZ already meets the requirement — it is a large step up in cost and effort',
    ],
    keyNumbers: [
      { label: 'AZs per Region', value: 'At least three in most Regions', volatile: true },
      {
        label: 'Inter-AZ latency',
        value: 'Single-digit milliseconds — synchronous replication is viable',
      },
      { label: 'Cross-AZ data transfer', value: 'Charged in both directions — a real cost factor' },
      {
        label: 'Region isolation',
        value:
          'Regions are independent by design; most services do not replicate across them automatically',
      },
      {
        label: 'Global services',
        value: 'IAM · Route 53 · CloudFront · WAF (for CloudFront) · Organizations',
      },
      {
        label: 'DR strategies',
        value:
          'Backup & restore (hours) → Pilot light → Warm standby → Multi-site active-active (near zero)',
      },
    ],
    examTraps: [
      'A subnet lives in exactly one AZ. Spreading a workload means multiple subnets, and this underpins most HA questions.',
      'Cross-AZ traffic costs money in both directions — why a single shared NAT gateway across three AZs is both a resilience and a cost problem.',
      'The four DR strategies map to RTO and RPO in a fixed order, and the exam gives you the numbers to choose: hours → backup and restore; tens of minutes → pilot light; minutes → warm standby; near zero → active-active.',
      'Data does not leave a Region unless you configure it to. That is the basis of every data-residency answer.',
      'Local Zones reduce latency to a specific metro; Wavelength targets 5G mobile; Outposts is your own premises. Three different answers to three different latency stories.',
    ],
    confusedWith: [
      {
        slug: 'vpc',
        difference:
          'A VPC is regional and spans the AZs you give it subnets in; the AZs themselves are AWS infrastructure.',
      },
      {
        slug: 'cloudfront',
        difference:
          'Edge locations are for caching and edge routing, not for running your workload.',
      },
    ],
    pricing:
      'No direct charge; Region choice affects service pricing, and cross-AZ and cross-Region transfer are billed.',
    docsUrl: 'https://aws.amazon.com/about-aws/global-infrastructure/',
    related: ['vpc', 'route53', 'cloudfront', 's3', 'rds', 'global-accelerator', 'outposts'],
  },
  {
    slug: 'timestream',
    name: 'Amazon Timestream',
    category: 'database',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Purpose-built time-series database for IoT and operational metrics.',
    whatItIs:
      'A serverless time-series database with automatic tiering from a fast in-memory store to cheap magnetic storage, and SQL with time-series functions like interpolation and smoothing built in.',
    whenToUse: [
      'IoT sensor readings, device telemetry, application metrics at scale',
      'Queries that are inherently about time windows and trends',
    ],
    whenNotToUse: [
      'General-purpose workloads — DynamoDB or RDS',
      'Analytics over non-time-series data — Redshift',
    ],
    keyNumbers: [
      {
        label: 'Tiering',
        value:
          'Memory store for recent data, magnetic store for history, with automatic transition',
      },
    ],
    examTraps: [
      'The tell is "time series", "IoT sensor data" or "metrics over time" as the primary shape of the data.',
    ],
    confusedWith: [
      {
        slug: 'dynamodb',
        difference:
          'DynamoDB can store time-series data but has no time-series query functions or automatic tiering.',
      },
    ],
    pricing: 'Per GB ingested, per GB-month stored by tier, and per GB scanned by queries.',
    docsUrl: `${D}/timestream/latest/developerguide/what-is-timestream.html`,
    related: ['dynamodb', 'kinesis-data-streams', 'managed-grafana'],
  },
]
