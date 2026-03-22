import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Messages() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) fetchConversations(data.user.id)
      else setLoading(false)
    })
  }, [])

  async function fetchConversations(userId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*, listing:listing_id(title, id)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (data) {
      const seen = new Set()
      const convs: any[] = []
      data.forEach(msg => {
        const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
        const key = `${msg.listing_id}-${otherId}`
        if (!seen.has(key)) {
          seen.add(key)
          convs.push({ ...msg, otherId, listingTitle: msg.listing?.title })
        }
      })
      setConversations(convs)
    }
    setLoading(false)
  }

  async function openConversation(conv: any) {
    setSelected(conv)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('listing_id', conv.listing_id)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('listing_id', conv.listing_id)
      .eq('receiver_id', user.id)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selected) return
    const { error } = await supabase.from('messages').insert({
      listing_id: selected.listing_id,
      sender_id: user.id,
      receiver_id: selected.otherId,
      content: newMessage.trim(),
    })
    if (!error) {
      setNewMessage('')
      openConversation(selected)
    }
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>Ladataan...</p>
  if (!user) return <p style={{ textAlign: 'center', marginTop: 60 }}>Kirjaudu ensin sisään.</p>

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => { window.location.hash = '#profile'; window.dispatchEvent(new HashChangeEvent('hashchange')) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 15, padding: 0 }}
        >
          Takaisin
        </button>
        <h2 style={{ margin: 0 }}>Viestit</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 2fr' : '1fr', gap: 16 }}>
        <div>
          {conversations.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>Ei viestejä vielä.</p>
          ) : (
            conversations.map(conv => (
              <div
                key={`${conv.listing_id}-${conv.otherId}`}
                onClick={() => openConversation(conv)}
                style={{ padding: 14, border: '1.5px solid', borderColor: selected?.listing_id === conv.listing_id ? '#2a2a2a' : '#ddd', borderRadius: 8, marginBottom: 8, cursor: 'pointer', background: selected?.listing_id === conv.listing_id ? '#f9f9f9' : 'white' }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  {conv.listingTitle || 'Ilmoitus'}
                </div>
                <div style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {conv.content}
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  {new Date(conv.created_at).toLocaleDateString('fi-FI')}
                </div>
              </div>
            ))
          )}
        </div>

        {selected && (
          <div style={{ border: '1.5px solid #ddd', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 480 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', background: '#f9f9f9' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.listingTitle}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{ alignSelf: msg.sender_id === user.id ? 'flex-end' : 'flex-start', background: msg.sender_id === user.id ? '#1a1a2e' : '#f0f0ec', color: msg.sender_id === user.id ? 'white' : '#1a1a1a', padding: '10px 14px', borderRadius: msg.sender_id === user.id ? '12px 12px 2px 12px' : '12px 12px 12px 2px', maxWidth: '75%', fontSize: 14, lineHeight: 1.5 }}
                >
                  {msg.content}
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                    {new Date(msg.created_at).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Kirjoita viesti..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
              <button
                onClick={sendMessage}
                style={{ padding: '10px 18px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              >
                Lähetä
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
