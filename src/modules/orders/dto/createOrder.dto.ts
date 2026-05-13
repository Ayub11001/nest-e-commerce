import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

class OrderItemDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    productId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @ApiProperty({ example: 49.99 })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a valid number' })
    @Type(() => Number)
    price: number
}


export class CreateOrderDto {
    @ApiProperty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiProperty()
    @IsOptional()
    @IsString()
    shippingAddress: string;
}