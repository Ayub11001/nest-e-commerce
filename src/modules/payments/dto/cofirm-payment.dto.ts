import { IsNotEmpty, IsString } from "class-validator";

export class ConfirmPaymetDto {
    @IsString()
    @IsNotEmpty()
    paymentIntentId: string;

    @IsString()
    @IsNotEmpty()
    orderId: string;
}