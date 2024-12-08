import { IncomingMessage, ServerResponse } from 'http';

export interface Request extends IncomingMessage {
  app?: any;
  body?: any;
  query?: any;
  params?: any;
}

export interface Response extends ServerResponse {
  app?: any;
  locals?: any;
}

export type NextFunction = (err?: any) => void;
export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void; 