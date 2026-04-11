import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";

export class UserResponseDto {
    @ApiProperty({
        description: 'User id',
        example: '251a00ad-2a2b-46a2-a00c-f8aad7c323a6'
    })
    id: string

    @ApiProperty({
        description: 'User email address',
        example: 'someone@something.com'
    })
    email: string

    @ApiProperty({
        description: 'User first name',
        example: 'John',
        nullable: true
    })
    firstName: string | null
    
    @ApiProperty({
        description: 'User last name',
        example: 'Connor',
        nullable: true
    })
    lastName: string | null
    
    @ApiProperty({
        description: 'User role',
        enum: Role
    })
    role: Role
    
    @ApiProperty({
        description: 'Account creation date',
        example: '2026-04-11 05:56:36.385'
    })
    createdAt: Date

    @ApiProperty({
        description: 'Account updation date',
        example: '2026-04-11 05:56:36.385'
    })
    updatedAt: Date

}