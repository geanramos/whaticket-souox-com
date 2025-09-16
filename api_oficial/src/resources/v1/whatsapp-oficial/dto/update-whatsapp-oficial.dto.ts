import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateWhatsappOficialDto } from './create-whatsapp-oficial.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateWhatsappOficialDto extends PartialType(
  CreateWhatsappOficialDto,
) {
  /**
   * chatwoot url
   * @type {string}
   */
  @ApiProperty({
    description: 'chatwoot webhook url',
    default: 'http://url.com.br',
    example: 'http://url.com.br',
  })
  @IsOptional()
  @IsString()
  chatwoot_webhook_url?: string;

  /**
   * chatwoot token
   * @type {string}
   */
  @ApiProperty({
    description: 'chatwoot webhook token',
    default: 'TOKENCHATWOOT',
    example: 'TOKENCHATWOOT',
  })
  @IsOptional()
  @IsString()
  auth_token_chatwoot?: string;

  /**
   * n8n url
   * @type {string}
   */
  @ApiProperty({
    description: 'n8n webhook url',
    default: 'http://url.com.br',
    example: 'http://url.com.br',
  })
  @IsOptional()
  @IsString()
  n8n_webhook_url?: string;

  /**
   * chatwoot token
   * @type {string}
   */
  @ApiProperty({
    description: 'n8n webhook token',
    default: 'TOKENN8N',
    example: 'TOKENN8N',
  })
  @IsOptional()
  @IsString()
  auth_token_n8n?: string;

  /**
   * chatwoot url
   * @type {string}
   */
  @ApiProperty({
    description: 'crm webhook url',
    default: 'http://url.com.br',
    example: 'http://url.com.br',
  })
  @IsOptional()
  @IsString()
  crm_webhook_url?: string;

  /**
   * crm webhook token
   * @type {string}
   */
  @ApiProperty({
    description: 'crm webhook token',
    default: 'TOKENCRM',
    example: 'TOKENCRM',
  })
  @IsOptional()
  @IsString()
  auth_token_crm?: string;

  /**
   * chatwoot url
   * @type {string}
   */
  @ApiProperty({
    description: 'typebot webhook url',
    default: 'http://url.com.br',
    example: 'http://url.com.br',
  })
  @IsOptional()
  @IsString()
  typebot_webhook_url?: string;

  /**
   * crm webhook token
   * @type {string}
   */
  @ApiProperty({
    description: 'typebot webhook token',
    default: 'TOKENTYPEBOT',
    example: 'TOKENTYPEBOT',
  })
  @IsOptional()
  @IsString()
  auth_token_typebot?: string;

  /**
   * crm webhook token
   * @type {boolean}
   */
  @ApiProperty({
    description: 'caso utilize o rabbitmq coloque true',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  use_rabbitmq?: boolean;

  /**
   * id whatsapp do mult100
   * @type {string}
   */
  @ApiProperty({
    description: 'ID do whatsapp do Mult 100',
    default: 1,
    example: 1,
  })
  @IsString()
  @IsOptional()
  token_mult100?: string;

  /**
   * id do telefone do business meta
   * @type {string}
   */
  @ApiProperty({
    description: 'id do telefone do business meta',
    default: 'PHONENUMBERID',
    example: 'PHONENUMBERID',
  })
  @IsString()
  @IsOptional()
  phone_number_id?: string;

  /**
   * identificação da meta business
   * @type {string}
   */
  @ApiProperty({
    description: 'identificação da meta business',
  })
  @IsString()
  @IsOptional()
  waba_id?: string;

  /**
   * token de envio api
   * @type {string}
   */
  @ApiProperty({
    description: 'token de envio api',
    default: 'TOKENENVIOAPI',
    example: 'TOKENENVIOAPI',
  })
  @IsString()
  @IsOptional()
  send_token?: string;

  /**
   * id da empresa
   * @type {string}
   */
  @ApiProperty({
    description: 'id da empresa',
    default: 'BUSINESSID',
    example: 'BUSINESSID',
  })
  @IsString()
  @IsOptional()
  business_id?: string;

  /**
   * numero telefone
   * @type {string}
   */
  @ApiProperty({
    description: 'numero telefone',
    default: '+55000111111111',
    example: '+55000111111111',
  })
  @IsString()
  @IsOptional()
  phone_number?: string;

  /**
   * routing key do RabbitMQ
   * @type {string}
   */
  @ApiProperty({
    description: 'routing key do RabbitMQ',
    default: 'routing_key',
    example: 'routing_key',
  })
  @IsOptional()
  @IsString()
  rabbitmq_routing_key?: string;
}
