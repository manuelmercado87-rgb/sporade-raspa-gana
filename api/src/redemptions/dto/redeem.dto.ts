import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class ValidateCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class RedeemDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Matches(/^\d{6,12}$/, { message: 'Cédula inválida' })
  cedula: string;

  @IsString()
  @IsNotEmpty()
  scratchCode: string;
}
