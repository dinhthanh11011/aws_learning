import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const storageServices: Service[] = [
  {
    slug: 's3',
    name: 'Amazon S3',
    abbr: 'S3',
    category: 'storage',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner:
      'Object storage with eleven nines of durability and a storage class for every access pattern.',
    whatItIs:
      'Objects (up to 5 TB each) in flat buckets, addressed by key, reached over HTTPS. There is no filesystem — the "folders" in the console are key prefixes. Durability comes from replication across at least three AZs within the Region. Almost every AWS data question touches S3, because it is the default landing zone for anything that is not a live database.',
    whenToUse: [
      'Static assets, backups, logs, data-lake storage, media, any blob a URL can point at',
      'Static website hosting, usually behind CloudFront',
      'The staging area between services: upload triggers Lambda, Athena queries in place, Glue crawls it',
      'Cross-Region or same-Region replication for DR and compliance',
    ],
    whenNotToUse: [
      'A filesystem your application mounts and does random writes into — that is EFS or FSx',
      'Boot volumes or block-level I/O — that is EBS',
      'A transactional database — object storage has no locking or query engine',
      'Frequent small appends: you cannot modify part of an object, only replace the whole thing',
    ],
    keyNumbers: [
      { label: 'Durability', value: '99.999999999% (11 nines) across ≥3 AZs' },
      { label: 'Max object size', value: '5 TB' },
      {
        label: 'Single PUT limit',
        value: '5 GB',
        note: 'Multipart upload is required above that, and recommended above 100 MB.',
      },
      {
        label: 'Request performance',
        value: '≥3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD per second, per prefix',
      },
      {
        label: 'Consistency',
        value: 'Strong read-after-write for all operations',
        note: 'Since December 2020 — older study material is wrong about this.',
      },
      { label: 'Standard-IA / One Zone-IA minimum', value: '30 days, 128 KB billed minimum' },
      { label: 'Glacier Instant Retrieval', value: '90-day minimum, millisecond retrieval' },
      {
        label: 'Glacier Flexible Retrieval',
        value: '90-day minimum · Expedited 1–5 min · Standard 3–5 h · Bulk 5–12 h',
      },
      {
        label: 'Glacier Deep Archive',
        value: '180-day minimum · Standard 12 h · Bulk 48 h',
        note: 'Cheapest storage AWS sells.',
      },
      {
        label: 'One Zone-IA availability',
        value: 'One AZ only — 20% cheaper than Standard-IA, and it is gone if that AZ is lost',
      },
    ],
    examTraps: [
      'Intelligent-Tiering is the answer whenever access patterns are described as "unknown", "changing" or "unpredictable". If the pattern *is* known, naming the class directly is cheaper — Intelligent-Tiering adds a per-object monitoring fee.',
      'Block Public Access at the account level overrides any bucket policy or ACL that grants public access. "The bucket policy allows it but it is still 403" is nearly always this.',
      'Presigned URLs are how you grant temporary access without making anything public, and they inherit the permissions of whoever signed them.',
      'Versioning cannot be switched off once enabled — only suspended. A delete on a versioned bucket writes a delete marker rather than removing data.',
      'MFA Delete requires the root user and can only be configured via the CLI or API, never the console.',
      'Replication needs versioning on both buckets, is asynchronous, and does not copy objects that already existed unless you run S3 Batch Replication.',
      'Object Lock in compliance mode cannot be shortened or removed by anyone, including root. That is the answer to WORM and regulatory-retention questions.',
      'Transfer Acceleration routes uploads over the CloudFront edge network — the answer for slow long-distance uploads. Multipart upload is the answer for large-file throughput. They solve different problems.',
      'Requester Pays shifts data-transfer and request charges to the caller — the answer when you publish a large dataset and do not want the egress bill.',
      'S3 Standard has no minimum duration or retrieval fee. Every other class has at least one, which is what makes lifecycle timing questions non-obvious.',
    ],
    confusedWith: [
      {
        slug: 'ebs',
        difference:
          'EBS is a block device attached to one instance (or a few, with Multi-Attach); S3 is an HTTP API reachable by anything with credentials.',
      },
      {
        slug: 'efs',
        difference:
          'EFS is a POSIX filesystem many instances mount concurrently; S3 has no filesystem semantics at all.',
      },
      {
        slug: 's3-glacier',
        difference:
          'Glacier is a family of S3 storage classes, not a separate service any more. Same bucket, colder tiers.',
      },
    ],
    pricing:
      'Per GB-month by storage class, plus requests, plus data transfer out, plus retrieval fees and early-deletion charges on the colder classes.',
    docsUrl: `${D}/AmazonS3/latest/userguide/Welcome.html`,
    related: [
      's3-glacier',
      'cloudfront',
      'kms',
      'athena',
      'backup',
      'storage-gateway',
      'datasync',
      'lambda',
    ],
  },
  {
    slug: 's3-glacier',
    name: 'Amazon S3 Glacier storage classes',
    abbr: 'Glacier',
    category: 'storage',
    certs: ['SAA-C03'],
    tier: 1,
    oneLiner: 'Archive tiers: minutes to hours to retrieve, and very cheap to keep.',
    whatItIs:
      'Three archival storage classes inside S3. Glacier Instant Retrieval keeps millisecond access at a much lower storage price. Glacier Flexible Retrieval trades access time for cost. Glacier Deep Archive is the cheapest storage AWS offers, at the price of a 12–48 hour wait. The trade is always the same: storage cost down, retrieval time and retrieval cost up.',
    whenToUse: [
      'Long-term retention where retrieval is rare: compliance archives, old backups, raw logs',
      'Deep Archive for the seven-year regulatory tail you hope never to read',
      'Instant Retrieval for archives that must still open immediately when someone does ask',
    ],
    whenNotToUse: [
      'Anything read regularly — retrieval fees will exceed what you saved',
      'Data younger than the minimum duration, where early deletion is charged in full',
    ],
    keyNumbers: [
      { label: 'Instant Retrieval', value: 'Milliseconds · 90-day minimum' },
      {
        label: 'Flexible Retrieval',
        value: 'Expedited 1–5 min · Standard 3–5 h · Bulk 5–12 h (free) · 90-day minimum',
      },
      { label: 'Deep Archive', value: 'Standard 12 h · Bulk 48 h · 180-day minimum' },
      {
        label: 'Expedited capacity',
        value: 'Provisioned capacity units guarantee expedited retrievals during a spike',
      },
    ],
    examTraps: [
      'Match the retrieval window to the requirement exactly. "Within 12 hours" fits Deep Archive Standard; "within an hour" does not, and needs Flexible Expedited.',
      'You cannot use a lifecycle rule to move data to a *warmer* class. Transitions only go one way, from hot to cold.',
      'Lifecycle transitions must respect the minimum durations — S3 will not let you chain Standard-IA (30 days) into Glacier before day 30 in a way that dodges the charge.',
      'S3 Glacier the standalone service (with vaults and Vault Lock) still exists but the exam almost always means the S3 storage classes.',
    ],
    confusedWith: [
      {
        slug: 's3',
        difference: 'Same service and same bucket — Glacier classes are just colder tiers of S3.',
      },
      {
        slug: 'backup',
        difference:
          'AWS Backup orchestrates backup jobs and retention policies across services; Glacier is only where cold bytes sit.',
      },
    ],
    pricing:
      'Very low per GB-month, offset by retrieval fees, per-request fees and early-deletion charges.',
    docsUrl: `${D}/AmazonS3/latest/userguide/storage-class-intro.html`,
    related: ['s3', 'backup', 'snow-family'],
  },
  {
    slug: 'ebs',
    name: 'Amazon EBS',
    abbr: 'EBS',
    category: 'storage',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner: 'Network-attached block volumes for EC2 — the disk that survives a stop.',
    whatItIs:
      'Durable block storage replicated within a single Availability Zone and attached over the network to an instance. Volume type is the whole decision: gp3 for general purpose, io1/io2 for high sustained IOPS, st1 for throughput-heavy sequential work, sc1 for cold. Snapshots are incremental, stored in S3, and are how a volume crosses an AZ or Region boundary.',
    whenToUse: [
      'Boot volumes and any single-instance filesystem',
      'Self-managed databases on EC2 that need consistent low-latency block I/O',
      'Workloads needing provisioned IOPS guarantees',
    ],
    whenNotToUse: [
      'Shared access from many instances — EBS attaches to one instance at a time (io1/io2 Multi-Attach is a narrow exception, same AZ only)',
      'Cross-AZ access: a volume cannot leave its AZ. Snapshot and restore instead',
      'Cheap bulk archive — S3 is an order of magnitude cheaper',
    ],
    keyNumbers: [
      { label: 'gp3 baseline', value: '3,000 IOPS and 125 MB/s included, independent of size' },
      { label: 'gp3 maximum', value: '16,000 IOPS · 1,000 MB/s' },
      { label: 'gp2 (legacy)', value: '3 IOPS per GB, burst to 3,000 — performance tied to size' },
      { label: 'io2 Block Express', value: 'Up to 256,000 IOPS · 4,000 MB/s · 64 TiB' },
      { label: 'io2 durability', value: '99.999%', note: 'Versus 99.8–99.9% for gp2/gp3.' },
      { label: 'st1 / sc1', value: 'HDD, throughput-optimised and cold — cannot be boot volumes' },
      { label: 'Max volume size', value: '64 TiB for io2 Block Express, 16 TiB for gp2/gp3' },
      { label: 'Snapshots', value: 'Incremental, stored in S3, copyable across Regions' },
    ],
    examTraps: [
      'gp3 is cheaper than gp2 and lets you raise IOPS without growing the volume. "We need more IOPS but not more space" means gp3 or io2, never a bigger gp2.',
      'st1 and sc1 cannot boot an instance. A question offering sc1 for a root volume is offering a wrong answer.',
      'Encrypting an existing unencrypted volume is not an in-place operation: snapshot it, copy the snapshot with encryption enabled, restore. Once encrypted, snapshots and restores stay encrypted.',
      'EBS is single-AZ. "Volume must survive an AZ failure" points to snapshots, or to EFS instead.',
      'A gp2 volume hitting its burst-credit floor is the hidden cause in "was fast, now slow" questions — the same shape as T-instance CPU credits.',
      'Deleting a snapshot does not break later snapshots, even though they are incremental. AWS keeps the blocks the later ones need.',
    ],
    confusedWith: [
      {
        slug: 'instance-store',
        difference:
          'Instance store is physically attached, faster, and erased on stop or terminate. EBS is network-attached and persists.',
      },
      {
        slug: 'efs',
        difference:
          'EFS is shared, multi-AZ and grows automatically; EBS is one-instance, one-AZ and fixed-size until you modify it.',
      },
    ],
    pricing:
      'Per GB-month provisioned (not used), plus provisioned IOPS and throughput above the included baseline, plus snapshot storage.',
    docsUrl: `${D}/ebs/latest/userguide/what-is-ebs.html`,
    related: ['ec2', 'instance-store', 'efs', 'backup', 'kms', 's3'],
  },
  {
    slug: 'instance-store',
    name: 'EC2 Instance Store',
    category: 'storage',
    certs: ['SAA-C03'],
    tier: 2,
    oneLiner: 'Physically attached NVMe/SSD — fastest, and wiped when the instance stops.',
    whatItIs:
      'Block storage on disks physically inside the host. Nothing is on the network, so latency and IOPS beat EBS by a wide margin. The data does not survive a stop, a hibernate, a terminate, or a host failure.',
    whenToUse: [
      'Scratch space, temporary files, caches, spill-to-disk for a query engine',
      'Replicated distributed stores (Cassandra, Kafka) where the cluster already holds another copy',
      'Buffers where losing the data on restart is acceptable by design',
    ],
    whenNotToUse: [
      'Anything that must survive a stop or a host failure',
      'Data with no second copy elsewhere',
    ],
    keyNumbers: [
      {
        label: 'Persistence',
        value: 'Lost on stop, hibernate, terminate or host failure',
        note: 'A reboot preserves it.',
      },
      { label: 'Snapshots', value: 'Not supported — copy to EBS or S3 yourself' },
      { label: 'Cost', value: 'Included in the instance price' },
    ],
    examTraps: [
      'The exam signal is "highest possible IOPS", "temporary", "scratch" or "buffer" plus tolerance of loss. If durability appears anywhere in the requirement, it is not instance store.',
      'Only certain instance families include it (i, d, and the "d" suffix variants). You cannot add it to an instance that does not have it.',
    ],
    confusedWith: [
      {
        slug: 'ebs',
        difference:
          'EBS persists across stops and can be snapshotted; instance store cannot do either.',
      },
    ],
    pricing: 'No separate charge — bundled into the instance price.',
    docsUrl: `${D}/ec2/latest/userguide/InstanceStorage.html`,
    related: ['ebs', 'ec2'],
  },
  {
    slug: 'efs',
    name: 'Amazon EFS',
    abbr: 'EFS',
    category: 'storage',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner: 'Elastic NFS filesystem that many Linux instances mount at once, across AZs.',
    whatItIs:
      'A managed NFSv4 filesystem. It grows and shrinks automatically with no capacity to provision, and thousands of clients — EC2, ECS, EKS, Lambda — can mount it concurrently. You reach it through mount targets, one per AZ, each with its own security group.',
    whenToUse: [
      'Shared content across a fleet: web assets, uploads, a CMS content directory',
      'Lift-and-shift of an application expecting a POSIX filesystem it can write to from several servers',
      'Shared state for containers or Lambda functions that need a real filesystem',
      'Home directories and shared development environments',
    ],
    whenNotToUse: [
      'Windows workloads — that is FSx for Windows File Server',
      'Boot volumes or the lowest-latency block I/O — that is EBS',
      'Cheap object storage where no filesystem is needed — S3 costs far less',
      'High-performance computing scratch at scale — FSx for Lustre',
    ],
    keyNumbers: [
      {
        label: 'Storage classes',
        value: 'Standard (multi-AZ) · One Zone (single AZ, ~47% cheaper)',
      },
      {
        label: 'Lifecycle management',
        value: 'Automatic transition to Infrequent Access and Archive after a set idle period',
      },
      { label: 'Throughput modes', value: 'Elastic (recommended) · Provisioned · Bursting' },
      {
        label: 'Performance modes',
        value:
          'General Purpose (default, lowest latency) · Max I/O (higher throughput, higher latency)',
      },
      { label: 'Protocol', value: 'NFSv4.1 / NFSv4.0 — Linux only' },
      {
        label: 'Encryption',
        value: 'At rest via KMS, in transit via TLS with the EFS mount helper',
      },
    ],
    examTraps: [
      'EFS is Linux only. Any mention of Windows or SMB rules it out and points to FSx for Windows File Server.',
      'The two security groups matter: the instance SG must allow outbound NFS (2049), and the mount target SG must allow inbound 2049 from the instance SG. "Mount hangs" is nearly always this.',
      'EFS is regional with a mount target per AZ, so it survives an AZ loss — the reason it beats EBS in HA questions about shared files.',
      'EFS One Zone plus lifecycle policies is the standard "cut our EFS bill" answer, at the cost of AZ resilience.',
      'EFS Access Points enforce a POSIX user and a root directory per application — the least-privilege answer for multi-tenant filesystems.',
    ],
    confusedWith: [
      {
        slug: 'fsx',
        difference:
          'FSx offers Windows/SMB, Lustre, NetApp ONTAP and OpenZFS. EFS is only NFS for Linux.',
      },
      { slug: 'ebs', difference: 'EBS is one instance, one AZ. EFS is many instances across AZs.' },
      {
        slug: 's3',
        difference:
          'EFS gives POSIX file semantics and in-place writes; S3 gives whole-object PUT and GET.',
      },
    ],
    pricing:
      'Per GB-month by storage class, plus throughput if provisioned. No pre-provisioned capacity.',
    docsUrl: `${D}/efs/latest/ug/whatisefs.html`,
    related: ['ebs', 'fsx', 's3', 'ec2', 'lambda', 'datasync'],
  },
  {
    slug: 'fsx',
    name: 'Amazon FSx',
    abbr: 'FSx',
    category: 'storage',
    certs: ['SAA-C03'],
    tier: 1,
    oneLiner: 'Four managed third-party filesystems: Windows, Lustre, NetApp ONTAP, OpenZFS.',
    whatItIs:
      'A family, and the exam tests you on picking the right member. FSx for Windows File Server gives SMB with Active Directory integration. FSx for Lustre gives HPC-grade parallel throughput with an S3 link. FSx for NetApp ONTAP gives multi-protocol access plus ONTAP features like snapshots and dedup. FSx for OpenZFS gives ZFS semantics with low-latency NFS.',
    whenToUse: [
      'Windows File Server: SMB shares, AD-joined, Windows ACLs, DFS namespaces',
      'Lustre: machine learning training, genomics, seismic and other HPC reading from S3 at hundreds of GB/s',
      'NetApp ONTAP: migrating an on-premises NetApp estate, or needing NFS and SMB and iSCSI on one volume',
      'OpenZFS: moving Linux NFS workloads that rely on ZFS snapshots and compression',
    ],
    whenNotToUse: [
      'Plain Linux NFS with no special requirements — EFS is simpler and cheaper',
      'Object storage needs — S3',
    ],
    keyNumbers: [
      { label: 'FSx for Windows', value: 'SMB · AD-integrated · Single-AZ or Multi-AZ' },
      {
        label: 'FSx for Lustre',
        value: 'Scratch (no replication, cheapest) or Persistent (replicated)',
      },
      { label: 'Lustre + S3', value: 'Links to an S3 bucket and lazily loads objects as files' },
      { label: 'ONTAP protocols', value: 'NFS, SMB and iSCSI on the same filesystem' },
    ],
    examTraps: [
      'Windows or SMB or Active Directory in the question means FSx for Windows File Server. This is the single most common FSx question.',
      'HPC, ML training or "process data in S3 at extreme throughput" means FSx for Lustre.',
      'Lustre Scratch has no replication — it is for temporary processing where the source of truth is still in S3.',
      '"Existing NetApp / ONTAP investment" or "needs NFS *and* SMB" means FSx for NetApp ONTAP.',
    ],
    confusedWith: [
      {
        slug: 'efs',
        difference:
          'EFS is Linux NFS only. FSx covers Windows SMB, Lustre HPC and multi-protocol ONTAP.',
      },
      {
        slug: 'storage-gateway',
        difference:
          'Storage Gateway bridges on-premises systems to AWS storage. FSx is a filesystem living in AWS (FSx File Gateway is the hybrid crossover).',
      },
    ],
    pricing: 'Per GB-month plus provisioned throughput, varying by filesystem type and deployment.',
    docsUrl: `${D}/fsx/latest/WindowsGuide/what-is.html`,
    related: ['efs', 's3', 'directory-service', 'datasync', 'storage-gateway'],
  },
  {
    slug: 'storage-gateway',
    name: 'AWS Storage Gateway',
    category: 'storage',
    certs: ['SAA-C03'],
    tier: 2,
    oneLiner:
      'On-premises appliance that presents AWS storage as local NFS, SMB, iSCSI or a tape library.',
    whatItIs:
      'A virtual (or hardware) appliance in your data centre that speaks a familiar local protocol on one side and S3 or EBS on the other, with a local cache for hot data. It is the standard answer to "keep our existing on-premises application unchanged but put the data in AWS".',
    whenToUse: [
      'S3 File Gateway: on-premises apps write to an NFS/SMB share, objects land in S3',
      'FSx File Gateway: low-latency on-premises access to an FSx for Windows filesystem',
      'Volume Gateway: iSCSI block volumes backed by S3, cached or stored mode',
      'Tape Gateway: replace a physical tape library while keeping the existing backup software',
    ],
    whenNotToUse: [
      'One-off or scheduled bulk transfers — DataSync is purpose-built and faster',
      'Petabyte offline migration — Snowball',
      'Cloud-native applications that can call S3 directly',
    ],
    keyNumbers: [
      { label: 'Volume Gateway cached', value: 'Primary data in S3, hot subset cached locally' },
      {
        label: 'Volume Gateway stored',
        value: 'Full dataset local, asynchronously backed up to S3 as EBS snapshots',
      },
      {
        label: 'Tape Gateway',
        value: 'Virtual tape library; tapes archive to Glacier / Deep Archive',
      },
    ],
    examTraps: [
      '"Existing backup software expecting a tape library" is always Tape Gateway.',
      '"Low-latency access to the whole dataset on premises, backed up to AWS" is Volume Gateway *stored*. "Dataset too big for local disk" is *cached*.',
      'Storage Gateway is for ongoing hybrid access. DataSync is for moving data. If the question says "migrate" or "one-time", it is DataSync or Snowball.',
    ],
    confusedWith: [
      {
        slug: 'datasync',
        difference:
          'DataSync is a transfer service for moving data on a schedule; Storage Gateway is a permanent protocol bridge with a cache.',
      },
      {
        slug: 'snow-family',
        difference:
          'Snow ships physical devices for offline bulk transfer; Storage Gateway runs over your network link.',
      },
    ],
    pricing:
      'Per GB of data stored in AWS plus per GB written through the gateway, plus the usual S3/EBS charges.',
    docsUrl: `${D}/storagegateway/latest/userguide/WhatIsStorageGateway.html`,
    related: ['s3', 'datasync', 'snow-family', 'fsx', 'backup', 'direct-connect'],
  },
  {
    slug: 'backup',
    name: 'AWS Backup',
    category: 'storage',
    certs: ['SAA-C03'],
    tier: 2,
    oneLiner:
      'One place to define backup plans, retention and cross-Region copies for many services.',
    whatItIs:
      'A policy engine for backups. You define a backup plan — schedule, retention, lifecycle to cold storage, cross-Region and cross-account copy — and apply it by tag or resource to EBS, RDS, Aurora, DynamoDB, EFS, FSx, S3, EC2, Storage Gateway volumes and more. Vault Lock gives you immutable, WORM-protected backups.',
    whenToUse: [
      'Centralised, auditable backup policy across services and accounts',
      'Compliance requirements for retention that must be provable',
      'Cross-Region copies for disaster recovery',
      'Organisation-wide backup policy enforced through AWS Organizations',
    ],
    whenNotToUse: [
      'A single resource where a native snapshot schedule is enough',
      'Continuous replication with a near-zero RPO — that is read replicas, S3 replication or Aurora Global Database',
    ],
    keyNumbers: [
      {
        label: 'Vault Lock',
        value:
          'Governance mode (breakable by privileged users) or Compliance mode (immutable, even to root)',
      },
      {
        label: 'Point-in-time restore',
        value: 'Supported for RDS, Aurora, DynamoDB, S3 and SAP HANA',
      },
      { label: 'Cross-account copy', value: 'Supported via AWS Organizations' },
    ],
    examTraps: [
      'Backup is about RPO measured in hours, and recovery you initiate. It is not a high-availability mechanism — do not answer an AZ-failover question with it.',
      'Vault Lock in compliance mode cannot be undone by anyone. That is the answer to "must be immutable for N years".',
      'Tag-based resource selection is how a backup plan covers resources created after the plan was written.',
    ],
    confusedWith: [
      {
        slug: 's3-glacier',
        difference:
          'Glacier is where cold bytes live; AWS Backup is the scheduler, policy and catalogue around them.',
      },
      {
        slug: 'dms',
        difference:
          'DMS migrates and replicates live databases; Backup takes point-in-time copies for restore.',
      },
    ],
    pricing: 'Per GB-month of backup storage plus restore charges, by resource type.',
    docsUrl: `${D}/aws-backup/latest/devguide/whatisbackup.html`,
    related: ['s3-glacier', 'ebs', 'rds', 'dynamodb', 'efs', 'organizations'],
  },
]
