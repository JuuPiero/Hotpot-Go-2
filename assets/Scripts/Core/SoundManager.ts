import { _decorator, Component, AudioSource, AudioClip, Node, instantiate, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundManager')
export class SoundManager extends Component {

    static instance: SoundManager;

    @property(Node)
    audioPrefab: Node | null = null;

    @property([AudioClip])
    audios: AudioClip[] = [];

    private audioDict: Map<string, AudioClip> = new Map();

    @property
    poolSize = 10;

    private pool: AudioSource[] = [];

    masterVolume = 1;
    musicVolume = 1;
    sfxVolume = 1;

    onLoad() {
        SoundManager.instance = this;

        for (let clip of this.audios) {
            this.audioDict.set(clip.name, clip);
        }

        this.initPool();
    }
    protected start(): void {
        this.playMusic("BGM", true)
    }

    initPool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.createAudioSource();
        }
    }

    createAudioSource(): AudioSource {

        let node: Node;

        if (this.audioPrefab) {
            node = instantiate(this.audioPrefab);
        }
        else {
            node = new Node("AudioSource");
            node.addComponent(AudioSource);
        }

        node.setParent(this.node);

        const source = node.getComponent(AudioSource)!;
        this.pool.push(source);

        return source;
    }

    getAvailable(): AudioSource {

        for (let s of this.pool) {
            if (!s.playing) {
                return s;
            }
        }

        return this.createAudioSource();
    }

    playOneShot(name: string, volume = 1, pitch = 1) {

        const clip = this.audioDict.get(name);
        if (!clip) {
            console.warn("Audio not found:", name);
            return;
        }

        const source = this.getAvailable();

        // source.pitch = pitch;
        source.volume = this.masterVolume * this.sfxVolume * volume;
        source.playOneShot(clip);
    }

    playMusic(name: string, loop = true) {

        const clip = this.audioDict.get(name);
        if (!clip) return;

        const source = this.getAvailable();

        source.clip = clip;
        source.loop = loop;
        source.volume = this.masterVolume * this.musicVolume;

        source.play();
    }

    playMusicFade(name: string, duration = 1) {

        const clip = this.audioDict.get(name);
        if (!clip) return;

        const source = this.getAvailable();

        source.clip = clip;
        source.loop = true;
        source.volume = 0;

        source.play();

        tween(source)
        .to(duration, { volume: this.masterVolume * this.musicVolume })
        .start();
    }

    stopMusic() {

        for (let s of this.pool) {
            if (s.loop && s.playing) {
                s.stop();
            }
        }
    }

    stopMusicFade(duration = 1) {

        for (let s of this.pool) {

            if (s.loop && s.playing) {

                tween(s)
                .to(duration, { volume: 0 })
                .call(() => s.stop())
                .start();
            }
        }
    }

    stopAll() {
        for (let s of this.pool) {
            s.stop();
        }
    }

    pauseAll() {
        for (let s of this.pool) {
            s.pause();
        }
    }

    resumeAll() {
        for (let s of this.pool) {
            s.play();
        }
    }

    setMasterVolume(v: number) {
        this.masterVolume = Math.max(0, Math.min(1, v));
        this.updateVolumes();
    }

    setMusicVolume(v: number) {
        this.musicVolume = Math.max(0, Math.min(1, v));
        this.updateVolumes();
    }

    setSFXVolume(v: number) {
        this.sfxVolume = Math.max(0, Math.min(1, v));
    }

    updateVolumes() {

        for (let s of this.pool) {

            if (s.loop) {
                s.volume = this.masterVolume * this.musicVolume;
            }
        }
    }

    has(name: string) {
        return this.audioDict.has(name);
    }

}