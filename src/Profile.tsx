import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const CAR_MODELS: Record<string, string> = {
  kupla: '🚗 Kupla',
  transporter: '🚐 Transporter',
  golf: '🚙 Golf',
  jetta: '🚘 Jetta',
}

const CONDITION_LABELS: Record<string, string> = {
  uusi: 'Uusi',
  lahes_uusi: 'Lähes uusi',
  hyva: 'Hyvä',
  huono: 'Huono',
  rikki: 'Rikki',
}

export default function Profile() {
  const [listings, setListings] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<'listings' | 'favorites'>('listings')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        fetchMyListings(data.user.id)
        fetchFavorites(data.user.id)
      } else setLoading(false)
    })
  }, [])

  async function fetchMyListings(userId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('listings')
      .select('*, listing_images(url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }

  async function fetchFavorites(userId: string) {
    const { data } = await supabase
      .from('favorites')
      .select('listing_id, listings(*, listing_images(url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setFavorites(data?.map((f: any) => f.listings).filter(Boolean) || [])
  }

  async function removeFavorite(listingId: string) {
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId)
    setFavorites(prev => prev.filter(f => f.id !== listingId))
  }

  function goTo(newHash: string) {
    window.location.hash = newHash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }

  async function deleteListing(id: string) {
    if (!confirm('Haluatko varmasti poistaa tämän ilmoituksen?')) return
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (!error) {
      setMessage('✅ Ilmoitus poistettu!')
      setListings(prev => prev.filter(l => l.id !== id))
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'hidden' : 'active'
    const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', id)
    if (!error) setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
  }

  async function markAsSold(id: string) {
    const { error } = await supabase.from('listings').update({ status: 'sold' }).eq('id', id)
    if (!error) {
      setMessage('✅ Merkitty myydyksi!')
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'sold' } : l))
    }
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>Ladataan...</p>
  if (!user) return <p style={{ textAlign: 'center', marginTop: 60 }}>Kirjaudu ensin sisään.</p>

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => goTo('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 15, padding: 0 }}>
          ← Takaisin
        </button>
        <h2 style={{ margin: 0 }}>Profiili</h2>
      </div>

      <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
        Sähköposti: <strong>{user.email}</strong>
      </p>

      {message && (
        <div style={{ padding: 12, borderRadius: 8, background: '#d4edda', marginBottom: 16, color: '#2d6a4f' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => goTo('#new')} style={{ background: '#1a1a2e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
          + Uusi ilmoitus
        </button>
        <button onClick={() => goTo('#messages')} style={{ background: '#e63946', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
          ✉️ Viestit
        </button>
      </div>

      {/* Välilehdet */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #eee' }}>
        <button
          onClick={() => setTab('listings')}
          style={{ padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: tab === 'listings' ? 700 : 400, borderBottom: tab === 'listings' ? '2px solid #1a1a2e' : '2px solid transparent', marginBottom: -2, color: tab === 'listings' ? '#1a1a2e' : '#888' }}
        >
          Omat ilmoitukset ({listings.length})
        </button>
        <button
          onClick={() => setTab('favorites')}
          style={{ padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: tab === 'favorites' ? 700 : 400, borderBottom: tab === 'favorites' ? '2px solid #e63946' : '2px solid transparent', marginBottom: -2, color: tab === 'favorites' ? '#e63946' : '#888' }}
        >
          ❤️ Suosikit ({favorites.length})
        </button>
      </div>

      {/* Omat ilmoitukset */}
      {tab === 'listings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {listings.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>Sinulla ei ole vielä ilmoituksia.</p>
          ) : listings.map(listing => (
            <div key={listing.id} style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex' }}>
              <div style={{ width: 100, minHeight: 100, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>
                {listing.listing_images?.[0]?.url
                  ? <img src={listing.listing_images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🔩'}
              </div>
              <div style={{ padding: 12, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                      {CAR_MODELS[listing.car_model] || ''} {listing.car_generation || ''}
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>{listing.title}</div>
                    <div style={{ color: '#e63946', fontWeight: 'bold', marginTop: 2 }}>
                      {listing.price ? `${listing.price} €` : 'Hinta sopimuksen mukaan'}
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', background: listing.status === 'active' ? '#d4edda' : listing.status === 'sold' ? '#f8d7da' : '#fff3cd', color: listing.status === 'active' ? '#2d6a4f' : listing.status === 'sold' ? '#c1121f' : '#856404' }}>
                    {listing.status === 'active' ? 'Aktiivinen' : listing.status === 'sold' ? 'Myyty' : 'Piilotettu'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => goTo(`#edit-${listing.id}`)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 13 }}>✏️ Muokkaa</button>
                  {listing.status !== 'sold' && (
                    <>
                      <button onClick={() => toggleStatus(listing.id, listing.status)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 13 }}>
                        {listing.status === 'active' ? '🙈 Piilota' : '👁 Näytä'}
                      </button>
                      <button onClick={() => markAsSold(listing.id)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #52b788', background: '#d4edda', cursor: 'pointer', fontSize: 13, color: '#2d6a4f' }}>✅ Merkitse myydyksi</button>
                    </>
                  )}
                  <button onClick={() => deleteListing(listing.id)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #f8d7da', background: '#f8d7da', cursor: 'pointer', fontSize: 13, color: '#c1121f' }}>🗑 Poista</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suosikit */}
      {tab === 'favorites' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {favorites.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>Ei vielä suosikkeja. Lisää sydän-painikkeella ilmoituksissa!</p>
          ) : favorites.map(listing => (
            <div key={listing.id} style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex' }}>
              <div
                onClick={() => goTo(`#listing-${listing.id}`)}
                style={{ width: 100, minHeight: 100, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, cursor: 'pointer' }}
              >
                {listing.listing_images?.[0]?.url
                  ? <img src={listing.listing_images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🔩'}
              </div>
              <div style={{ padding: 12, flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div onClick={() => goTo(`#listing-${listing.id}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                    {CAR_MODELS[listing.car_model] || ''} {listing.car_generation || ''}
                    {listing.condition ? ` • ${CONDITION_LABELS[listing.condition]}` : ''}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>{listing.title}</div>
                  <div style={{ color: '#e63946', fontWeight: 'bold', marginTop: 2 }}>
                    {listing.price ? `${listing.price} €` : 'Hinta sopimuksen mukaan'}
                  </div>
                </div>
                <button
                  onClick={() => removeFavorite(listing.id)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #f8d7da', background: '#f8d7da', cursor: 'pointer', fontSize: 13, color: '#c1121f', flexShrink: 0 }}
                >
                  ❤️ Poista
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
