/**
 * The Sound behavior loads and plays a sound asset supporting positional audio.
 *
 * @class Sound
 * @param {Object} [config] Optional parameters.
 * @param {THREE.Object3D} [config.target=null] A target that will listen for the sound being played.  If omitted, the scene camera will be used.
 * @param {String} [config.src] A URL to the sound file to be loaded.
 * @param {String} [config.res] A sound resource identifier to be loaded.
 * @param {String} [config.on] Name of the event that will trigger the sound to be played.
 * @param {Boolean} [config.loop=false] Specifies whether the sound should loop back to the beginning once playback has finished.
 * @param {Boolean} [config.autoplay=false] Specifies whether the sound will play automatically when the parent object is loaded into the scene.
 * @param {Boolean} [config.oneshot=false] Specifies whether multiple instances of the sound can be played simultaneously.  Note that one-shot sounds cannot be paused, stopped or seeked into, and instances will clean themselves up automatically when playback has finished.
 * @param {Number} [config.volume=1] Volume that the sound should play at.
 * @param {Number} [config.spatialBlend=1] Specifies how the sound will be perceived spactially, ranging from 0 (2D stereo without panning between left and right sound channels) up to 1 (localized 3D with panning between left and right sound channels).
 * @param {Number} [config.pitch=1] The speed and octave adjustment that the sound will play at.  0.5 for half speed at a lower octave, 2 for double speed at a higher octave.
 * @param {Number} [config.minDistance=1] The minimum distance that the sound will play at full volume.
 * @param {Number} [config.maxDistance=12] The maximum distance that the sound will play before volume reaches silent when a linear/cosine rolloff algorithm is specified, otherwise the volume will stop lowering after the specified distance when a logarithmic rolloff algorithm is specified.
 * @param {String} [config.rolloff='logarithmic'] Volume can reach a silent level when a linear/cosine rolloff algorithm is specified, otherwise the volume will stop lowering after the specified distance when a logarithmic rolloff algorithm is specified.
 * @param {Boolean} [config.native=true] Specifies whether a native sound (n-sound) component will be used when running the app in the Altspace client.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.Sound = class {
	get type() { return 'Sound'; }

	constructor(config) {
		this.config = Object.assign({ on: '', res: '', src: '', loop: false, volume: 1, autoplay: false, oneshot: false, spatialBlend: 1, pitch: 1, minDistance: 1, maxDistance: 12, rolloff: 'logarithmic', native: true, target: null }, config);

		if(!(this.config.native && altspace.inClient)) {
			this.audioLoader = new THREE.AudioLoader();
			this.audioListener = new THREE.AudioListener();
			this.target = this.config.target;
			if(this.target) this.target.add(this.audioListener);
		}
	}

	awake(o, s) {
		this.object3d = o;
		this.scene = s;

		altspaceutil.manageBehavior(this, this.object3d);

		this.config.src = altspaceutil.getAbsoluteURL(this.config.src);

		if(this.config.native && altspace.inClient) {
			this.nativeComponent = new altspaceutil.behaviors.NativeComponent('n-sound', { on: this.config.on, res: this.config.res, src: this.config.src, loop: this.config.loop, volume: this.config.volume, autoplay: this.config.autoplay, oneshot: this.config.oneshot, spatialBlend: this.config.spatialBlend, pitch: this.config.pitch, minDistance: this.config.minDistance, maxDistance: this.config.maxDistance, rolloff: this.config.rolloff }, { useCollider: true });
			this.object3d.addEventListener('n-sound-loaded', () => {
				this.loaded = this.nativeComponent.getAttribute('loaded');
				this.object3d.dispatchEvent({
					type: 'sound-loaded',
					bubbles: true,
					target: this.object3d
				});
			});
			this.object3d.addBehavior(this.nativeComponent);
		} else {
			this.loaded = false;
			this.loading = false;
			this.loadedSounds = [];
			this.sound = null;
			this.soundBuffer = null;
			this.on = this.res = this.src = this.loop = this.autoplay = this.oneshot = this.spatialBlend = this.pitch = this.minDistance = this.maxDistance = this.rolloff = null;
			this._loadSound();
		}
	}

	update() {
		this.config.src = altspaceutil.getAbsoluteURL(this.config.src);

		if(this.config.native && altspace.inClient) {
			this.loaded = this.nativeComponent.getAttribute('loaded');
			this.nativeComponent.data.on = this.config.on;
			this.nativeComponent.data.res = this.config.res;
			this.nativeComponent.data.src = this.config.src;
			this.nativeComponent.data.loop = this.config.loop;
			this.nativeComponent.data.volume = this.config.volume;
			this.nativeComponent.data.autoplay = this.config.autoplay;
			this.nativeComponent.data.oneshot = this.config.oneshot;
			this.nativeComponent.data.spatialBlend = this.config.spatialBlend;
			this.nativeComponent.data.pitch = this.config.pitch;
			this.nativeComponent.data.minDistance = this.config.minDistance;
			this.nativeComponent.data.maxDistance = this.config.maxDistance;
			this.nativeComponent.data.rolloff = this.config.rolloff;
		} else {
			if(!this.target) {
				this.scene.traverseVisible(child => {
					if(!this.target && child.isCamera) {
						this.target = child;
						this.target.add(this.audioListener);
						return;
					}
				});
			}

			if(this.config.on && this.config.on !== '' && this.on !== this.config.on) {
				if(this.on) this.object3d.removeEventListener(this.on, this.playHandler);
				if(!this.playHandler) this.playHandler = this.play.bind(this);
				this.on = this.config.on;
				this.object3d.addEventListener(this.on, this.playHandler);
			}

			if(this.volume !== this.config.volume) {
				this.volume = this.config.volume;
				if(this.sound) this.sound.setVolume(this.volume);
			}

			if((this.res !== this.config.res || this.src !== this.config.src || this.loop !== this.config.loop || this.autoplay !== this.config.autoplay || this.oneshot !== this.config.oneshot || this.spatialBlend !== this.config.spatialBlend || this.pitch !== this.config.pitch || this.minDistance !== this.config.minDistance || this.maxDistance !== this.config.maxDistance || this.rolloff !== this.config.rolloff) && !this.loading) this._loadSound();
		}
	}

	play() {
		if(this.config.native && altspace.inClient) {
			this.nativeComponent.callComponentAction('play');
		} else if(this.sound || (this.oneshot && this.loaded)) {
			if(this.oneshot) {
				this._createSound().play();
			} else {
				this.stop();
				this.sound.play();
			}

			this.object3d.dispatchEvent({
				type: 'sound-played',
				bubbles: true,
				target: this.object3d
			});
		}
	}

	pause() {
		if(this.config.native && altspace.inClient) {
			this.nativeComponent.callComponentAction('pause');
		} else if(this.sound && !this.oneshot) {
			this.sound.pause();

			this.object3d.dispatchEvent({
				type: 'sound-paused',
				bubbles: true,
				target: this.object3d
			});
		}
	}

	stop() {
		if(this.config.native && altspace.inClient) {
			this.nativeComponent.callComponentAction('stop');
		} else if(this.sound && this.sound.isPlaying && !this.oneshot) {
			this.sound.stop();

			this.object3d.dispatchEvent({
				type: 'sound-stopped',
				bubbles: true,
				target: this.object3d
			});
		}
	}

	seek(time) {
		if(this.config.native && altspace.inClient) {
			this.nativeComponent.callComponentAction('seek', { time: time });
		} else if(this.sound && !this.oneshot) {
			this.sound.offset = time / 1000.0;
		}
	}

	_loadSound() {
		this.loaded = false;
		if(this.sound) {
			if(this.sound.isPlaying) this.sound.stop();
			this.object3d.remove(this.sound);
			this.sound = null;
		}

		let reuseBuffer = (this.src === this.config.src && this.res === this.config.res && this.soundBuffer);

		this.loading = true;
		this.res = this.config.res;
		this.src = this.config.src;
		this.loop = this.config.loop;
		this.volume = this.config.volume;
		this.autoplay = this.config.autoplay;
		this.oneshot = this.config.oneshot;
		this.spatialBlend = this.config.spatialBlend;
		this.pitch = this.config.pitch;
		this.minDistance = this.config.minDistance;
		this.maxDistance = this.config.maxDistance;
		this.rolloff = this.config.rolloff;

		let onSoundBufferLoaded = soundBuffer => {
			if(this.loading && !this.loaded) {
				this.soundBuffer = soundBuffer;
				let sound = this._createSound();
				this.loaded = true;
				this.object3d.dispatchEvent({
					type: 'sound-loaded',
					bubbles: true,
					target: this.object3d
				});
				if(this.autoplay) {
					sound.play();
					this.object3d.dispatchEvent({
						type: 'sound-played',
						bubbles: true,
						target: this.object3d
					});
				}
			}
		}
		reuseBuffer ? onSoundBufferLoaded(this.soundBuffer) : this.audioLoader.load(this.src, onSoundBufferLoaded);
	}

	_createSound() {
		let sound = new THREE.PositionalAudio(this.audioListener);
		sound.setBuffer(this.soundBuffer);
		sound.setLoop(this.loop);
		sound.setVolume(this.volume);
		sound.setRefDistance(this.minDistance);
		sound.setMaxDistance(this.maxDistance);
		sound.setPlaybackRate(this.pitch);
		sound.getOutput().distanceModel = (this.rolloff === 'linear' || this.rolloff === 'cosine') ? 'linear' : 'exponential'; // Use most compatible algorithm from available options
		this.object3d.add(sound);
		if(this.oneshot) {
			this.loadedSounds.push(sound);
			sound.onEnded = () => {
				sound.isPlaying = false;
				if(this.loadedSounds) {
					let index = this.loadedSounds.indexOf(sound);
					if(index >= 0) this.loadedSounds.splice(index, 1);
				}
				if(this.object3d) this.object3d.remove(sound);
			};
		} else {
			this.sound = sound;
		}
		return sound;
	}

	dispose() {
		if(this.object3d && this.config.native && altspace.inClient) {
			if(this.nativeComponent) this.object3d.removeBehavior(this.nativeComponent);
		} else {
			if(this.on && this.playHandler) {
				this.object3d.removeEventListener(this.on, this.playHandler);
				this.on = this.playHandler = null;
			}

			if(this.sound) {
				if(this.sound.isPlaying) this.sound.stop();
				this.object3d.remove(this.sound);
				this.sound = null;
			}

			this.loadedSounds.forEach(sound => {
				if(sound.isPlaying) sound.stop();
				this.object3d.remove(sound);
			});
			this.loadedSounds = null;

			if(this.target && this.audioListener) this.target.remove(this.audioListener);
			this.target = this.sound = null;
			this.loaded = this.loading = false;
		}
	}

	clone() {
		return new altspaceutil.behaviors.Sound(this.config);
	}
}
