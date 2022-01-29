import { BaseController } from '../common/base.controller';
import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http-error.class';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.interface';
import { IUser } from './users.controller.interface';
import { UserService } from './user.service';
import { ValidateMiddleware } from '../common/validate.middleware';
import { UserRegisterDto } from './dto/user-register.dto';
import { sign } from 'jsonwebtoken';

import 'reflect-metadata';
import { UserLoginDto } from './dto/user-login.dto';
import { IConfigService } from '../config/config.service.interface';
import { AuthGuard } from '../common/auth.guard';

@injectable()
export class UsersController extends BaseController implements IUser {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.UserService) private userService: UserService,
		@inject(TYPES.ConfigService) private configService: IConfigService,
	) {
		super(loggerService);
		this.bindRoutes([
			{
				path: '/login',
				func: this.login,
				method: 'post',
				middlewares: [new ValidateMiddleware(UserLoginDto)],
			},
			{
				path: '/register',
				func: this.register,
				method: 'post',
				middlewares: [new ValidateMiddleware(UserRegisterDto)],
			},
			{
				path: '/info',
				func: this.info,
				method: 'get',
				middlewares: [new AuthGuard()],
			},
		]);
	}

	async login(req: Request, res: Response, next: NextFunction): Promise<void> {
		const result = await this.userService.validateUser(req.body);
		if (!result) {
			return next(new HttpError(401, 'authorization failed'));
		}

		const jwt = await this.signJwt(req.body.email, this.configService.get('SECRET'));
		this.ok(res, { jwt });
	}

	async register({ body }: Request, res: Response, next: NextFunction): Promise<void> {
		const result = await this.userService.createUser(body);
		if (!result) {
			return next(new HttpError(422, 'User is exist'));
		}
		this.ok(res, { email: result.email, id: result.id });
	}

	async info(req: Request, res: Response, next: NextFunction): Promise<void> {
		const userInfo = await this.userService.getUserInfo(req.user);
		this.ok(res, { email: userInfo?.email, id: userInfo?.id });
	}

	private signJwt(email: string, secret: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			sign(
				{
					email,
					iat: Math.floor(Date.now() / 1000),
				},
				secret,
				{
					algorithm: 'HS256',
				},
				(err, token) => {
					if (err) {
						reject(err);
					}
					resolve(token as string);
				},
			);
		});
	}
}
