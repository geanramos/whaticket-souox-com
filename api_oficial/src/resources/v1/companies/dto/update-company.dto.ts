import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
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
}
