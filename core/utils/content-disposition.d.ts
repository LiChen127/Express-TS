declare module 'content-disposition' {
  // export function parse(str: string): { type: string; parameters: Record<string, string> };
  export function contentDisposition(filename: string, options?: any): string;
}
