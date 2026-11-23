// Sample-accurate Web Audio contact-microphone escapement & bench tool foley engine.
// Renders the three metallic transients of every 200ms Swiss lever beat (unlock, impulse,
// drop) plus knocking clatter and quiet tactile foley for tweezers, screwdrivers, blower,
// ultrasonic bath, and tunnel demagnetizer.

import { EVENT_DROP, EVENT_IMPULSE, EVENT_KNOCK, EVENT_UNLOCK } from "./physics"

class HorologyAudioEngine {
  private ctx: AudioContext | null = null
  private muted = false
  private masterGain: GainNode | null = null

  public unlockContext(): void {
    if (typeof window === "undefined") return
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctor) return
      this.ctx = new Ctor()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.muted ? 0 : 0.42
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => {})
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : 0.42,
        this.ctx.currentTime,
        0.015
      )
    }
  }

  public isMuted(): boolean {
    return this.muted
  }

  private pingResonator(
    freqHz: number,
    q: number,
    gainPeak: number,
    decaySec: number,
    delaySec = 0
  ): void {
    if (this.muted || !this.ctx || !this.masterGain) return
    if (this.ctx.state !== "running") return

    const t0 = this.ctx.currentTime + delaySec
    const osc = this.ctx.createOscillator()
    const filter = this.ctx.createBiquadFilter()
    const env = this.ctx.createGain()

    osc.type = "triangle"
    osc.frequency.setValueAtTime(freqHz, t0)
    osc.frequency.exponentialRampToValueAtTime(freqHz * 0.72, t0 + decaySec)

    filter.type = "bandpass"
    filter.frequency.setValueAtTime(freqHz, t0)
    filter.Q.setValueAtTime(q, t0)

    env.gain.setValueAtTime(0.0001, t0)
    env.gain.linearRampToValueAtTime(gainPeak, t0 + 0.0008)
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + decaySec)

    osc.connect(filter)
    filter.connect(env)
    env.connect(this.masterGain)

    osc.start(t0)
    osc.stop(t0 + decaySec + 0.004)
  }

  public playEscapementBeat(
    events: number,
    amplitudeDeg: number,
    isTick: boolean
  ): void {
    if (this.muted || !this.ctx || this.ctx.state !== "running") return
    const vigor = Math.max(0.25, Math.min(1.15, amplitudeDeg / 290))
    const pitchSkew = isTick ? 1.0 : 0.965

    if (events & EVENT_UNLOCK) {
      this.pingResonator(4650 * pitchSkew, 9, 0.11 * vigor, 0.009, 0.0)
    }
    if (events & EVENT_IMPULSE) {
      this.pingResonator(6350 * pitchSkew, 12, 0.14 * vigor, 0.011, 0.004)
    }
    if (events & EVENT_DROP) {
      // Crispest lock ping against ruby pallet stone + brass banking pin
      this.pingResonator(8450 * pitchSkew, 15, 0.22 * vigor, 0.015, 0.011)
    }
    if (events & EVENT_KNOCK) {
      this.pingResonator(3100, 5, 0.32, 0.024, 0.018)
    }
  }

  public playToolFoley(
    kind:
      | "tweezer"
      | "screw"
      | "letdown"
      | "oil"
      | "blower"
      | "ultrasonic"
      | "demag"
      | "error"
  ): void {
    this.unlockContext()
    if (this.muted || !this.ctx || this.ctx.state !== "running") return

    switch (kind) {
      case "tweezer":
        this.pingResonator(5400, 14, 0.16, 0.018, 0)
        break
      case "screw":
        this.pingResonator(3600, 10, 0.14, 0.016, 0)
        this.pingResonator(4100, 10, 0.12, 0.016, 0.045)
        break
      case "letdown":
        for (let i = 0; i < 5; i++) {
          this.pingResonator(2900 - i * 180, 8, 0.14, 0.02, i * 0.045)
        }
        break
      case "oil":
        this.pingResonator(7200, 18, 0.09, 0.022, 0)
        break
      case "blower":
        this.pingResonator(1150, 2.2, 0.14, 0.09, 0)
        break
      case "ultrasonic":
        this.pingResonator(9200, 20, 0.12, 0.18, 0)
        this.pingResonator(9600, 20, 0.1, 0.18, 0.09)
        break
      case "demag":
        this.pingResonator(180, 4, 0.22, 0.28, 0)
        break
      case "error":
        this.pingResonator(420, 4, 0.22, 0.09, 0)
        break
    }
  }
}

export const horologyAudio = new HorologyAudioEngine()
