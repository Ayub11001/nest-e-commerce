import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.stragegy';
import { RefreshTokenGuard } from './guards/refreshToken.guard';

@Module({
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy, RefreshTokenGuard],
  controllers: [AuthController],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET')!,
        signOptions: {
          expiresIn: Number(configService.get<number>('JWT_EXPIRES_IN', 900))
        }
      }),
    }),
    PassportModule.register({defaultStrategy: 'jwt'})
  ]
})
export class AuthModule {}
