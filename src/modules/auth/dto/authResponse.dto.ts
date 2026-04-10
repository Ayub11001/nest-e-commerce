import { Role } from "@prisma/client";

export interface AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string,
        email: string,
        firstName: string | null,
        lastName: string | null,
        role: Role
    }
}