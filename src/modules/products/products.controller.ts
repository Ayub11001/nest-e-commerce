import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/response-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-porduct.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
    constructor(
        private readonly productService: ProductsService
    ) {}

    // Create a product
    @Post()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary: 'Create a new product'})
    @ApiBody({
        type: CreateProductDto
    })
    @ApiResponse({
        status: 201,
        description: 'Product created successfully',
        type: ProductResponseDto
    })
    @ApiResponse({
        status: 409,
        description: 'sku already exists',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Admin role required',
    })
    async createProduct(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
        return await this.productService.create(createProductDto);
    }

    // Get all products
    @Get()
    @ApiOperation({
        summary: 'Get all products with optional filters'
    })
    @ApiResponse({
        status: 200,
        description: 'List of all the products with pagination',
        schema: {
            type: "object",
            properties: {
                data: {
                    type: 'array',
                    items: {$ref: '#/components/schemas/ProductResponseDto'}
                },
                meta: {
                    type: 'object',
                    properties: {
                        total: {type: 'number'},
                        page: {type: 'number'},
                        limit: {type: 'number'},
                        totalPages: {type: 'number'},     
                    }
                }
            }
        }
    })
    async getAllProducts(@Query() queryProductDto: QueryProductDto): Promise<{
        data: ProductResponseDto[],
        meta: {
            page: number,
            total: number, 
            limit: number,
            totalPages: number
        }
    }> {
        return this.productService.findAll(queryProductDto);
    }

    // Get a product by Id
    @Get(':id')
    @ApiOperation({
        summary: 'Fetch fa product by its id'
    })
    @ApiResponse({
        status: 200,
        description: 'Product detaials',
        type: ProductResponseDto
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    async findById(@Param('id') id: string): Promise<ProductResponseDto> {
        return await this.productService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Update a product (for Admin only)'
    })
    @ApiBody({
        type: UpdateProductDto
    })
    @ApiResponse({
        status: 200,
        description: 'Updated product successfully',
        type: ProductResponseDto
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found'
    })
    @ApiResponse({
        status: 409,
        description: 'sku already exists'
    })
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto 
    ): Promise<ProductResponseDto> {
        return await this.productService.update(id, updateProductDto);
    }

    // Update Stock of the product (For admin only)
    @Patch(':id/stock')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Update product Stock (for Admin only)'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                quantity: {
                    type: 'number',
                    description: 'Stock adjustment (positive to add and negaitve to substract)',
                    example: 10
                },
            },
            required: ['quantity']
        } 
    })
    @ApiResponse({
        status: 200,
        description: 'Stock updated successfully',
        type: ProductResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Insufficient stock',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    async updateStock(@Param('id') id: string,
        @Body('quantity') quantity: number
    ): Promise<ProductResponseDto> {
        return await this.productService.updateStock(id, quantity);
    }

    // Delete a product (for Admin only)
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Delete a product (for a Admin)'
    })
    @ApiResponse({
        status: 200,
        description: 'Deleted product successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found'
    })
    @ApiResponse({
        status: 400,
        description: 'Cannot delete product in active order'
    })
    async deleteProduct(@Param('id') id: string): Promise<{
        message: string
    }> {
        return await this.productService.remove(id);
    }
}
