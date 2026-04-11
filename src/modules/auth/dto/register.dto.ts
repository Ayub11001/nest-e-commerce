// DTO for user registration

import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, isString, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {

    @ApiProperty({
        description: 'User email address',
        example: 'someone@something.com'
    })
    @IsEmail({}, {message: 'Enter a valid email address'})
    @IsNotEmpty({message: 'Email is required'})
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'My.Name@01/11/98'
    })
    @IsString()
    @IsNotEmpty({message: "Password is required"})
    @MinLength(8, {message: "Password must be atleast 8 characters"})
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%.*?&])[A-Za-z\d@$!%*?.&]/,
        {
            message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        }
    )
    password: string;

    @ApiProperty({
        description: 'An optional first name of the user',
        example: 'Jhon',
        required: false
    })
    @IsString()
    @IsOptional()
    firstName?: string

    @ApiProperty({
        description: 'An optional last name of the user',
        example: 'Connor',
        required: false
    })
    @IsString()
    @IsOptional()
    lastName?: string

}