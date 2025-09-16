import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCompanyDto {
  /**
   * nome da empresa
   * @type {string}
   */
  @ApiProperty({
    description: 'nome da empresa',
    default: 'Empresa A',
    example: 'Empresa A',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * id da empresa do mult100
   * @type {number}
   */
  @ApiProperty({
    description: 'id da empresa no mult100',
    default: 1,
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  idEmpresaMult100: number;
}
