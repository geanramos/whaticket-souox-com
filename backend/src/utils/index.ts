// Utilitário para normalizar JIDs do WhatsApp
// Se vier com @lid, converte para @s.whatsapp.net (usuário) ou @g.us (grupo)

export function normalizeJid(jid: string): string {
  if (!jid) return jid;

  // Corrige casos onde o jid vem duplicado, ex: 5519981790250@s.whatsapp.net@s.whatsapp.net
  if (jid.includes('@s.whatsapp.net@s.whatsapp.net')) {
    return jid.replace('@s.whatsapp.net@s.whatsapp.net', '@s.whatsapp.net');
  }
  if (jid.includes('@g.us@g.us')) {
    return jid.replace('@g.us@g.us', '@g.us');
  }

  // Se já contém @s.whatsapp.net ou @g.us, retorna o próprio jid
  if (jid.includes('@s.whatsapp.net') || jid.includes('@g.us')) {
    return jid;
  }

  if (jid.includes('@lid')) {
    const base = jid.split('@')[0];
    if (base.length > 15 || jid.includes('g.us')) {
      return base + '@g.us';
    }
    return base + '@s.whatsapp.net';
  }
  return jid;
} 