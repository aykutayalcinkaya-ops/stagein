import { supabase } from '../client'
import type { Message, Conversation } from '@stagein/shared'

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .contains('participant_ids', [userId])
    .order('last_message_at', { ascending: false })
  if (error) throw error
  return data as Conversation[]
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users(id, username, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Message[]
}

export async function sendMessage(message: Omit<Message, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('messages').insert(message).select().single()
  if (error) throw error
  return data
}

export function subscribeToMessages(conversationId: string, callback: (msg: Message) => void) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => callback(payload.new as Message))
    .subscribe()
}
