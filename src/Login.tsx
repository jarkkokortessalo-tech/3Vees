import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setMessage('')

    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage('Virhe: ' + error.message)
      } else if (data.user) {
        // Luodaan profiili suoraan tässä
        await supabase.from('profiles').upsert({ id: data.user.id })
        setMessage('✅ Tili luotu! Voit nyt kirjautua sisään.')
        setIsRegister(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage('Virhe: ' + error.message)
      else window.location.hash = ''
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 32, border: '1px solid #eee', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginTop: 0 }}>{isRegister ? 'Luo tili' : 'Kirjaudu sisään'}</h2>

      <input
        type="email"
        placeholder="Sähköposti"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '2px solid #ddd', fontSize: 15, marginBottom: 10, boxSizing: 'border-box' }}
      />
      <input
        type="password"
        placeholder="Salasana"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '2px solid #ddd', fontSize: 15, marginBottom: 16, boxSizing: 'border-box' }}
      />

      {message && (
        <div style={{ padding: 10, borderRadius: 8, background: message.includes('✅') ? '#d4edda' : '#f8d7da', marginBottom: 12, fontSize: 14 }}>
          {message}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ width: '100%', padding: 12, background: '#e63946', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}
      >
        {loading ? 'Odota...' : isRegister ? 'Luo tili' : 'Kirjaudu'}
      </button>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
        {isRegister ? 'Onko sinulla jo tili?' : 'Ei vielä tiliä?'}{' '}
        <span onClick={() => setIsRegister(!isRegister)} style={{ color: '#e63946', cursor: 'pointer', fontWeight: 'bold' }}>
          {isRegister ? 'Kirjaudu' : 'Rekisteröidy'}
        </span>
      </p>

      <p style={{ textAlign: 'center' }}>
        <span onClick={() => window.location.hash = ''} style={{ color: '#888', cursor: 'pointer', fontSize: 13 }}>
          ← Takaisin etusivulle
        </span>
      </p>
    </div>
  )
}
