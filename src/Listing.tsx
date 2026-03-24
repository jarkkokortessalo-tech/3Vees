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
  lahes_uusi: 'Lähes käyttämätön',
  hyva: 'Hyvä',
  huono: 'Huono',
  rikki: 'Rikki',
}

const CONDITION_COLORS: Record<string, string> = {
  uusi: '#2d6a4f',
  lahes_uusi: '#52b788',
  hyva: '#f4a261',
  huono: '#e76f51',
  rikki: '#c1121f',
}

export default function Listing({ id }: { id: string }) {
  const [listing, setListing] = useState<any>(null)
  const [images, setImages] = useState<any[]>([])
  const [seller, setSeller] = useState<any>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sendMessage, setSendMessage] = useState('')
  const [messageSent, setMessageSent] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) checkFavorite(data.user.id)
    })
    fetchListing()
    incrementViews()
  }, [id])

  async function incrementViews() {
    await supabase.rpc('increment_view_count', { listing_id: id })
  }

  async function fetchListing() {
    const { data } = await supabase
      .from('listings')
      .select('*, listing_images(url, sort_order)')
      .eq('id', id)
      .single()
    if (data) {
      setListing(data)
      setImages(data.listing_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [])
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user_id).single()
      setSeller(profile)
      const { count } = await supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('listing_id', id)
      setFavoriteCount(count || 0)
    }
    setLoading(false)
  }

  async function checkFavorite(userId: string) {
    const { data } = await supabase.from('favorites').select('id').eq('user_id', userId).eq('listing_id', id).single()
    setIsFavorite(!!data)
  }

  async function toggleFavorite() {
    if (!user) { window.location.hash = '#login'; return }
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', id)
      setIsFavorite(false)
      setFavoriteCount(prev => prev - 1)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: id })
      setIsFavorite(true)
      setFavoriteCount(prev => prev + 1)
    }
  }

  async function handleSendMessage() {
    if (!user) { window.location.hash = '#login'; return }
    if (!sendMessage.trim()) return
    const { error } = await supabase.from('messages').insert({
      listing_id: listing.id,
      sender_id: user.id,
      receiver_id: listing.user_id,
      content: sendMessage.trim(),
    })
    if (!error) { setMessageSent(true); setSendMessage('') }
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>Ladataan...</p>
  if (!listing) return <p style={{ textAlign: 'center', marginTop: 60 }}>Ilmoitusta ei löydy.</p>

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>

      {/* Takaisin ja suosikki */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 15, padding: 0 }}>
          ← Takaisin
        </button>
        <button
          onClick={toggleFavorite}
          style={{ background: isFavorite ? '#fff0f0' : 'white', border: `1.5px solid ${isFavorite ? '#e63946' : '#ddd'}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14, color: isFavorite ? '#e63946' : '#888', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {isFavorite ? '❤️' : '🤍'} {favoriteCount > 0 ? favoriteCount : ''} {isFavorite ? 'Suosikeissa' : 'Lisää suosikkeihin'}
        </button>
      </div>

      {/* Katselut ja suosikit */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
          👁 {listing.view_count || 0} katselua
        </span>
        <span style={{ fontSize: 13, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
          ❤️ {favoriteCount} suosikissa
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Kuvat */}
        <div>
          <div style={{ background: '#f5f5f5', borderRadius: 12, overflow: 'hidden', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
            {images.length > 0
              ? <img src={images[activeImage]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '🔩'}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <img key={i} src={img.url} alt="" onClick={() => setActiveImage(i)} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: activeImage === i ? '2px solid #e63946' : '2px solid transparent' }} />
              ))}
            </div>
          )}
        </div>

        {/* Tiedot */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {listing.car_model && <span style={{ background: '#1a1a2e', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 13 }}>{CAR_MODELS[listing.car_model]}</span>}
            {listing.car_generation && <span style={{ background: '#eee', color: '#333', padding: '4px 10px', borderRadius: 20, fontSize: 13 }}>{listing.car_generation}</span>}
            {listing.condition && <span style={{ background: CONDITION_COLORS[listing.condition], color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 13 }}>{CONDITION_LABELS[listing.condition]}</span>}
            {listing.is_rare && <span style={{ background: '#ffd700', color: '#333', padding: '4px 10px', borderRadius: 20, fontSize: 13 }}>⭐ Harvinaisuus</span>}
          </div>

          <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>{listing.title}</h2>
          <div style={{ color: '#e63946', fontWeight: 'bold', fontSize: 28, marginBottom: 16 }}>
            {listing.price ? `${listing.price} €` : 'Hinta sopimuksen mukaan'}
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
            {listing.brand && <div style={{ marginBottom: 4 }}>🏷 Merkki: <strong>{listing.brand}</strong></div>}
            {listing.year_from && <div style={{ marginBottom: 4 }}>📅 Vuosimalli: {listing.year_from}{listing.year_to ? `–${listing.year_to}` : '+'}</div>}
            {listing.engine_fuel && <div style={{ marginBottom: 4 }}>{listing.engine_fuel === 'petrol' ? '⛽ Bensiini' : '🛢 Diesel'}</div>}
            {listing.oe_number && <div style={{ marginBottom: 4 }}>🔢 OE-numero: <strong>{listing.oe_number}</strong></div>}
            {listing.is_aftermarket && <div style={{ marginBottom: 4 }}>🔧 Jälkimarkkinaosa{listing.aftermarket_brand ? `: ${listing.aftermarket_brand}` : ''}</div>}
            {listing.is_original_accessory && <div>✨ Alkuperäinen lisävaruste</div>}
          </div>

          {/* Vanteen tiedot */}
          {listing.category === 'vanteet' && (listing.wheel_diameter || listing.wheel_pcd) && (
            <div style={{ background: '#f0f0ec', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
              <strong>🔩 Vanteen tiedot</strong>
              {listing.wheel_diameter && <div style={{ marginTop: 4 }}>Koko: {listing.wheel_diameter}{listing.wheel_width ? `x${listing.wheel_width}J` : '"'}</div>}
              {listing.wheel_pcd && <div>Pulttijako: {listing.wheel_pcd}</div>}
              {listing.wheel_et && <div>ET-luku: {listing.wheel_et}</div>}
              {listing.wheel_cb && <div>Keskireikä: {listing.wheel_cb} mm</div>}
              {listing.wheel_material && <div>Materiaali: {listing.wheel_material}</div>}
            </div>
          )}

          {/* Radio-tiedot */}
          {listing.category === 'radiot' && (
            <div style={{ background: '#fff8e1', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
              <strong>📻 Radion tiedot</strong>
              {listing.radio_voltage && <div style={{ marginTop: 4 }}>Jännite: {listing.radio_voltage.toUpperCase()}</div>}
              {listing.radio_era && <div>Aikakausi: {listing.radio_era}</div>}
              {listing.radio_works !== null && <div>{listing.radio_works ? '✅ Toimii' : '🔧 Korjattavaksi'}</div>}
            </div>
          )}

          <div style={{ fontSize: 14, marginBottom: 16 }}>
            {listing.shipping_available && <div>📦 Postitus: {listing.shipping_price ? `${listing.shipping_price} €` : 'Hinta sovittavissa'}{listing.shipping_size ? ` (${listing.shipping_size})` : ''}</div>}
            {listing.pickup_available && <div>📍 Nouto: {listing.pickup_postal_code || 'Sijainti sopimuksen mukaan'}</div>}
          </div>
        </div>
      </div>

      {listing.description && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8 }}>Kuvaus</h3>
          <p style={{ lineHeight: 1.7, color: '#444', whiteSpace: 'pre-wrap' }}>{listing.description}</p>
        </div>
      )}

      {user?.id !== listing.user_id && (
        <div style={{ marginTop: 24, background: '#f9f9f9', borderRadius: 12, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Ota yhteyttä myyjään</h3>
          {seller && (
            <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
              Myyjä: <strong>{seller.username || 'Yksityinen myyjä'}</strong>
              {seller.city ? ` • ${seller.city}` : ''}
            </p>
          )}
          {messageSent ? (
            <div style={{ background: '#d4edda', padding: 12, borderRadius: 8, color: '#2d6a4f' }}>
              ✅ Viesti lähetetty! Myyjä vastaa sinulle pian.
            </div>
          ) : (
            <>
              <textarea
                placeholder="Kirjoita viesti myyjälle..."
                value={sendMessage}
                onChange={e => setSendMessage(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '2px solid #ddd', fontSize: 15, boxSizing: 'border-box', resize: 'vertical' }}
              />
              <button onClick={handleSendMessage} style={{ marginTop: 8, background: '#e63946', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }}>
                {user ? 'Lähetä viesti' : 'Kirjaudu lähettääksesi'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
