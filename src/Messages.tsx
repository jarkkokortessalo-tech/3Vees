import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Messages() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

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
      const unread: Record<string, number> = {}

      data.forEach(msg => {
        const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
        const key = `${otherId}`
        
        if (!unread[key]) unread[key] = 0
        if (!msg.read && msg.receiver_id === userId) unread[key]++

        if (!seen.has(key)) {
          seen.add(key)
          convs.push({
            ...msg,
            otherId,
            listingTitle: msg.listing?.title,
            conversationKey: key
          })
        }
      })
      setConversations(convs)
      setUnreadCounts(unread)
    }
    setLoading(false)
  }

  async function openConversation(conv: any) {
    setSelected(conv)
    const { data } = await supabase
      .from('messages')
      .select('*, listing:listing_id(title, id)')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conv.otherId}),and(sender_id.eq.${conv.otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', conv.otherId)

    setUnreadCounts(prev => ({ ...prev, [conv.otherId]: 0 }))
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

  function goTo(newHash: string) {
    window.location.hash = newHash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>Ladataan...</p>
  if (!user) return <p style={{ textAlign: 'center', marginTop: 60 }}>Kirjaudu ensin sisään.</p>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1.5px solid #eee', display: 'flex', alignItems: 'center', gap: 12, background: 'white' }}>
        <button onClick={() => goTo('#profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 15, padding: 0 }}>
          ← Takaisin
        </button>
        <h2 style={{ margin: 0, fontSize: 18 }}>Viestit</h2>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Keskustelulista */}
        <div style={{ width: selected ? 300 : '100%', borderRight: '1.5px solid #eee', overflowY: 'auto', background: 'white', flexShrink: 0 }}>
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
              <p>Ei viestejä vielä.</p>
            </div>
          ) : (
            conversations.map(conv => {
              const unread = unreadCounts[conv.otherId] || 0
              const isSelected = selected?.otherId === conv.otherId
              return (
                <div
                  key={conv.otherId}
                  onClick={() => openConversation(conv)}
                  style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: isSelected ? '#f0f0ec' : 'white', borderLeft: isSelected ? '3px solid #1a1a2e' : '3px solid transparent' }}
                >
                  {/* Käyttäjä-avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 16, flexShrink: 0 }}>
                      {conv.otherId?.slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: unread > 0 ? 700 : 400, fontSize: 14, color: '#1a1a1a' }}>
                          Käyttäjä
                        </div>
                        {unread > 0 && (
                          <span style={{ background: '#e63946', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>
                            {unread}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {conv.listingTitle || 'Ilmoitus'}
                      </div>
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.content}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Viestiketju */}
        {selected && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', overflow: 'hidden' }}>
            
            {/* Ketjun header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', background: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 18, padding: 0, lineHeight: 1 }}>←</button>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                {selected.otherId?.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Käyttäjä</div>
                <div style={{ fontSize: 12, color: '#888' }}>{selected.listingTitle}</div>
              </div>
            </div>

            {/* Ilmoituslinkki */}
            {selected.listing_id && (
              <div
                onClick={() => goTo(`#listing-${selected.listing_id}`)}
                style={{ padding: '8px 16px', background: '#f0f0ec', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🔩 <span style={{ textDecoration: 'underline' }}>{selected.listingTitle}</span>
              </div>
            )}

            {/* Viestit */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map(msg => {
                const isMine = msg.sender_id === user.id
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    {msg.listing?.title && msg.listing?.title !== selected.listingTitle && (
                      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>
                        🔩 {msg.listing.title}
                      </div>
                    )}
                    <div style={{ background: isMine ? '#1a1a2e' : 'white', color: isMine ? 'white' : '#1a1a1a', padding: '10px 14px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', maxWidth: '75%', fontSize: 14, lineHeight: 1.5, border: isMine ? 'none' : '1px solid #eee', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>
                      {new Date(msg.created_at).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Viestinlähetys */}
            <div style={{ padding: 12, borderTop: '1px solid #eee', background: 'white', display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Kirjoita viesti..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 20, fontSize: 14, outline: 'none' }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                style={{ padding: '10px 18px', background: newMessage.trim() ? '#1a1a2e' : '#ddd', color: 'white', border: 'none', borderRadius: 20, cursor: newMessage.trim() ? 'pointer' : 'default', fontWeight: 'bold', fontSize: 14 }}
              >
                ➤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
