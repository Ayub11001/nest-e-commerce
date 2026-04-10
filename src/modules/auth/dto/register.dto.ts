// DTO for user registration

import { IsEmail, IsNotEmpty, IsOptional, isString, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {

    @IsEmail({}, {message: 'Enter a valid email address'})
    @IsNotEmpty({message: 'Email is required'})
    email: string;

    @IsString()
    @IsNotEmpty({message: "Password is required"})
    @MinLength(8, {message: "Password must be atleast 8 characters"})
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        }
    )
    password: string;

    @IsString()
    @IsOptional()
    firstName?: string

    @IsString()
    @IsOptional()
    lastName?: string

}