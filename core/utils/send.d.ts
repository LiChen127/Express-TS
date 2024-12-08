// import { Request } from '../type';

declare module 'send' {
  export function send(req: any, path: string, options: any): void;
  export function mime(path: string): string;
}
