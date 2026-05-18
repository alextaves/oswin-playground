import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'
import styles from './SchoenbergPlayground.module.css'

const PIANO_URLS = {
  A0:'A0.mp3',  C1:'C1.mp3',  'D#1':'Ds1.mp3', 'F#1':'Fs1.mp3',
  A1:'A1.mp3',  C2:'C2.mp3',  'D#2':'Ds2.mp3', 'F#2':'Fs2.mp3',
  A2:'A2.mp3',  C3:'C3.mp3',  'D#3':'Ds3.mp3', 'F#3':'Fs3.mp3',
  A3:'A3.mp3',  C4:'C4.mp3',  'D#4':'Ds4.mp3', 'F#4':'Fs4.mp3',
  A4:'A4.mp3',  C5:'C5.mp3',  'D#5':'Ds5.mp3', 'F#5':'Fs5.mp3',
  A5:'A5.mp3',  C6:'C6.mp3',  'D#6':'Ds6.mp3', 'F#6':'Fs6.mp3',
  A6:'A6.mp3',  C7:'C7.mp3',  'D#7':'Ds7.mp3', 'F#7':'Fs7.mp3',
  A7:'A7.mp3',  C8:'C8.mp3',
}

const VOICE_TRACKS = [
  { id: 'track-0', label: 'Track 1' },
  { id: 'track-1', label: 'Track 2' },
  { id: 'track-2', label: 'Track 3' },
]

const PIANO_TRACKS = [
  { midi: '/midi/op11.mid',   label: 'Schoenberg — Op. 11 No. 1' },
  { midi: '/midi/op11no2.mid', label: 'Schoenberg — Op. 11 No. 2' },
  { midi: '/midi/op11no3.mid', label: 'Schoenberg — Op. 11 No. 3' },
  { midi: '/midi/op19.mid',   label: 'Schoenberg — Op. 19 (complete)' },
  { midi: '/midi/op19no2.mid', label: 'Schoenberg — Op. 19 No. 2 (Langsam)' },
  { midi: '/midi/op19no6.mid', label: 'Schoenberg — Op. 19 No. 6 (Sehr langsam)' },
  { midi: '/midi/33.mid',     label: 'Track 33' },
]

export default function SchoenbergPlayground() {
  const containerRef = useRef(null)
  const disposeRef   = useRef([])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const dispose = disposeRef.current

    // ── Global effects chain ──────────────────────────────────────────────
    const reverb      = new Tone.Reverb({ decay: 2, wet: 0 }).toDestination()
    const globalDelay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0 }).connect(reverb)
    const globalDist  = new Tone.Distortion({ distortion: 0.5, wet: 0 }).connect(globalDelay)
    dispose.push(reverb, globalDelay, globalDist)

    // ── Mix recorder ──────────────────────────────────────────────────────
    const recorder = new Tone.Recorder()
    reverb.connect(recorder)
    dispose.push(recorder)

    let isRecording = false
    const recBtn = el.querySelector('.js-record-mix')
    recBtn.addEventListener('click', async () => {
      await Tone.start()
      if (!isRecording) {
        await recorder.start()
        isRecording = true
        recBtn.textContent = 'Stop Rec'
        recBtn.classList.add('recording')
      } else {
        const blob = await recorder.stop()
        isRecording = false
        recBtn.textContent = 'Rec'
        recBtn.classList.remove('recording')
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `mix-${Date.now()}.webm`; a.click()
        URL.revokeObjectURL(url)
      }
    })

    el.querySelector('.js-reverb').addEventListener('input', e => {
      reverb.wet.value = Number(e.target.value)
      el.querySelector('.js-reverb-val').textContent = e.target.value
    })
    el.querySelector('.js-delay').addEventListener('input', e => {
      globalDelay.wet.value = Number(e.target.value)
      el.querySelector('.js-delay-val').textContent = e.target.value
    })
    el.querySelector('.js-dist').addEventListener('input', e => {
      globalDist.wet.value = Number(e.target.value)
      el.querySelector('.js-dist-val').textContent = e.target.value
    })

    // ── Voice tracks ──────────────────────────────────────────────────────
    const voiceStates = Array.from(el.querySelectorAll('.js-voice-track')).map(trackEl => {
      const pitchShift = new Tone.PitchShift(0).connect(globalDist)
      const vol        = new Tone.Volume(0).connect(pitchShift)
      dispose.push(pitchShift, vol)

      const state = { player: null, grainPlayer: null, grainMode: false, mediaRecorder: null, chunks: [] }

      const recordBtn = trackEl.querySelector('.js-btn-record')
      const playBtn   = trackEl.querySelector('.js-btn-play')
      const stopBtn   = trackEl.querySelector('.js-btn-stop')
      const grainBtn  = trackEl.querySelector('.js-btn-grain')
      const fileInput = trackEl.querySelector('.js-input-file')
      const statusEl  = trackEl.querySelector('.js-status')

      trackEl.querySelector('.js-sl-volume').addEventListener('input', e => {
        vol.volume.value = Number(e.target.value)
        trackEl.querySelector('.js-val-volume').textContent = e.target.value
      })
      trackEl.querySelector('.js-sl-pitch').addEventListener('input', e => {
        pitchShift.pitch = Number(e.target.value)
        trackEl.querySelector('.js-val-pitch').textContent = e.target.value
      })
      trackEl.querySelector('.js-sl-grain').addEventListener('input', e => {
        trackEl.querySelector('.js-val-grain').textContent = e.target.value
        if (state.grainPlayer) state.grainPlayer.grainSize = Number(e.target.value)
      })
      trackEl.querySelector('.js-sl-overlap').addEventListener('input', e => {
        trackEl.querySelector('.js-val-overlap').textContent = e.target.value
        if (state.grainPlayer) state.grainPlayer.overlap = Number(e.target.value)
      })
      trackEl.querySelector('.js-sl-drift').addEventListener('input', e => {
        trackEl.querySelector('.js-val-drift').textContent = e.target.value
        if (state.grainPlayer) state.grainPlayer.drift = Number(e.target.value)
      })
      trackEl.querySelector('.js-sl-speed').addEventListener('input', e => {
        trackEl.querySelector('.js-val-speed').textContent = e.target.value
        if (state.grainPlayer) state.grainPlayer.playbackRate = Number(e.target.value)
      })

      async function loadAudio(url, label) {
        statusEl.textContent = 'Loading…'
        if (state.player) { state.player.dispose(); state.player = null }
        if (state.grainPlayer) { state.grainPlayer.dispose(); state.grainPlayer = null }
        if (state.grainMode) {
          state.grainMode = false
          grainBtn.classList.remove('active')
          trackEl.classList.remove(styles.grainActive)
        }
        state.player = new Tone.Player(url).connect(vol)
        await state.player.load(url)
        state.grainPlayer = new Tone.GrainPlayer(url).connect(vol)
        state.grainPlayer.loop         = true
        state.grainPlayer.grainSize    = Number(trackEl.querySelector('.js-sl-grain').value)
        state.grainPlayer.overlap      = Number(trackEl.querySelector('.js-sl-overlap').value)
        state.grainPlayer.drift        = Number(trackEl.querySelector('.js-sl-drift').value)
        state.grainPlayer.playbackRate = Number(trackEl.querySelector('.js-sl-speed').value)
        playBtn.disabled  = false
        stopBtn.disabled  = false
        grainBtn.disabled = false
        statusEl.textContent = label
        updatePlayAll()
      }

      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0]
        if (!file) return
        await loadAudio(URL.createObjectURL(file), file.name)
        fileInput.value = ''
      })

      recordBtn.addEventListener('click', async () => {
        if (state.mediaRecorder?.state === 'recording') {
          state.mediaRecorder.stop()
          recordBtn.textContent = 'Record'
          recordBtn.classList.remove('recording')
          statusEl.textContent = 'Processing…'
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        state.chunks = []
        state.mediaRecorder = new MediaRecorder(stream)
        state.mediaRecorder.ondataavailable = e => state.chunks.push(e.data)
        state.mediaRecorder.onstop = async () => {
          const blob = new Blob(state.chunks, { type: 'audio/webm' })
          await loadAudio(URL.createObjectURL(blob), 'Recording')
          stream.getTracks().forEach(t => t.stop())
        }
        state.mediaRecorder.start()
        recordBtn.textContent = 'Stop'
        recordBtn.classList.add('recording')
        statusEl.textContent = 'Recording…'
      })

      playBtn.addEventListener('click', async () => {
        if (!state.player) return
        await Tone.start()
        state.player.start()
        statusEl.textContent = 'Playing'
      })

      stopBtn.addEventListener('click', () => {
        try { if (state.player) state.player.stop() } catch {}
        if (state.grainMode && state.grainPlayer) {
          state.grainPlayer.stop()
          state.grainMode = false
          grainBtn.classList.remove('active')
          trackEl.classList.remove(styles.grainActive)
        }
        statusEl.textContent = 'Stopped'
      })

      grainBtn.addEventListener('click', async () => {
        if (!state.grainPlayer) return
        await Tone.start()
        if (!state.grainMode) {
          state.grainMode = true
          state.grainPlayer.start()
          grainBtn.classList.add('active')
          trackEl.classList.add(styles.grainActive)
          statusEl.textContent = 'Grain'
        } else {
          state.grainMode = false
          state.grainPlayer.stop()
          grainBtn.classList.remove('active')
          trackEl.classList.remove(styles.grainActive)
          statusEl.textContent = 'Ready'
        }
      })

      return state
    })

    // ── Piano tracks ──────────────────────────────────────────────────────
    const pianoStates = Array.from(el.querySelectorAll('.js-piano-track')).map(trackEl => {
      const midiPath    = trackEl.dataset.midi
      const statusEl    = trackEl.querySelector('.js-status')
      const playBtn     = trackEl.querySelector('.js-btn-play')
      const stopBtn     = trackEl.querySelector('.js-btn-stop')
      const progressFill = trackEl.querySelector('.js-progress-fill')

      const trackDist  = new Tone.Distortion({ distortion: 0, wet: 0 }).connect(globalDist)
      const trackDelay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0 }).connect(trackDist)
      const vol        = new Tone.Volume(0).connect(trackDelay)
      const pitchShift = new Tone.PitchShift(0).connect(vol)
      dispose.push(trackDist, trackDelay, vol, pitchShift)

      trackEl.querySelector('.js-sl-volume').addEventListener('input', e => {
        vol.volume.value = Number(e.target.value)
        trackEl.querySelector('.js-val-volume').textContent = e.target.value
      })
      trackEl.querySelector('.js-sl-pitch').addEventListener('input', e => {
        pitchShift.pitch = Number(e.target.value)
        trackEl.querySelector('.js-val-pitch').textContent = e.target.value
      })
      trackEl.querySelector('.js-sl-delay').addEventListener('input', e => {
        trackDelay.wet.value = Number(e.target.value)
        trackEl.querySelector('.js-val-delay').textContent = e.target.value
      })
      trackEl.querySelector('.js-sl-dist').addEventListener('input', e => {
        trackDist.wet.value = Number(e.target.value)
        trackEl.querySelector('.js-val-dist').textContent = e.target.value
      })

      let parts = [], loopDuration = 0, loaded = false, playing = false, startedAt = 0, rafId = null

      const sampler = new Tone.Sampler({
        urls: PIANO_URLS,
        baseUrl: 'https://tonejs.github.io/audio/salamander/',
        onload: async () => {
          try {
            const midi = await Midi.fromUrl(midiPath)
            loopDuration = midi.duration
            midi.tracks.forEach(track => {
              if (!track.notes.length) return
              const part = new Tone.Part(
                (time, note) => sampler.triggerAttackRelease(note.name, note.duration, time, note.velocity),
                track.notes.map(n => ({ time: n.time, name: n.name, duration: n.duration, velocity: n.velocity }))
              )
              part.loop = true
              part.loopEnd = loopDuration
              parts.push(part)
            })
            loaded = true
            playBtn.disabled = false
            stopBtn.disabled = false
            statusEl.textContent = 'Ready'
            updatePlayAll()
          } catch (err) {
            statusEl.textContent = 'MIDI load failed'
          }
        },
      }).connect(pitchShift)
      dispose.push(sampler)

      function tickProgress() {
        if (!playing) return
        const elapsed = Tone.now() - startedAt
        const looped  = loopDuration > 0 ? elapsed % loopDuration : 0
        progressFill.style.width = `${loopDuration > 0 ? (looped / loopDuration) * 100 : 0}%`
        rafId = requestAnimationFrame(tickProgress)
      }

      function startParts() {
        parts.forEach(p => { p.stop(); p.start('+0') })
        if (Tone.Transport.state !== 'started') Tone.Transport.start()
        startedAt = Tone.now()
        playing = true
        if (rafId) cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(tickProgress)
        statusEl.textContent = 'Playing'
      }

      function stopParts() {
        parts.forEach(p => p.stop())
        playing = false
        if (rafId) cancelAnimationFrame(rafId)
        progressFill.style.width = '0%'
        statusEl.textContent = 'Stopped'
      }

      playBtn.addEventListener('click', async () => {
        if (!loaded) return
        await Tone.start()
        startParts()
      })
      stopBtn.addEventListener('click', () => stopParts())

      return { startParts, stopParts, isLoaded: () => loaded }
    })

    // ── Play All ──────────────────────────────────────────────────────────
    function updatePlayAll() {
      const anyReady = voiceStates.some(t => t.player) || pianoStates.some(t => t.isLoaded())
      el.querySelector('.js-play-all').disabled = !anyReady
    }

    el.querySelector('.js-play-all').addEventListener('click', async () => {
      await Tone.start()
      if (Tone.Transport.state !== 'started') Tone.Transport.start()
      pianoStates.forEach(t => { if (t.isLoaded()) t.startParts() })
      voiceStates.forEach(t => { if (t.player) t.player.start() })
    })

    return () => {
      disposeRef.current.forEach(node => { try { node.dispose() } catch {} })
      disposeRef.current = []
    }
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={styles.app} ref={containerRef}>
        <div className={styles.header}>
          <h1>Schoenberg Playground</h1>
          <div className={styles.headerButtons}>
            <button className={`js-record-mix ${styles.btnRecordMix}`}>Rec</button>
            <button className="js-play-all" disabled>Play All</button>
          </div>
        </div>

        <p className={styles.sectionLabel}>Voice Tracks</p>
        <div className={styles.tracks}>
          {VOICE_TRACKS.map(({ id, label }) => (
            <div key={id} className={`js-voice-track ${styles.track} ${styles.voiceTrack}`}>
              <div className={styles.trackHeader}>
                <span className={styles.trackLabel}>{label}</span>
                <span className={`js-status ${styles.trackStatus}`}>No recording</span>
              </div>
              <div className={styles.trackButtons}>
                <button className="js-btn-record">Record</button>
                <label className={styles.btnUpload}>
                  Upload<input type="file" className="js-input-file" accept="audio/*" style={{ display: 'none' }} />
                </label>
                <button className={`js-btn-play ${styles.btnPlay}`} disabled>Play</button>
                <button className={`js-btn-stop ${styles.btnStop}`} disabled>Stop</button>
                <button className={`js-btn-grain ${styles.btnGrain}`} disabled>Grain</button>
              </div>
              <div className={styles.trackEffects}>
                <div className={styles.effect}>
                  <label>Volume <span className="js-val-volume">0</span> dB</label>
                  <input type="range" className="js-sl-volume" min="-30" max="6" step="1" defaultValue="0" />
                </div>
                <div className={styles.effect}>
                  <label>Pitch <span className="js-val-pitch">0</span> st</label>
                  <input type="range" className="js-sl-pitch" min="-12" max="12" step="1" defaultValue="0" />
                </div>
              </div>
              <div className={styles.grainControls}>
                <div className={styles.effect}>
                  <label>Grain <span className="js-val-grain">0.2</span>s</label>
                  <input type="range" className="js-sl-grain" min="0.02" max="0.5" step="0.01" defaultValue="0.2" />
                </div>
                <div className={styles.effect}>
                  <label>Overlap <span className="js-val-overlap">0.1</span></label>
                  <input type="range" className="js-sl-overlap" min="0" max="0.95" step="0.01" defaultValue="0.1" />
                </div>
                <div className={styles.effect}>
                  <label>Drift <span className="js-val-drift">0</span></label>
                  <input type="range" className="js-sl-drift" min="0" max="1" step="0.01" defaultValue="0" />
                </div>
                <div className={styles.effect}>
                  <label>Speed <span className="js-val-speed">1</span>x</label>
                  <input type="range" className="js-sl-speed" min="0.05" max="2" step="0.05" defaultValue="1" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className={styles.sectionLabel}>Piano Channels</p>
        <div className={styles.tracks}>
          {PIANO_TRACKS.map(({ midi, label }) => (
            <div key={midi} className={`js-piano-track ${styles.track} ${styles.pianoTrack}`} data-midi={midi}>
              <div className={styles.trackHeader}>
                <span className={styles.trackLabel}>{label}</span>
                <span className={`js-status ${styles.trackStatus}`}>Loading samples…</span>
              </div>
              <div className={styles.progressWrap}>
                <div className={`js-progress-fill ${styles.progressFill}`} />
              </div>
              <div className={styles.trackButtons}>
                <button className={`js-btn-play ${styles.btnPlay}`} disabled>Play</button>
                <button className={`js-btn-stop ${styles.btnStop}`} disabled>Stop</button>
              </div>
              <div className={styles.trackEffects}>
                <div className={styles.effect}>
                  <label>Vol <span className="js-val-volume">0</span></label>
                  <input type="range" className="js-sl-volume" min="-30" max="6" step="1" defaultValue="0" />
                </div>
                <div className={styles.effect}>
                  <label>Pitch <span className="js-val-pitch">0</span></label>
                  <input type="range" className="js-sl-pitch" min="-12" max="12" step="1" defaultValue="0" />
                </div>
                <div className={styles.effect}>
                  <label>Delay <span className="js-val-delay">0</span></label>
                  <input type="range" className="js-sl-delay" min="0" max="1" step="0.01" defaultValue="0" />
                </div>
                <div className={styles.effect}>
                  <label>Dist <span className="js-val-dist">0</span></label>
                  <input type="range" className="js-sl-dist" min="0" max="1" step="0.01" defaultValue="0" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.globalEffects}>
          <h2>Global Effects</h2>
          <div className={styles.effectRow}>
            <div className={styles.effect}>
              <label>Reverb <span className="js-reverb-val">0</span></label>
              <input type="range" className="js-reverb" min="0" max="1" step="0.01" defaultValue="0" />
            </div>
            <div className={styles.effect}>
              <label>Delay <span className="js-delay-val">0</span></label>
              <input type="range" className="js-delay" min="0" max="1" step="0.01" defaultValue="0" />
            </div>
            <div className={styles.effect}>
              <label>Distortion <span className="js-dist-val">0</span></label>
              <input type="range" className="js-dist" min="0" max="1" step="0.01" defaultValue="0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
