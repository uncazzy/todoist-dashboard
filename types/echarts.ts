/**
 * Shared echarts type aliases.
 *
 * echarts exports its tooltip/label callback params type publicly only under the name
 * `DefaultLabelFormatterCallbackParams`. The short `CallbackDataParams` name is also
 * reachable from `echarts/types/dist/shared`, but that is an internal path with no
 * stability guarantee, so we alias the public export here instead and import this
 * module from chart components.
 */
export type { DefaultLabelFormatterCallbackParams as CallbackDataParams } from 'echarts';
