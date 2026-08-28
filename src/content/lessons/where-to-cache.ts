import type { Lesson } from '../schema'

/**
 * Four caches turn up as four plausible options in one question, and the thing
 * that separates them is not what they store — it is how far from the user the
 * answer already exists. So the first diagram is one request walking inward,
 * stopping at whichever layer already has it, and the word "cache" is not
 * defined until the reader has watched three of them decline to answer.
 *
 * The second walkthrough is lazy loading against write-through, because that
 * trade-off is asked directly and it is a *sequence* — a write, then a read —
 * which is precisely what a table cannot show and a walkthrough can.
 *
 * `compare` last, on the axis the atlas cannot render: the requirement quoted
 * in a stem, and which of the four caches it is pointing at. The `optionSet`
 * on `api-gateway` already holds the REST/HTTP table (invariant 21), so the
 * only thing borrowed from it here is the one line that decides a cache
 * question — HTTP APIs cannot cache.
 */
export const whereToCache: Lesson = {
  id: 'where-to-cache',
  families: ['saa', 'dva'],
  taskId: 'saa-3.3',
  cluster: 'data-and-cost',
  title: 'Four caches, four distances from the user',
  subtitle:
    'CloudFront, API Gateway, ElastiCache and DAX all answer "make it faster and cheaper", and they turn up together as four options in one question. What separates them is not what they store — it is how far the request has already travelled before something can say yes.',
  minutes: 16,
  tier: 1,
  serviceSlugs: ['cloudfront', 'elasticache', 'dynamodb', 'api-gateway'],
  requires: [],
  cardIds: [
    'idea:edge-location',
    'define:edge-location',
    'trap:concept:edge-location:cloudfront-in-front-of-an-s3-bucket-is-a-latency-and-cost-an',
    'trap:concept:edge-location:regional-edge-caches-sit-between-edge-locations-and-your-ori',
    'vs:concept:edge-location:region',
    'idea:cache-ttl-and-invalidation',
    'define:cache-ttl-and-invalidation',
    'num:concept:cache-ttl-and-invalidation:route-53-ttl',
    'num:concept:cache-ttl-and-invalidation:cache-control',
    'trap:concept:cache-ttl-and-invalidation:versioned-object-names-beat-invalidation-invalidation-costs',
    'trap:concept:cache-ttl-and-invalidation:a-cache-in-front-of-a-database-hides-the-problem-when-the-re',
    'num:cloudfront:ttls',
    'num:cloudfront:invalidation',
    'num:cloudfront:certificates',
    'num:cloudfront:origin-access-control-oac',
    'trap:cloudfront:cache-key-configuration-decides-your-hit-ratio-forwarding-a',
    'trap:cloudfront:versioned-object-names-app-v2-js-are-cheaper-and-more-re',
    'trap:cloudfront:cloudfront-reduces-cost-as-well-as-latency-origin-egress-to',
    'vs:cloudfront:elasticache',
    'vs:cloudfront:global-accelerator',
    'num:elasticache:memcached',
    'num:elasticache:redis-valkey',
    'num:elasticache:latency',
    'trap:elasticache:anything-requiring-high-availability-failover-persistence',
    'trap:elasticache:lazy-loading-only-caches-on-a-miss-stale-data-risk-no-wast',
    'trap:elasticache:elasticache-is-not-a-database-a-question-about-durable-stor',
    'trap:elasticache:storing-session-state-in-elasticache-is-the-standard-answer',
    'vs:elasticache:dynamodb',
    'num:dynamodb:dax',
    'trap:dynamodb:dax-accelerates-reads-only-and-only-through-the-dax-endpo',
    'num:api-gateway:caching',
    'opt:api-gateway:api-type:http-api',
    'trap:opt:api-gateway:api-type:http-api',
    'trigger:t-read-heavy',
    'trigger:t-no-code-change',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'A cache question never says "cache". It says the same reads repeat, or the origin is under load, or users on another continent are waiting — and then it offers you [[cloudfront]], [[elasticache]], an [[api-gateway|API Gateway]] cache and DAX as four options that are all, in the abstract, correct. The one the paper wants is decided by a single thing: **where the request has already got to before anything can answer it.**',
    },

    /* ── 2. Show it before naming it ──────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'wtc-inward',
        title: 'One request from Sydney, travelling until something can answer',
        caption:
          'Each layer it passes is a chance to stop. Every hop it survives is latency the user waits for and work the origin has to do — which is why the question is always how far in the answer already lives.',
        // Template B, left-to-right chain fanning out at the end.
        cols: 19,
        rows: 8,
        nodes: [
          {
            id: 'user',
            label: 'User in Sydney',
            sub: 'asks for a page',
            kind: 'user',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'cloudfront',
            label: 'CloudFront edge',
            sub: 'hundreds of cities',
            kind: 'service',
            category: 'network',
            x: 5.4,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'api-gateway',
            label: 'API Gateway',
            sub: 'in the Region',
            kind: 'service',
            category: 'serverless',
            x: 10.4,
            y: 3.3,
            w: 3,
            h: 1.3,
          },
          {
            id: 'elasticache',
            label: 'ElastiCache',
            sub: 'in your VPC',
            kind: 'service',
            category: 'database',
            x: 15.2,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'database',
            label: 'The database',
            sub: 'the only durable copy',
            kind: 'data',
            x: 15.2,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'to-edge', from: 'user', to: 'cloudfront', label: 'GET', tone: 'default' },
          { id: 'to-region', from: 'cloudfront', to: 'api-gateway', label: 'a miss', tone: 'warn' },
          {
            id: 'to-cache',
            from: 'api-gateway',
            to: 'elasticache',
            label: 'ask memory',
            tone: 'ok',
          },
          {
            id: 'to-db',
            from: 'api-gateway',
            to: 'database',
            label: 'ask disk',
            tone: 'warn',
          },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['to-edge'],
            title: 'The request stops at the nearest edge location, if the object is there',
            detail:
              'An edge location is a small site close to users — there are far more of them than there are Regions — and it caches content and terminates the connection. A hit here costs no origin transfer at all, which is why a CDN in front is usually both faster **and** cheaper.',
            tone: 'ok',
          },
          {
            edgeIds: ['to-region'],
            title: 'On a miss it crosses the ocean once, to the Region, and reaches the API',
            detail:
              'A REST API can hold its own response cache — **0.5 GB to 237 GB, with a TTL up to 3,600 seconds** — so a repeated call with the same parameters can be answered here without your code running at all.',
            tone: 'warn',
          },
          {
            edgeIds: ['to-cache'],
            title: 'Past that, the application asks memory before it asks disk',
            detail:
              'ElastiCache sits inside the VPC and answers in **sub-millisecond, typically microsecond** time. This is the layer that removes repeated database work rather than spreading it — and the one your code has to be written to consult.',
            tone: 'ok',
          },
          {
            edgeIds: ['to-db'],
            title: 'And only what nothing else could answer reaches the database',
            detail:
              'Every layer above exists to make this arrow rare. Note what has *not* happened: nothing here is durable except this last box. A cache is not a system of record, and a question about storing the data is not answered by any of the three boxes to its left.',
            tone: 'warn',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the names, in order of distance',
      md: 'The [[edge-location|edge]] shortens the **network path**, not the compute — it helps either by serving a cached copy or by getting the request onto the AWS backbone sooner. [[cloudfront]] caches HTTP responses out there for your users; [[elasticache]] caches data in here for your application. **DAX** is the odd one: an in-memory cache in front of [[dynamodb]] giving microsecond reads, reached through its own endpoint, which means it caches without your code learning any cache logic. And every one of them holds a copy for as long as its [[cache-ttl-and-invalidation|TTL]] says — the layers stack, and the user sees the sum.',
    },

    /* ── 3. The trade-off that is a sequence, not a table ─────────────────── */
    { kind: 'heading', text: 'How the copy gets there in the first place' },
    {
      kind: 'diagram',
      spec: {
        id: 'wtc-populate',
        title: 'A write, then a read of the same item, under each strategy',
        caption:
          'The same two operations in the same order. The only difference is whether the write bothered to touch the cache on its way past.',
        // Template B, fan-in-the-middle: the same journey, differing at one point.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'client',
            label: 'Write, then read',
            sub: 'the same item',
            kind: 'user',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'app',
            label: 'Your application',
            sub: 'owns the cache logic',
            kind: 'note',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'lazy',
            label: 'Lazy loading',
            sub: 'write skips the cache',
            kind: 'note',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'through',
            label: 'Write-through',
            sub: 'write fills the cache',
            kind: 'note',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'miss',
            label: 'The read misses',
            sub: 'and then caches',
            kind: 'note',
            x: 17,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'warm',
            label: 'The read hits',
            sub: 'already warm',
            kind: 'note',
            x: 17,
            y: 5.7,
            w: 3,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'send', from: 'client', to: 'app', label: 'PUT, GET', tone: 'default' },
          { id: 'pick-lazy', from: 'app', to: 'lazy', label: 'on write', tone: 'warn' },
          { id: 'pick-through', from: 'app', to: 'through', label: 'on write', tone: 'ok' },
          { id: 'then-miss', from: 'lazy', to: 'miss', label: 'on read', tone: 'warn' },
          { id: 'then-hit', from: 'through', to: 'warm', label: 'on read', tone: 'ok' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['send'],
            title: 'The client writes an item and immediately reads it back',
            detail:
              'Both strategies are code you write, in the application. Neither is a setting on the cache, which is the first reason this is a design decision rather than a configuration one.',
            tone: 'default',
          },
          {
            edgeIds: ['pick-lazy', 'then-miss'],
            title: 'Lazy loading caches nothing on a write, so the read pays for the miss',
            detail:
              'Only data somebody has actually asked for is ever stored, so no memory is wasted on items nobody reads — but the first read after every write is slow, and until it happens the cache holds a stale copy or none at all.',
            tone: 'warn',
          },
          {
            edgeIds: ['pick-through', 'then-hit'],
            title:
              'Write-through fills the cache as part of the write, so the read is already warm',
            detail:
              'Always fresh, and the read never pays. The cost is memory spent on items that may never be read, and a slower write. A **TTL** is what bounds staleness in either case, which is why the answer to most questions is lazy loading plus a TTL.',
            tone: 'ok',
          },
        ],
      },
    },

    /* ── 4. The wrong answer, as real syntax ──────────────────────────────── */
    { kind: 'heading', text: 'The staleness question, and what people type for it' },
    {
      kind: 'code',
      lang: 'bash',
      caption: 'A deployment went out and users are still running last week’s JavaScript',
      code: `# "The edge is serving the old file, so purge the edge"
aws cloudfront create-invalidation --distribution-id E1EXAMPLE --paths '/*'
                                                               ^^^^^^^^^^^^
     The first 1,000 paths a month are free and it is charged after that,
     it takes minutes to propagate, and it throws away every warm object
     at every edge location — not just the one that went stale.`,
    },
    {
      kind: 'code',
      lang: 'html',
      caption: 'What the exam prefers instead: give the new file a new name',
      code: `<script src="/static/app.a9f3c1.js"></script>
                         ^^^^^^
     A different URL is a different object, so there is nothing at any
     edge to invalidate and nothing in any browser to expire. Instant,
     free, and it works for the copies you do not control.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Versioned object names beat invalidation, and the exam says so',
      md: 'Invalidation costs money and takes minutes; changing the URL is instant and free. The same logic runs one layer up: **lowering a DNS TTL has to happen before a failover, not during it**, because clients already hold the old value for the length of the old TTL. Every TTL between the user and the origin is part of how long a change takes to be believed.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'The hit ratio is decided by the cache key, and it is easy to destroy',
      md: '**Forwarding all headers, cookies and query strings makes almost everything a miss** — every distinct combination becomes a separate object, and a cache that stores one copy per user is not a cache. Include in the key exactly what genuinely varies the response, and nothing else. Origin defaults are overridable by `Cache-Control` headers from the origin, and CloudFront’s own default TTL applies when the origin sends none.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Three sentences that decide the option, once you are down to two',
      md: '**DAX accelerates reads only, and only through the DAX endpoint** — it does nothing for a write-heavy workload, and an application talking to the ordinary DynamoDB endpoint gets no benefit from it at all. **ElastiCache is not a database**, so any requirement about durably storing the cached data rules it out. And **an HTTP API cannot cache** — a question that asks for response caching on API Gateway has already chosen REST for you.',
    },
    {
      kind: 'callout',
      tone: 'money',
      title: 'And the one that is a cost answer as much as a latency answer',
      md: '**Origin egress to CloudFront is free, and CloudFront-to-user rates are lower than S3-to-internet.** A cache hit costs no origin transfer at all. So putting a distribution in front of a bucket is nearly always cheaper as well as faster — but note what it is not: it is a latency and cost answer, **not a durability answer**. It does not give you a second copy of anything.',
    },

    /* ── 5. Compare, last ─────────────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'The requirement in the stem, and which cache it is pointing at',
      columns: ['What the question is asking for', 'The option that looks right and is not'],
      rows: [
        {
          label: '"Static assets, users worldwide, reduce latency"',
          cells: [
            'CloudFront — the content is cacheable, so distance is the problem',
            'ElastiCache, which lives inside one VPC and shortens nothing',
          ],
        },
        {
          label: '"Dynamic, non-cacheable, and it must have static IPs"',
          cells: [
            'Global Accelerator — only the path can be improved, not the work',
            'CloudFront, which caches HTTP and hands you a domain name',
          ],
        },
        {
          label: '"The same query hits RDS thousands of times a second"',
          cells: [
            'ElastiCache — caching removes the work, replicas only spread it',
            'A read replica, which serves the same expensive query again',
          ],
        },
        {
          label: '"Cache DynamoDB without rewriting the application"',
          cells: [
            'DAX, which is reached through its own endpoint and needs no cache logic',
            'ElastiCache, which means writing lazy loading into the application',
          ],
        },
        {
          label: '"Response caching on the API, with a TTL"',
          cells: [
            'An API Gateway REST API, which is the only type that can cache',
            'An HTTP API, which is cheaper and cannot cache at all',
          ],
        },
        {
          label: '"Replace instances freely without logging users out"',
          cells: [
            'Session state in ElastiCache, making the web tier stateless',
            'Sticky sessions, which pin the user to a target that can still die',
          ],
        },
        {
          label: '"Failover, persistence, or sorted sets and pub/sub"',
          cells: [
            'Redis or Valkey — Memcached has none of those',
            'Memcached, which only wins on "simplest possible cache"',
          ],
        },
      ],
    },

    /* ── 6. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'ElastiCache latency', value: 'Sub-millisecond, typically microseconds' },
        {
          label: 'Memcached',
          value:
            'Multi-threaded · shards by client · no replication · no persistence · no failover',
        },
        {
          label: 'Redis/Valkey',
          value:
            'Replication · Multi-AZ automatic failover · persistence · pub/sub · sorted sets · transactions',
        },
        { label: 'DAX', value: 'In-memory cache in front of DynamoDB, microsecond reads' },
        {
          label: 'API Gateway caching',
          value: '0.5 GB to 237 GB, TTL up to 3600 seconds — REST APIs only',
        },
        {
          label: 'CloudFront TTLs',
          value: 'Minimum, maximum and default TTL, overridable by Cache-Control headers',
        },
        {
          label: 'CloudFront invalidation',
          value: 'By path; the first 1,000 paths per month are free',
        },
        {
          label: 'Route 53 TTL',
          value: 'Seconds to days — 60 seconds is typical where failover matters',
        },
        {
          label: 'CloudFront certificates',
          value: 'For a custom domain, the ACM certificate must be in us-east-1',
        },
      ],
    },

    /* ── 7. Next ──────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['cloudfront', 'elasticache', 'api-gateway', 'dynamodb'],
    },
    {
      kind: 'prose',
      md: 'One warning worth carrying out of here. A cache in front of a database hides the problem when the requirement is really about **write** throughput — caching only ever helps reads, and a stem describing writes that cannot keep up is not answered by any box on this page. That one is a distribution problem, and the lesson on the partition key is where it is decided.',
    },
  ],

  checks: [
    {
      id: 'where-to-cache-distance',
      prompt:
        'A media site serves large images from S3 to users on every continent from one Region. Latency is poor and the S3 transfer bill is the largest line on the invoice. What addresses both?',
      options: [
        {
          text: 'CloudFront in front of the bucket, because a hit serves locally and costs no origin transfer',
          correct: true,
          why: 'The content is cacheable and the audience is spread out, which is the edge case exactly. Origin egress to CloudFront is free and its per-GB rates to users are lower than S3 direct, so it is the cheaper answer as well as the faster one.',
        },
        {
          text: 'ElastiCache in front of the bucket, to hold the popular images in memory',
          correct: false,
          why: 'ElastiCache caches data inside your VPC for your application. It is on the wrong side of the ocean for a user in another continent and it does not front S3.',
        },
        {
          text: 'Cross-Region replication of the bucket, so each continent reads locally',
          correct: false,
          why: 'That is a durability and residency mechanism you then have to route to, and it multiplies storage cost. Cacheable content to a global audience is the CloudFront answer.',
        },
      ],
    },
    {
      id: 'where-to-cache-dax',
      prompt:
        'A DynamoDB-backed application is read-heavy on a small set of hot items, and the team cannot make significant code changes. Which cache fits?',
      options: [
        {
          text: 'DAX, which sits in front of DynamoDB and is reached through its own endpoint',
          correct: true,
          why: 'DAX is purpose-built for DynamoDB and needs no application cache logic — the application points at the DAX endpoint instead. "Without modifying the application" is the phrase that means a transparent layer in front.',
        },
        {
          text: 'ElastiCache for Redis, which is faster than DAX and more flexible',
          correct: false,
          why: 'ElastiCache is a cache you populate: lazy loading, invalidation and TTL all become application code. That is the change the requirement rules out.',
        },
        {
          text: 'A CloudFront distribution in front of the application, cached on the item id',
          correct: false,
          why: 'CloudFront caches HTTP responses at the edge for users. The problem described is repeated database reads inside the Region, not distance.',
        },
      ],
    },
    {
      id: 'where-to-cache-populate',
      prompt:
        'A team is adding ElastiCache to a read-heavy catalogue. Most items are never viewed, and prices may be a few minutes out of date. Which population strategy fits?',
      options: [
        {
          text: 'Lazy loading with a TTL, so only what is actually read is ever cached',
          correct: true,
          why: 'Lazy loading caches on a miss, so memory is spent only on items somebody asked for, and the TTL bounds how stale a copy can get. A tolerance for minutes of staleness is what makes it safe.',
        },
        {
          text: 'Write-through, so the cache is never stale',
          correct: false,
          why: 'Write-through is always fresh and wastes memory on items nobody reads — the opposite of what a catalogue where most items are never viewed wants. It is for data that must be readable the instant it is written.',
        },
        {
          text: 'Neither — configure the cluster to preload the table at startup',
          correct: false,
          why: 'The two strategies are application code, not a cluster setting, and the point of the trade-off is choosing what to spend memory on rather than storing everything.',
        },
      ],
    },
    {
      id: 'where-to-cache-invalidate',
      prompt:
        'After every front-end deployment, some users keep running the previous JavaScript bundle for hours. What is the exam’s preferred fix?',
      options: [
        {
          text: 'Give each build a versioned file name, so the new deployment requests a different URL',
          correct: true,
          why: 'A different URL is a different object: nothing at any edge needs invalidating and nothing in any browser needs expiring. It is instant, free, and it works on caches you do not control.',
        },
        {
          text: 'Create a CloudFront invalidation on /* as the last step of every deployment',
          correct: false,
          why: 'Invalidation is charged past the first 1,000 paths a month, takes minutes to propagate, and discards every warm object at every edge. The exam prefers versioned names for exactly these reasons.',
        },
        {
          text: 'Lower the Route 53 TTL on the site’s record so clients pick up the change sooner',
          correct: false,
          why: 'DNS TTL governs which address a client resolves, not which version of an object a cache holds. Lowering it also has to happen before you need it, not after.',
        },
      ],
    },
  ],
}
