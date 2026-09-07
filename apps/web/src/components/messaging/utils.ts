import type { Conversation } from '@stagein/shared'

export function isGroupConversation(conversation: Pick<Conversation, 'participant_ids'>): boolean {
  return conversation.participant_ids.length > 2
}

/** Grup için başlık (varsa) veya katılımcı adlarından üretilmiş özet; 1:1 için karşı tarafın adı. */
export function getConversationDisplayName(conversation: Conversation): string {
  if (isGroupConversation(conversation)) {
    if (conversation.title) return conversation.title
    const names = (conversation.participants ?? []).map((p) => p.full_name ?? p.username)
    return names.length > 0 ? names.join(', ') : 'Grup'
  }
  const other = conversation.participants?.[0]
  return other?.full_name ?? other?.username ?? 'Kullanıcı'
}
