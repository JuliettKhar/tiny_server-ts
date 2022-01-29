import { IsEmail, IsString } from 'class-validator';

export class UserLoginDto {
	@IsEmail({}, { message: 'wrong password' })
	email: string;

	@IsString()
	password: string;
}
