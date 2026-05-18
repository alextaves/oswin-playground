const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export default function Grafting() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f4f0',
    }}>
      <p style={{
        fontFamily: SANS, fontSize: 11, letterSpacing: '0.2em',
        textTransform: 'uppercase', color: 'rgba(0,0,0,0.25)',
        textAlign: 'center', lineHeight: 1.8,
      }}>
        Grafting.<br />Coming soon.
      </p>
    </div>
  )
}
