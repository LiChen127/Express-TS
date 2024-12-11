import { NextFunction, Request, Response } from '../type';
export default function query(options: any): (req: Request, res: Response, next: NextFunction) => void;
