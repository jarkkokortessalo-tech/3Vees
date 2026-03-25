import { useState } from 'react'

const CAR_MODELS = [
  { value: '', label: 'Kaikki autot' },
  { value: 'kupla', label: ' Kupla' },
  { value: 'transporter', label: ' Transporter' },
  { value: 'golf', label: ' Golf' },
  { value: 'jetta', label: ' Jetta' },
  { value: 'passat', label: ' Passat' },
  { value: 'polo', label: ' Polo' },
  { value: 'scirocco', label: ' Scirocco' },
  { value: 'corrado', label: ' Corrado' },
]

const CAR_GENERATIONS: Record<string, string[]> = {
  kupla: ['1954-1967', '1968-1979', '1980-1985'],
  transporter: ['T1', 'T2', 'T3'],
  golf: ['Mk1', 'Mk2'],
  jetta: ['Mk1', 'Mk2'],
}

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

const CONDITIONS = [
  { value: '', label: 'Kaikki kunnot' },
  { value: 'uusi', label: 'Uusi' },
  { value: 'lahes_uusi', label: 'Lähes käyttämätön' },
  { value: 'hyva', label: 'Hyvä' },
  { value: 'huono', label: 'Huono' },
  { value: 'rikki', label: 'Rikki' },
]

interface SearchProps {
  onSearch: (params: any) => void
}

export default function Search({ onSearch }: SearchProps) {
  const [text, setText] = useState('')
  const [car, setCar] = useState('')
  const [generation, setGeneration] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [shipping, setShipping] = useState(false)

  function handleSearch() {
    onSearch({ text, car, generation, category, condition, yearFrom, yearTo, priceMin, priceMax, shipping })
  }

  function handleReset() {
    setText(''); setCar(''); setGeneration(''); setCategory('')
    setCondition(''); setYearFrom(''); setYearTo('')
    setPriceMin(''); setPriceMax(''); setShipping(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #ddd', fontSize: 14, boxSizing: 'border-box' as const, background: 'white' }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 'bold' as const, marginBottom: 4, color: '#555', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => window.location.hash = ''}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 15, padding: 0 }}
        >
          ← Takaisin
        </button>
        <h2 style={{ margin: 0 }}>Tarkenna hakua</h2>
      </div>

      <div style={{ background: 'white', border: '1.5px solid #2a2a2a', borderRadius: 8, padding: 24 }}>

        {/* Vapaa tekstihaku */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Hakusana</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #ddd', borderRadius: 6, padding: '10px 14px', background: 'white' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="esim. jarrusatula, golf, blaupunkt..."
              value={text}
              onChange={e => setText(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%' }}
            />
          </div>
        </div>

        {/* Auto ja sukupolvi */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Automalli</label>
            <select value={car} onChange={e => { setCar(e.target.value); setGeneration('') }} style={inputStyle}>
              {CAR_MODELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sukupolvi</label>
            <select value={generation} onChange={e => setGeneration(e.target.value)} style={inputStyle} disabled={!car}>
              <option value="">Kaikki</option>
              {car && CAR_GENERATIONS[car]?.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Kategoria ja kunto */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Kategoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Kunto</label>
            <select value={condition} onChange={e => setCondition(e.target.value)} style={inputStyle}>
              {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Vuosimalli */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Vuosimalli alkaen</label>
            <input type="number" placeholder="esim. 1965" value={yearFrom} onChange={e => setYearFrom(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Vuosimalli asti</label>
            <input type="number" placeholder="esim. 1985" value={yearTo} onChange={e => setYearTo(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Hinta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Hinta min (€)</label>
            <input type="number" placeholder="0" value={priceMin} onChange={e => setPriceMin(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Hinta max (€)</label>
            <input type="number" placeholder="9999" value={priceMax} onChange={e => setPriceMax(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Postitus */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={shipping} onChange={e => setShipping(e.target.checked)} />
            Näytä vain postitse toimitettavat
          </label>
        </div>

        {/* Napit */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSearch}
            style={{ flex: 1, padding: '12px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔍 Hae
          </button>
          <button
            onClick={handleReset}
            style={{ padding: '12px 20px', background: 'white', color: '#666', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 15, cursor: 'pointer' }}
          >
            Tyhjennä
          </button>
        </div>
      </div>
    </div>
  )
}
