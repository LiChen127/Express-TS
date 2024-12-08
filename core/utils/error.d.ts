declare module Error {
  export class HttpError extends Error {
    constructor(message: string, status: number);
  }
  code: string;
}
