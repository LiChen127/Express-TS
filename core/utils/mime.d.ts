declare module 'mime' {
  export function getType(path: string): string;
  export function extension(type: string): string;
  export function charset(type: string): string;
  export function parse(type: string): {
    type: string;
    parameters: Record<string, string>;
  };
}
