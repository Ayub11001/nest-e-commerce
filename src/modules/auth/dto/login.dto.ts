import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
    @ApiProperty({
        description: 'User email address',
        example: 'someone@something.com'
    })
    @IsEmail({}, {message: 'Enter valid email address'})
    @IsNotEmpty({message: 'Email is required'})
    email: string

    @ApiProperty({
        description: 'User password',
        example: 'My.Name@01/11/98'
    })
    @IsString()
    @IsNotEmpty({message: 'Password is required'})
    password: string
}