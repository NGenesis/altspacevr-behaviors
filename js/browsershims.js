window.altspaceutil = window.altspaceutil || {};
altspaceutil.shims = altspaceutil.shims || {};
altspaceutil.shims.sdk = altspaceutil.shims.sdk || {};
if(altspaceutil.shims.sdk.inClient === undefined) altspaceutil.shims.sdk.inClient = !!altspace.inClient;

altspaceutil.shims._currentThreeJSScene = null;
altspaceutil.shims.sdk.getThreeJSScene = function() {
	if(altspace.inClient && altspace._internal && altspace._internal.getThreeJSScene) altspaceutil.shims.sdk._currentThreeJSScene = altspace._internal.getThreeJSScene();
	return altspaceutil.shims.sdk._currentThreeJSScene;
}

altspaceutil.shims.sdk.setThreeJSScene = function(scene) {
	if(altspace.inClient && altspace._internal && altspace._internal.setThreeJSScene) altspace._internal.setThreeJSScene(scene);
	altspaceutil.shims._currentThreeJSScene = scene;
}

altspaceutil.shims.sdk.getEnclosure = function() {
	if(!altspaceutil.shims.sdk._EnclosureBrowserShim) {
		altspaceutil.shims.sdk._EnclosureBrowserShim = new class Enclosure extends THREE.EventDispatcher {
			constructor() {
				super();
				this.innerWidth = 1280;
				this.innerHeight = 720;
				this.innerDepth = 1280;
				this.pixelsPerMeter = 1;
				this.hasFocus = document.hasFocus();
				this.fullspace = false;

				window.addEventListener('focus', () => this.hasFocus = document.hasFocus());
				window.addEventListener('blur', () => this.hasFocus = document.hasFocus());
			}

			requestFullspace() {
				if(!this.fullspace) {
					this.fullspace = true;
					this.dispatchEvent({ type: 'fullspacechange' });
				}
				return Promise.resolve();
			}

			exitFullspace() {
				if(this.fullspace) {
					this.fullspace = false;
					this.dispatchEvent({ type: 'fullspacechange' });
				}
				return Promise.resolve();
			}
		};
	}

	return Promise.resolve(altspaceutil.shims.sdk._EnclosureBrowserShim);
}

altspaceutil.shims.sdk.getDocument = function() {
	return new Promise((resolve, reject) => {
		altspace.getEnclosure().then(enclosure => {
			if(!altspaceutil.shims.sdk._DocumentBrowserShim) {
				altspaceutil.shims.sdk._DocumentBrowserShim = new class Document extends THREE.Mesh {
					constructor() {
						super(new THREE.PlaneBufferGeometry(-enclosure.innerWidth / 1000, enclosure.innerHeight / 1000, 1, 1), Object.assign(new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: new THREE.Texture() }), { uuid: 'altspace-document', visible: false }));

						this.type = 'Document';
						this.originalGeometry = this.geometry;
						this.originalMaterial = this.material;
						this.inputEnabled = false;
						this.audioSpatializationEnabled = true;
						this.reset();
					}

					get inputEnabled() { return this._inputEnabled; }
					set inputEnabled(value) { this._inputEnabled = value; }

					get audioSpatializationEnabled() { return this._audioSpatializationEnabled; }
					set audioSpatializationEnabled(value) { this._audioSpatializationEnabled = value; }

					reset() {
						this.geometry = this.originalGeometry;
						this.geometry.verticesNeedUpdate = true;
						this.geometry.uvsNeedUpdate = true;

						this.material = this.originalMaterial;
						this.material.map.repeat.set(1, 1);
						this.material.map.offset.set(0, 0);
						this.material.side = THREE.DoubleSide;

						let currentScene = altspaceutil.shims.sdk.getThreeJSScene() || this.parent;
						if(currentScene) {
							currentScene.add(this);
							this.matrix.identity();
							this.matrix.getInverse(currentScene.matrix);
							this.applyMatrix(this.matrix);
						}
					}
				};
			}

			return resolve(altspaceutil.shims.sdk._DocumentBrowserShim);
		}).catch(e => reject(e));
	});
}

altspaceutil.shims.sdk.getSpace = function() {
	if(!altspaceutil.shims.sdk._SpaceBrowserShim) {
		altspaceutil.shims.sdk._SpaceBrowserShim = new class Space {
			constructor() {
				this.sid = 'browser';
				this.name = 'Web Space';
				this.templateSid = 'browser';
			}
		};
	}

	return Promise.resolve(altspaceutil.shims.sdk._SpaceBrowserShim);
}

altspaceutil.shims.sdk.getUser = function() {
	if(!altspaceutil.shims.sdk._UserBrowserShim) {
		altspaceutil.shims.sdk._UserBrowserShim = new class User {
			constructor() {
				this.userId = 'BrowserGuest';
				this.displayName = 'Guest';
				this.isModerator = true;
				this.avatarInfo = {
					sid: 's-series-m01',
					primaryColor: "rgb(0,0,0)",
					highlightColor: "rgb(255,255,255)"
				};
			}
		};
	}

	return Promise.resolve(altspaceutil.shims.sdk._UserBrowserShim);
}

altspaceutil.shims.sdk.getThreeJSDebugInfo = function() {
	return Promise.resolve([]);
}

altspaceutil.shims.sdk.getThreeJSTrackingSkeleton = function() {
	if(!altspaceutil.shims.sdk._ThreeJSTrackingSkeletonBrowserShim) {
		class TrackingJoint extends THREE.Object3D {
			constructor(name, position, quaternion, confidence) {
				super();
				this.type = 'TrackingJoint';
				this.confidence = confidence;
				this.name = this.location = name;
				this.position.copy(position);
				this.quaternion.copy(quaternion);
			}

			getJoint(bodyPart, side, subIndex) {
				side = side || 'Center';
				subIndex = subIndex === undefined ? 0 : subIndex;
				this.trackingJoints[side + bodyPart + subIndex];
			}
		};

		altspaceutil.shims.sdk._ThreeJSTrackingSkeletonBrowserShim = new class TrackingSkeleton extends THREE.Object3D {
			constructor() {
				super();
				this.type = 'TrackingSkeleton';
				Object.values(this.trackingJoints = {
					'LeftEye0': new TrackingJoint('LeftEye0', { x: -1.97182, y: 1.80098, z: 5.81021 }, { x:0.04939496774553409, y: -0.7336266303864485, z: 0.05363520622544854, w: 0.6756296093292512 }, 3),
					'RightEye0': new TrackingJoint('RightEye0', { x: -1.96686, y: 1.80098, z: 5.74999 }, { x:0.04939496774553409, y: -0.7336266303864485, z: 0.05363520622544854, w: 0.6756296093292512 }, 3),
					'CenterHead0': new TrackingJoint('CenterHead0', { x: -1.89206, y: 1.78727, z: 5.78686 }, { x:0.04939496774553409, y: -0.7336266303864485, z: 0.05363520622544854, w: 0.6756296093292512 }, 3),
					'CenterNeck0': new TrackingJoint('CenterNeck0', { x: -1.81299, y: 1.69395, z: 5.79299 }, { x:-1.8530686175238797e-17, y: -0.8420416245242373, z: -1.8530686175238797e-17, w: 0.539412553217464 }, 3),
					'CenterSpine0': new TrackingJoint('CenterSpine0', { x: -1.81298, y: 1.27273, z: 5.79299 }, { x:0.000010001753394771951, y: -0.8420524879699061, z: 0.000010001753394771948, w: 0.539395594442169 }, 0),
					'CenterSpine1': new TrackingJoint('CenterSpine1', { x: -1.81299, y: 1.3994, z: 5.79299 }, { x:0.000010001753394771951, y: -0.8420524879699061, z: 0.000010001753394771948, w: 0.539395594442169 }, 0),
					'CenterSpine2': new TrackingJoint('CenterSpine2', { x: -1.81299, y: 1.52607, z: 5.79299 }, { x:0.000010001753394771951, y: -0.8420524879699061, z: 0.000010001753394771948, w: 0.539395594442169 }, 0),
					'CenterHips0': new TrackingJoint('CenterHips0', { x: -1.81298, y: 1.20273, z: 5.79299 }, { x:-1.8533002074052303e-17, y: -0.8420563923075377, z: -1.8533002074052303e-17, w: 0.5393894995029234 }, 0),
					'CenterEye0': new TrackingJoint('CenterEye0', { x: -1.96934, y: 1.80098, z: 5.7801 }, { x:0.04939496774553409, y: -0.7336266303864485, z: 0.05363520622544854, w: 0.6756296093292512 }, 3)
				}).forEach(trackingJoint => this.add(trackingJoint));
			}

			getJoint(bodyPart, side, subIndex) {
				side = side || 'Center';
				subIndex = subIndex === undefined ? 0 : subIndex;
				this.trackingJoints[side + bodyPart + subIndex];
			}
		};
	}

	return Promise.resolve(altspaceutil.shims.sdk._ThreeJSTrackingSkeletonBrowserShim);
}

altspaceutil.shims.sdk.getGamepads = function() {
	return navigator.getGamepads();
}

altspaceutil.shims.sdk.getThreeJSRenderer = function(options) {
	if(!altspaceutil.shims.sdk._ThreeJSRendererBrowserShim) {
		options = Object.assign({ antialias: true, version: '0.2.0' }, options);

		altspaceutil.shims.sdk._ThreeJSRendererBrowserShim = new class AltRenderer extends THREE.WebGLRenderer {
			constructor(options) {
				console.log('THREE.AltRenderer', THREE.REVISION);
				console.log('AltRenderer version ' + options.version);
				super(options);
			}

			render(scene, camera, renderTarget, forceClear) {
				altspaceutil.shims.sdk.setThreeJSScene(scene);
				super.render(scene, camera, renderTarget, forceClear);
			}
		}(options);
	}

	return altspaceutil.shims.sdk._ThreeJSRendererBrowserShim;
}

altspaceutil.shims.sdk.open = function(url, target, opts) {
	target = target || '_blank';
	opts = Object.assign({ hidden: false }, opts);

	let popup = new class Popup {
		constructor() {
			this.window = null;
			this.url = url;
			this.closed = false;
			if(!opts.hidden || target !== '_blank') this.window = window.open(this.url, '_blank');
		}

		show() {
			if(!this.closed && !this.window) this.window = window.open(this.url, '_blank');
			return Promise.resolve();
		}

		close() {
			if(!this.closed && this.window) {
				this.closed = true;
				this.window.close();
				this.window = null;
			}

			return Promise.resolve();
		}
	};

	return Promise.resolve(popup);
}

altspaceutil.initializeAltspaceShims = function(force) {
	if(!altspace.inClient || force) {
		altspace.inClient = altspaceutil.shims.sdk.inClient;
		altspace.getDocument = altspaceutil.shims.sdk.getDocument;
		altspace.getEnclosure = altspaceutil.shims.sdk.getEnclosure;
		altspace.getSpace = altspaceutil.shims.sdk.getSpace;
		altspace.getUser = altspaceutil.shims.sdk.getUser;
		altspace.getThreeJSDebugInfo = altspaceutil.shims.sdk.getThreeJSDebugInfo;
		altspace.getThreeJSTrackingSkeleton = altspaceutil.shims.sdk.getThreeJSTrackingSkeleton;
		altspace.getGamepads = altspaceutil.shims.sdk.getGamepads;
		altspace.getThreeJSRenderer = altspaceutil.shims.sdk.getThreeJSRenderer;
		altspace.open = altspaceutil.shims.sdk.open;
	}

	return Promise.resolve();
}

altspaceutil.initializeAltspaceShims();