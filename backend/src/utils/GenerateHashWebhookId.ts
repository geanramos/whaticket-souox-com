import crypto from 'crypto';

export const generateHashWebhookId = (): string => {
  // Gerar hash único baseado no timestamp e número aleatório
  const timestamp = Date.now().toString();
  const randomNum = Math.random().toString(36).substring(2, 15);
  const combined = `${timestamp}-${randomNum}`;
  
  // Criar hash SHA256
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  
  // Retornar primeiros 16 caracteres
  return hash.substring(0, 16);
};