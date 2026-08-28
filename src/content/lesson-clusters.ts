/**
 * The eight clusters the lessons are grouped into, in the order they are meant
 * to be read — roughly descending exam weight.
 *
 * Named `lesson-clusters.ts` rather than `lessons/clusters.ts` for the same
 * reason the registries are: a directory file that the `@/content` barrel also
 * re-exports breaks Turbopack's module graph, and the runtime error points
 * nowhere near the cause.
 *
 * This array is the *only* declaration of cluster order, and `content:check`
 * requires the lessons of a cluster to be contiguous in `lesson-registry.ts`
 * and the clusters to appear there in this order. Before this existed the two
 * orders were independent and nothing stopped them drifting — the grouping was
 * prose in `/learn`'s closing paragraph, so a lesson appended to the wrong run
 * would have been invisible until somebody read the page and noticed.
 *
 * The `blurb` is what the closing paragraph used to say about each cluster. It
 * belongs next to the lessons it describes rather than in a sentence a hundred
 * words from them.
 */
export type LessonCluster = {
  id: string
  title: string
  blurb: string
}

export const LESSON_CLUSTERS: LessonCluster[] = [
  {
    id: 'reachability',
    title: 'Reachability',
    blurb: 'Routing, the two filters, and why something cannot reach the internet.',
  },
  {
    id: 'identity',
    title: 'Identity',
    blurb:
      'How IAM decides, why a role beats an access key, and the two keys behind envelope encryption.',
  },
  {
    id: 'storage',
    title: 'Storage',
    blurb:
      'The three shapes, choosing an S3 storage class, and what eleven nines actually measures.',
  },
  {
    id: 'resilience',
    title: 'Resilience',
    blurb:
      'Multi-AZ against a read replica, the two numbers that choose a disaster recovery architecture, and which load balancer the layer decides.',
  },
  {
    id: 'serverless-and-events',
    title: 'Serverless and events',
    blurb:
      'What actually runs a Lambda function, whether the hand-off is a queue, a topic or a bus, and what happens on the second delivery.',
  },
  {
    id: 'data-and-cost',
    title: 'Data and cost',
    blurb:
      'Why the partition key is the whole design, four caches at four distances from the user, and paying less for exactly the same thing.',
  },
  {
    id: 'developer',
    title: 'The developer cluster',
    blurb:
      'What the API Gateway front door does before your code runs, which of Cognito’s two pools a requirement is asking for, which of the three Code-something services owns which job, and which of CloudWatch, X-Ray and CloudTrail can answer the sentence in front of you.',
  },
  {
    id: 'long-tail',
    title: 'The long tail',
    blurb:
      'Why a stack rather than a resource is the thing CloudFormation acts on, which of a container task’s two IAM roles has just failed and who owns the server underneath it, when a queue is the wrong shape for events more than one team needs, and where the state lives when step three of a workflow fails.',
  },
]

export const lessonClusterById = new Map(LESSON_CLUSTERS.map((c) => [c.id, c]))
