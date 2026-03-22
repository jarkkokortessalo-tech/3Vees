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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetchListing()
  }, [id])

  async function fetchListing() {
    const { data } = await supabase
      .from('listings')
      .select('*, listing_images(url, sort_order)')
      .eq('id', id)
      .single()

    if (data) {
      setListing(data)
      setImages(
        data.listing_images?.sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        ) || []
      )
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user_id)
        .single()
      setSeller(profile)
    }
    setLoading(false)
  }

  async function handleSendMessage() {
    if (!user) {
      window.location.hash = '#login'
      return
    }
    if (!sendMessage.trim()) return

    const { error } = await supabase.from('messages').insert({
      listing_id: listing.id,
      sender_id: user.id,
      receiver_id: listing.user_id,
      content: sendMessage.trim(),
    })

    if (!error) {
      setMessageSent(true)
      setSendMessage('')
    }
  }

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: 60 }}>Ladataan...</p>
  }

  if (!listing) {
    return <p style={{ textAlign: 'center', marginTop: 60 }}>Ilmoitusta ei löydy.</p>
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#faf9f6', minHeight: '100vh' }}>
      <button
        onClick={() => window.history.back()}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 15, marginBottom: 16, padding: 0 }}
      >
        ← Takaisin
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ background: '#f5f5f5', borderRadius: 12, overflow: 'hidden', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
            {images.length > 0
              ? <img src={images[activeImage]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '🔩'}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt=""
                  onClick={() => setActiveImage(i)}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: activeImage === i ? '2px solid #e63946' : '2px solid transparent' }}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {listing.car_model && (
              <span style={{ background: '#1a1a2e', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 13 }}>
                {CAR_MODELS[listing.car_model]}
              </span>
            )}
            {listing.car_generation && (
              <span style={{ background: '#eee', color: '#333', padding: '4px 10px', borderRadius: 20, fontSize: 13 }}>
                {listing.car_generation}
              </span>
            )}
            {listing.condition && (
              <span style={{ background: CONDITION_COLORS[listing.condition], color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 13 }}>
                {CONDITION_LABELS[listing.condition]}
              </span>
            )}
            {listing.is_rare && (
              <span style={{ background: '#ffd700', color: '#333', padding: '4px 10px', borderRadius: 20, fontSize: 13 }}>
                ⭐ Harvinaisuus
              </span>
            )}
          </div>

          <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>{listing.title}</h2>

          <div style={{ color: '#e63946', fontWeight: 'bold', fontSize: 28, marginBottom: 16 }}>
            {listing.price ? `${listing.price} €` : 'Hinta sopimuksen mukaan'}
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
            {listing.year_from && (
              <div style={{ marginBottom: 4 }}>
                📅 Vuosimalli: {listing.year_from}{listing.year_to ? `–${listing.year_to}` : '+'}
              </div>
            )}
            {listing.engine_cooling && (
              <div style={{ marginBottom: 4 }}>
                {listing.engine_cooling === 'air' ? '💨 Ilmajäähdytteinen' : '💧 Vesijäähdytteinen'}
              </div>
            )}
            {listing.engine_fuel && (
              <div style={{ marginBottom: 4 }}>
                {listing.engine_fuel === 'petrol' ? '⛽ Bensiini' : '🛢 Diesel'}
              </div>
            )}
            {listing.oe_number && (
              <div style={{ marginBottom: 4 }}>🔢 OE-numero: <strong>{listing.oe_number}</strong></div>
            )}
            {listing.is_aftermarket && (
              <div style={{ marginBottom: 4 }}>
                🔧 Jälkimarkkinaosa{listing.aftermarket_brand ? `: ${listing.aftermarket_brand}` : ''}
              </div>
            )}
            {listing.is_original_accessory && (
              <div>✨ Alkuperäinen lisävaruste</div>
            )}
          </div>

          {listing.category === 'radiot' && (
            <div style={{ background: '#fff8e1', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
              <strong>📻 Radion tiedot</strong>
              {listing.radio_voltage && (
                <div style={{ marginTop: 4 }}>Jännite: {listing.radio_voltage.toUpperCase()}</div>
              )}
              {listing.radio_era && <div>Aikakausi: {listing.radio_era}</div>}
              {listing.radio_works !== null && (
                <div>{listing.radio_works ? '✅ Toimii' : '🔧 Korjattavaksi'}</div>
              )}
            </div>
          )}

          <div style={{ fontSize: 14, marginBottom: 16 }}>
            {listing.shipping_available && (
              <div>📦 Postitus: {listing.shipping_price ? `${listing.shipping_price} €` : 'Hinta sovittavissa'}</div>
            )}
            {listing.pickup_available && (
              <div>📍 Nouto: {listing.pickup_postal_code || 'Sijainti sopimuksen mukaan'}</div>
            )}
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
              <button
                onClick={handleSendMessage}
                style={{ marginTop: 8, background: '#e63946', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }}
              >
                {user ? 'Lähetä viesti' : 'Kirjaudu lähettääksesi'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}