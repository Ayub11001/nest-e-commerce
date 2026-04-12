import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';


@ApiTags('Categories')
@Controller('categoies')
export class CategoryController {
    constructor(
        private readonly categoryService: CategoryService
    ) {}

    // Create a category
    @Post()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Create a new category'
    })
    @ApiBody({type: CreateCategoryDto})
    @ApiResponse({ status: 201, description: 'Category created successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid input data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
        return await this.categoryService.create(createCategoryDto);
    }

    // Get all Categories
    @Get()
    @ApiOperation({ summary: 'Get all categories' })
    @ApiResponse({
        status: 200,
        description: 'List of categories retrieved successfully.',
        schema: {
        type: 'object',
        properties: {
            data: {
            type: 'array',
            items: { $ref: '#/components/schemas/CategoryResponseDto' },
            },
            meta: {
            type: 'object',
            properties: {
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' },
            },
            },
        },
        },
    })
    async findAll(@Query() queryDto: QueryCategoryDto): Promise<{
        data: CategoryResponseDto[],
        meta: {total: number, page: number, limit: number, totalPages: number}
    }> {
        return await this.categoryService.findAll(queryDto);
    }

    // Get category by id
    @Get(':id')
    @ApiOperation({
        summary: 'Get category by id'
    })
    @ApiResponse({
        status: 200,
        description: 'Category details',
        type: CategoryResponseDto
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found',
    })
    async getCategoryById(@Param('id') categoryId: string): Promise<CategoryResponseDto> {
        return await this.categoryService.findOne(categoryId);
    }

    @Get('slug/:slug')
    @ApiOperation({
        summary: 'Get category by id'
    })
    @ApiResponse({
        status: 200,
        description: 'Category details',
        type: CategoryResponseDto
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found',
    })
    async getCategoryBySlug(@Param('slug') slug: string): Promise<CategoryResponseDto> {
        return await this.categoryService.findCategoryBySlug(slug)
    }

    // Update Category (for admins)
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Update Category (for admins)'})
    @ApiBody({
        type: UpdateCategoryDto
    })
    @ApiResponse({
        status: 200,
        description: 'Category updated successfully',
        type: CategoryResponseDto
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found',
    })
    @ApiResponse({
        status: 409,
        description: 'Category sulg already exists',
    })
    async updateCategory(
        @Param('id') id: string, 
        @Body() updateCategoryDto: UpdateCategoryDto
    ): Promise<CategoryResponseDto> {
        return await this.categoryService.update(id, updateCategoryDto);
    }
}
