/**
 * The services the exam asks "which option" about, and therefore owe an
 * `optionSets` entry.
 *
 * A curated list rather than a heuristic, deliberately. No rule over the corpus
 * reliably separates "this service has mutually exclusive options" from prose
 * that merely mentions several things, and a heuristic that guesses wrong
 * produces the always-red gate that invariant 20 warns about — the kind nobody
 * reads. This list *is* the backlog: `content:check` prints one counted line
 * while entries are outstanding, and the warning disappears when it is done.
 */
export const OPTION_SET_OWED = [
  's3',
  'ebs',
  'ec2',
  'route53',
  'elb',
  'rds',
  'lambda',
  'dynamodb',
  'efs',
  'ec2-auto-scaling',
  'aurora',
  'kms',
  'api-gateway',
  'fsx',
  'sqs',
] as const
