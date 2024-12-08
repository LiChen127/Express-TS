declare module 'send' {
  export function send(req: Request, path: string, options: any): void;
  export function mime(path: string): string;
}
