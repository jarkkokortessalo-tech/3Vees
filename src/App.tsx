import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import NewListing from './NewListing'
import Listing from './Listing'
import Profile from './Profile'
import Messages from './Messages'
import Search from './Search'

const LOGO_URL = 'https://rohjtuvkgjkrguvpsqpa.supabase.co/storage/v1/object/public/assets/preview.webp'

const CAR_MODELS = [
  { value: 'kupla', label: '🚗 Kupla' },
  { value: 'transporter', label: '🚐 Transporter' },
  { value: 'golf', label: '🚙 Golf' },
  { value: 'jetta', label: '🚘 Jetta' },
]

const CATEGORIES = [
  { value: '', label: 'Kaikki kategoriat' },
  { value: 'tekniikka', label: 'Tekniikka' },
  { value: 'kori', label: 'Kori' },
  { value: 'valaistus', label: 'Valaistus' },
  { value: 'alusta', label: 'Alusta' },
  { value: 'vanteet', label: 'Vanteet' },
  { value: 'sisusta', label: 'Sisusta' },
  { value: 'sahkot', label: 'Sähköt' },
  { value: 'lisavarusteet', label: 'Lisävarusteet' },
  { value: 'radiot', label: 'Radiot' },
]

const CONDITION_LABELS: Record<string, string> = {
  uusi: 'Uusi',
  lahes_uusi: 'Lähes uusi',
  hyva: 'Hyvä',
  huono: 'Huono',
  rikki: 'Rikki',
}

function getHash() {
  return window.location.hash
}

export default function App() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCar, setSelectedCar] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchText, setSearchText] = useState('')
  const [user, setUser] = useState<any>(null)
  const [hash, setHash] = useState(getHash())
  const [showCarModal, setShowCarModal] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    const onHash = () => setHash(getHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (hash === '' || hash === '#') fetchListings()
  }, [hash, selectedCar, selectedCategory, searchText])

  async function fetchListings() {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*, listing_images(url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (selectedCar) query = query.eq('car_model', selectedCar)
    if (selectedCategory) query = query.eq('category', selectedCategory)
    if (searchText) query = query.ilike('title', `%${searchText}%`)
    const { data } = await query
    setListings(data || [])
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.hash = ''
    setHash('')
  }

  function goTo(newHash: string) {
    window.location.hash = newHash
    setHash(newHash)
  }

  const currentHash = getHash()
  if (currentHash === '#login') return <Login />
  if (currentHash === '#new') return <NewListing />
  if (currentHash === '#profile') return <Profile />
  if (currentHash === '#messages') return <Messages />
  if (currentHash === '#search') return <Search onSearch={(params) => {
    setSearchText(params.text)
    setSelectedCar(params.car)
    setSelectedCategory(params.category)
    window.location.hash = ''
    setHash('')
  }} />
  if (currentHash.startsWith('#listing-')) {
    return <Listing id={currentHash.replace('#listing-', '')} />
  }
  if (currentHash.startsWith('#edit-')) {
    return <NewListing editId={currentHash.replace('#edit-', '')} />
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#f4f4f0', minHeight: '100vh' }}>

      {showCarModal && (
        <div
          onClick={() => setShowCarModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#faf9f6', border: '1.5px solid #2a2a2a', borderRadius: 4, padding: 24, minWidth: 280 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Valitse automalli</h3>
            {[{ value: '', label: 'Kaikki autot' }, ...CAR_MODELS].map(car => (
              <div
                key={car.value}
                onClick={() => { setSelectedCar(car.value); setShowCarModal(false) }}
                style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: 3, fontWeight: selectedCar === car.value ? 700 : 400, background: selectedCar === car.value ? '#f0efe8' : 'transparent', marginBottom: 4, border: selectedCar === car.value ? '1px solid #2a2a2a' : '1px solid transparent' }}
              >
                {car.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: '#faf9f6', borderBottom: '1.5px solid #2a2a2a' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', position: 'relative' }}>

          <div style={{ position: 'absolute', right: 16, top: 16, display: 'flex', gap: 8, zIndex: 2 }}>
            {user ? (
              <>
                <div
                  onClick={() => goTo('#profile')}
                  style={{ width: 38, height: 38, borderRadius: '50%', border: '1.5px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#faf9f6' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </div>
                <button onClick={signOut} style={{ padding: '7px 12px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#888', borderRadius: 3 }}>
                  Ulos
                </button>
              </>
            ) : (
              <button onClick={() => goTo('#login')} style={{ padding: '7px 16px', border: '1.5px solid #2a2a2a', background: '#faf9f6', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderRadius: 3 }}>
                Kirjaudu sisään
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
            <img src={LOGO_URL} alt="3Vs VW Parts" style={{ maxWidth: 500, width: '100%', height: 'auto' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', paddingBottom: 16 }}>
            <button
              onClick={() => setShowCarModal(true)}
              style={{ padding: '8px 20px', border: '1.5px solid #2a2a2a', background: '#faf9f6', cursor: 'pointer', fontSize: 14, fontWeight: 600, borderRadius: 3 }}
            >
              {selectedCar ? CAR_MODELS.find(c => c.value === selectedCar)?.label : '▾ Valitse automalli'}
            </button>
            {user && (
              <button onClick={() => goTo('#new')} style={{ padding: '8px 20px', border: '1.5px solid #2a2a2a', background: '#faf9f6', cursor: 'pointer', fontSize: 14, fontWeight: 600, borderRadius: 3 }}>
                + Uusi ilmoitus
              </button>
            )}
          </div>

          <div style={{ paddingBottom: 16, display: 'flex', gap: 8, maxWidth: 600, margin: '0 auto' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #2a2a2a', borderRadius: 3, padding: '9px 14px', background: 'white' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Hae varaosaa, mallia tai osanumeroa..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', background: 'transparent' }}
              />
            </div>
            <button
  onClick={() => { window.location.hash = '#search'; setHash('#search') }}
  style={{ padding: '9px 14px', border: '1.5px solid #2a2a2a', borderRadius: 3, background: '#1a1a2e', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
>
  Tarkenna hakua
</button>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ padding: '9px 12px', border: '1.5px solid #2a2a2a', borderRadius: 3, fontSize: 13, background: '#faf9f6', cursor: 'pointer' }}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: 60 }}>Ladataan...</p>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔩</div>
            <p style={{ color: '#888', fontSize: 18 }}>Ei ilmoituksia.</p>
            <p style={{ color: '#aaa', fontSize: 14 }}>Ole ensimmäinen myyjä!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {listings.map(listing => (
              <div
                key={listing.id}
                onClick={() => goTo(`#listing-${listing.id}`)}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                style={{ border: '1.5px solid #2a2a2a', borderRadius: 3, overflow: 'hidden', background: 'white', cursor: 'pointer', transition: 'transform 0.15s', boxShadow: '3px 3px 0 #d0cfc8' }}
              >
                <div style={{ background: '#f0efe8', height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, borderBottom: '1.5px solid #2a2a2a' }}>
                  {listing.listing_images?.[0]?.url
                    ? <img src={listing.listing_images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '🔩'}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {CAR_MODELS.find(c => c.value === listing.car_model)?.label}
                    {listing.car_generation ? ` • ${listing.car_generation}` : ''}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#1a1a1a' }}>{listing.title}</div>
                  <div style={{ color: '#c1121f', fontWeight: 800, fontSize: 18 }}>
                    {listing.price ? `${listing.price} €` : 'Hinta sopimuksen mukaan'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {listing.condition && (
                      <span style={{ fontSize: 11, background: '#f0efe8', color: '#666', padding: '3px 8px', border: '0.5px solid #ccc', borderRadius: 2 }}>
                        {CONDITION_LABELS[listing.condition]}
                      </span>
                    )}
                    {listing.shipping_available && (
                      <span style={{ fontSize: 11, background: '#f0efe8', color: '#555', padding: '3px 8px', border: '0.5px solid #ccc', borderRadius: 2 }}>
                        📦 Postitus
                      </span>
                    )}
                    {listing.is_rare && (
                      <span style={{ fontSize: 11, background: '#fff8e1', color: '#7d5a00', padding: '3px 8px', border: '0.5px solid #e0c060', borderRadius: 2 }}>
                        ⭐ Harvinaisuus
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
