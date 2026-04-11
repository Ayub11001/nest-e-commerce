import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) {}

    @Get('me')
    @ApiOperation({
        summary: 'Get current logged in user profile'
    })
    @ApiResponse({
        status: 200,
        description: 'The current logged in user profile',
        type: UserResponseDto
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    async getProfile(@Req() req: RequestWithUser): Promise<UserResponseDto> {
        return await this.usersService.findOne(req.user.id);
    }
}
