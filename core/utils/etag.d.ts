declare module 'etag' {
  export default function etag(
    body: string | Buffer,
    options?: { weak?: boolean }
  ): string;
}
