import { 
    Body,
    Controller, 
    Delete, 
    Get, 
    HttpCode, 
    HttpStatus, 
    Param, 
    Patch, 
    Req, 
    UseGuards
 } from '@nestjs/common';
import { 
    ApiBearerAuth, 
    ApiBody, 
    ApiOperation, 
    ApiResponse, 
    ApiTags  
 } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import path from 'path';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) {}

    // Get a logged in user's profile
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

    // Get all the users
    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({summary: 'Get all the users'})
    @ApiResponse({
        status: 200,
        description: "A list of all the users",
        type: [UserResponseDto]
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getAll(): Promise<UserResponseDto[]> {
        return await this.usersService.findAll();
    }

    // Get user by id
    @Get(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'Get user by ID'
    })
    @ApiResponse({
        status: 200,
        description: 'The user with specified ID',
        type: UserResponseDto
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
        return await this.usersService.findOne(id);
    }

    // Update user info
    @Patch('me')
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({
        status: 200,
        description: 'The updated user profile',
        type: UserResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 409, description: 'Email already in use' })
    async updateUser(
        @GetUser('id') userId: string, 
        @Body() updateUserDto: UpdateUserDto
    ): Promise<UserResponseDto> {
        return await this.usersService.update(userId, updateUserDto);
    }

    // Change user password
    @Patch('me/password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Change current user password' })
    @ApiResponse({ status: 200, description: 'Password changed successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async changePassword(
        @GetUser('id') userId: string, 
        @Body() changePasswordDto: ChangePasswordDto,
    ): Promise<{message: string}> {
        return await this.usersService.changePassword(userId, changePasswordDto);
    } 

    // Delete user account
    @Delete('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete current user account' })
    @ApiResponse({
        status: 200,
        description: 'User account deleted successfully',
    })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
    async deleteAccount(@GetUser('id') userId: string): 
    Promise<{message: string}> {
        return await this.usersService.remove(userId);
    }
    
    // Delete user by ID (for the Admin)
    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete user by ID' })
    @ApiResponse({
        status: 200,
        description: 'User with the specified ID deleted successfully',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async deleteUserById(@Param('id') userID: string): 
    Promise<{message: string}> {

        return await this.usersService.remove(userID)
    }
}
