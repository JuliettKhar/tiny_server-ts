import { NextFunction, Request, Response } from 'express';
import { IMiddleware } from './middleware.interface';
import { verify } from 'jsonwebtoken';

export class AuthMiddleware implements IMiddleware {
	constructor(private secret: string) {}

	execute(req: Request, res: Response, next: NextFunction): void {
		if (req.headers.authorization) {
			// const token = req.headers.authorization.split(' ')[1];
			verify(req.headers.authorization.split(' ')[1], this.secret, (err, payload: any) => {
				if (err) {
					next();
				} else if (payload) {
					// @ts-ignore
					req.user = payload.email;
					next();
				}
			});
		} else {
			next();
		}
	}
}
