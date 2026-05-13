import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { Request } from "express";
import bcrypt from 'bcrypt'

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
            passReqToCallback: true
        })
    }

    // validate callaback

    async validate(
        req: Request, 
        payload: {
            sub: string, 
            email: string, 
            refreshId: string
        }
    ) {
        //console.log('Refresh strategy executed');
        const authHeaders = req.headers.authorization;
        if(!authHeaders) {
            throw new UnauthorizedException('No refresh-token received')
        }

        const refreshToken = authHeaders.replace('Bearer', '').trim();
        if(!refreshToken) {
            throw new UnauthorizedException('Empty refresh-token received')
        }

        const user = await this.prisma.user.findUnique({
            where: {id: payload.sub},
            select: {
                id: true,
                email: true,
                refreshToken: true,
                role: true
            }
        });
        if(!user || !(user.refreshToken)) {
            throw new UnauthorizedException('Invalid refresh-token')
        }
        
        const isRefreshTokenMatch = await bcrypt.compare(refreshToken, user.refreshToken)
        if(!isRefreshTokenMatch) {
            throw new UnauthorizedException('Invalid refresh-token')
        }

        return {
            id: user.id,
            email: user.email,
            role: user.role
        }
    }
}