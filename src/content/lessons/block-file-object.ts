import type { Lesson } from '../schema'

/**
 * Batch 3, first lesson, and the one the other two depend on: storage class and
 * durability questions both assume you have already stopped confusing the three
 * shapes. Almost every wrong answer in a storage question is a shape mismatch —
 * a filesystem offered where an object store was asked for — rather than a wrong
 * product, so the shapes have to land before any table of options does.
 *
 * Every fact is on the `ebs`, `efs`, `s3`, `instance-store` and `fsx` atlas
 * entries. The contribution is the order: one file is written once, and the
 * reader watches a second server in another AZ succeed against one of the two
 * and fail against the other, before the words "block" and "file" appear at all.
 */
export const blockFileObject: Lesson = {
  id: 'block-file-object',
  families: ['saa'],
  taskId: 'saa-3.1',
  cluster: 'storage',
  title: 'Block, file and object',
  subtitle:
    'Three shapes of storage, and the sentence in a requirement that picks each one. The wrong answer in a storage question is almost never the wrong product — it is the right product in the wrong shape.',
  minutes: 14,
  tier: 1,
  serviceSlugs: ['ebs', 'efs', 's3', 'instance-store', 'fsx'],
  requires: [],
  cardIds: [
    'vs:ebs:efs',
    'vs:s3:efs',
    'vs:s3:ebs',
    'vs:ebs:instance-store',
    'vs:efs:fsx',
    'num:ebs:max-volume-size',
    'num:ebs:snapshots',
    'num:efs:protocol',
    'num:s3:max-object-size',
    'num:instance-store:persistence',
    'trap:ebs:ebs-is-single-az-volume-must-survive-an-az-failure-points',
    'trap:efs:efs-is-linux-only-any-mention-of-windows-or-smb-rules-it-ou',
    'trap:efs:the-two-security-groups-matter-the-instance-sg-must-allow-o',
    'trap:instance-store:the-exam-signal-is-highest-possible-iops-temporary-sc',
    'which:ebs',
    'which:efs',
    'which:s3',
  ],

  sections: [
    /* ── 1. The hook: one file, and a question nobody asks early enough ──── */
    {
      kind: 'prose',
      md: 'An application writes one uploaded file to disk. That single line of code is identical whichever storage you gave it — and the difference only shows up later, when a **second server** goes looking for the same file. Step through what happens then, before any of the three has a name.',
    },

    /* ── 2. Watch the second server succeed and fail ─────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'bfo-second-server',
        title: 'The same write, and a second server in another AZ',
        caption:
          'Two parallel journeys that differ only in what sits at the junction. Advance it and watch which one the second server can reach.',
        // Template B, the fan-in-the-middle variant: the same journey twice with
        // a different object at the junction, which is exactly the comparison.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'upload',
            label: 'An upload',
            sub: 'one file',
            kind: 'data',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'ec2-a',
            label: 'App server A',
            sub: 'AZ a — writes it',
            kind: 'service',
            category: 'compute',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'ebs',
            label: 'EBS volume',
            sub: 'one instance, one AZ',
            kind: 'service',
            category: 'storage',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'efs',
            label: 'EFS filesystem',
            sub: 'a mount target per AZ',
            kind: 'service',
            category: 'storage',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'ec2-b-blocked',
            label: 'App server B',
            sub: 'AZ b',
            kind: 'service',
            category: 'compute',
            x: 17,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'ec2-b-mounts',
            label: 'App server B',
            sub: 'AZ b',
            kind: 'service',
            category: 'compute',
            x: 17,
            y: 5.7,
            w: 3,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'write', from: 'upload', to: 'ec2-a', label: 'the file', tone: 'info' },
          { id: 'toebs', from: 'ec2-a', to: 'ebs', label: 'write', tone: 'info' },
          { id: 'toefs', from: 'ec2-a', to: 'efs', label: 'write', tone: 'info' },
          { id: 'blocked', from: 'ebs', to: 'ec2-b-blocked', label: 'cross-AZ', tone: 'bad' },
          { id: 'mounted', from: 'efs', to: 'ec2-b-mounts', label: 'mounts it', tone: 'ok' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['write'],
            title: 'One file arrives, and the application saves it',
            detail:
              'Nothing in the application says which kind of storage is underneath. That is the whole reason this decision gets made by accident.',
            tone: 'info',
          },
          {
            edgeIds: ['toebs', 'toefs'],
            title: 'Both writes look the same from inside the instance',
            detail:
              'One lands on a volume the operating system formatted itself. The other lands on a directory that was already a filesystem when the instance mounted it. Same code, same path, same result — so far.',
            tone: 'info',
          },
          {
            edgeIds: ['blocked'],
            title: 'The volume cannot follow the file to the second server',
            detail:
              'An [[ebs|EBS]] volume attaches to **one instance at a time** and **cannot leave its Availability Zone**. Server B is in AZ b, so there is no configuration that attaches this volume to it — the answer is to snapshot and restore, which is a copy rather than the same data.',
            tone: 'bad',
          },
          {
            edgeIds: ['mounted'],
            title: 'The filesystem is already there for it',
            detail:
              '[[efs|EFS]] is Regional with a **mount target per Availability Zone**, so server B mounts the same filesystem and reads the file that server A wrote a moment ago. Thousands of clients can do this at once — EC2, ECS, EKS and Lambda.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the words',
      md: '[[ebs|EBS]] is **block** storage: a raw device the operating system formats and owns, which is why only one owner is allowed. [[efs|EFS]] is **file** storage: a filesystem that already exists, which many clients mount concurrently. The third shape has not appeared yet, because it is not on this picture at all.',
    },

    /* ── 3. The third shape, which is not a disk ─────────────────────────── */
    { kind: 'heading', text: 'The third shape is not attached to anything' },
    {
      kind: 'diagram',
      spec: {
        id: 'bfo-object',
        title: 'S3 is an API, not a device',
        caption:
          'Nothing is attached and nothing is mounted. Any client with credentials makes an HTTPS request — the bucket is not inside the VPC at all.',
        // Template C: two peers, one of them in a container and one deliberately
        // well clear of it, because "outside the VPC" is the teaching.
        cols: 11,
        rows: 3,
        nodes: [
          {
            id: 'ec2',
            label: 'Any client',
            sub: 'with credentials',
            kind: 'service',
            category: 'compute',
            x: 0.6,
            y: 1.4,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 's3',
            label: 'S3',
            sub: 'buckets and keys',
            kind: 'service',
            category: 'storage',
            x: 7.4,
            y: 1.4,
            w: 2.8,
            h: 1.3,
          },
        ],
        edges: [{ id: 'get', from: 'ec2', to: 's3', label: 'GetObject', tone: 'ok' }],
        groups: [{ id: 'vpc', label: 'Your VPC', kind: 'vpc', nodeIds: ['ec2'] }],
        steps: [],
      },
    },
    {
      kind: 'prose',
      md: '[[s3]] is **object** storage: objects of up to 5 TB in flat buckets, addressed by key and reached over HTTPS. There is no filesystem — the "folders" in the console are key prefixes — and durability comes from replication across at least three Availability Zones within the [[region|Region]]. Nothing mounts it, which is exactly why anything with credentials can read it from anywhere.',
    },

    /* ── 4. The three access paths, read out one line at a time ──────────── */
    {
      kind: 'code',
      lang: 'text',
      caption: 'The same file, saved three ways — this is the whole distinction',
      code: `BLOCK   the OS sees a device, and formats it itself
  $ lsblk
    nvme1n1  100G                          <-- an EBS volume, attached to this instance
  $ mkfs -t xfs /dev/nvme1n1
  $ mount /dev/nvme1n1 /data
  $ cp report.txt /data/report.txt

FILE    the OS mounts a filesystem that already exists
  $ mount -t nfs4 fs-0abc.efs.eu-west-1.amazonaws.com:/ /shared
  $ cp report.txt /shared/report.txt        <-- every other instance sees it now

OBJECT  no device, no mount, no path — an HTTPS request
  $ aws s3api put-object --bucket reports --key 2026/08/report.txt --body report.txt`,
    },
    {
      kind: 'steps',
      title: 'The same three commands, one at a time',
      items: [
        {
          title: 'mkfs only appears in the block case, and that is the definition',
          md: 'A block device arrives raw. You choose the filesystem, you own it, and the instance that formatted it is the one that understands it — which is why [[ebs|EBS]] attaches to a single instance at a time. `io1` and `io2` Multi-Attach is the narrow exception, and it is same-AZ only.',
        },
        {
          title: 'mount with no mkfs is the file case',
          md: 'The filesystem already exists and is somebody else’s job. [[efs|EFS]] speaks **NFSv4.1 / NFSv4.0**, which is a Linux protocol — any mention of Windows or SMB rules it out and points at [[fsx|FSx for Windows File Server]] instead.',
        },
        {
          title: 'The object case never touches the operating system',
          md: 'There is no path on the instance, so there is nothing to mount, nothing to format, nothing to size and nothing to attach. `2026/08/report.txt` is not a folder structure — it is one key, and the slashes are characters in it.',
        },
        {
          title: 'And that is why the third one grows on its own',
          md: 'An [[ebs|EBS]] volume has a size you chose. [[s3]] has none, and [[efs|EFS]] grows and shrinks with what is in it. When a requirement says storage must scale without anyone provisioning capacity, the block answer is already out.',
        },
      ],
    },

    /* ── 5. The wrong answer, written out ────────────────────────────────── */
    { kind: 'heading', text: 'The line people write when they think S3 is a disk' },
    {
      kind: 'code',
      lang: 'text',
      caption: 'Both of these are wrong, and neither is wrong for the reason people expect',
      code: `$ echo "one more line" >> s3://reports/2026/08/report.txt
                       ^^ there is no append —
     an object is replaced whole, every time

$ ls s3://reports/2026/08/
                  ^^^^^^^^ there is no directory here to list;
     that is the front of one key, and the slashes are characters in it`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'No folder, and no partial write',
      md: 'You cannot modify part of an object, only replace the whole thing — so **frequent small appends** are the one workload [[s3]] is genuinely bad at, and a question describing a log file being written to continuously by several servers is describing [[efs|EFS]]. Equally, a requirement for a filesystem the application mounts and does **random writes** into is EFS or [[fsx|FSx]], never S3 with a mount tool bolted on.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The fourth thing, which is block storage that does not survive a stop',
      md: '[[instance-store|Instance store]] is block storage on disks physically inside the host, so it beats EBS on latency and IOPS by a wide margin — and it is **lost on stop, hibernate, terminate or host failure** (a reboot preserves it). The exam signal is "highest possible IOPS", "temporary", "scratch" or "buffer" **plus** a stated tolerance of loss. If durability appears anywhere in the requirement, it is not instance store.',
    },

    /* ── 6. The head-to-head, last ───────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'What the requirement says, and which shape it is pointing at',
      columns: ['The answer', 'What rules the others out'],
      rows: [
        {
          label: '"Shared filesystem, several instances, no application change"',
          cells: [
            '[[efs|EFS]]',
            'EBS attaches to one instance at a time; S3 has no filesystem semantics at all',
          ],
        },
        {
          label: '"Boot volume", or consistent low-latency block I/O for a database on EC2',
          cells: [
            '[[ebs|EBS]], almost always gp3',
            'EFS is NFS over the network, and S3 is not a device — neither can boot anything',
          ],
        },
        {
          label: '"Windows", "SMB share", or an Active Directory-integrated file system',
          cells: [
            '[[fsx|FSx for Windows File Server]]',
            'EFS is NFS and Linux only, so the word Windows settles it on its own',
          ],
        },
        {
          label: '"HPC", "machine learning training", extreme throughput over data in S3',
          cells: [
            '[[fsx|FSx for Lustre]], linked to the bucket',
            'EFS does not reach the parallel throughput HPC questions describe',
          ],
        },
        {
          label: '"Scratch space" or "highest possible IOPS", and losing it is acceptable',
          cells: [
            '[[instance-store|Instance store]]',
            'EBS reaches the disk over the network, which is the cost this workload will not pay',
          ],
        },
        {
          label: 'Backups, logs, media, static assets — any blob a URL can point at',
          cells: [
            '[[s3]]',
            'A filesystem costs far more per GB, and nothing here needs to mount anything',
          ],
        },
        {
          label: '"The data must survive the loss of an Availability Zone"',
          cells: [
            '[[efs|EFS]], or [[ebs|EBS]] snapshots',
            'An EBS volume is single-AZ; instance store does not survive a stop, let alone an AZ',
          ],
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'The one failure that looks like a network fault',
      md: 'EFS needs **two** security groups to agree: the instance SG must allow outbound NFS on 2049, and the mount target SG must allow inbound 2049 from the instance SG. "The mount hangs" is nearly always this, and it is the reason the [[security-group|security group]] lesson is worth having read first.',
    },

    /* ── 7. Numbers, last of all ─────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'S3 max object size', value: '5 TB' },
        {
          label: 'S3 consistency',
          value: 'Strong read-after-write for all operations',
          note: 'Since December 2020 — older study material is wrong about this.',
        },
        {
          label: 'EBS max volume size',
          value: '64 TiB for io2 Block Express, 16 TiB for gp2/gp3',
        },
        {
          label: 'EBS snapshots',
          value: 'Incremental, stored in S3, copyable across Regions',
        },
        { label: 'EFS protocol', value: 'NFSv4.1 / NFSv4.0 — Linux only' },
        {
          label: 'Instance store persistence',
          value: 'Lost on stop, hibernate, terminate or host failure',
          note: 'A reboot preserves it.',
        },
      ],
    },

    /* ── 8. Next ─────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'The four storage shapes, end to end',
      slugs: ['ebs', 'efs', 's3', 'instance-store', 'fsx'],
    },
    {
      kind: 'prose',
      md: 'Once the shape is settled, the storage question is not finished — it has only narrowed. If the answer is [[s3]], the paper will then ask which **storage class**, and that is a different decision driven entirely by the access pattern. That is the next lesson, **S3 storage classes**.',
    },
  ],

  checks: [
    {
      id: 'block-file-object-shared',
      prompt:
        'Six EC2 instances across two Availability Zones run the same Linux CMS and must all read and write the same content directory, with no application change. Which storage?',
      options: [
        {
          text: 'EFS, mounted by all six instances',
          correct: true,
          why: 'Shared filesystem, several instances, no application change is the EFS signature. It is Regional, with a mount target per AZ, and thousands of clients can mount it concurrently.',
        },
        {
          text: 'One EBS volume attached to each instance, kept in step by a sync job',
          correct: false,
          why: 'A volume attaches to one instance at a time and cannot cross an AZ. Copies that are synchronised drift apart the moment anything is written.',
        },
        {
          text: 'An S3 bucket, mounted as a filesystem on each instance',
          correct: false,
          why: 'S3 has no filesystem semantics: no partial writes, no directories, no POSIX locking. A CMS writing into a content directory needs a real filesystem.',
        },
      ],
    },
    {
      id: 'block-file-object-append',
      prompt:
        'An application appends a few hundred bytes to the same log file every second, from three servers at once. Why is S3 the wrong home for that file?',
      options: [
        {
          text: 'You cannot modify part of an object — every append would rewrite the whole thing',
          correct: true,
          why: 'An object is replaced whole. Frequent small appends are the workload object storage is genuinely bad at, and the requirement is describing a shared filesystem.',
        },
        {
          text: 'S3 is eventually consistent, so the three servers would overwrite each other',
          correct: false,
          why: 'S3 has been strongly consistent for all operations since December 2020. The problem is the write shape, not the consistency model.',
        },
        {
          text: 'S3 objects are capped at 5 GB, which a busy log would exceed',
          correct: false,
          why: '5 GB is the single-PUT limit; an object can be 5 TB. Size is not what rules S3 out here.',
        },
      ],
    },
    {
      id: 'block-file-object-az',
      prompt:
        'A requirement says a self-managed database on EC2 must keep its data if the Availability Zone it is in is lost. The data is on an EBS volume today. What does that requirement actually point at?',
      options: [
        {
          text: 'Snapshots, which are stored in S3 and are Regional, or a move to EFS',
          correct: true,
          why: 'A volume cannot leave its AZ, so the volume itself can never satisfy this. Snapshots cross the boundary, and EFS is the shared, AZ-durable filesystem.',
        },
        {
          text: 'Attaching the same volume to a standby instance in the second AZ',
          correct: false,
          why: 'There is no such configuration. Even io1 and io2 Multi-Attach is same-AZ only.',
        },
        {
          text: 'Switching the volume to io2 Block Express for its 99.999% durability',
          correct: false,
          why: 'That raises durability within the AZ and changes nothing about losing the AZ. Durability and availability are different requirements.',
        },
      ],
    },
    {
      id: 'block-file-object-scratch',
      prompt:
        'A query engine spills intermediate results to disk and needs the highest possible IOPS. The spill files are regenerated on every restart. Which storage does that describe?',
      options: [
        {
          text: 'Instance store, on an instance family that includes it',
          correct: true,
          why: 'Scratch data plus highest possible IOPS plus an explicit tolerance of loss is the instance store signature — the disks are physically in the host, so nothing crosses the network.',
        },
        {
          text: 'A gp3 EBS volume with provisioned IOPS raised to its ceiling',
          correct: false,
          why: 'gp3 tops out at 16,000 IOPS and still reaches the disk over the network. The durability you would be paying for is worthless on data that is regenerated anyway.',
        },
        {
          text: 'EFS in Elastic throughput mode',
          correct: false,
          why: 'EFS is a shared network filesystem. Nothing here needs sharing, and NFS is the wrong shape for the lowest-latency spill.',
        },
      ],
    },
  ],
}
