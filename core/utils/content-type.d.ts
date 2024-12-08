declare module 'content-type' {
  export function parse(str: string): { type: string; parameters: Record<string, string> };
  // export function format(type: string, parameters: Record<string, string>): string;
  export function format(type: string): string;
}
