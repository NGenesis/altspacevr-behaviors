/**
 * The PreloadNativeSounds behavior will load the specified sound files used by n-sound
 * to ensure the resources are cached for subsequent uses. The behavior will remove itself automatically 
 * once the sound files have been preloaded or the specified timeout threshold has been reached.
 *
 * @class PreloadNativeSounds
 * @param {Object[]} [sounds] Native sound resources to be preloaded.  Can either be an array of sound file paths or an array of [NativeComponent]{@link module:altspaceutil/behaviors.NativeComponent} n-sound data objects.
 * @param {Object} [config] Optional configuration properties
 * @param {Boolean} [config.dispose=true] Specifies whether the preloaded native sound objects will be destroyed after the preload has completed.  By default, preloaded sound objects will be destroyed after being cached.
 * @param {Number} [config.timeout=10000] Time in milliseconds to wait before ending the preload.  A [n-sound-preloaded] event will be fired with a timeout property set to true when the timeout threshold has been reached.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.PreloadNativeSounds = function(sounds, config) {
	this.type = 'PreloadSoundEffects';
	this.sounddata = sounds;
	this.config = Object.assign({ timeout: 10000, dispose: true }, config || {});

	this.awake = function(o) {
		this.object3d = o;
		this.elapsedTime = 0;
		this.preloadedCount = 0;
		this.isTimedOut = false;
		this.sounds = [];

		altspaceutil.manageBehavior(this, this.object3d);

		this.soundLoadedEventHandler = (function(event) {
			if(this.preloadedCount > 0) --this.preloadedCount;
			if(!this.isTimedOut && this.preloadedCount <= 0) {
				var self = this;

				/**
				* Fires an event once all sounds have been preloaded, or the specified timeout threshold has been reached.
				*
				* @event n-sound-preloaded
				* @property {PreloadNativeSounds} behavior The behavior that preloaded the sounds.
				* @property {THREE.Object3D[]} sounds The sound objects that were preloaded.
				* @property {Boolean} timeout Indicates whether the timeout threshold has been reached before all sounds were preloaded.
				* @memberof module:altspaceutil/behaviors.PreloadNativeSounds
				*/
				this.object3d.dispatchEvent({
					type: 'n-sound-preloaded',
					behavior: self,
					sounds: self.sounds,
					timeout: false,
					bubbles: true
				});

				this.object3d.removeBehavior(this);
			}
		}).bind(this);

		for(var sounddata of this.sounddata) {
			++this.preloadedCount;

			var obj = new THREE.Object3D();
			obj.addBehavior(new altspaceutil.behaviors.NativeComponent('n-sound', (typeof sounddata == 'string' || sounddata instanceof String) ? { src: sounddata } : sounddata));
			obj.addEventListener('n-sound-loaded', this.soundLoadedEventHandler);
			this.object3d.add(obj);
			this.sounds.push(obj);
		}
	}

	this.update = function(deltaTime) {
		this.elapsedTime += deltaTime;
		if(this.preloadedCount > 0 && !this.isTimedOut && this.config.timeout > 0 && this.elapsedTime >= this.config.timeout && this.object3d) {
			this.isTimedOut = true;

			var self = this;
			this.object3d.dispatchEvent({
				type: 'n-sound-preloaded',
				behavior: self,
				sounds: self.sounds,
				timeout: true,
				bubbles: true
			});

			this.object3d.removeBehavior(this);
		}
	}

	this.dispose = function() {
		for(var sound of this.sounds) {
			sound.removeEventListener('n-sound-loaded', this.soundLoadedEventHandler);
			if(this.config.dispose && sound.parent) sound.parent.remove(sound);
		}

		this.soundLoadedEventHandler = null;
		this.sounds = null;
		this.object3d = null;
		this.elapsedTime = 0;
		this.preloadedCount = 0;
	}

	this.clone = function() {
		return new altspaceutil.behaviors.PreloadNativeSounds(this.sounddata, this.config);
	}
}