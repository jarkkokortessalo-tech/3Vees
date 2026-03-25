import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const STEPS = ['Perustiedot', 'Osan tiedot', 'Kuvaus', 'Toimitus']

const CAR_GENERATIONS: Record<string, string[]> = {
  kupla: ['1946-1952', '1953-1957', '1958-1964', '1965-1967', '1968-1970', '1971-1974'],
  transporter: ['T1', 'T2', 'T3'],
  golf: ['Mk1', 'Mk2'],
  jetta: ['Mk1', 'Mk2'],
  passat: ['b1', 'b2'],
  polo: ['mk1', 'mk2'],
  scirocco: ['1'],
  corrado: ['1'],
}

export default function NewListing({ editId }: { editId?: string }) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<any[]>([])
  const isEdit = !!editId

  const [form, setForm] = useState({
    car_model: '',
    car_generation: '',
    year_from: '',
    year_to: '',
    engine_fuel: '',
    category: '',
    title: '',
    description: '',
    condition: '',
    brand: '',
    oe_number: '',
    is_aftermarket: false,
    aftermarket_brand: '',
    is_original_accessory: false,
    radio_voltage: '',
    radio_era: '',
    radio_works: '',
    wheel_diameter: '',
    wheel_width: '',
    wheel_pcd: '',
    wheel_et: '',
    wheel_cb: '',
    wheel_material: '',
    price: '',
    shipping_available: false,
    shipping_price: '',
    shipping_size: '',
    pickup_available: false,
    pickup_postal_code: '',
  })

  useEffect(() => {
    if (editId) loadListing(editId)
  }, [editId])

  async function loadListing(id: string) {
    const { data } = await supabase
      .from('listings')
      .select('*, listing_images(url, sort_order)')
      .eq('id', id)
      .single()
    if (data) {
      setForm({
        car_model: data.car_model || '',
        car_generation: data.car_generation || '',
        year_from: data.year_from?.toString() || '',
        year_to: data.year_to?.toString() || '',
        engine_fuel: data.engine_fuel || '',
        category: data.category || '',
        title: data.title || '',
        description: data.description || '',
        condition: data.condition || '',
        brand: data.brand || '',
        oe_number: data.oe_number || '',
        is_aftermarket: data.is_aftermarket || false,
        aftermarket_brand: data.aftermarket_brand || '',
        is_original_accessory: data.is_original_accessory || false,
        radio_voltage: data.radio_voltage || '',
        radio_era: data.radio_era || '',
        radio_works: data.radio_works !== null ? data.radio_works.toString() : '',
        wheel_diameter: data.wheel_diameter || '',
        wheel_width: data.wheel_width || '',
        wheel_pcd: data.wheel_pcd || '',
        wheel_et: data.wheel_et || '',
        wheel_cb: data.wheel_cb || '',
        wheel_material: data.wheel_material || '',
        price: data.price?.toString() || '',
        shipping_available: data.shipping_available || false,
        shipping_price: data.shipping_price?.toString() || '',
        shipping_size: data.shipping_size || '',
        pickup_available: data.pickup_available || false,
        pickup_postal_code: data.pickup_postal_code || '',
      })
      setExistingImages(data.listing_images || [])
    }
  }

  function set(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('Kirjaudu ensin sisään!'); setLoading(false); return }

    const payload = {
      car_model: form.car_model,
      car_generation: form.car_generation,
      year_from: form.year_from ? parseInt(form.year_from) : null,
      year_to: form.year_to ? parseInt(form.year_to) : null,
      engine_fuel: form.category === 'tekniikka' ? (form.engine_fuel || null) : null,
      category: form.category,
      title: form.title,
      description: form.description,
      condition: form.condition,
      brand: form.brand || null,
      oe_number: form.oe_number || null,
      is_aftermarket: form.is_aftermarket,
      aftermarket_brand: form.aftermarket_brand || null,
      is_original_accessory: form.is_original_accessory,
      radio_voltage: form.category === 'radiot' ? (form.radio_voltage || null) : null,
      radio_era: form.category === 'radiot' ? (form.radio_era || null) : null,
      radio_works: form.category === 'radiot' && form.radio_works !== '' ? form.radio_works === 'true' : null,
      wheel_diameter: form.category === 'vanteet' ? (form.wheel_diameter || null) : null,
      wheel_width: form.category === 'vanteet' ? (form.wheel_width || null) : null,
      wheel_pcd: form.category === 'vanteet' ? (form.wheel_pcd || null) : null,
      wheel_et: form.category === 'vanteet' ? (form.wheel_et || null) : null,
      wheel_cb: form.category === 'vanteet' ? (form.wheel_cb || null) : null,
      wheel_material: form.category === 'vanteet' ? (form.wheel_material || null) : null,
      price: form.price ? parseFloat(form.price) : null,
      shipping_available: form.shipping_available,
      shipping_price: form.shipping_price ? parseFloat(form.shipping_price) : null,
      shipping_size: form.shipping_size || null,
      pickup_available: form.pickup_available,
      pickup_postal_code: form.pickup_postal_code || null,
    }

    let listingId = editId
    if (isEdit) {
      const { error } = await supabase.from('listings').update(payload).eq('id', editId)
      if (error) { setMessage('Virhe: ' + error.message); setLoading(false); return }
    } else {
      const { data: listing, error } = await supabase
        .from('listings').insert({ ...payload, user_id: user.id }).select().single()
      if (error) { setMessage('Virhe: ' + error.message); setLoading(false); return }
      listingId = listing.id
    }

    for (let i = 0; i < images.length; i++) {
      const file = images[i]
      const path = `${listingId}/${Date.now()}_${i}`
      const { data: img } = await supabase.storage.from('listing-images').upload(path, file)
      if (img) {
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path)
        await supabase.from('listing_images').insert({ listing_id: listingId, url: urlData.publicUrl, sort_order: existingImages.length + i })
      }
    }

    setMessage(isEdit ? '✅ Ilmoitus päivitetty!' : '✅ Ilmoitus julkaistu!')
    setTimeout(() => window.location.hash = '#profile', 2000)
    setLoading(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '2px solid #ddd', fontSize: 15, marginBottom: 12, boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 'bold' as const, marginBottom: 4, color: '#555' }
  const btnStyle = (active: boolean) => ({ flex: 1, padding: 10, borderRadius: 8, border: '2px solid', borderColor: active ? '#e63946' : '#ddd', background: active ? '#e63946' : 'white', color: active ? 'white' : '#333', cursor: 'pointer' })

  return (
    <div style={{ maxWidth: 560, margin: '32px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span onClick={() => window.location.hash = '#profile'} style={{ cursor: 'pointer', color: '#888' }}>← Takaisin</span>
        <h2 style={{ margin: 0 }}>{isEdit ? 'Muokkaa ilmoitusta' : 'Uusi ilmoitus'}</h2>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {STEPS.map((_s, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? '#e63946' : '#eee' }} />
        ))}
      </div>
      <div style={{ textAlign: 'center', marginBottom: 20, color: '#888', fontSize: 14 }}>
        Vaihe {step + 1}/{STEPS.length}: <strong>{STEPS[step]}</strong>
      </div>

      {step === 0 && (
        <div>
          <label style={labelStyle}>Auto *</label>
          <select value={form.car_model} onChange={e => set('car_model', e.target.value)} style={inputStyle}>
            <option value="">Valitse auto</option>
            <option value="kupla">Kupla</option>
            <option value="transporter">Transporter</option>
            <option value="golf">Golf</option>
            <option value="jetta">Jetta</option>
          </select>

          {form.car_model && (
            <>
              <label style={labelStyle}>Sukupolvi / korimalli</label>
              <select value={form.car_generation} onChange={e => set('car_generation', e.target.value)} style={inputStyle}>
                <option value="">Valitse</option>
                {CAR_GENERATIONS[form.car_model]?.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Vuosimalli alkaen</label>
              <input type="number" placeholder="esim. 1974" value={form.year_from} onChange={e => set('year_from', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Vuosimalli asti</label>
              <input type="number" placeholder="esim. 1983" value={form.year_to} onChange={e => set('year_to', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <label style={labelStyle}>Kategoria *</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
            <option value="">Valitse kategoria</option>
            <option value="tekniikka">Tekniikka</option>
            <option value="kori">Kori</option>
            <option value="valaistus">Valaistus</option>
            <option value="alusta">Alusta</option>
            <option value="vanteet">Vanteet</option>
            <option value="sisusta">Sisusta</option>
            <option value="sahkot">Sähköt / käyttölaitteet</option>
            <option value="lisavarusteet">Lisävarusteet</option>
            <option value="radiot">Radiot</option>
          </select>

          {form.category === 'tekniikka' && (
            <>
              <label style={labelStyle}>Polttoaine</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={() => set('engine_fuel', 'petrol')} style={btnStyle(form.engine_fuel === 'petrol')}>⛽ Bensiini</button>
                <button onClick={() => set('engine_fuel', 'diesel')} style={btnStyle(form.engine_fuel === 'diesel')}>🛢 Diesel</button>
                <button onClick={() => set('engine_fuel', '')} style={btnStyle(form.engine_fuel === '')}>Molemmat</button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 1 && (
        <div>
          <label style={labelStyle}>Otsikko *</label>
          <input type="text" placeholder="esim. Golf Mk1 etujarrusatula" value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} />

          <label style={labelStyle}>Merkki</label>
          <input type="text" placeholder="esim. Bosch, VW, Pirelli..." value={form.brand} onChange={e => set('brand', e.target.value)} style={inputStyle} />

          <label style={labelStyle}>OE-varaosanumero (vapaaehtoinen)</label>
          <input type="text" placeholder="esim. 171615123" value={form.oe_number} onChange={e => set('oe_number', e.target.value)} style={inputStyle} />

          <label style={labelStyle}>Kunto *</label>
          <select value={form.condition} onChange={e => set('condition', e.target.value)} style={inputStyle}>
            <option value="">Valitse kunto</option>
            <option value="uusi">Uusi</option>
            <option value="lahes_uusi">Lähes käyttämätön</option>
            <option value="hyva">Hyvä</option>
            <option value="huono">Huono</option>
            <option value="rikki">Rikki (osiksi)</option>
          </select>

          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.is_aftermarket} onChange={e => set('is_aftermarket', e.target.checked)} />
            Jälkimarkkinaosa
          </label>

          {form.is_aftermarket && (
            <input type="text" placeholder="Merkki (esim. Febi, Sachs...)" value={form.aftermarket_brand} onChange={e => set('aftermarket_brand', e.target.value)} style={{ ...inputStyle, marginTop: 8 }} />
          )}

          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={form.is_original_accessory} onChange={e => set('is_original_accessory', e.target.checked)} />
            Alkuperäinen lisävaruste
          </label>

          {/* Vanteiden lisätiedot */}
          {form.category === 'vanteet' && (
            <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, marginTop: 12 }}>
              <strong style={{ fontSize: 14 }}>🔩 Vanteen tiedot</strong>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Halkaisija (tuumaa)</label>
                  <input type="text" placeholder="esim. 15" value={form.wheel_diameter} onChange={e => set('wheel_diameter', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Leveys (J)</label>
                  <input type="text" placeholder="esim. 6.0" value={form.wheel_width} onChange={e => set('wheel_width', e.target.value)} style={inputStyle} />
                </div>
              </div>

              <label style={labelStyle}>Pulttijako (PCD)</label>
              <input type="text" placeholder="esim. 4x100" value={form.wheel_pcd} onChange={e => set('wheel_pcd', e.target.value)} style={inputStyle} />

              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>ET-luku (offset)</label>
                  <input type="text" placeholder="esim. ET38" value={form.wheel_et} onChange={e => set('wheel_et', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Keskireikä (CB)</label>
                  <input type="text" placeholder="esim. 57.1" value={form.wheel_cb} onChange={e => set('wheel_cb', e.target.value)} style={inputStyle} />
                </div>
              </div>

              <label style={labelStyle}>Materiaali</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={() => set('wheel_material', 'alumiini')} style={btnStyle(form.wheel_material === 'alumiini')}>⚙️ Alumiini</button>
                <button onClick={() => set('wheel_material', 'teräs')} style={btnStyle(form.wheel_material === 'teräs')}>🔧 Teräs</button>
              </div>
            </div>
          )}

          {/* Radio-lisätiedot */}
          {form.category === 'radiot' && (
            <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, marginTop: 12 }}>
              <strong style={{ fontSize: 14 }}>📻 Radion lisätiedot</strong>
              <label style={{ ...labelStyle, marginTop: 12 }}>Jännite</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={() => set('radio_voltage', '6v')} style={btnStyle(form.radio_voltage === '6v')}>6V</button>
                <button onClick={() => set('radio_voltage', '12v')} style={btnStyle(form.radio_voltage === '12v')}>12V</button>
              </div>
              <label style={labelStyle}>Aikakausi</label>
              <input type="text" placeholder="esim. 1960-luvun alkuperäisradio" value={form.radio_era} onChange={e => set('radio_era', e.target.value)} style={inputStyle} />
              <label style={labelStyle}>Toimivuus</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => set('radio_works', 'true')} style={btnStyle(form.radio_works === 'true')}>✅ Toimii</button>
                <button onClick={() => set('radio_works', 'false')} style={btnStyle(form.radio_works === 'false')}>🔧 Korjattavaksi</button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <label style={labelStyle}>Kuvaus</label>
          <textarea
            placeholder="Kerro osasta tarkemmin — kunto, historia, mihin sopii..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={5}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          {existingImages.length > 0 && (
            <>
              <label style={labelStyle}>Nykyiset kuvat</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {existingImages.map((img, i) => (
                  <img key={i} src={img.url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                ))}
              </div>
            </>
          )}

          <label style={labelStyle}>Lisää kuvia</label>
          <input type="file" accept="image/*" multiple onChange={e => setImages(Array.from(e.target.files || []))} style={{ marginBottom: 12 }} />
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {images.map((img, i) => (
                <img key={i} src={URL.createObjectURL(img)} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <label style={labelStyle}>Hinta (€)</label>
          <input type="number" placeholder="0.00" value={form.price} onChange={e => set('price', e.target.value)} style={inputStyle} />

          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.shipping_available} onChange={e => set('shipping_available', e.target.checked)} />
            📦 Postitus mahdollinen
          </label>

          {form.shipping_available && (
            <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 14, marginTop: 8, marginBottom: 8 }}>
              <label style={labelStyle}>Pakettikoko</label>
              <select value={form.shipping_size} onChange={e => {
                set('shipping_size', e.target.value)
                const prices: Record<string, string> = { 'XXS': '6.90', 'S': '8.90', 'M': '10.90', 'L': '13.90', 'XL': '16.90' }
                if (prices[e.target.value]) set('shipping_price', prices[e.target.value])
              }} style={inputStyle}>
                <option value="">Valitse koko</option>
                <option value="XXS">Pikkupaketti XXS — max 3×25×35 cm — 6,90 €</option>
                <option value="S">S-paketti — max 11×32×42 cm — 8,90 €</option>
                <option value="M">M-paketti — max 19×36×60 cm — 10,90 €</option>
                <option value="L">L-paketti — max 59×36×60 cm — 13,90 €</option>
                <option value="XL">XL-paketti — max 100×60×60 cm — 16,90 €</option>
              </select>

              <label style={labelStyle}>Postituskulut (€)</label>
              <input type="number" placeholder="0.00" value={form.shipping_price} onChange={e => set('shipping_price', e.target.value)} style={inputStyle} />
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>💡 Hinnat ovat ohjeellisia Posti-hintoja.</div>
            </div>
          )}

          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={form.pickup_available} onChange={e => set('pickup_available', e.target.checked)} />
            📍 Nouto mahdollinen
          </label>

          {form.pickup_available && (
            <input type="text" placeholder="Postinumero" value={form.pickup_postal_code} onChange={e => set('pickup_postal_code', e.target.value)} style={{ ...inputStyle, marginTop: 8 }} />
          )}

          {message && (
            <div style={{ padding: 12, borderRadius: 8, background: message.includes('✅') ? '#d4edda' : '#f8d7da', marginBottom: 12, marginTop: 12 }}>
              {message}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: 12, borderRadius: 8, border: '2px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 15 }}>
            ← Edellinen
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#e63946', color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 'bold' }}>
            Seuraava →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#e63946', color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 'bold' }}>
            {loading ? 'Tallennetaan...' : isEdit ? '✅ Tallenna muutokset' : '✅ Julkaise ilmoitus'}
          </button>
        )}
      </div>
    </div>
  )
}
