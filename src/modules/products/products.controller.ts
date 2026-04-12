import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/response-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

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
}
