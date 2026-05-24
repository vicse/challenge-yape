export interface CloudEvent<T = Record<string, unknown>> {
  id: number;
  source: string;
  type: string;
  data: T;
}
