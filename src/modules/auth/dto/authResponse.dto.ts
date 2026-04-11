import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";

export class AuthResponseDto {

    @ApiProperty({
        description: 'Access token for discription',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30'
    })
    accessToken: string;

    @ApiProperty({
        description: 'Reefresh token for discription',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30'
    })
    refreshToken: string;

    @ApiProperty({
        description: 'Authenticated user information',
        example: {
            id: 'user-id',
            email: 'user@something.com',
            firstName: 'John',
            lastName: 'Connor',
            role: 'User'
        }
    })
    user: {
        id: string,
        email: string,
        firstName: string | null,
        lastName: string | null,
        role: Role
    }
}