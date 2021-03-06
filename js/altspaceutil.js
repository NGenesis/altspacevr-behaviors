'use strict';

window.altspaceutil = window.altspaceutil || {};
altspaceutil.behaviors = altspaceutil.behaviors || {};

altspaceutil.VERSION = altspaceutil.VERSION || '1.1.5';

// Native Event Helpers
altspaceutil.addNativeEventListener = function(name, callback) {
	return (altspace._internal && altspace._internal.couiEngine) ? altspace._internal.couiEngine.on(name, callback) : null;
}

altspaceutil.removeNativeEventListener = function(name, callback) {
	if(altspace._internal && altspace._internal.couiEngine) altspace._internal.couiEngine.off(name, callback);
}

altspaceutil.removeAllNativeEventListeners = function(name) {
	if(altspace._internal && altspace._internal.couiEngine && altspace._internal.couiEngine.events[name]) delete altspace._internal.couiEngine.events[name];
}

altspaceutil.getObject3DById = function(meshId) {
	return (altspace._internal && altspace._internal.getObject3DById) ? altspace._internal.getObject3DById(meshId) : null;
}

altspaceutil._currentThreeJSScene = null;
altspaceutil.getThreeJSScene = function() {
	return (altspace._internal && altspace._internal.getThreeJSScene) ? altspace._internal.getThreeJSScene() : altspaceutil._currentThreeJSScene;
}

altspaceutil.setThreeJSScene = function(scene) {
	if(altspace._internal && altspace._internal.setThreeJSScene) {
		altspace._internal.setThreeJSScene(scene);
	} else {
		altspaceutil._currentThreeJSScene = scene;
	}
}

/**
* Expands the Altspace client's serialization buffer to improve loading performance.
* @function expandSerializationBuffer
* @param {Number} [size] The size to expand the serialization buffer by, in bytes.
* @memberof module:altspaceutil
*/
altspaceutil.expandSerializationBuffer = function(size) {
	if(altspace.inClient && altspace._internal && altspace._internal.ScratchThriftBuffer && size > 0) {
		altspace._internal.ScratchThriftBuffer.grow(size);
	}
}

/**
* Enables or disables the profiler for the Altspace client's serialization buffer to determine whether the buffer needs to be expanded.  Profiler messages will be displayed in the console when enabled.
* @function profileSerializationBuffer
* @param {Boolean} [enabled] Specifies whether the serialization buffer is to be enabled.
* @memberof module:altspaceutil
*/
altspaceutil.profileSerializationBuffer = function(enabled) {
	if(altspace.inClient && altspace._internal && altspace._internal.ScratchThriftBuffer) {
		altspace._internal.ScratchThriftBuffer.profile = (enabled === undefined) ? true : enabled;
	}
}

/**
* Indicates whether the app is being loaded on a mobile version of the Altspace client.  This is typically determined by the user agent exposed to the app.
* @function isMobileApp
* @returns {Boolean} Whether the app is running on a mobile client.  Returns true for mobile clients, false otherwise.
* @memberof module:altspaceutil
*/
altspaceutil.isMobileApp = function(url) {
	return /mobile/i.test(navigator.userAgent);
}

/**
* Gets the fullspace enclosure for the app.
* @function getFullspaceEnclosure
* @returns {Promise} A promise that resolves to a fullspace Enclosure.
* @memberof module:altspaceutil
*/
altspaceutil.getFullspaceEnclosure = function() {
	let getEnclosure = altspace.inClient ? altspace.getEnclosure : () => {
		// Emulate fullspace enclosure in browser
		if(!altspaceutil._BrowserEnclosure) {
			altspaceutil._BrowserEnclosure = new class extends THREE.EventDispatcher {
				constructor() {
					super();
					this.innerWidth = 1280;
					this.innerHeight = 720;
					this.innerDepth = 1280;
					this.pixelsPerMeter = 1;
					this.hasFocus = document.hasFocus();
					this.fullspace = true;

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

		return Promise.resolve(altspaceutil._BrowserEnclosure);
	};

	return new Promise((resolve, reject) => {
		getEnclosure().then(enclosure => enclosure.requestFullspace().then(() => {
			enclosure.addEventListener('fullspacechange', () => {
				if(!enclosure.fullspace) enclosure.requestFullspace().catch(() => reject('enclosure.requestFullspace() after fullspacechange event failed'));
			});
			resolve(enclosure);
		})).catch(() => reject('Failed to get fullspace enclosure.'));
	});
}

altspaceutil.getFullspaceAppManifest = function() {
	if(altspaceutil._fullspaceAppManifest) return Promise.resolve(altspaceutil._fullspaceAppManifest);

	let query = new URLSearchParams(window.location.search);
	let applyManifestUrlParams = manifest => {
		for(let q of query.entries()) {
			if(/altvr\.enclosure\.(.*)/i.test(q[0])) {
				let propertyname = q[0].match(/altvr\.enclosure\.(.*)/i)[1];

				let anchormanifest = manifest.enclosure = Object.assign({}, manifest.enclosure);
				anchormanifest.position = Object.assign({ x: 0, y: 0, z: 0 }, anchormanifest.position);
				anchormanifest.rotation = Object.assign({ x: 0, y: 0, z: 0 }, anchormanifest.rotation);
				anchormanifest.scale = (anchormanifest.hasOwnProperty('scale') && typeof anchormanifest.scale == 'number') ? { x: anchormanifest.scale || 1, y: anchormanifest.scale || 1, z: anchormanifest.scale || 1 } : Object.assign({ x: 1, y: 1, z: 1 }, anchormanifest.scale);

				switch(propertyname) {
					case 'position':
					case 'rotation': {
						let property = q[1].split(',');
						if(property.length >= 1) anchormanifest[propertyname].x = parseFloat(property[0]) || 0;
						if(property.length >= 2) anchormanifest[propertyname].y = parseFloat(property[1]) || 0;
						if(property.length >= 3) anchormanifest[propertyname].z = parseFloat(property[2]) || 0;
						break;
					}

					case 'scale': {
						let property = q[1].split(',');
						if(property.length === 1) {
							anchormanifest[propertyname].x = anchormanifest[propertyname].y = anchormanifest[propertyname].z = parseFloat(property[0]) || 1;
						} else {
							if(property.length >= 1) anchormanifest[propertyname].x = parseFloat(property[0]) || 1;
							if(property.length >= 2) anchormanifest[propertyname].y = parseFloat(property[1]) || 1;
							if(property.length >= 3) anchormanifest[propertyname].z = parseFloat(property[2]) || 1;
						}
						break;
					}
				}
			} else if(/altvr\.anchors\.(.*)\.(.*)/i.test(q[0])) {
				let [, anchorname, propertyname] = q[0].match(/altvr\.anchors\.(.*)\.(.*)/i);

				let anchormanifestindex = manifest.anchors.findIndex(a => { return (a.name === anchorname); });
				if(anchormanifestindex < 0) anchormanifestindex = manifest.anchors.push({ name: anchorname }) - 1;

				anchormanifest = manifest.anchors[anchormanifestindex] = Object.assign({ name: anchorname }, manifest.anchors[anchormanifestindex]);
				anchormanifest.position = Object.assign({ x: 0, y: 0, z: 0 }, anchormanifest.position);
				anchormanifest.rotation = Object.assign({ x: 0, y: 0, z: 0 }, anchormanifest.rotation);
				anchormanifest.scale = (anchormanifest.hasOwnProperty('scale') && typeof anchormanifest.scale == 'number') ? { x: anchormanifest.scale || 1, y: anchormanifest.scale || 1, z: anchormanifest.scale || 1 } : Object.assign({ x: 1, y: 1, z: 1 }, anchormanifest.scale);

				switch(propertyname) {
					case 'position':
					case 'rotation': {
						let property = q[1].split(',');
						if(property.length >= 1) anchormanifest[propertyname].x = parseFloat(property[0]) || 0;
						if(property.length >= 2) anchormanifest[propertyname].y = parseFloat(property[1]) || 0;
						if(property.length >= 3) anchormanifest[propertyname].z = parseFloat(property[2]) || 0;
						break;
					}

					case 'scale': {
						let property = q[1].split(',');
						if(property.length === 1) {
							anchormanifest[propertyname].x = anchormanifest[propertyname].y = anchormanifest[propertyname].z = parseFloat(property[0]) || 1;
						} else {
							if(property.length >= 1) anchormanifest[propertyname].x = parseFloat(property[0]) || 1;
							if(property.length >= 2) anchormanifest[propertyname].y = parseFloat(property[1]) || 1;
							if(property.length >= 3) anchormanifest[propertyname].z = parseFloat(property[2]) || 1;
						}
						break;
					}
				}
			}
		}
	}

	if(query.has('altvr.manifest') && query.get('altvr.manifest').length > 0) {
		return new Promise((resolve, reject) => {
			fetch(altspaceutil.getAbsoluteURL(query.get('altvr.manifest'))).then(response => response.json()).then(obj => {
				altspaceutil._fullspaceAppManifest = obj;
				applyManifestUrlParams(altspaceutil._fullspaceAppManifest);
				resolve(altspaceutil._fullspaceAppManifest);
			}).catch(() => reject('Failed to download manifest from ' + query.get('altvr.manifest')));
		});
	} else {
		altspaceutil._fullspaceAppManifest = { enclosure: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, anchors: [] };
		applyManifestUrlParams(altspaceutil._fullspaceAppManifest);
		return Promise.resolve(altspaceutil._fullspaceAppManifest);
	}
}

/**
* FullspaceApp manages the render and update loop and creation of anchor points for a three.js app. This class is not intended to be created directly, but should be retrieved using [altspaceutil.getFullspaceApp]{@link module:altspaceutil.getFullspaceApp}.
* @class module:altspaceutil~FullspaceApp
* @memberof module:altspaceutil
*/
altspaceutil.FullspaceApp = class {
	constructor(config) {
		this.config = Object.assign({ serializationBufferSize: 500000 }, config);
		if(this.config.serializationBufferSize) altspaceutil.expandSerializationBuffer(this.config.serializationBufferSize);
	}

	initialize() {
		let waitForInitialization = () => {
			if(!this._isInitializing && !this._isInitialized) {
				this._isInitializing = true;
				return Promise.resolve();
			}

			return new Promise((resolve, reject) => {
				let waitIntervalId = setInterval(() => {
					if(!this._isInitializing) {
						clearInterval(waitIntervalId);
						resolve();
					}
				}, 10);
			})
		};

		let getSpace = altspace.inClient ? altspace.getSpace() : Promise.resolve({ sid: 'browser', name: 'Web Space', templateSid: 'browser' });

		return new Promise((resolve, reject) => {
			waitForInitialization().then(() => {
				if(this._isInitialized) return resolve(this);
				this._isInitializing = true;

				return Promise.all([altspaceutil.getFullspaceEnclosure(), altspaceutil.getFullspaceAppManifest(), getSpace]).then(resolvers => {
					let [enclosure, manifest, space] = resolvers;

					this._enclosure = enclosure;
					this._manifest = manifest;
					this._space = space;

					this._scene = new THREE.Scene();
					this._camera = new THREE.PerspectiveCamera();

					if(altspace.inClient) {
						this._renderer = altspace.getThreeJSRenderer();
					} else {
						this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

						Object.assign(this._camera, { fov: 90, near: 1, far: 2000 });
						this._camera.position.z = 20;

						let addRendererToDOM = () => {
							this._renderer.setClearColor(0xFFFFFF, 0);
							document.body.style.backgroundColor = '#000000';
							document.body.style.margin = '0px';
							document.body.style.overflow = 'hidden';
							document.body.appendChild(this._renderer.domElement);
							this._renderer.domElement.oncontextmenu = () => false;
						}
						document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", addRendererToDOM) : addRendererToDOM();

						let resizeRender = () => {
							this._camera.aspect = window.innerWidth / window.innerHeight;
							this._camera.updateProjectionMatrix();
							this._renderer.setSize(window.innerWidth, window.innerHeight);
						}
						window.addEventListener('resize', resizeRender);
						resizeRender();

						this._scene.add(this._camera);
						this._scene.add(new THREE.AmbientLight('white'));

						altspace.utilities.shims.cursor.init(this._scene, this._camera, { renderer: this._renderer } );
					}

					this._anchors = {};

					this._anchor = Object.assign(new THREE.Group(), { name: 'altvr.enclosure' });
					this._scene.add(this._anchor);

					let anchormanifest = this._manifest ? this._manifest.enclosure : null;
					if(anchormanifest) {
						this._anchor.position.copy(anchormanifest.position);
						this._anchor.rotation.set(THREE.Math.degToRad(anchormanifest.rotation.x), THREE.Math.degToRad(anchormanifest.rotation.y), THREE.Math.degToRad(anchormanifest.rotation.z));
						this._anchor.scale.copy(anchormanifest.scale);
					}

					this._anchorsGroup = Object.assign(new THREE.Group(), { name: 'altvr.anchors' });
					this._anchorsGroup.addBehavior(new class _ApplyAppAnchorTransform {
						get type() {
							return '_ApplyAppAnchorTransform';
						}

						constructor(anchor) {
							this.anchor = anchor;
						}

						awake(o) {
							this.object3d = o;
							this.object3d.position.copy(this.anchor.position);
							this.object3d.quaternion.copy(this.anchor.quaternion);
							this.object3d.scale.copy(this.anchor.scale);
						}

						update() {
							this.object3d.position.copy(this.anchor.position);
							this.object3d.quaternion.copy(this.anchor.quaternion);
							this.object3d.scale.copy(this.anchor.scale);
						}
					}(this._anchor));
					this._scene.add(this._anchorsGroup);

					this._isInitialized = true;

					let loop = () => {
						window.requestAnimationFrame(loop);
						this._scene.updateAllBehaviors();
						this._renderer.render(this._scene, this._camera);
					}
					loop();

					this._isInitializing = false;
					resolve(this);
				});
			}).catch(() => {
				this._isInitializing = false;
				reject('Failed to initialize fullspace app.');
			});
		});
	}


	/**
	* Retrieves an anchor point with the specified name.  If the anchor point does not exist, it will be created automtically at app origin. The anchor can have its transform specified using the altvr.anchors.<name>.position, altvr.anchors.<name>.rotation and altvr.anchors.<name>.scale URL parameters, or a manifest file referenced using the altvr.manifest URL parameter.
	* @method anchors
	* @param {String} [name] Name of the anchor.
	* @returns {THREE.Group}
	* @memberof module:altspaceutil~FullspaceApp
	*/
	anchors(name) {
		if(this._anchors[name]) return this._anchors[name];

		let anchor = this._anchors[name] = Object.assign(new THREE.Group(), { name: name });
		this._anchorsGroup.add(anchor);

		let anchormanifest = this._manifest.anchors.find(a => { return a.name === name; });
		if(anchormanifest) {
			anchor.position.copy(anchormanifest.position);
			anchor.rotation.set(THREE.Math.degToRad(anchormanifest.rotation.x), THREE.Math.degToRad(anchormanifest.rotation.y), THREE.Math.degToRad(anchormanifest.rotation.z));
			anchor.scale.copy(anchormanifest.scale);
		}

		return anchor;
	}

	/**
	* The scene associated with the app.
	* @readonly
	* @instance
	* @member {THREE.Scene} scene
	* @memberof module:altspaceutil~FullspaceApp
	*/
	get scene() {
		return this._scene;
	}

	/**
	* The renderer associated with the app.
	* @readonly
	* @instance
	* @member {module:altspace~AltRenderer} renderer
	* @memberof module:altspaceutil~FullspaceApp
	*/
	get renderer() {
		return this._renderer;
	}

	/**
	* The camera associated with the app.
	* @readonly
	* @instance
	* @member {THREE.Camera} camera
	* @memberof module:altspaceutil~FullspaceApp
	*/
	get camera() {
		return this._camera;
	}

	/**
	* The root anchor associated with the app.  The root anchor can have its transform specified using the altvr.enclosure.position, altvr.enclosure.rotation and altvr.enclosure.scale URL parameters, or a manifest file referenced using the altvr.manifest URL parameter.
	* @readonly
	* @instance
	* @member {THREE.Group} anchor
	* @memberof module:altspaceutil~FullspaceApp
	*/
	get anchor() {
		return this._anchor;
	}

	/**
	* The enclosure associated with the app.
	* @readonly
	* @instance
	* @member {module:altspace~Enclosure} enclosure
	* @memberof module:altspaceutil~FullspaceApp
	*/
	get enclosure() {
		return this._enclosure;
	}

	/**
	* The space associated with the app.
	* @readonly
	* @instance
	* @member {module:altspace~Space} space
	* @memberof module:altspaceutil~FullspaceApp
	*/
	get space() {
		return this._space;
	}
}

/**
* Gets an initialized fullspace app instance.  The app will be initialized on the first call to this function, which sets up the render loop, fullspace enclosure and anchors.
* @function getFullspaceApp
* @param {Object} [config] Optional parameters.
* @param {Number} [config.serializationBufferSize=500000] Initial size of the serialization buffer. See {@link expandSerializationBuffer} for more information.
* @returns {Promise} A promise that resolves to a FullspaceApp.
* @memberof module:altspaceutil
*/
altspaceutil.getFullspaceApp = function(config) {
	if(!altspaceutil._fullspaceApp) altspaceutil._fullspaceApp = new altspaceutil.FullspaceApp(config);
	return altspaceutil._fullspaceApp.initialize();
}

/**
* Create an absolute URL from the specified relative URL, using the current host as the URL base.
* @function getAbsoluteURL
* @param {String} [url] A relative URL.  Providing an absolute URL will return itself unchanged.
* @returns {String} An absolute URL of the given relative URL.
* @memberof module:altspaceutil
*/
altspaceutil.getAbsoluteURL = function(url) {
	return new URL(url, window.location).toString();
}

/**
* Create a base path from the specified file URL.
* @function getBasePath
* @param {String} [url] A URL to a file.
* @returns {String} A URL to the file's base path.
* @memberof module:altspaceutil
*/
altspaceutil.getBasePath = function(url) {
	return url.split('/').slice(0, -1).join('/') + '/';
}

/**
* Loads a three.js texture from the specified texture file URL, optimizing for faster loading times in the Altspace client where appropriate.
* @function loadTexture
* @param {String} [url] A URL to a texture file.
* @param {Object} [config] Optional parameters to be passed to the texture loader (e.g. crossOrigin, withCredentials, path).
* @returns {THREE.Texture} The loaded texture.
* @memberof module:altspaceutil
*/
altspaceutil.loadTexture = function(url, config) {
	if(altspace.inClient) {
		if(url.startsWith('blob:')) {
			// Convert Blob URL to Data URL, then shim canvas to avoid redrawing texture in Coherent
			let texture = new THREE.Texture();
			fetch(url).then(response => response.blob()).then(blob => {
				let reader = new FileReader();
				reader.onerror = () => console.warn('Failed to load blob texture at ' + url);
				reader.onload = () => Object.assign(texture, { image: { nodeName: 'CANVAS', toDataURL: () => reader.result }, needsUpdate: true })
				reader.readAsDataURL(blob);
			});
			return texture;
		} else if(url.startsWith('data:')) {
			// Shim canvas to avoid redrawing texture in Coherent
			return Object.assign(new THREE.Texture({ nodeName: 'CANVAS', toDataURL: () => url }), { needsUpdate: true });
		}

		// Shim image to avoid texture being loaded in Coherent
		return new THREE.Texture({ src: altspaceutil.getAbsoluteURL(url) });
	}

	config = Object.assign({ crossOrigin: 'anonymous' }, config);

	var loader = new THREE.TextureLoader();
	if(config.crossOrigin !== 'anonymous') loader.setCrossOrigin(config.crossOrigin);
	if(config.withCredentials !== undefined) loader.setWithCredentials(config.withCredentials);
	if(config.path !== undefined) loader.setPath(config.path);
	return loader.load(url);
}

/**
* Sets the Altspace cursor collider property for the specified object.
* @function setCursorCollider
* @param {THREE.Object3D} [object3d] An object to set the cursor collider property for.
* @param {Boolean} [isCursorCollider] Specifies if the object is a cursor collider.
* @param {Boolean} [recursive=false] Specifies if the property change should also be applied recursively to all children of the object.
* @memberof module:altspaceutil
*/
altspaceutil.setCursorCollider = function(object3d, isCursorCollider, recursive) {
	if(!object3d) return;

	if(recursive) {
		object3d.traverse(child => {
			if(!child.userData.altspace) child.userData.altspace = {};
			if(!child.userData.altspace.collider) child.userData.altspace.collider = {};
			child.userData.altspace.collider.enabled = isCursorCollider;
		});
	} else {
		if(!object3d.userData.altspace) object3d.userData.altspace = {};
		if(!object3d.userData.altspace.collider) object3d.userData.altspace.collider = {};
		object3d.userData.altspace.collider.enabled = isCursorCollider;
	}
}

/**
* Gets the Altspace cursor collider property for the specified object.
* @function isCursorCollider
* @param {THREE.Object3D} [object3d] An object to retrieve the cursor collider property from.
* @returns {Boolean} Whether the object is a cursor collider.
* @memberof module:altspaceutil
*/
altspaceutil.isCursorCollider = function(object3d) {
	if(!object3d) return false;
	return (!object3d.userData.altspace || !object3d.userData.altspace.collider || object3d.userData.altspace.enabled === undefined || object3d.userData.altspace.enabled);
}

/**
* Flags a behavior as managed.  While managed, the behavior
* will automatically call dispose and reinitialize itself when the object
* is removed from the scene tree, and will remain in the object's behavior
* list until removeBehavior is called to destroy it.  Adding the object back
* into the scene will initialize the behavior as if it was a newly added behavior.
* @function manageBehavior
* @param {altspace.utilities.behaviors.Behavior} [behavior] The behavior to be managed.
* @param {THREE.Object3D} [object3d] The object that owns the behavior.
* @memberof module:altspaceutil
*/
altspaceutil.manageBehavior = function(behavior, object3d) {
	behavior.__isManaged = true;

	if(!object3d.__resetManagedBehavior) {
		object3d.addEventListener('removed', object3d.__resetManagedBehavior = function() {
			if(object3d.__resetManagedBehavior) {
				object3d.removeEventListener('removed', object3d.__resetManagedBehavior);
				object3d.__resetManagedBehavior = null;
			}

			object3d.traverse(function(child) {
				if(!child.__behaviorList) return;

				for(var behavior of child.__behaviorList) {
					if(behavior.__isInitialized && behavior.__isManaged) {
						try {
							if(behavior.dispose) behavior.dispose.call(behavior, child);
							behavior.__isInitialized = false;
						} catch(error) {
							console.group();
							(console.error || console.log).call(console, error.stack || error);
							console.log('[Behavior]');
							console.log(behavior);
							console.log('[Object3D]');
							console.log(child);
							console.groupEnd();
						}
					}
				}
			});
		});
	}
}

/**
* Flags a managed behavior as unmanaged.  After being unmanaged, the behavior
* must be manually removed from the object with removeBehavior to destroy it
* when it is no longer needed.
* @function unmanageBehavior
* @param {altspace.utilities.behaviors.Behavior} [behavior] The behavior to be unmanaged.
* @param {THREE.Object3D} [object3d] The object that owns the behavior.
* @memberof module:altspaceutil
*/
altspaceutil.unmanageBehavior = function(behavior, object3d) {
	behavior.__isManaged = false;
}

/**
* Clones an object and its children, including behaviors when possible.
* Note that a behavior will only be cloned if it implements a clone() function.
* @function cloneWithBehaviors
* @param {Boolean} [recursive=true] Whether children of the object should be cloned.
* @returns {THREE.Object3D}
* @memberof module:altspaceutil
*/
altspaceutil.cloneWithBehaviors = function(obj, recursive) {
	// Clone Object
	var other = obj.clone(false);

	// Clone Behaviors
	if(obj.__behaviorList && obj.__behaviorList.length > 0) {
		for(var behavior of obj.__behaviorList) {
			try {
				if(behavior.clone) {
					var otherBehavior = behavior.clone.call(behavior, other, obj);
					if(otherBehavior) {
						other.__behaviorList = other.__behaviorList || [];
						other.__behaviorList.push(otherBehavior);
					}
				}
			} catch(error) {
				console.group();
				(console.error || console.log).call(console, error.stack || error);
				console.log('[Behavior]');
				console.log(behavior);
				console.log('[Object3D]');
				console.log(obj);
				console.groupEnd();
			}
		}
	}

	// Clone Children
	if(recursive === undefined || recursive) {
		for(var child of obj.children) {
			other.add(child.cloneWithBehaviors(true));
		}
	}

	return other;
}

/**
* Loads and executes a script from the specified JavaScript file URL.
* @function loadScript
* @param {String} [url] A URL to a JavaScript file.
* @param {Object} [config] Optional parameters for specialized cases.
* @param {Function} [config.scriptTest=null] A predicate function that tests whether the script contents has loaded.  A return value of true indicates that the loaded script content exists, false otherwise.
* @param {Boolean} [config.loadOnce=true] Indicates whether the script should be loaded if it was previously loaded.  If true, the script will not be loaded again on subsequent calls if it was previously loaded.
* @returns {Promise}
* @memberof module:altspaceutil
*/
altspaceutil.loadScript = (url, config) => {
	config = Object.assign({ loadOnce: true }, config);
	altspaceutil._loadedScripts = altspaceutil._loadedScripts || {};

	if(config.scriptTest && config.scriptTest(url)) return Promise.resolve();

	if(config.loadOnce) {
		if(altspaceutil._loadedScripts[url] && altspaceutil._loadedScripts[url].loaded) return Promise.resolve();
		if(altspaceutil._loadedScripts[url] && altspaceutil._loadedScripts[url].waiting) return altspaceutil._loadedScripts[url].waiting;
	}

	let script = document.createElement('script');
	script.src = new URL(url, window.location).toString();
	script.async = false; // When explicitly set to false, download the script asynchronously but execute in order it was added to DOM

	let firstTimeLoad = (altspaceutil._loadedScripts[url] === undefined);
	let waitForScriptEvents = new Promise((resolve, reject) => {
		script.onload = () => {
			if(!config.scriptTest || config.scriptTest(url)) {
				resolve();
			} else {
				console.warn('Script test failed for script at ' + script.src);
				reject('Script test failed for script at ' + script.src);
			}

			if(firstTimeLoad) {
				altspaceutil._loadedScripts[url].loaded = true;
				altspaceutil._loadedScripts[url].waiting = null;
			}
		};
		script.onerror = () => {
			if(firstTimeLoad) {
				altspaceutil._loadedScripts[url].waiting = null;
				delete altspaceutil._loadedScripts[url];
			}

			console.warn('Failed to load script at ' + script.src);
			reject('Failed to load script at ' + script.src);
		};
	});

	if(firstTimeLoad) altspaceutil._loadedScripts[url] = { waiting: waitForScriptEvents };

	if(!altspaceutil._lastLoadScript) {
		// Insert first dynamically loaded script before the first script in the DOM
		let firstScript = document.getElementsByTagName('script')[0];
		firstScript.parentNode.insertBefore(script, firstScript);
	} else {
		// Every subsequently loaded script should be inserted after the previously loaded script
		altspaceutil._lastLoadScript.parentNode.insertBefore(script, altspaceutil._lastLoadScript.nextSibling);
	}

	altspaceutil._lastLoadScript = script;

	return waitForScriptEvents;
}

/**
* Loads and executes one or more scripts from the specified JavaScript file URL.
* @function loadScripts
* @param {String[]} [scripts] An array of JavaScript file URLs to be loaded.
* @returns {Promise}
* @memberof module:altspaceutil
*/
/**
* Loads and executes one or more scripts from the specified JavaScript file URL.
* @function loadScripts
* @param {Object[]} [scripts] An array of objects containing a URL and optional config parameters for the scripts to be loaded. See below for object parameters.
* @returns {Promise}
* @memberof module:altspaceutil
*/
altspaceutil.loadScripts = scripts => {
	if(!scripts || scripts.length <= 0) return Promise.resolve();
	return Promise.all(scripts.map(script => (typeof script === 'string' || script instanceof String) ? altspaceutil.loadScript(script) : altspaceutil.loadScript(script.url, script)));
}

/**
* Enables or disables texture loading optimizations in the Altspace client.  Enabling texture loader optimizations can drastically improve texture loading times, reduce resource usage and correct compability issues with embedded textures in the Altspace client.  These optimizations are enabled by default, and can be disabled when compatibility issues with other libraries arise.
* @function overrideTextureLoader
* @param {Boolean} [override] Specifies whether texture loader optimizations are enabled.
* @memberof module:altspaceutil
*/
altspaceutil.overrideTextureLoader = override => {
	if(altspace.inClient) altspaceutil._isTextureLoaderOverridden = override;
}

if(altspace.inClient) {
	if(!altspaceutil._originalTextureLoaderFunc) altspaceutil._originalTextureLoaderFunc = THREE.TextureLoader.prototype.load;
	altspaceutil._isTextureLoaderOverridden = true; // Enable texture loader optimizations by default, but can be disabled later by user if it conflicts with other libraries.

	THREE.TextureLoader.prototype.load = function(url, resolve) {
		if(!altspaceutil._isTextureLoaderOverridden) return altspaceutil._originalTextureLoaderFunc.apply(this, arguments);
		let texture = altspaceutil.loadTexture(url);
		if(resolve) resolve(texture); // Signal GLTFLoader resource resolution
		return texture;
	}
}

if(!altspaceutil._assetLoaders) altspaceutil._assetLoaders = new class {
	constructor() {
		this.handlers = [];

		this.add(/\.obj$/i, (url, config) => {
			return new Promise((resolve, reject) => {
				altspaceutil.loadScript('https://cdn.jsdelivr.net/combine/npm/three@0.' + THREE.REVISION + '.0/examples/js/loaders/MTLLoader.min.js,npm/three@0.' + THREE.REVISION + '.0/examples/js/loaders/OBJLoader.min.js', { scriptTest: () => THREE.MTLLoader && THREE.OBJLoader }).then(() => {
					// Retrieve MTL file path from OBJ
					let loader = new THREE.FileLoader();
					loader.load(url, response => {
						let mtlFileUrl = /^[\s]*mtllib[\s]+(.*\.mtl)[\s]*$/m.exec(response);
						if(mtlFileUrl) {
							mtlFileUrl = new URL(mtlFileUrl[1], url).toString();
							let loader = new THREE.MTLLoader();
							loader.setCrossOrigin(config.crossOrigin);
							loader.setTexturePath(altspaceutil.getBasePath(mtlFileUrl));
							loader.load(mtlFileUrl, materials => {
								materials.preload();
								resolve(new THREE.OBJLoader().setMaterials(materials).parse(response));
							}, null, () => reject('Could not retrieve materials from ' + mtlFileUrl));
						} else {
							resolve(new THREE.OBJLoader().parse(response));
						}
					}, null, () => reject('Could not retrieve asset from ' + url));
				}).catch(() => reject('Could not load scripts for MTLLoader/OBJLoader'));
			});
		});

		this.add(/\.gltf|\.glb$/i, (url, config) => {
			if(altspace.inClient && (config.native === undefined || config.native)) {
				let obj = new THREE.Object3D();
				obj.addBehavior(new altspaceutil.behaviors.NativeComponent('n-gltf', { url: url, sceneIndex: config.sceneIndex || 0 }, { useCollider: config.cursorCollider }));
				return Promise.resolve(obj);
			}

			return new Promise((resolve, reject) => {
				altspaceutil.loadScript('https://cdn.jsdelivr.net/npm/three@0.' + THREE.REVISION + '.0/examples/js/loaders/GLTFLoader.min.js', { scriptTest: () => THREE.GLTFLoader }).then(() => {
					let loader = new THREE.GLTFLoader();
					loader.setCrossOrigin(config.crossOrigin);
					loader.load(url, obj => resolve((config.sceneIndex > 0 && obj.scenes && config.sceneIndex < obj.scenes.length) ? obj.scenes[config.sceneIndex] : obj.scene), null, () => reject('Could not retrieve asset from ' + url));
				}).catch(() => reject('Could not load scripts for GLTFLoader'));
			});
		});

		this.add(/\.dae$/i, (url, config) => {
			return new Promise((resolve, reject) => {
				altspaceutil.loadScript('https://cdn.jsdelivr.net/npm/three@0.' + THREE.REVISION + '.0/examples/js/loaders/ColladaLoader.min.js', { scriptTest: () => THREE.ColladaLoader }).then(() => {
					if(altspace.inClient) {
						let loader = new THREE.FileLoader();
						loader.load(url, response => {
							let originalLoader = THREE.TextureLoader.prototype.load;
							THREE.TextureLoader.prototype.load = (textureUrl, ...args) => originalLoader.call(this, new URL(textureUrl, url).toString(), ...args);

							let loader = new THREE.ColladaLoader();
							loader.setCrossOrigin(config.crossOrigin);
							let obj = loader.parse(response, altspaceutil.getBasePath(url));
							THREE.TextureLoader.prototype.load = originalLoader;
							resolve(obj.scene);
						}, null, () => reject('Could not retrieve asset from ' + url));
					} else {
						let loader = new THREE.ColladaLoader();
						loader.setCrossOrigin(config.crossOrigin);
						loader.load(url, obj => resolve(obj.scene), null, () => reject('Could not retrieve asset from ' + url));
					}
				}).catch(() => reject('Could not load scripts for ColladaLoader'));
			});
		});

		this.add(/\.fbx$/i, (url, config) => {
			return new Promise((resolve, reject) => {
				altspaceutil.loadScript('https://cdn.jsdelivr.net/combine/npm/three@0.' + THREE.REVISION + '.0/examples/js/libs/inflate.min.js,npm/three@0.' + THREE.REVISION + '.0/examples/js/loaders/FBXLoader.min.js', { scriptTest: () => THREE.FBXLoader }).then(() => {
					let loader = new THREE.FBXLoader();
					loader.setCrossOrigin(config.crossOrigin);
					loader.load(url, obj => resolve(obj), null, () => reject('Could not retrieve asset from ' + url));
				}).catch(() => reject('Could not load scripts for FBXLoader'));
			});
		});

		this.add(/\.stl$/i, (url, config) => {
			return new Promise((resolve, reject) => {
				altspaceutil.loadScript('https://cdn.jsdelivr.net/npm/three@0.' + THREE.REVISION + '.0/examples/js/loaders/STLLoader.min.js', { scriptTest: () => THREE.STLLoader }).then(() => {
					let loader = new THREE.STLLoader();
					if(loader.setCrossOrigin) loader.setCrossOrigin(config.crossOrigin);
					loader.load(url, geometry => resolve(new THREE.Mesh(geometry, geometry.hasColors ? new THREE.MeshBasicMaterial({ opacity: geometry.alpha, transparent: (geometry.alpha < 1), vertexColors: THREE.VertexColors }) : undefined)), null, () => reject('Could not retrieve asset from ' + url));
				}).catch(() => reject('Could not load scripts for STLLoader'));
			});
		});

		this.add(/\.assimp$/i, (url, config) => {
			return new Promise((resolve, reject) => {
				altspaceutil.loadScript('https://cdn.jsdelivr.net/npm/three@0.' + THREE.REVISION + '.0/examples/js/loaders/AssimpLoader.min.js', { scriptTest: () => THREE.AssimpLoader }).then(() => {
					if(altspace.inClient) {
						let loader = new THREE.FileLoader();
						loader.setResponseType('arraybuffer');
						loader.load(url, response => {
							let originalLoader = THREE.TextureLoader.prototype.load;
							THREE.TextureLoader.prototype.load = (textureUrl, ...args) => originalLoader.call(this, new URL(textureUrl, url).toString(), ...args);

							let loader = new THREE.AssimpLoader();
							loader.setCrossOrigin(config.crossOrigin);
							let obj = loader.parse(response, altspaceutil.getBasePath(url));
							THREE.TextureLoader.prototype.load = originalLoader;
							resolve(obj.object);
						}, null, () => reject('Could not retrieve asset from ' + url));
					} else {
						let loader = new THREE.AssimpLoader();
						loader.setCrossOrigin(config.crossOrigin);
						loader.load(url, obj => resolve(obj.object), null, () => reject('Could not retrieve asset from ' + url));
					}
				}).catch(() => reject('Could not load scripts for AssimpLoader'));
			});
		});

		this.add(/\.bom$/i, (url, config) => {
			return new Promise((resolve, reject) => {
				altspaceutil.loadScript('https://cdn.jsdelivr.net/gh/NGenesis/bom-three.js@v0.6.3/examples/js/loaders/BOMLoader.min.js', { scriptTest: () => THREE.BOMLoader }).then(() => {
					let loader = new THREE.BOMLoader();
					loader.setCrossOrigin(config.crossOrigin);
					loader.load(url, obj => resolve(obj), null, () => reject('Could not retrieve asset from ' + url));
				}).catch(() => reject('Could not load scripts for BOMLoader'));
			});
		});
	}

	add(regex, handler) {
		this.handlers.push({ regex: regex, handler: handler });
	}

	remove(regex, handler) {
		this.handlers = this.handlers.filter(h => h.regex.toString() !== regex.toString() && (!handler || h.handler !== handler));
	}

	get(url) {
		let path = new URL(url).pathname;
		for(let h of this.handlers) {
			if(h.regex.test(path)) return h.handler;
		}
		return null;
	}
}

/**
* Registers a handler that will load and construct the specified asset type.
* @function addAssetLoader
* @param {RegExp} [regex] The regular expression that will be used to identify an asset from its URL (e.g. `/\.dae$/i` to match the file extension for Collada assets.)
* @param {AssetLoaderHandler} [handler] A handler function that accepts a URL and configuration parameters that will load and construct the asset.  The function must return a promise that resolves that resolves to the loaded asset, or a rejected promise on failure.
* @memberof module:altspaceutil
*/
altspaceutil.addAssetLoader = (regex, handler) => {
	altspaceutil._assetLoaders.add(regex, handler);
}

/**
* Unregisters a handler for the specified asset type.
* @function removeAssetLoader
* @param {RegExp} [regex] The regular expression associated with an asset handler.
* @param {AssetLoaderHandler} [handler=null] An asset handler function that is associated with the specified regular expression.  If omitted, all handlers for the specified regular expression will be removed.
* @memberof module:altspaceutil
*/
altspaceutil.removeAssetLoader = (regex, handler) => {
	altspaceutil._assetLoaders.remove(regex, handler);
}

/**
* Loads an asset from the specified URL.
* @function loadAsset
* @param {String} [url] A URL to the asset to be loaded.
* @param {Object} [config] Optional parameters.
* @param {Boolean} [config.applyTransform=true] When true, the position/rotation/quaternion/scale properties will be applied to the loaded asset.
* @param {Boolean} [config.native=true] When true, assets loaded in the Altspace client will be loaded as native objects where appropriate (e.g. n-gltf for glTF assets), otherwise standard browser behavior will be followed.
* @param {Boolean} [config.cursorCollider=false] Specified whether cursor collision is enabled on the loaded asset.
* @param {Boolean} [config.crossOrigin='anonymous'] Specifies the cross-origin state for loading textures.
* @param {THREE.Vector3} [config.position] Position to be applied to the loaded asset.
* @param {THREE.Euler} [config.rotation] Rotation to be applied to the loaded asset, in radians.
* @param {THREE.Quaternion} [config.quaternion] Quaternion to be applied to the loaded asset.  Specifying quaternion will override the rotation property.
* @param {THREE.Vector3|Number} [config.scale=1] Scale to be applied to the loaded asset.  Uniform scaling is applied when a single value is specified.
* @param {Function} [config.onLoaded=null] A callback function to execute when the asset has been loaded.  A reference to the loaded asset will be passed into this function.
* @returns {Promise}
* @memberof module:altspaceutil
*/
altspaceutil.loadAsset = (url, config) => {
	url = altspaceutil.getAbsoluteURL(url);
	config = Object.assign({ applyTransform: true, cursorCollider: false, crossOrigin: 'anonymous' }, config);

	let fireOnLoadedEvent = asset => {
		altspaceutil.setCursorCollider(asset, config.cursorCollider ? true : false, true);

		if(config.applyTransform) {
			if(config.position) {
				config.position = Object.assign({ x: 0, y: 0, z: 0 }, config.position);
				asset.position.copy(config.position);
			}

			if(config.quaternion) {
				config.quaternion = Object.assign({ x: 0, y: 0, z: 0, w: 1 }, config.quaternion);
				asset.quaternion.copy(config.quaternion);
			} else if(config.rotation) {
				config.rotation = Object.assign({ x: 0, y: 0, z: 0 }, config.rotation);
				asset.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
			}

			if(config.scale) {
				config.scale = (config.hasOwnProperty('scale') && typeof config.scale == 'number') ? { x: config.scale || 1, y: config.scale || 1, z: config.scale || 1 } : Object.assign({ x: 1, y: 1, z: 1 }, config.scale);
				asset.scale.copy(config.scale);
			}
		}

		return new Promise((resolve, reject) => {
			let result = config.onLoaded ? config.onLoaded(asset) : null;
			if(result instanceof Promise) result.then(() => resolve(asset)).catch(e => reject('Error occurred while processing onLoaded asset handler', e));
			else resolve(asset);
		});
	}

	let handler = altspaceutil._assetLoaders.get(url, config);
	return handler ? handler(url, config).then(fireOnLoadedEvent) : Promise.reject('Could not get asset handler for ' + url);
}

/**
* Loads one or more assets from the specified URLs.
* @function loadAssets
* @param {Object[]} [assets] An array of objects containing a URL and optional config parameters for the assets to be loaded.
* @returns {Promise}
* @memberof module:altspaceutil
*/
/**
* Loads one or more assets from the specified URLs.
* @function loadAssets
* @param {Object} [assets] An object of named objects containing a URL and optional config parameters for the assets to be loaded.
* @returns {Promise}
* @memberof module:altspaceutil
*/
altspaceutil.loadAssets = assets => {
	if(!assets) return Promise.resolve(assets);
	
	return new Promise((resolve, reject) => {
		let promisedAssets = Array.isArray(assets) ? assets : Object.values(assets);
		Promise.all(promisedAssets.map(asset => (typeof asset === 'string' || asset instanceof String) ? altspaceutil.loadAsset(asset) : altspaceutil.loadAsset(asset.url, asset))).then(resolvers => {
			if(Array.isArray(assets)) {
				resolve(resolvers);
			} else {
				let loadedAssets = {};
				Object.keys(assets).forEach((key, index) => { loadedAssets[key] = resolvers[index]; });
				resolve(loadedAssets);
			}
		}).catch(e => reject('Could not load assets', e));
	});
}
window.altspaceutil = window.altspaceutil || {};
altspaceutil.shims = altspaceutil.shims || {};
altspaceutil.shims.sdk = altspaceutil.shims.sdk || {};
if(altspaceutil.shims.sdk.inClient === undefined) altspaceutil.shims.sdk.inClient = altspace.inClient ? true : false;

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

altspaceutil.shims.sdk.addNativeComponent = function(mesh, componentType) {
}

altspaceutil.shims.sdk.removeNativeComponent = function(mesh, componentType) {
}

altspaceutil.shims.sdk.updateNativeComponent = function(mesh, componentType, data) {
	//data = JSON.stringify((data instanceof Object) ? data : { singularProperty: data });
}

altspaceutil.shims.sdk.callNativeComponentAction = function(mesh, componentType, functionName, functionArgs) {
}

altspaceutil.shims.sdk.callNativeComponentFunc = function(mesh, componentType, functionName, functionArgs) {
	if(componentType === 'n-gltf' && functionName === 'GetBoundingBox') return Promise.resolve({ center: { x: 0, y: 0, z: 0 }, extents: { x: 0, y: 0, z: 0 } });
	return Promise.resolve({});
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
		altspace.addNativeComponent = altspaceutil.shims.sdk.addNativeComponent;
		altspace.removeNativeComponent = altspaceutil.shims.sdk.removeNativeComponent;
		altspace.updateNativeComponent = altspaceutil.shims.sdk.updateNativeComponent;
		altspace.callNativeComponentAction = altspaceutil.shims.sdk.callNativeComponentAction;
		altspace.callNativeComponentFunc = altspaceutil.shims.sdk.callNativeComponentFunc;
	}

	return Promise.resolve();
}

altspaceutil.initializeAltspaceShims();/**
 * The TWEEN behavior provides a convenience wrapper for [tween.js](https://github.com/tweenjs/tween.js/) to manage and update TWEEN and TWEEN.Group objects.
 *
 * @class TWEEN
 * @param {TWEEN.Group} [tweengroup] A tween group to be managed by the behavior.  When ommitted, the global `TWEEN` object will be managed by the behavior.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.TWEEN = function(tweengroup) {
	this.type = 'TWEEN';
	this.group = tweengroup || TWEEN;

	this.update = function(deltaTime) {
		if(this.group) this.group.update();
	}

	this.dispose = function() {
		this.removeAll();
	}

	this.removeAll = function() {
		if(this.group) this.group.removeAll();
	}

	this.getAll = function() {
		return this.group ? this.group.getAll() : null;
	}

	this.add = function(tween) {
		if(this.group) this.group.add(tween);
	}

	this.remove = function(tween) {
		if(this.group) this.group.remove(tween);
	}
}
altspaceutil.behaviors.NativeComponentPlaceholderMesh = altspaceutil.behaviors.NativeComponentPlaceholderMesh || new THREE.Mesh(new THREE.BoxBufferGeometry(0.001, 0.001, 0.001), Object.assign(new THREE.MeshBasicMaterial(), { visible: false }));

altspaceutil.behaviors.NativeComponentDefaults = {
	'n-object': {
		data: {
			res: 'architecture/wall-4w-4h'
		}
	},

	'n-spawner': {
		data: {
			res: 'interactables/basketball'
		}
	},

	'n-text': {
		data: {
			text: '',
			fontSize: 10,
			width: 10,
			height: 1,
			horizontalAlign: 'middle',
			verticalAlign: 'middle'
		},
		initComponent: function() {
			if(!altspace.inClient) {
				this.config.meshComponent = false;
				this.shimbehavior = new altspaceutil.behaviors.Text({ text: this.data.text, fontSize: this.data.fontSize, width: this.data.width, height: this.data.height, horizontalAlign: this.data.horizontalAlign, verticalAlign: this.data.verticalAlign, native: false });
				this.object3d.addBehavior(this.shimbehavior);
			}
		},
		shimUpdate: function() {
			if(!altspace.inClient && this.shimbehavior) {
				this.shimbehavior.config.text = this.data.text;
				this.shimbehavior.config.fontSize = this.data.fontSize;
				this.shimbehavior.config.width = this.data.width;
				this.shimbehavior.config.height = this.data.height;
				this.shimbehavior.config.horizontalAlign = this.data.horizontalAlign;
				this.shimbehavior.config.verticalAlign = this.data.verticalAlign;
			}
		}
	},

	'n-sphere-collider': {
		data: {
			isTrigger: false,
			center: { 'x': 0, 'y': 0, 'z': 0 },
			radius: 0,
			type: 'environment'
		},
		config: {
			meshComponent: true
		},
		initComponent: initCollisionEventHandler
	},

	'n-box-collider': {
		data: {
			isTrigger: false,
			center: { 'x': 0, 'y': 0, 'z': 0 },
			size: { 'x': 0, 'y': 0, 'z': 0 },
			type: 'environment'
		},
		config: {
			meshComponent: true
		},
		initComponent: initCollisionEventHandler
	},

	'n-capsule-collider': {
		data: {
			isTrigger: false,
			center: { 'x': 0, 'y': 0, 'z': 0 },
			radius: 0,
			height: 0,
			direction: 'y',
			type: 'environment'
		},
		config: {
			meshComponent: true
		},
		initComponent: initCollisionEventHandler
	},

	'n-mesh-collider': {
		data: {
			isTrigger: false,
			convex: true,
			type: 'environment'
		},
		config: {
			recursiveMesh: true,
			inheritParentData: true,
			meshComponent: true
		},
		initComponent: initCollisionEventHandler
	},

	'n-container': {
		data: {
			capacity: 4
		},
		config: {
			meshComponent: true
		},
		attributes: {
			/**
			* The number of objects in the n-container.
			* @instance
			* @member {Number} count
			* @readonly
			* @memberof module:altspace/utilities/behaviors.NativeComponent.attributes
			*/
			count: 0
		},
		initComponent: function() {
			if(altspace.inClient) {
				// Handle Container Count Changes
				this.nativeEvents['NativeContainerCountChanged'] = altspaceutil.addNativeEventListener('NativeContainerCountChanged', (function(meshId, count, oldCount) {
					var object3d = altspaceutil.getObject3DById(meshId);
					if(object3d && object3d === this.component) {
						this.attributes.count = count;

						/**
						* Fires an event every time an object enters or leaves the bounds of the n-container.
						*
						* @event container-count-changed
						* @property {Number} count The new object count
						* @property {Number} oldCount The old object count
						* @property {THREE.Object3D} target - The object which emitted the event.
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						object3d.dispatchEvent({
							type: 'container-count-changed',
							detail: {
								count: count,
								oldCount: oldCount
							},
							bubbles: true,
							target: object3d
						});
					}
				}).bind(this));

				// Handle Container State Changes
				this.nativeEvents['NativeContainerStateChanged'] = altspaceutil.addNativeEventListener('NativeContainerStateChanged', (function(meshId, stateName, didGain) {
					var object3d = altspaceutil.getObject3DById(meshId);
					if(object3d && object3d === this.component) {
						var oldState = this.state;

						this.state = didGain ? stateName : undefined;
						object3d.dispatchEvent({
							type: didGain ? 'stateadded' : 'stateremoved',
							detail: { state: stateName },
							bubbles: true,
							target: object3d
						});

						/**
						* Fires an event when the n-container reaches zero objects contained.
						*
						* @event container-empty
						* @property {THREE.Object3D} target - The object which emitted the event.
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						/**
						* Fires an event when the n-container reaches its capacity
						*
						* @event container-full
						* @property {THREE.Object3D} target - The object which emitted the event.
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						if(this.state !== oldState && this.state) {
							object3d.dispatchEvent({
								type: stateName,
								bubbles: true,
								target: object3d
							});
						}
					}
				}).bind(this));
			}

			// Forward Events From Placeholder To Behavior Owner
			if(this.placeholder) {
				var forwardPlaceholderEvent = (function(event) {
					this.object3d.dispatchEvent(event);
				}).bind(this);
				this.placeholder.addEventListener('container-count-changed', forwardPlaceholderEvent);
				this.placeholder.addEventListener('container-empty', forwardPlaceholderEvent);
				this.placeholder.addEventListener('container-full', forwardPlaceholderEvent);
				this.placeholder.addEventListener('triggerenter', forwardPlaceholderEvent);
				this.placeholder.addEventListener('triggerexit', forwardPlaceholderEvent);
			}
		}
	},

	'n-sound': {
		data: {
			on: '',
			res: '',
			src: '',
			loop: false,
			volume: 1,
			autoplay: false,
			oneshot: false,
			spatialBlend: 1,
			pitch: 1,
			minDistance: 1,
			maxDistance: 12,
			rolloff: 'logarithmic'
		},
		attributes: {
			/**
			* Indicates that the component has been loaded by the AltspaceVR client.
			* @instance
			* @member {Boolean} loaded
			* @readonly
			* @memberof module:altspace/utilities/behaviors.NativeComponent.attributes
			*/
			loaded: false
		},
		initComponent: function() {
			this.data.src = altspaceutil.getAbsoluteURL(this.data.src);

			if(altspace.inClient) {
				// Override A-Frame Callback For NativeSoundLoadedEvent To Suppress Errors That Occur When Object Doesn't Exist
				if(!altspaceutil.overrideNativeSoundLoadedEvent) {
					altspaceutil.overrideNativeSoundLoadedEvent = true;

					altspaceutil.removeAllNativeEventListeners('NativeSoundLoadedEvent');
					altspaceutil.addNativeEventListener('NativeSoundLoadedEvent', function(meshId) {
						altspace._internal.forwardEventToChildIFrames('NativeSoundLoadedEvent', arguments);

						var object3D = altspace._internal.getObject3DById(meshId);
						if(object3D && object3D.el) object3D.el.emit('n-sound-loaded', null, true);
					});
				}

				// Handle Sound Loaded
				this.nativeEvents['NativeSoundLoadedEvent'] = altspaceutil.addNativeEventListener('NativeSoundLoadedEvent', (function(meshId) {
					var object3d = altspaceutil.getObject3DById(meshId);
					if(object3d && object3d === this.component) {
						this.attributes.loaded = true;
						/**
						* Fires an event once the n-sound has finished loading.
						*
						* @event n-sound-loaded
						* @property {THREE.Object3D} target - The object which emitted the event.
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						object3d.dispatchEvent({
							type: 'n-sound-loaded',
							bubbles: true,
							target: object3d
						});
					}
				}).bind(this));

				// Forward Events From Placeholder To Behavior Owner
				if(this.placeholder) {
					this.placeholder.addEventListener('n-sound-loaded', event => this.object3d.dispatchEvent(event));
					this.placeholder.addEventListener('sound-paused', event => this.object3d.dispatchEvent(event));
					this.placeholder.addEventListener('sound-played', event => this.object3d.dispatchEvent(event));
					this.placeholder.addEventListener('sound-stopped', event => this.object3d.dispatchEvent(event));
				}
			} else {
				this.shimbehavior = new altspaceutil.behaviors.Sound({ on: this.data.on, res: this.data.res, src: this.data.src, loop: this.data.loop, volume: this.data.volume, autoplay: this.data.autoplay, oneshot: this.data.oneshot, spatialBlend: this.data.spatialBlend, pitch: this.data.pitch, minDistance: this.data.minDistance, maxDistance: this.data.maxDistance, rolloff: this.data.rolloff, native: false });
				this.object3d.addEventListener('sound-loaded', () => {
					this.attributes.loaded = true;
					this.object3d.dispatchEvent({
						type: 'n-sound-loaded',
						bubbles: true,
						target: this.object3d
					});
				});
				// sound-paused / sound-played / sound-stopped events don't need to be forwarded
				this.object3d.addBehavior(this.shimbehavior);
			}
		},
		callComponentAction: function(functionName, functionArgs) {
			if(altspace.inClient) {
				if(functionName === 'play') {
					this.component.dispatchEvent({
						type: 'sound-played',
						bubbles: true,
						target: this.component
					});
				} else if(functionName === 'pause') {
					this.component.dispatchEvent({
						type: 'sound-paused',
						bubbles: true,
						target: this.component
					});
				} else if(functionName === 'stop') {
					this.component.dispatchEvent({
						type: 'sound-stopped',
						bubbles: true,
						target: this.component
					});
					altspace.callNativeComponentAction(this.component, this.type, 'pause');
					altspace.callNativeComponentAction(this.component, this.type, 'seek', { time: 0 });
					return;
				}

				altspace.callNativeComponentAction(this.component, this.type, functionName, functionArgs);
			} else if(this.shimbehavior) {
				if(functionName === 'play') this.shimbehavior.play();
				else if(functionName === 'pause') this.shimbehavior.pause();
				else if(functionName === 'seek') this.shimbehavior.seek(functionArgs.time || 0);
				else if(functionName === 'stop') this.shimbehavior.stop();
			}
		},
		update: function() {
			this.data.src = altspaceutil.getAbsoluteURL(this.data.src);
			this.attributes.loaded = false;

			if(this.initialized) altspace.updateNativeComponent(this.component, this.type, this.data);

			if(this.playHandlerType) {
				this.component.removeEventListener(this.playHandlerType, this.playHandler);
				this.playHandlerType = null;
			}

			if(this.data.on && this.data.on !== '') {
				if(this.playHandler === undefined) this.playHandler = this.callComponentAction.bind(this, 'play');
				this.playHandlerType = this.data.on;
				this.component.addEventListener(this.playHandlerType, this.playHandler);
			}
		},
		shimUpdate: function() {
			if(!altspace.inClient && this.shimbehavior) {
				this.data.src = altspaceutil.getAbsoluteURL(this.data.src);
				this.shimbehavior.config.volume = this.data.volume;
				this.shimbehavior.config.on = this.data.on;

				if(this.shimbehavior.config.src !== this.data.src || this.shimbehavior.config.res !== this.data.res || this.shimbehavior.config.loop !== this.data.loop || this.shimbehavior.config.autoplay !== this.data.autoplay || this.shimbehavior.config.oneshot !== this.data.oneshot || this.shimbehavior.config.spatialBlend !== this.data.spatialBlend || this.shimbehavior.config.pitch !== this.data.pitch || this.shimbehavior.config.minDistance !== this.data.minDistance || this.shimbehavior.config.maxDistance !== this.data.maxDistance || this.shimbehavior.config.rolloff !== this.data.rolloff) {
					this.attributes.loaded = false;
					this.shimbehavior.config.src = this.data.src;
					this.shimbehavior.config.res = this.data.res;
					this.shimbehavior.config.loop = this.data.loop;
					this.shimbehavior.config.autoplay = this.data.autoplay;
					this.shimbehavior.config.oneshot = this.data.oneshot;
					this.shimbehavior.config.spatialBlend = this.data.spatialBlend;
					this.shimbehavior.config.pitch = this.data.pitch;
					this.shimbehavior.config.minDistance = this.data.minDistance;
					this.shimbehavior.config.maxDistance = this.data.maxDistance;
					this.shimbehavior.config.rolloff = this.data.rolloff;
				}
			}
		}
	},

	'n-skeleton-parent': {
		data: {
			part: 'head',
			side: 'center',
			index: 0,
			userId: null // defaults to current user when omitted
		},
		config: {
			recursiveMesh: true,
			inheritParentData: true,
			meshComponent: true
		}
	},

	'n-cockpit-parent': {
		config: {
			sendUpdates: false,
			recursiveMesh: true,
			inheritParentData: true,
			meshComponent: true
		}
	},

	'n-billboard': {
		config: {
			sendUpdates: false,
			meshComponent: true
		},
		initComponent: function() {
			if(!altspace.inClient) {
				this.config.meshComponent = false;
				this.shimbehavior = new altspaceutil.behaviors.Billboard({ y: false, native: false });
				this.object3d.addBehavior(this.shimbehavior);
			}
		}
	},

	'n-animator': {
		config: {
			sendUpdates: false,
			meshComponent: true
		}
	},

	'n-layout-browser': {
		data: {
			url: 'about:blank',
			isEnclosure: false
		},
		initComponent: function() {
			this.data.url = altspaceutil.getAbsoluteURL(this.data.url);
			this.scene.userData.altspace = this.scene.userData.altspace || {};
			this.scene.userData.altspace.initialized = true;
		},
		update: function() {
			this.data.url = altspaceutil.getAbsoluteURL(this.data.url);
			if(this.initialized) altspace.updateNativeComponent(this.component, this.type, this.data);
		}
	},

	'n-portal': {
		data: {
			targetSpace: null, // defaults to current space when omited
			targetEvent: null, // defaults to current space when omited
			targetPosition: { x: 0, y: 0, z: 0 },
			targetQuaternion: { x: 0, y: 0, z: 0, w: 1 }
		},
		update: function() {
			if(this.config.targetEntity) {
				this.scene.updateMatrixWorld(true);
				this.data.targetPosition = this.config.targetEntity.getWorldPosition(new THREE.Vector3());
				var quaternion = this.config.targetEntity.getWorldQuaternion(new THREE.Quaternion());
				this.data.targetQuaternion = { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
			}

			if(this.initialized) altspace.updateNativeComponent(this.component, this.type, this.data);
		}
	},

	'n-gltf': {
		data: {
			url: '',
			sceneIndex: 0
		},
		attributes: {
			/**
			* Indicates that the component has been loaded by the AltspaceVR client.
			* @instance
			* @member {Boolean} loaded
			* @readonly
			* @memberof module:altspace/utilities/behaviors.NativeComponent.attributes
			*/
			loaded: false
		},
		initComponent: function() {
			this.data.url = altspaceutil.getAbsoluteURL(this.data.url);

			if(altspace.inClient) {
				// Override A-Frame Callback For NativeGLTFLoadedEvent To Suppress Errors That Occur When Object Doesn't Exist
				if(!altspaceutil.overrideNativeGLTFLoadedEvent) {
					altspaceutil.overrideNativeGLTFLoadedEvent = true;

					altspaceutil.removeAllNativeEventListeners('NativeGLTFLoadedEvent');
					altspaceutil.addNativeEventListener('NativeGLTFLoadedEvent', function(meshId) {
						altspace._internal.forwardEventToChildIFrames('NativeGLTFLoadedEvent', arguments);

						var object3D = altspace._internal.getObject3DById(meshId);
						if(object3D && object3D.el) object3D.el.emit('n-gltf-loaded', null, true);
					});
				}

				// Handle GLTF Loaded
				this.nativeEvents['NativeGLTFLoadedEvent'] = altspaceutil.addNativeEventListener('NativeGLTFLoadedEvent', (function(meshId) {
					var object3d = altspaceutil.getObject3DById(meshId);
					if(object3d && object3d === this.component) {
						this.attributes.loaded = true;
						/**
						* Fires an event once the n-gltf has finished loading.
						*
						* @event n-gltf-loaded
						* @property {THREE.Object3D} target - The object which emitted the event.
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						object3d.dispatchEvent({
							type: 'n-gltf-loaded',
							bubbles: true,
							target: object3d
						});
					}
				}).bind(this));

				// Forward Events From Placeholder To Behavior Owner
				if(this.placeholder) {
					var forwardPlaceholderEvent = (function(event) {
						this.object3d.dispatchEvent(event);
					}).bind(this);
					this.placeholder.addEventListener('n-gltf-loaded', forwardPlaceholderEvent);
				}
			} else {
				this.shimbehavior = new altspaceutil.behaviors.GLTF({ url: this.data.url, sceneIndex: this.data.sceneIndex, native: false });
				this.object3d.addEventListener('gltf-loaded', () => {
					this.attributes.loaded = true;
					this.object3d.dispatchEvent({
						type: 'n-gltf-loaded',
						bubbles: true,
						target: this.object3d
					});
				});
				this.object3d.addBehavior(this.shimbehavior);
			}
		},
		update: function() {
			this.data.url = altspaceutil.getAbsoluteURL(this.data.url);
			this.attributes.loaded = false;
			if(this.initialized) altspace.updateNativeComponent(this.component, this.type, this.data);
		},
		callComponentFunc: function(functionName, functionArgs) {
			if(altspace.inClient) {
				return altspace.callNativeComponentFunc(this.component, this.type, functionName, functionArgs).then(function(data) {
					if(functionName === 'GetBoundingBox') return new THREE.Box3(new THREE.Vector3().subVectors(data.center, data.extents), new THREE.Vector3().addVectors(data.center, data.extents));
					return data;
				});
			} else {
				if(this.shimbehavior && functionName === 'GetBoundingBox') return this.shimbehavior.getBoundingBox();
			}

			return Promise.resolve();
		},
		shimUpdate: function() {
			if(!altspace.inClient && this.shimbehavior) {
				this.data.url = altspaceutil.getAbsoluteURL(this.data.url);
				if(this.shimbehavior.config.url !== this.data.url || this.shimbehavior.config.sceneIndex !== this.data.sceneIndex) {
					this.attributes.loaded = false;
					this.shimbehavior.config.url = this.data.url;
					this.shimbehavior.config.sceneIndex = this.data.sceneIndex;
				}
			}
		}
	},

	'n-rigidbody': {
		data: {
			mass: 1,
			drag: 0,
			angularDrag: 0.05,
			useGravity: true,
			isKinematic: false,
			positionConstraints: [false, false, false],
			rotationConstraints: [false, false, false],
		},
		config: {
			meshComponent: true
		},
		initComponent: function() {
			if(altspace.inClient) {
				// Handle Transform Update Events
				/*var tempInverseMatrix, pooledWorldPosition, pooledWorldQuaternion;
				this.nativeEvents['NativeTransformUpdateEvent'] = altspaceutil.addNativeEventListener('NativeTransformUpdateEvent', (function(meshId, positionX, positionY, positionZ, rotationX, rotationY, rotationZ, rotationW) {
					var object3d = altspaceutil.getObject3DById(meshId);
					if(object3d && object3d === this.component) {
						tempInverseMatrix = tempInverseMatrix || new THREE.Matrix4();
						tempInverseMatrix.getInverse(altspaceutil.getThreeJSScene().matrix);

						pooledWorldPosition = pooledWorldPosition || new THREE.Vector3();
						pooledWorldPosition.set(positionX, positionY, positionZ);
						pooledWorldPosition.applyMatrix4(tempInverseMatrix);

						pooledWorldQuaternion = pooledWorldQuaternion || new THREE.Quaternion();
						pooledWorldQuaternion.set(rotationX, rotationY, rotationZ, rotationW);
						//TODO: This function doesn't exist. Not taking scene rotation into account at the moment because of this.
						//Possibly compose the position and rotation into a single Matrix4 and apply the inverse scene matrix and then decompose the matrix.
						//pooledWorldQuaternion.applyMatrix4(tempInverseMatrix);

						object3d.dispatchEvent({
							type: 'native-transform-update',
							worldPosition: pooledWorldPosition,
							worldQuaternion: pooledWorldQuaternion,
							bubbles: true,
							target: object3d
						});
					}
				}).bind(this));*/

				// Forward Events From Placeholder To Behavior Owner
				if(this.placeholder) {
					var forwardPlaceholderEvent = (function(event) {
						this.object3d.dispatchEvent(event);
					}).bind(this);
					this.placeholder.addEventListener('native-transform-update', forwardPlaceholderEvent);
				}
			}
		}
	}
};

function initCollisionEventHandler() {
	if(altspace.inClient && this.placeholder) {
		this.nativeEvents['NativeCollisionEvent'] = altspaceutil.addNativeEventListener('NativeCollisionEvent', (function(type, thisMeshId, otherMeshId, relativeVelocityX, relativeVelocityY, relativeVelocityZ, normalX, normalY, normalZ, pointX, pointY, pointZ) {
			var thisObject3D = altspaceutil.getObject3DById(thisMeshId), otherObject3D = altspaceutil.getObject3DById(otherMeshId);
			if(thisObject3D === this.placeholder || otherObject3D === this.placeholder) {
				var event = {
					type: type,
					bubbles: true,
					target: (thisObject3D === this.placeholder) ? this.object3d : thisObject3D,
					other: (otherObject3D === this.placeholder) ? this.object3d : otherObject3D,
					relativeVelocity: {
						x: relativeVelocityX,
						y: relativeVelocityY,
						z: relativeVelocityZ
					}
				};

				//TODO BUG: the position needs to be transformed by the scene
				//Some collision events (such as exit) seem to sometimes have no contact points
				if (normalX) {
					event.point = {
						position: {
							x: pointX,
							y: pointY,
							z: pointZ
						},
						normal: {
							x: normalX,
							y: normalY,
							z: normalZ
						}
					}
				}

				this.object3d.dispatchEvent(event);
			}
		}).bind(this));

		this.nativeEvents['NativeTriggerEvent'] = altspaceutil.addNativeEventListener('NativeTriggerEvent', (function(type, thisMeshId, otherMeshId) {
			var thisObject3D = altspaceutil.getObject3DById(thisMeshId), otherObject3D = altspaceutil.getObject3DById(otherMeshId);
			if(thisObject3D === this.placeholder || otherObject3D === this.placeholder) {
				var event = {
					type: type,
					bubbles: true,
					target: (thisObject3D === this.placeholder) ? this.object3d : thisObject3D,
					other: (otherObject3D === this.placeholder) ? this.object3d : otherObject3D,
				};

				this.object3d.dispatchEvent(event);
			}
		}).bind(this));
	}
}

/**
 * Provides support for AltspaceVR native components to be attached to objects, providing sane configuration defaults where appropriate.
 * 
 * @class NativeComponent
 * @param {String} [type] Native component type.
 * @param {Object} [data] Native component properties.
 * @param {Object} [config] Optional parameters.  Many of these properties are provided only to override the internal behavior of a component in specialized use cases.
 * @param {THREE.Object3D} [config.targetEntity=null] An object in the scene that a user will teleport to when entering a native portal.
 * @param {Boolean} [config.useCollider=false] Specifies whether cursor collision should be disabled on the native component.
 * @param {Boolean} [config.sharedComponent=true] Specifies whether the native component should share the same THREE.Mesh instance with other native components.
 * @param {Boolean} [config.recursiveMesh=false] Specifies whether the native component is applied recursively to all THREE.Mesh children.
 * @param {Boolean} [config.recursive=false] Specifies whether the native component is applied recursively to all children.
 * @param {Boolean} [config.sendUpdates=true] Specifies whether the native component should send updates to the native Altspace client.
 * @param {Boolean} [config.updateOnStaleData=true] Specifies whether the native component should send updates to the native Altspace client when a property has changed.
 * @param {Boolean} [config.inheritParentData=false] Specifies whether the native component should inherit its property state from a parent component.
 * @param {Boolean} [config.meshComponent=false] Specifies whether the native component is treated as a mesh-specific component.  This is used as a performance optimization to defer initialization of mesh-specific components (e.g. native parents and colliders) attached to placeholder objects, until another component is added that gives them functionality (e.g. text, spawner).
 * @memberof module:altspace/utilities/behaviors
 */
altspaceutil.behaviors.NativeComponent = function(_type, _data, _config) {
	this.type = _type || 'NativeComponent';

	this.nativeEvents = {};
	this.defaults = altspaceutil.behaviors.NativeComponentDefaults[this.type];
	this.config = Object.assign({ sendUpdates: true, recursiveMesh: false, recursive: false, useCollider: false, updateOnStaleData: true, sharedComponent: true, inheritParentData: false, meshComponent: false }, (this.defaults && this.defaults.config) ? JSON.parse(JSON.stringify(this.defaults.config)) : {}, _config);
	this.data = Object.assign((this.defaults && this.defaults.data) ? JSON.parse(JSON.stringify(this.defaults.data)) : {}, _data);
	this.attributes = (this.defaults && this.defaults.attributes) ? JSON.parse(JSON.stringify(this.defaults.attributes)) : {};

	this.awake = function(o, s) {
		this.scene = s;
		this.component = this.object3d = o;
		this.initialized = false;

		altspaceutil.manageBehavior(this, this.object3d);

		if(!(this.component instanceof THREE.Mesh)) {
			// Cannot Have Multiple Components Of The Same Type Per Mesh, Create New Placeholder For Subsequent Components
			if(this.config.sharedComponent && this.object3d.userData._sharedNativeComponent) {
				for(var behavior of this.object3d.userData._sharedNativeComponent.behaviors) {
					if(behavior !== this && behavior.type === this.type) {
						this.config.sharedComponent = false;
						break;
					}
				}
			}

			// Create Placeholder Mesh
			if(this.config.sharedComponent) {
				this.sharedData = this.object3d.userData._sharedNativeComponent = this.object3d.userData._sharedNativeComponent || {};
				this.sharedData.placeholder = this.sharedData.placeholder || altspaceutil.behaviors.NativeComponentPlaceholderMesh.clone();
				this.sharedData.behaviors = this.sharedData.behaviors || [];
				this.sharedData.behaviors.push(this);
				if(!this.sharedData.placeholder.parent) this.object3d.add(this.sharedData.placeholder);
			}

			this.component = this.placeholder = (this.sharedData && this.sharedData.placeholder) ? this.sharedData.placeholder : altspaceutil.behaviors.NativeComponentPlaceholderMesh.clone();
			this.object3d.add(this.placeholder);
		}

		if(this.defaults && this.defaults.initComponent) this.defaults.initComponent.bind(this)();

		if(!this.config.useCollider) {
			this.component.userData.altspace = this.component.userData.altspace || {};
			this.component.userData.altspace.collider = this.component.userData.altspace.collider || {};
			this.component.userData.altspace.collider.enabled = false;
		}

		// Link Children To Nearest Parent When Component Data Is Inherited
		var linkedParent = false;
		if(this.config.inheritParentData && !this.parent) {
			var parent = this.object3d.parent;
			while(parent) {
				var behavior = parent.getBehaviorByType(this.type);
				if(behavior) {
					this.parent = behavior.parent || behavior;
					linkedParent = true;
					break;
				}

				parent = parent.parent;
			}
		}

		this.update();

		// Add Component To Descendants
		if((this.config.recursive || this.config.recursiveMesh) && (!this.parent || linkedParent)) {
			this.object3d.traverse((function(child) {
				if(child !== this.object3d && child !== this.placeholder && (this.config.recursive || (this.config.recursiveMesh && child instanceof THREE.Mesh))) {
					if(!child.getBehaviorByType(this.type)) child.addBehavior(Object.assign(new altspaceutil.behaviors.NativeComponent(this.type, this.data, this.config), { parent: this }));
				}
			}).bind(this));
		}
	}

	this.update = function() {
		if(this.placeholder) {
			// Placeholder Inherits Object Properties
			if(this.object3d.userData.altspace) this.placeholder.userData.altspace = this.object3d.userData.altspace;
			this.placeholder.visible = this.object3d.visible;
		}

		// Children Inherit Parent's Data
		if(this.parent && this.config.inheritParentData) this.data = Object.assign({}, this.parent.data);

		// Recursively Applied Components Are Automatically Added To Children
		if(!this.parent && (this.config.recursive || this.config.recursiveMesh)) {
			this.object3d.traverse((function(child) {
				if(child !== this.object3d && child !== this.placeholder && (this.config.recursive || (this.config.recursiveMesh && child instanceof THREE.Mesh))) {
					if(!child.getBehaviorByType(this.type)) child.addBehavior(Object.assign(new altspaceutil.behaviors.NativeComponent(this.type, this.data, this.config), { parent: this }));
				}
			}).bind(this));
		}

		if(altspace.inClient) {
			if(!this.initialized) {
				if(!this.config.meshComponent || this.object3d instanceof THREE.Mesh) {
					this.initialized = true;
				} else if(this.config.sharedComponent && this.sharedData) {
					// Initialize Shared Components That Previously Offered No Functional Benefit
					for(var behavior of this.sharedData.behaviors) {
						if(behavior.initialized) {
							this.initialized = true;
							break;
						}
					}
				}

				if(this.initialized) altspace.addNativeComponent(this.component, this.type);
			}

			if(this.config.sendUpdates) {
				if(this.config.updateOnStaleData) {
					var newData = JSON.stringify(this.data);
					if(this.oldData !== newData) {
						if(this.defaults && this.defaults.update) {
							this.defaults.update.bind(this)();
						} else if(this.initialized) {
							altspace.updateNativeComponent(this.component, this.type, this.data);
						}
						this.oldData = newData;
					}
				} else {
					if(this.defaults && this.defaults.update) {
						this.defaults.update.bind(this)();
					} else if(this.initialized) {
						altspace.updateNativeComponent(this.component, this.type, this.data);
					}
				}
			}
		} else {
			if(!this.initialized) {
				if(!this.config.meshComponent || this.object3d instanceof THREE.Mesh) {
					this.initialized = true;
				} else if(this.config.sharedComponent && this.sharedData) {
					// Initialize Shared Components That Previously Offered No Functional Benefit
					for(var behavior of this.sharedData.behaviors) {
						if(behavior.initialized) {
							this.initialized = true;
							break;
						}
					}
				}
			}

			if(this.defaults && this.defaults.shimUpdate) this.defaults.shimUpdate.bind(this)();
		}
	}

	/**
	* Invokes an action associated with the native component.  Deprecated. See callComponentAction.
	*
	* @method callComponent
	* @param {String} [functionName] - The function name to invoke on the native component.
	* @param {Arguments...} [functionArgs] - Arguments that will be passed to the function when invoked.
	* @memberof module:altspaceutil/behaviors.NativeComponent
	*/
	this.callComponent = function(functionName, functionArgs) {
		this.callComponentAction(functionName, functionArgs);
	}

	/**
	* Invokes an action associated with the native component.
	*
	* @method callComponentAction
	* @param {String} [functionName] - The function name to invoke on the native component.
	* @param {Arguments...} [functionArgs] - Arguments that will be passed to the function when invoked.
	* @memberof module:altspaceutil/behaviors.NativeComponent
	*/
	this.callComponentAction = function(functionName, functionArgs) {
		if(!this.initialized || !this.component) return;

		if(this.defaults && this.defaults.callComponentAction) this.defaults.callComponentAction.bind(this)(functionName, functionArgs);
		else altspace.callNativeComponentAction(this.component, this.type, functionName, functionArgs);
	}

	/**
	* Calls a function associated with the native component, and returns a promise of the value that will be returned by the native component function.
	*
	* @method callComponentFunc
	* @param {String} [functionName] - The function name to invoke on the native component.
	* @param {Arguments...} [functionArgs] - Arguments that will be passed to the function when invoked.
	* @memberof module:altspaceutil/behaviors.NativeComponent
	*/
	this.callComponentFunc = function(functionName, functionArgs) {
		if(!this.initialized || !this.component) return Promise.reject();

		if(this.defaults && this.defaults.callComponentFunc) return this.defaults.callComponentFunc.bind(this)(functionName, functionArgs);
		return altspace.callNativeComponentFunc(this.component, this.type, functionName, functionArgs);
	}

	this.dispose = function() {
		if(this.shimbehavior && this.object3d) this.object3d.removeBehavior(this.shimbehavior);

		if(this.config.recursive || this.config.recursiveMesh && !this.parent) {
			this.object3d.traverse((function(child) {
				if(child !== this.object3d && child !== this.placeholder && (this.config.recursive || (this.config.recursiveMesh && child instanceof THREE.Mesh))) {
					var childComponent = child.getBehaviorByType(this.type);
					if(childComponent && childComponent.parent === this) child.removeBehavior(childComponent);
				}
			}).bind(this));
		}

		for(var nativeEvent in this.nativeEvents) {
			if(this.nativeEvents.hasOwnProperty(nativeEvent)) this.nativeEvents[nativeEvent].clear();
		}

		if(this.initialized) {
			if(this.defaults && this.defaults.dispose) this.defaults.dispose.bind(this)();
			altspace.removeNativeComponent(this.component, this.type);
		}

		if(this.config.sharedComponent && this.sharedData) {
			// Decrease Reference Count
			var index = this.sharedData.behaviors.indexOf(this);
			if(index >= 0) this.sharedData.behaviors.splice(index, 1);

			// Remove Shared Component Once All References Are Removed
			if(this.sharedData.behaviors.length <= 0) {
				if(this.sharedData.placeholder.parent) this.sharedData.placeholder.parent.remove(this.sharedData.placeholder);
				delete this.object3d.userData._sharedNativeComponent;
			}
		} else if(this.placeholder) {
			// Remove Standalone Placeholder
			this.object3d.remove(this.placeholder);
		}

		this.nativeEvents = {};
		this.initialized = false;
		this.object3d = null;
		this.placeholder = null;
		this.component = null;
		this.scene = null;
		this.sharedData = null;
		this.oldData = null;
		this.parent = null;
		this.shimbehavior = null;
	}

	/**
	* Retrieves an attribute associated with a native component.
	*
	* @method getAttribute
	* @param {String} [attributeName] - An attribute name associated with the native component.
	* @returns {Object} The value of the given attribute.
	* @memberof module:altspaceutil/behaviors.NativeComponent
	*/
	this.getAttribute = function(attributeName) {
		return this.attributes[attributeName];
	}

	this.clone = function() {
		return new altspaceutil.behaviors.NativeComponent(this.type, this.data, this.config);
	}
}

/**
 * The NativeComponentSync behavior syncs an object's native component data.  
 * **Note:** NativeComponentSync must be used in conjunction with 
 * [SceneSync]{@link module:altspace/utilities/behaviors.SceneSync}, 
 * [Object3DSync]{@link module:altspace/utilities/behaviors.Object3DSync} and 
 * a [NativeComponent]{@link module:altspaceutil/behaviors.NativeComponent} of
 * the same type specified for NativeComponentSync.
 *
 * @class NativeComponentSync
 * @param {String} [type] Type of native component to be synchronized.  To retrieve the behavior using the getBehaviorByType method, prepend "sync-" to the name of the native component type (e.g. sync-n-text for an n-text native component).
 * @param {Object} [config] Optional parameters.
 * @param {Object3DSync} [config.syncRef=null] A reference to the object syncing component.  Defaults to using the syncing component of the object the behavior is attached to.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.NativeComponentSync = function(_type, _config) {
	this.componentType = _type || 'NativeComponent';
	this.type = _type ? ('sync-' + _type) : 'NativeComponentSync';
	this.config = _config || {};

	this.awake = function(o) {
		this.object3d = o;

		altspaceutil.manageBehavior(this, this.object3d);

		this.component = this.object3d.getBehaviorByType(this.componentType);
		this.sync = this.config.syncRef || this.object3d.getBehaviorByType('Object3DSync');
		this.dataRef = this.sync.dataRef.child(this.componentType).child('data');
		this.dataRefUpdate = this.dataRef.on('value', (function(snapshot) {
			if(this.sync.isMine) return;

			var data = snapshot.val();
			if(!data) return;

			if(!this.component) {
				this.component = this.object3d.getBehaviorByType(this.componentType);

				if(!this.component) {
					this.component = new altspaceutil.behaviors.NativeComponent(this.componentType, data);
					this.object3d.addBehavior(this.component);
					return;
				}
			}

			this.component.data = data;
		}).bind(this));

		this.intervalId = setInterval(this.update.bind(this), this.sync.autoSendRateMS);
	}

	this.update = function() {
		if(!this.sync.isMine || !this.component) return;

		var newData = JSON.stringify(this.component.data);
		if(this.oldData !== newData) {
			this.dataRef.set(this.component.data);
			this.oldData = newData;
		}
	}

	this.dispose = function() {
		if(this.intervalId) clearInterval(this.intervalId);

		if(this.dataRefUpdate && this.dataRef) this.dataRef.off('value', this.dataRefUpdate);
		this.object3d = null;
		this.component = null;
		this.sync = null;
		this.dataRef = null;
		this.dataRefUpdate = null;
		this.oldData = null;
	}

	this.clone = function() {
		return new altspaceutil.behaviors.NativeComponentSync(this.componentType, this.config);
	}
}
/**
 * The Billboard behavior updates the orientation of an object to face the camera.
 *
 * @class Billboard
 * @param {Object} [config] Optional parameters.
 * @param {THREE.Object3D} [config.target=null] A target that the object should face.  If omitted, the scene camera will be used.
 * @param {Boolean} [config.x=true] Specifies whether the X-axis of the object should be reoriented to face the camera.
 * @param {Boolean} [config.y=true] Specifies whether the Y-axis of the object should be reoriented to face the camera.
 * @param {Boolean} [config.z=true] Specifies whether the Z-axis of the object should be reoriented to face the camera.
 * @param {Boolean} [config.native=true] Specifies whether a native billboard (n-billboard) component will be used when running the app in the Altspace client.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.Billboard = class {
	get type() { return 'Billboard'; }

	set target(target) { this.followTarget = target; }
	get target() { return this.followTarget; }

	constructor(config) {
		this.config = Object.assign({ target: null, x: true, y: true, z: true, native: true }, config);
		this.followTarget = this.config.target;

		this.worldPosition = new THREE.Vector3();
		this.worldPositionTarget = new THREE.Vector3();
		this.lookAtRotation = new THREE.Matrix4();
		this.worldQuaternion = new THREE.Quaternion();
		this.worldUp = new THREE.Vector3();
	}

	awake(o, s) {
		this.object3d = o;
		this.scene = s;

		altspaceutil.manageBehavior(this, this.object3d);

		if(this.config.native && altspace.inClient) {
			this.config.y = false;
			this.nativeComponent = new altspaceutil.behaviors.NativeComponent('n-billboard', {}, { useCollider: true });
			this.object3d.addBehavior(this.nativeComponent);
		}
	}

	update() {
		if(this.config.native && altspace.inClient) return;

		if(!this.followTarget) {
			this.scene.traverseVisible(child => {
				if(!this.followTarget && child.isCamera) {
					this.followTarget = child;
					return;
				}
			});
		}

		if(this.followTarget) {
			// Transform from observer space to world space
			let parent = this.object3d.parent;
			parent.updateMatrixWorld(true);
			this.object3d.applyMatrix(parent.matrixWorld);

			// Move observer to scene temporarily, without firing scene tree events
			//this.scene.add(this.object3d);
			this.object3d.parent.children.splice(this.object3d.parent.children.indexOf(this.object3d), 1);
			this.object3d.parent = this.scene;
			this.object3d.parent.children.push(this.object3d);

			// Limit Axis Rotation
			this.followTarget.getWorldPosition(this.worldPositionTarget);
			this.object3d.getWorldPosition(this.worldPosition);
			if(!this.config.x) this.worldPositionTarget.x = this.worldPosition.x = 0;
			if(!this.config.y) this.worldPositionTarget.y = this.worldPosition.y = 0;
			if(!this.config.z) this.worldPositionTarget.z = this.worldPosition.z = 0;

			// Rotate observer to look at target
			this.lookAtRotation.lookAt(this.worldPositionTarget, this.worldPosition, this.worldUp.copy(this.object3d.up).applyQuaternion(parent.getWorldQuaternion(this.worldQuaternion)).normalize());
			this.object3d.quaternion.setFromRotationMatrix(this.lookAtRotation);
			this.object3d.updateMatrix();

			// Transform from world space to target space
			this.object3d.applyMatrix(this.lookAtRotation.getInverse(parent.matrixWorld));

			// Move observer back to original parent, without firing scene tree events
			//parent.add(this.object3d);
			this.object3d.parent.children.splice(this.object3d.parent.children.indexOf(this.object3d), 1);
			this.object3d.parent = parent;
			this.object3d.parent.children.push(this.object3d);
		}
	}

	dispose() {
		if(this.object3d && this.config.native && altspace.inClient) {
			if(this.nativeComponent) this.object3d.removeBehavior(this.nativeComponent);
		}
	}

	clone() {
		return new altspaceutil.behaviors.Billboard(this.config);
	}
}
// Font Loader Helper
altspaceutil._FontGlobals = {
	fontUrl: 'https://cdn.jsdelivr.net/npm/altspacevr-behaviors@' + altspaceutil.VERSION + '/fonts/Varela_Round/Varela_Round.json',
	textureUrl: 'https://cdn.jsdelivr.net/npm/altspacevr-behaviors@' + altspaceutil.VERSION + '/fonts/Varela_Round/Varela_Round.png',
	width: 510,
	height: 250,
	scale: 0.001945,
	letterSpacing: 1.9,
	lineHeight: 62,
	tabSize: 9,
	anisotropy: 16,
	alphaTest: 0.0001,
	italicOffset: 8,
	fontStrength: 1,
	boldStrength: 0.75,
	uniforms: {
		map: { type: 't', value: null }
	},
	font: null,
	createShaderUniforms: () => {
		return THREE.UniformsUtils.clone(altspaceutil._FontGlobals.uniforms);
	},
	createVertexShader: () => {
		return `
		varying vec2 vUv;
		varying vec4 vColor;
		attribute vec4 color;
		varying float vBold;
		attribute float bold;
		void main() {
			vUv = uv;
			vColor = color;
			vBold = bold;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}`;
	},
	createFragmentShader: () => {
		return `
		#ifdef GL_OES_standard_derivatives
			#extension GL_OES_standard_derivatives : enable
		#endif
		precision highp float;
		varying vec2 vUv;
		varying vec4 vColor;
		varying float vBold;
		uniform sampler2D map;
		void main() {
			float distance = texture2D(map, vUv).a;
			#ifdef GL_OES_standard_derivatives
				float afwidth = length(vec2(dFdx(distance), dFdy(distance))) * 0.70710678118654757;
			#else
				float afwidth = (1.0 / 32.0) * (1.4142135623730951 / (2.0 * gl_FragCoord.w));
			#endif
			float alpha = smoothstep(0.5 * vBold - afwidth, 0.5 * vBold + afwidth, distance) * vColor.w;
			gl_FragColor = vec4(vColor.xyz, alpha);`
			+ (altspaceutil._FontGlobals.alphaTest ? (`if(gl_FragColor.a < ` + altspaceutil._FontGlobals.alphaTest + `) discard;`) : '') + 
		`}`;
	},
	loadMaterial: () => {
		let texture = new THREE.TextureLoader().load(altspaceutil._FontGlobals.textureUrl, () => {
			texture.needsUpdate = true;
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;
			texture.anisotropy = altspaceutil._FontGlobals.anisotropy;
		});

		let material = new THREE.ShaderMaterial({ uniforms: altspaceutil._FontGlobals.createShaderUniforms(), fragmentShader: altspaceutil._FontGlobals.createFragmentShader(), vertexShader: altspaceutil._FontGlobals.createVertexShader(), side: THREE.DoubleSide, transparent: true });
		material.uniforms.map.value = texture;
		return material;
	},
	loadFont: () => {
		if(altspaceutil._FontGlobals.font) return Promise.resolve(altspaceutil._FontGlobals.font);

		return new Promise((resolve, reject) => {
			fetch(altspaceutil._FontGlobals.fontUrl).then(response => response.json()).then(font => {
				altspaceutil._FontGlobals.font = font;
				resolve(font);
			});
		})
	}
};

/**
 * The Text behavior displays a text string using an SDF font, supporting line breaks, text alignment and inline formatting tags.
 * e.g. `<color=#FFFFFF>The</color> <color="red">quick <#FFFF00>brown <alpha=#33>fox <color=#FFFFFFFF> jumps over the <noparse><alpha=#DD>lazy</noparse> dog.`
 *
 * Supported Tags
 * `<color=...>Text</color>` Changes the color and opacity of text.
 * `<color=#RRGGBB>` `<color=#RGB>` `<color=#RRGGBBAA>` `<color=#RGBA>` `<#RRGGBB>` `<#RGB>` `<#RRGGBBAA>` `<#RGBA>` `<color="name">` (Supported color names are 'black', 'blue', 'green', 'orange', 'purple', 'red', 'yellow', 'white')
 * `<alpha=#AA>` - Changes the opacity of any text that follows.
 * `<noparse>Text</noparse>` - Prevents formatting tags from being parsed.
 * `<b>Text</b>` - Applies a bold effect to the text.
 * `<i>Text</i>` - Applies an italic effect to the text.
 *
 * @class Text
 * @param {Object} [config] Optional parameters.
 * @param {String} [config.text] The text to be displayed.
 * @param {Number} [config.fontSize=10] The size of the text.
 * @param {Number} [config.width=10] The width of the text block to display before text wrapping occurs.
 * @param {Number} [config.height=1] The height offset of the text block.
 * @param {String} [config.horizontalAlign='middle'] The horizontal alignment of the text block.
 * @param {String} [config.verticalAlign='middle'] The vertical alignment of the text block.
 * @param {Boolean} [config.native=true] Specifies whether a native text (n-text) component will be used when running the app in the Altspace client.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.Text = class {
	get type() { return 'Text'; }

	constructor(config) {
		this.config = Object.assign({ text: '', fontSize: 10, width: 10, height: 1, horizontalAlign: 'middle', verticalAlign: 'middle', native: true }, config);
	}

	awake(o) {
		this.object3d = o;
		this.loading = true;

		altspaceutil.manageBehavior(this, this.object3d);

		if(this.config.native && altspace.inClient) {
			this.nativeComponent = new altspaceutil.behaviors.NativeComponent('n-text', { text: this.config.text, fontSize: this.config.fontSize, width: this.config.width, height: this.config.height, horizontalAlign: this.config.horizontalAlign, verticalAlign: this.config.verticalAlign }, { useCollider: true });
			this.object3d.addBehavior(this.nativeComponent);
		} else {
			Promise.all([altspaceutil._FontGlobals.loadFont(), altspaceutil.loadScript('https://cdn.jsdelivr.net/npm/altspacevr-behaviors@' + altspaceutil.VERSION + '/lib/three-bmfont-text/three-bmfont-text.min.js', { scriptTest: () => window.createGeometry })]).then(() => {
				if(this.loading) {
					this.loading = false;
					this._updateText(true);
				}
			});
		}
	}

	update() {
		if(this.config.native && altspace.inClient && this.nativeComponent) {
			this.nativeComponent.data.text = this.config.text;
			this.nativeComponent.data.fontSize = this.config.fontSize;
			this.nativeComponent.data.width = this.config.width;
			this.nativeComponent.data.height = this.config.height;
			this.nativeComponent.data.horizontalAlign = this.config.horizontalAlign;
			this.nativeComponent.data.verticalAlign = this.config.verticalAlign;
		} else {
			if(this.mesh && (this.text !== this.config.text || this.fontSize !== this.config.fontSize || this.width !== this.config.width || this.height !== this.config.height || this.horizontalAlign !== this.config.horizontalAlign || this.verticalAlign !== this.config.verticalAlign)) {
				this._updateText();
			}
		}
	}

	dispose() {
		if(this.object3d && this.config.native && altspace.inClient) {
			if(this.nativeComponent) this.object3d.removeBehavior(this.nativeComponent);
		} else {
			if(this.loading) this.loading = false; // Prevent race conditions when font is being loaded
			if(this.mesh && this.mesh.parent) this.mesh.parent.remove(this.mesh);
		}
	}

	clone() {
		return new altspaceutil.behaviors.Text(this.config);
	}

	_updateText(init) {
		this.text = this.config.text;
		this.fontSize = this.config.fontSize;
		this.width = this.config.width;
		this.height = this.config.height;
		this.horizontalAlign = this.config.horizontalAlign;
		this.verticalAlign = this.config.verticalAlign;

		this.bmconfig = this._createFontConfig();

		let parsedText = this._parseText();
		this.bmconfig.text = parsedText.text;

		if(init) {
			this.mesh = new THREE.Mesh(createGeometry(this.bmconfig), altspaceutil._FontGlobals.loadMaterial());
			this.object3d.add(this.mesh);
		} else {
			this.mesh.geometry.update(this.bmconfig);
		}

		this.mesh.geometry.computeBoundingBox();
		this._updateTextStyles(parsedText.styles);
		this._updateTextLayout();
	}

	_parseText() {
		let text = this.config.text;
		let parsedText = '';
		let parsedTag = '';
		let skipTag = false;
		let isParsingTag = false;

		let statestack = [];
		let states = [];
		let currentstate = { color: { r: 1, g: 1, b: 1, a: 1 }, tag: 'color' };
		let currentlink = null, isBoldStyle = false, isItalicStyle = false, isStrikethroughStyle = false, isUnderlineStyle = false;
		statestack.push(JSON.parse(JSON.stringify(currentstate))); // Default state should not be removed from stack

		let addState = str => {
			parsedText += str;
			let state = { color: { r: currentstate.color.r, g: currentstate.color.g, b: currentstate.color.b, a: currentstate.color.a } };
			if(isBoldStyle) state.bold = true;
			if(isItalicStyle) state.italic = true;
			if(isStrikethroughStyle) state.strikethrough = true;
			if(isUnderlineStyle) state.underline = true;
			if(currentlink) state.link = currentlink;
			delete state.tag;
			for(let i = 0; i < str.length; ++i) {
				if(!/\s/.test(str.charAt(i))) states.push(state);
			}
		};

		let pushColorState = tag => {
			let state = JSON.parse(JSON.stringify(currentstate));
			state.tag = tag;
			statestack.push(state);
			return state;
		}

		let popColorState = tag => {
			let count = 0;
			while(statestack.length > 1) {
				if(statestack[statestack.length - 1].tag === tag) {
					if(count++ > 0) break;
				}
				statestack.pop();
			}
			currentstate = JSON.parse(JSON.stringify(statestack[statestack.length - 1]));
		}

		let parseColorHex = str => {
			if(/^#[0-9A-F]{8}$/i.test(str)) {
				currentstate.color.r = parseInt(str.substring(1, 3), 16) / 255.0;
				currentstate.color.g = parseInt(str.substring(3, 5), 16) / 255.0;
				currentstate.color.b = parseInt(str.substring(5, 7), 16) / 255.0;
				currentstate.color.a = parseInt(str.substring(7, 9), 16) / 255.0;
				return true;
			} else if(/^#[0-9A-F]{6}$/i.test(str)) {
				currentstate.color.r = parseInt(str.substring(1, 3), 16) / 255.0;
				currentstate.color.g = parseInt(str.substring(3, 5), 16) / 255.0;
				currentstate.color.b = parseInt(str.substring(5, 7), 16) / 255.0;
				currentstate.color.a = 1;
				return true;
			} else if(/^#[0-9A-F]{4}$/i.test(str)) {
				currentstate.color.r = parseInt(str.charAt(1) + str.charAt(1), 16) / 255.0;
				currentstate.color.g = parseInt(str.charAt(2) + str.charAt(2), 16) / 255.0;
				currentstate.color.b = parseInt(str.charAt(3) + str.charAt(3), 16) / 255.0;
				currentstate.color.a = parseInt(str.charAt(4) + str.charAt(4), 16) / 255.0;
				return true;
			} else if(/^#[0-9A-F]{3}$/i.test(str)) {
				currentstate.color.r = parseInt(str.charAt(1) + str.charAt(1), 16) / 255.0;
				currentstate.color.g = parseInt(str.charAt(2) + str.charAt(2), 16) / 255.0;
				currentstate.color.b = parseInt(str.charAt(3) + str.charAt(3), 16) / 255.0;
				currentstate.color.a = 1;
				return true;
			}

			return false;
		};

		let parseColorName = str => {
			switch(str.substring(1, str.length - 1)) {
				case 'black': {
					currentstate.color.r = currentstate.color.g = currentstate.color.b = 0;
					break;
				}
				case 'blue': {
					currentstate.color.r = currentstate.color.g = 0;
					currentstate.color.b = 1;
					break;
				}
				case 'green': {
					currentstate.color.r = currentstate.color.b = 0;
					currentstate.color.g = 1;
					break;
				}
				case 'orange': {
					currentstate.color.r = 1;
					currentstate.color.g = 0.6039215686;
					currentstate.color.b = 0;
					break;
				}
				case 'purple': {
					currentstate.color.r = currentstate.color.b = 1;
					currentstate.color.g = 0;
					break;
				}
				case 'red': {
					currentstate.color.r = 1;
					currentstate.color.g = currentstate.color.b = 0;
					break;
				}
				case 'yellow': {
					currentstate.color.r = currentstate.color.g = 1;
					currentstate.color.g = 1;
					break;
				}
				case 'white':
				default: {
					currentstate.color.r = currentstate.color.g = currentstate.color.b = 1;
					break;
				}
			}
			return true;
		};

		let parseAlphaHex = str => {
			if(/^#[0-9A-F]{2}$/i.test(str)) {
				currentstate.color.a = parseInt(str.substring(1, 3), 16) / 255.0;
				return true;
			}

			return false;
		};

		for(let i = 0; i < text.length;) {
			let c = text.charAt(i);
			++i;

			if(isParsingTag) {
				// Attempt to parse tag
				if(c === '<') {
					// Previous contents isn't a tag, add it to the parsed text and reset.
					addState(parsedTag);
					parsedTag = c;
				} else if(c === '>') {
					// Reached end of tag, tag type and properties can be parsed
					isParsingTag = false;
					parsedTag += c;

					let isEndTag = parsedTag.charAt(1) === '/';
					let [tagType, tagProperty] = parsedTag.substring(isEndTag ? 2 : 1, parsedTag.length - 1).split('=');
					if(tagType.length > 0) {
						if(tagType === 'noparse') {
							skipTag = !isEndTag;
						} else if(skipTag) {
							// Add unparsed/unsupported tag to parsed text
							addState(parsedTag);
						} else if(tagType === 'b') {
							isBoldStyle = !isEndTag;
						} else if(tagType === 'i') {
							isItalicStyle = !isEndTag;
						} else if(tagType === 's') {
							isStrikethroughStyle = !isEndTag;
						} else if(tagType === 'u') {
							isUnderlineStyle = !isEndTag;
						} else if(tagType.charAt(0) === '#' && !tagProperty && !isEndTag) {
							// Hex color code tag
							if(parseColorHex(tagType)) {
								pushColorState('color');
							} else {
								// Invalid hex color code, add to parsed text
								addState(parsedTag);
							}
						} else if(tagType === 'color') {
							if(isEndTag) {
								// Revert to previous color/alpha state
								popColorState('color');
							} else {
								// Hex code/Named color tag
								if(tagProperty && ((tagProperty.length > 1 && tagProperty.charAt(0) === '#' && parseColorHex(tagProperty)) || (tagProperty.length > 2 && tagProperty.charAt(0) === '"' && tagProperty.charAt(tagProperty.length - 1) === '"' && parseColorName(tagProperty)))) {
									pushColorState('color');
								} else {
									// Invalid color tag, add to parsed text
									addState(parsedTag);
								}
							}
						} else if(tagType === 'alpha' && !isEndTag) {
							// Hex alpha tag
							if(tagProperty && tagProperty.length > 1 && tagProperty.charAt(0) === '#' && parseAlphaHex(tagProperty)) {
								pushColorState('alpha');
							} else {
								// Invalid alpha tag, add to parsed text
								addState(parsedTag);
							}
						} else if(tagType === 'link' || tagType.substring(0, tagType.indexOf(' ')).trimEnd() === 'link') {
							if(isEndTag) {
								// Revert to previous link state
								currentlink = null;
							} else {
								// link tag
								if(tagProperty && tagProperty.length > 2 && tagProperty.charAt(0) === '"' && tagProperty.charAt(tagProperty.length - 1) === '"') {
									currentlink = tagProperty.substring(1, tagProperty.length - 1);
								} else {
									// Invalid link, add to parsed text
									addState(parsedTag);
								}
							}
						} else {
							// Invalid tag type, add to parsed text
							addState(parsedTag);
						}
					} else {
						// Empty tags are invalid, add to parsed text
						addState(parsedTag);
					}
				} else {
					parsedTag += c;
				}
			} else {
				// Attempt to parse text
				if(c === '<') {
					// Start parsing tag
					isParsingTag = true;
					parsedTag = c;
				} else {
					// Contiue parsing text
					addState(c);
				}
			}
		}

		return { text: parsedText, styles: states };
	}

	_updateTextStyles(styles) {
		let color = new Float32Array(this.mesh.geometry.attributes.position.count * 4);
		for(let i = 0; i < color.length;) {
			let style = styles[Math.floor(i / 16)].color;
			for(let j = 0; j < 4; ++j) {
				color[i++] = style.r;
				color[i++] = style.g;
				color[i++] = style.b;
				color[i++] = style.a;
			}
		}
		this.mesh.geometry.addAttribute('color', new THREE.BufferAttribute(color, 4));

		let bold = new Float32Array(this.mesh.geometry.attributes.position.count);
		for(let i = 0; i < bold.length;) {
			let value = styles[Math.floor(i / 4)].bold ? altspaceutil._FontGlobals.boldStrength : altspaceutil._FontGlobals.fontStrength;
			for(let j = 0; j < 4; ++j) bold[i++] = value;
		}
		this.mesh.geometry.addAttribute('bold', new THREE.BufferAttribute(bold, 1));

		let positions = this.mesh.geometry.attributes.position.array;
		for(let i = 0; i < positions.length; i += 8) {
			if(styles[Math.floor(i / 8)].italic) {
				positions[i] += altspaceutil._FontGlobals.italicOffset; // Bottom Left
				positions[i + 2] -= altspaceutil._FontGlobals.italicOffset; // Top Left
				positions[i + 4] -= altspaceutil._FontGlobals.italicOffset; // Right Right
				positions[i + 6] += altspaceutil._FontGlobals.italicOffset; // Bottom Right
			}
		}
		this.mesh.geometry.attributes.position.needsUpdate = true;
	}

	_updateTextLayout() {
		this.mesh.position.x = -this.mesh.geometry.layout.width / 2;
		this.mesh.position.z = 0;
		switch(this.config.verticalAlign) {
			case 'top': {
				this.mesh.position.y = this.mesh.geometry.boundingBox.min.y + this.bmconfig.height;
				break;
			}

			case 'bottom': {
				this.mesh.position.y = this.mesh.geometry.boundingBox.max.y - this.bmconfig.height;
				break;
			}

			case 'middle':
			default: {
				this.mesh.position.y = (this.mesh.geometry.boundingBox.max.y + this.mesh.geometry.boundingBox.min.y) / 2;
				break;
			}
		}
		this.mesh.position.multiplyScalar(this.bmconfig.scale);
		this.mesh.rotation.x = Math.PI;
		this.mesh.scale.setScalar(this.bmconfig.scale);
	}

	_createFontConfig() {
		return { text: this.config.text, width: altspaceutil._FontGlobals.width * this.config.width * (1 / this.config.fontSize), height: altspaceutil._FontGlobals.height * this.config.height * (1 / this.config.fontSize), align: this.config.horizontalAlign !== 'middle' ? this.config.horizontalAlign : 'center', font: altspaceutil._FontGlobals.font, lineHeight: altspaceutil._FontGlobals.lineHeight, letterSpacing: altspaceutil._FontGlobals.letterSpacing, tabSize: altspaceutil._FontGlobals.tabSize, scale: altspaceutil._FontGlobals.scale * this.config.fontSize, trimWhitespace: false };
	}
}
/**
 * The GLTF behavior loads and displays a glTF model asset.
 *
 * @class GLTF
 * @param {Object} [config] Optional parameters.
 * @param {String} [config.url] A URL to the GLTF model file to be loaded.
 * @param {Number} [config.sceneIndex=0] Specifies the scene to load when the GLTF model contains multiple scenes.
 * @param {Boolean} [config.native=true] Specifies whether a native glTF (n-gltf) component will be used when running the app in the Altspace client.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.GLTF = class {
	get type() { return 'GLTF'; }

	constructor(config) {
		this.config = Object.assign({ url: '', sceneIndex: 0, native: true }, config);
		this.config.url = altspaceutil.getAbsoluteURL(this.config.url);
		this.url = this.config.url;
		this.sceneIndex = this.config.sceneIndex;
		this.loading = false;
		this.loaded = false;
	}

	awake(o, s) {
		this.object3d = o;

		altspaceutil.manageBehavior(this, this.object3d);

		if(this.config.native && altspace.inClient) {
			this.nativeComponent = new altspaceutil.behaviors.NativeComponent('n-gltf', { url: this.config.url, sceneIndex: this.config.sceneIndex }, { useCollider: true });
			this.object3d.addEventListener('n-gltf-loaded', () => {
				this.loaded = this.nativeComponent.getAttribute('loaded');
				this.object3d.dispatchEvent({
					type: 'gltf-loaded',
					bubbles: true,
					target: this.object3d
				});
			});
			this.object3d.addBehavior(this.nativeComponent);
		} else {
			this.inverseWorldTransform = new THREE.Matrix4();
			this._loadMesh();
		}
	}

	update() {
		this.config.url = altspaceutil.getAbsoluteURL(this.config.url);

		if(this.config.native && altspace.inClient) {
			this.loaded = this.nativeComponent.getAttribute('loaded');
			this.nativeComponent.data.url = this.config.url;
			this.nativeComponent.data.sceneIndex = this.config.sceneIndex;
		} else {
			if((this.config.url !== this.url || this.config.sceneIndex !== this.sceneIndex) && !this.loading) this._loadMesh();
		}
	}

	getBoundingBox() {
		if(this.config.native && altspace.inClient && this.nativeComponent) return this.nativeComponent.callComponentFunc('GetBoundingBox');
		if(!this.mesh || !this.loaded) return Promise.reject();

		this.object3d.updateMatrixWorld(true);
		this.inverseWorldTransform.getInverse(this.object3d.matrixWorld);
		this.mesh.applyMatrix(this.inverseWorldTransform);

		let bbox = new THREE.Box3().setFromObject(this.mesh);

		this.inverseWorldTransform.getInverse(this.inverseWorldTransform);
		this.mesh.applyMatrix(this.inverseWorldTransform);

		return Promise.resolve(bbox);
	}

	_loadMesh() {
		this.loaded = false;
		if(this.mesh) {
			this.object3d.remove(this.mesh);
			this.mesh = null;
		}
		this.loading = true;
		this.url = this.config.url;
		this.sceneIndex = this.config.sceneIndex;
		altspaceutil.loadAsset(this.url, { native: false, sceneIndex: this.sceneIndex || 0 }).then(asset => {
			if(this.loading && !this.mesh) {
				this.mesh = asset;
				this.object3d.add(this.mesh);
				this.loaded = true;
				this.loading = false;
				this.object3d.dispatchEvent({
					type: 'gltf-loaded',
					bubbles: true,
					target: this.object3d
				});
			}
		});
	}

	dispose() {
		if(this.object3d && this.config.native && altspace.inClient) {
			if(this.nativeComponent) this.object3d.removeBehavior(this.nativeComponent);
		} else {
			this.mesh = null;
			this.loaded = false;
			this.loading = false;
			this.url = null;
			this.sceneIndex = null;
		}
	}

	clone() {
		return new altspaceutil.behaviors.GLTF(this.config);
	}
}
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
/**
 * The OrbitControls behavior provides a convenience wrapper for loading
 * and updating THREE.OrbitControls.
 *
 * @class OrbitControls
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.OrbitControls = function() {
	this.type = 'OrbitControls';

	this.awake = function(o) {
		if(!altspace.inClient) this.controls = new THREE.OrbitControls(o);
		altspaceutil.manageBehavior(this, o);
	}

	this.update = function(deltaTime) {
		if(!altspace.inClient) this.controls.update();
	}

	this.dispose = function() {
		this.controls = null;
	}
}
/**
 * An identifier that represents the user's avatar type preference.
 * @typedef {String} module:altspaceutil/behaviors.UserEvents~AvatarId
 **/

/**
 * The UserEvents behavior dispatches events which have been triggered by a given user
 * changing their avatar and/or account preferences.
 *
 * @class UserEvents
 * @param {Object} [config] Optional parameters.
 * @param {String[]} [config.userIds=null] An array of User IDs for each user to dispatch events for.
 * When omitted, only events for the user currently logged in will be handled.
 * @param {onRequestData} [config.onRequestData=null] A precondition callback returning a boolean that
 * determines if a user should have their data requested.  User data is requested if the callback
 * returns true, otherwise no action is taken.
 * @param {Number} [config.refreshTime=5000] Duration to wait between user updates, in milliseconds.
 * @param {Boolean} [config.trace=false] Specifies whether debugging information should be displayed.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.UserEvents = function(config) {
	this.config = Object.assign({ subscribeSelfServerEvents: false, onRequestData: null, refreshTime: 5000, trace: false, userIds: [] }, config);
	this.type = 'UserEvents';

	this.awake = function(o) {
		this.object3d = o;
		this.time = 0;
		this.loading = false;
		this.users = {};
		this.userIds = this.config.userIds.constructor === Array ? this.config.userIds : [this.config.userIds];

		altspaceutil.manageBehavior(this, this.object3d);

		this.dataRequest = new THREE.FileLoader();
		this.dataRequest.setWithCredentials(true);

		if(this.userIds.length <= 0) {
			var self = this;
			altspace.getUser().then(function(user) {
				self.selfUserId = user.legacyUserId ? user.legacyUserId : user.userId;
				self.updateUserAvatarInfo(user.avatarInfo);
				user.addEventListener('avatarchange', self.onUpdateUserAvatarInfo.bind(self));

				if(self.config.subscribeSelfServerEvents) {
					self.userIds.push(user.legacyUserId ? user.legacyUserId : user.userId);
					self.requestUserData();
				}
			});
		} else {
			this.requestUserData();
		}
	}

	this.onUpdateUserAvatarInfo = function(event) {
		this.updateUserAvatarInfo(event.data);
	}

	this.updateUserAvatarInfo = function(avatarInfo) {
		function convertRawAvatarColor(color) {
			if(color) {
				var rgb = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
				if(rgb) return [rgb[1], rgb[2], rgb[3]];
			}
			return color;
		}

		var primaryColor = convertRawAvatarColor(avatarInfo.primaryColor);
		var highlightColor = convertRawAvatarColor(avatarInfo.highlightColor);

		var userId = this.selfUserId;
		var user = this.users[userId] || { userId: userId };
		this.users[userId] = user;

		var oldAvatarId = user.avatarId;
		user.avatarId = avatarInfo.sid || null;

		var oldRawAvatarColors = user.rawAvatarColors;
		var oldAvatarTextures = user.avatarTextures;
		var avatarAppearanceChanged = (user.avatarId !== oldAvatarId);
		var avatarClass;

		user.avatarColors = {};
		user.rawAvatarColors = {};
		user.avatarTextures = {};

		switch(user.avatarId) {
			// Rubenoid Avatars
			case 'rubenoid-male-01':
			case 'rubenoid-female-01': {
				avatarClass = 'Rubenoid';

				if(avatarInfo.textures[0]) user.avatarTextures['hair'] = avatarInfo.textures[0];
				if(avatarInfo.textures[1]) user.avatarTextures['skin'] = avatarInfo.textures[1];
				if(avatarInfo.textures[2]) user.avatarTextures['clothing'] = avatarInfo.textures[2];

				if(!avatarAppearanceChanged) avatarAppearanceChanged = (oldAvatarTextures['hair'] !== user.avatarTextures['hair'] || oldAvatarTextures['skin'] !== user.avatarTextures['skin'] || oldAvatarTextures['clothing'] !== user.avatarTextures['clothing']);
				break;
			}

			// Robothead Avatars
			case 'robothead-roundguy-01':
			case 'robothead-propellerhead-01': {
				avatarClass = 'Robothead';

				if(highlightColor) {
					user.avatarColors['highlight'] = this.getAvatarColor(highlightColor);
					user.rawAvatarColors['highlight'] = highlightColor;
				}

				if(!avatarAppearanceChanged) avatarAppearanceChanged = (!oldRawAvatarColors['highlight'] || JSON.stringify(oldRawAvatarColors['highlight']) !== JSON.stringify(user.rawAvatarColors['highlight']));
				break;
			}

			// Pod Avatars
			case 'a-series-m01':
			case 'pod-classic':
			case 's-series-f01':
			case 's-series-m01':
			case 'x-series-m01':
			case 'x-series-m02': {
				avatarClass = 'Pod';

				if(primaryColor) {
					user.avatarColors['primary'] = this.getAvatarColor(primaryColor);
					user.rawAvatarColors['primary'] = primaryColor;
				}

				if(highlightColor) {
					user.avatarColors['highlight'] = this.getAvatarColor(highlightColor);
					user.rawAvatarColors['highlight'] = highlightColor;
				}

				if(!avatarAppearanceChanged) avatarAppearanceChanged = (!oldRawAvatarColors['primary'] || !oldRawAvatarColors['highlight'] || JSON.stringify(oldRawAvatarColors['primary']) !== JSON.stringify(user.rawAvatarColors['primary']) || JSON.stringify(oldRawAvatarColors['highlight']) !== JSON.stringify(user.rawAvatarColors['highlight']));
				break;
			}

			default: {
				avatarClass = '';
				if(this.config.trace) console.log('Unknown avatar type: ' + user.avatarId);
				break;
			}
		}

		if(avatarAppearanceChanged) {
			/**
			* Fires an event when the user changes avatar preferences.
			*
			* @event avatarchange
			* @property {String} userId User ID of the user.
			* @property {AvatarId} avatarId Avatar type identifier that was selected by the user.
			* @property {String} avatarClass Avatar type classification. Typically one of 'Pod',
			* 'Robothead' or 'Rubenoid', or empty when unclassified.
			* @property {Object} colors {@link THREE.Color} preferences of the avatar.  This typically provides
			* 'primary' and 'highlight' properties for Pod avatars, and 'highlight' for Robothead avatars.
			* @property {Object} rawColors Raw color preferences of the avatar.  This typically provides
			* 'primary' and 'highlight' properties for Pod avatars, and 'highlight' for Robothead avatars.
			* @property {Object} textures Texture identifier preferences for the avatar.  This typically provides
			* 'hair', 'skin' and 'clothing' properties for Rubenoid avatars.
			* @property {THREE.Object3D} target - The object which emitted the event.
			* @memberof module:altspaceutil/behaviors.UserEvents
			*/
			var self = this;
			this.object3d.dispatchEvent({
				type: 'avatarchange',
				detail: {
					userId: user.userId,
					avatarId: user.avatarId,
					avatarClass: avatarClass,
					colors: user.avatarColors,
					rawColors: user.rawAvatarColors,
					textures: user.avatarTextures
				},
				bubbles: true,
				target: self.object3d
			});
		}
	}

	this.update = function(deltaTime) {
		if(!this.loading && this.userIds.length > 0) {
			this.time -= deltaTime;
			if(this.time <= 0) this.requestUserData();
		}
	}

	this.onLoaded = function(obj) {
		if(!this.loading) return;

		var json = JSON.parse(obj);
		var self = this;

		for(var jsonuser of json.users) {
			if(jsonuser && jsonuser.user_id) {
				var userId = jsonuser.user_id;

				var user = this.users[userId] || { userId: userId };
				this.users[userId] = user;

				var oldUsername = user.username;
				user.username = jsonuser.username || null;

				var oldDisplayName = user.displayName;
				user.displayName = jsonuser.display_name || null;

				var oldOnline = user.online;
				user.online = jsonuser.online || false;

				var jsonavatar = jsonuser.user_avatar.config.avatar;

				var oldAvatarId = user.avatarId;
				user.avatarId = jsonavatar.avatar_sid || null;

				var oldRawAvatarColors = user.rawAvatarColors;
				var oldAvatarTextures = user.avatarTextures;
				var avatarAppearanceChanged = (user.avatarId !== oldAvatarId);
				var avatarClass;

				user.avatarColors = {};
				user.rawAvatarColors = {};
				user.avatarTextures = {};

				switch(user.avatarId) {
					// Rubenoid Avatars
					case 'rubenoid-male-01':
					case 'rubenoid-female-01': {
						avatarClass = 'Rubenoid';

						var texturePrefix = (user.avatarId === 'rubenoid-male-01') ? 'rubenoid-male-texture-' : 'rubenoid-female-texture-';
						if(jsonavatar[texturePrefix + '1'][0]) user.avatarTextures['hair'] = jsonavatar[texturePrefix + '1'][0];
						if(jsonavatar[texturePrefix + '2'][0]) user.avatarTextures['skin'] = jsonavatar[texturePrefix + '2'][0];
						if(jsonavatar[texturePrefix + '3'][0]) user.avatarTextures['clothing'] = jsonavatar[texturePrefix + '3'][0];

						if(!avatarAppearanceChanged) avatarAppearanceChanged = (oldAvatarTextures['hair'] !== user.avatarTextures['hair'] || oldAvatarTextures['skin'] !== user.avatarTextures['skin'] || oldAvatarTextures['clothing'] !== user.avatarTextures['clothing']);
						break;
					}

					// Robothead Avatars
					case 'robothead-roundguy-01':
					case 'robothead-propellerhead-01': {
						avatarClass = 'Robothead';

						if(jsonavatar['robothead-highlight-color']) {
							user.avatarColors['highlight'] = this.getAvatarColor(jsonavatar['robothead-highlight-color']);
							user.rawAvatarColors['highlight'] = jsonavatar['robothead-highlight-color'];
						}

						if(!avatarAppearanceChanged) avatarAppearanceChanged = (!oldRawAvatarColors['highlight'] || JSON.stringify(oldRawAvatarColors['highlight']) !== JSON.stringify(user.rawAvatarColors['highlight']));
						break;
					}

					// Pod Avatars
					case 'a-series-m01':
					case 'pod-classic':
					case 's-series-f01':
					case 's-series-m01':
					case 'x-series-m01':
					case 'x-series-m02': {
						avatarClass = 'Pod';

						if(jsonavatar['primary-color']) {
							user.avatarColors['primary'] = this.getAvatarColor(jsonavatar['primary-color']);
							user.rawAvatarColors['primary'] = jsonavatar['primary-color'];
						}

						if(jsonavatar['highlight-color']) {
							user.avatarColors['highlight'] = this.getAvatarColor(jsonavatar['highlight-color']);
							user.rawAvatarColors['highlight'] = jsonavatar['highlight-color'];
						}

						if(!avatarAppearanceChanged) avatarAppearanceChanged = (!oldRawAvatarColors['primary'] || !oldRawAvatarColors['highlight'] || JSON.stringify(oldRawAvatarColors['primary']) !== JSON.stringify(user.rawAvatarColors['primary']) || JSON.stringify(oldRawAvatarColors['highlight']) !== JSON.stringify(user.rawAvatarColors['highlight']));
						break;
					}

					default: {
						avatarClass = '';
						if(this.config.trace) console.log('Unknown avatar type: ' + user.avatarId);
						break;
					}
				}

				if(user.username !== oldUsername || user.displayName !== oldDisplayName) {
					/**
					* Fires an event when the user changes account preferences.
					*
					* @event userchange
					* @property {String} userId User ID of the user.
					* @property {String} username Username of the user.
					* @property {String} displayName Display name of the user.
					* @property {THREE.Object3D} target - The object which emitted the event.
					* @memberof module:altspaceutil/behaviors.UserEvents
					*/
					this.object3d.dispatchEvent({
						type: 'userchange',
						detail: {
							userId: user.userId,
							username: user.username,
							displayName: user.displayName
						},
						bubbles: true,
						target: self.object3d
					});
				}

				if(avatarAppearanceChanged) {
					/**
					* Fires an event when the user changes avatar preferences.
					*
					* @event avatarchange
					* @property {String} userId User ID of the user.
					* @property {AvatarId} avatarId Avatar type identifier that was selected by the user.
					* @property {String} avatarClass Avatar type classification. Typically one of 'Pod',
					* 'Robothead' or 'Rubenoid', or empty when unclassified.
					* @property {Object} colors {@link THREE.Color} preferences of the avatar.  This typically provides
					* 'primary' and 'highlight' properties for Pod avatars, and 'highlight' for Robothead avatars.
					* @property {Object} rawColors Raw color preferences of the avatar.  This typically provides
					* 'primary' and 'highlight' properties for Pod avatars, and 'highlight' for Robothead avatars.
					* @property {Object} textures Texture identifier preferences for the avatar.  This typically provides
					* 'hair', 'skin' and 'clothing' properties for Rubenoid avatars.
					* @property {THREE.Object3D} target - The object which emitted the event.
					* @memberof module:altspaceutil/behaviors.UserEvents
					*/
					this.object3d.dispatchEvent({
						type: 'avatarchange',
						detail: {
							userId: user.userId,
							avatarId: user.avatarId,
							avatarClass: avatarClass,
							colors: user.avatarColors,
							rawColors: user.rawAvatarColors,
							textures: user.avatarTextures
						},
						bubbles: true,
						target: self.object3d
					});
				}

				if(user.online !== oldOnline) {
					/**
					* Fires an event when the user's connection status changes.
					*
					* @event avatarstatus
					* @property {String} userId User ID of the user.
					* @property {String} displayName Display name of the user.
					* @property {Boolean} online Specifies whether user is currently logged in.
					* @property {THREE.Object3D} target - The object which emitted the event.
					* @memberof module:altspaceutil/behaviors.UserEvents
					*/
					this.object3d.dispatchEvent({
						type: 'avatarstatus',
						detail: {
							userId: user.userId,
							displayName: user.displayName,
							online: (user.online ? true : false)
						},
						bubbles: true,
						target: self.object3d
					});
				}
			}
		}

		this.loading = false;
	}

	this.onError = function(xhr) {
		if(this.loading) {
			if(this.config.trace) {
				var url = xhr.target.responseURL || '';
				console.log('Error loading avatar data ' + url);
			}

			this.loading = false;
		}
	}

	/**
	* Subscribe to receiving events for a given User ID.
	*
	* @method subscribeUser
	* @param {String} userId - User ID to receive events for.
	* @memberof module:altspaceutil/behaviors.UserEvents
	*/
	this.subscribeUser = function(userId) {
		var index = this.userIds.indexOf(userId);
		if(index === -1) this.userIds.push(userId);
	}

	/**
	* Unsubscribe from receiving events for a given User ID.
	*
	* @method unsubscribeUser
	* @param {String} userId - User ID to stop receiving events for.
	* @memberof module:altspaceutil/behaviors.UserEvents
	*/
	this.unsubscribeUser = function(userId) {
		var index = this.userIds.indexOf(userId);
		if(index >= 0) this.userIds.splice(index, 1);
	}

	this.requestUserData = function() {
		if(!this.dataRequest || this.loading || this.userIds.length <= 0) return;

		var requestUserIds = [];
		for(var userId of this.userIds) {
			/**
			* A precondition callback returning a boolean that determines if a user should have their data requested.
			* User data is requested if the callback returns true, otherwise no action is taken.
			* @callback onRequestData
			* @param {String} userId User ID of a user who will have their data requested.
			* @param {THREE.Object3D} object The object that will emit the request.
			* @memberof module:altspaceutil/behaviors.UserEvents
			*/
			if(!this.config.onRequestData || this.config.onRequestData.call(this, userId, this.object3d)) requestUserIds.push(userId);
		}

		if(requestUserIds.length > 0) {
			// Authenticates Using Positron Session Exposed By AltspaceSDK
			// https://account.altvr.com/api/v1/users/<userid1>,<userid2>,...
			this.dataRequest.load('https://account.altvr.com/api/v1/users/' + requestUserIds.join(), this.onLoaded.bind(this), undefined, this.onError.bind(this));

			this.time = this.config.refreshTime;
			this.loading = true;
		}
	}

	this.getAvatarColor = function(color) {
		function getColorFromRGB(r, g, b) {
			// Normalize color values
			var maxColor = Math.max(r, g, b);
			if(maxColor > 255) {
				r = Math.floor(r / maxColor * 255);
				g = Math.floor(g / maxColor * 255);
				b = Math.floor(b / maxColor * 255);
			}

			return new THREE.Color(r / 255, g / 255, b / 255);
		}

		function getColorFromName(color) {
			var colorRGB = {
				'black': { r: 0.1, g: 0.1, b: 0.1 },
				'darkgrey': { r: 0.3, g: 0.3, b: 0.3 },
				'grey': { r: 0.75, g: 0.75, b: 0.75 },
				'white': { r: 1.0, g: 1.0, b: 1.0 }
			};

			color = (color in colorRGB) ? color : 'white';
			return new THREE.Color(colorRGB[color].r, colorRGB[color].g, colorRGB[color].b);
		}

		if(typeof(color) === 'string') {
			var rgb = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
			if(rgb) return getColorFromRGB(rgb[1], rgb[2], rgb[3]);
			return getColorFromName(color);
		} else if(color.constructor === Array && color.length === 1 && typeof(color[0]) === 'string') {
			var rgb = color[0].match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
			if(rgb) return getColorFromRGB(rgb[1], rgb[2], rgb[3]);
			return getColorFromName(color[0]);
		}

		return getColorFromRGB(color[0], color[1], color[2]);
	}

	this.dispose = function() {
		this.dataRequest = null;
		this.object3d = null;
		this.time = 0;
		this.loading = false;
		this.users = {};
	}

	this.clone = function() {
		return new altspaceutil.behaviors.UserEvents(this.config);
	}
}
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
}/**
 * The TransformControls behavior enables an object's position, rotation and scale to be manipulated
 * in AltspaceVR with a draggable transform gizmo.
 *
 * @class TransformControls
 * @param {Object} [config] Optional parameters.
 * @param {String} [config.controlType=none] The default control type to be selected.  Supported control types are 'none', 'position', 'rotate' or 'scale'.
 * @param {Boolean} [config.showButtons=false] Specifies whether buttons should be displayed to toggle between control types.
 * @param {Boolean} [config.followTarget=true] Specified whether the transform gizmo should follow the object that is being manipulated.
 * @param {THREE.Object3D} [config.target=null] The target that the transform gizmo should manipulate when interacted with.  If omitted, the object that the 
 * behavior is associated with will be used as the target.
 * @param {Number} [config.scale=1] Adjusts the scale of the transform gizmo.
 * @param {Boolean} [config.allowNegativeScale=false] Specifies whether the scale transform gizmo will allow the target's scale to be negative.
 * @param {Object} [config.positionAxisLock] Specifies which axes of the position gizmo can be displayed and manipulated.
 * @param {Boolean} [config.positionAxisLock.x=true] X axis of the position gizmo.
 * @param {Boolean} [config.positionAxisLock.y=true] Y axis of the position gizmo.
 * @param {Boolean} [config.positionAxisLock.z=true] Z axis of the position gizmo.
 * @param {Object} [config.rotateAxisLock] Specifies which axes of the rotate gizmo can be displayed and manipulated.
 * @param {Boolean} [config.rotateAxisLock.x=true] X axis of the rotate gizmo.
 * @param {Boolean} [config.rotateAxisLock.y=true] Y axis of the rotate gizmo.
 * @param {Boolean} [config.rotateAxisLock.z=true] Z axis of the rotate gizmo.
 * @param {Object} [config.scaleAxisLock] Specifies which axes of the scale gizmo can be displayed and manipulated.
 * @param {Boolean} [config.scaleAxisLock.x=true] X axis of the scale gizmo.
 * @param {Boolean} [config.scaleAxisLock.y=true] Y axis of the scale gizmo.
 * @param {Boolean} [config.scaleAxisLock.z=true] Z axis of the scale gizmo.
 * @param {Boolean} [config.disableColliders=true] Specifies whether colliders on the target object should be disabled.
 * @param {Boolean} [config.disableChildColliders=true] Specifies whether colliders on the target's children should be disabled.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.TransformControls = function(_config) {
	this.type = 'TransformControls';
	this.config = Object.assign({ controlType: 'none', showButtons: false, followTarget: true, target: null, scale: 1, allowNegativeScale: false, disableColliders: true, disableChildColliders: true }, _config);
	this.config.positionAxisLock = Object.assign({ x: true, y: true, z: true }, this.config.positionAxisLock);
	this.config.rotateAxisLock = Object.assign({ x: true, y: true, z: true }, this.config.rotateAxisLock);
	this.config.scaleAxisLock = Object.assign({ x: true, y: true, z: true }, this.config.scaleAxisLock);

	this.awake = function(o, s) {
		this.object3d = o;
		this.scene = s;
		this.target = this.config.target || this.object3d;

		if(!altspaceutil.behaviors.TransformControls.Materials) {
			altspaceutil.behaviors.TransformControls.Materials = {
				'red': new THREE.MeshBasicMaterial({ color: 0xFF0000 }),
				'green': new THREE.MeshBasicMaterial({ color: 0x00FF00 }),
				'blue': new THREE.MeshBasicMaterial({ color: 0x0000FF }),
				'yellow': new THREE.MeshBasicMaterial({ color: 0xFFFF00 }),
				'orange': new THREE.MeshBasicMaterial({ color: 0xFFCC00 }),
				'hidden': new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false }),
				'red-transclucent': new THREE.MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.2 }),
				'green-transclucent': new THREE.MeshBasicMaterial({ color: 0x00FF00, transparent: true, opacity: 0.2 }),
				'blue-transclucent': new THREE.MeshBasicMaterial({ color: 0x0000FF, transparent: true, opacity: 0.2 })
			};
		}

		if(!altspaceutil.behaviors.TransformControls.Geometries) {
			altspaceutil.behaviors.TransformControls.Geometries = {
				'button': new THREE.BoxBufferGeometry(0.2, 0.2, 0.2),
				'intersector': new THREE.PlaneBufferGeometry(100000, 100000)
			};
		}

		altspaceutil.manageBehavior(this, this.object3d);

		this.objectState = {};
		this.controls = { none: null, position: new THREE.Group(), rotate: new THREE.Group(), scale: new THREE.Group() };
		this.selectedControlType = this.config.controlType;
		this.selectedControl = null;
		this.controlTypeButtons = null;

		this.scene.addEventListener('cursormove', (function(event) {
			if(!this.selectedControl) {
				if(this.hoveredAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(child instanceof THREE.Mesh && child.userData.material) {
							child.material = child.userData.material;
							delete child.userData.material;
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
					this.hoveredAxis = null;
				}
				return;
			}

			this.raycaster.set(event.ray.origin, event.ray.direction);
			var intersection = this.raycaster.intersectObject(this.selectedControl, true)[0];

			// Remove Previous Hover Effects
			if(this.hoveredAxis && (!intersection || this.hoveredAxis !== intersection.object)) {
				if(!this.dragAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(child instanceof THREE.Mesh && child.userData.material) {
							child.material = child.userData.material;
							delete child.userData.material;
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}
				this.hoveredAxis = null;
			}

			if(intersection) {
				this.hoveredAxis = intersection.object;
				if(!this.dragAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(child instanceof THREE.Mesh && !child.userData.material && child.material.visible) {
							child.userData.material = child.material;
							child.material = altspaceutil.behaviors.TransformControls.Materials['orange'];
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}
			}
		}).bind(this));

		var createAxisOrigin = (function(name, color, size, lock) {
			return Object.assign(lock ? new THREE.Mesh(new THREE.BoxBufferGeometry(size.width, size.height, size.depth), altspaceutil.behaviors.TransformControls.Materials[color]) : new THREE.Group(), { name: name });
		}).bind(this);

		var createPositionAxis = (function(name, color, size, position, rotation, lock) {
			if(!lock) return Object.assign(new THREE.Object3D(), { name: name });

			if(altspaceutil.behaviors.TransformControls.Geometries['axis-position-' + name]) {
				var axis = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['axis-position-' + name].clone(), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
				axis.position.set(position.x, position.y, position.z);
				axis.rotation.set(rotation.x, rotation.y, rotation.z);

				return axis;
			}

			var axis = Object.assign(new THREE.Mesh(new THREE.BoxGeometry(size.width, size.height, size.depth), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
			axis.position.set(position.x, position.y, position.z);
			axis.rotation.set(rotation.x, rotation.y, rotation.z);

			var axisEnd = new THREE.Object3D();
			axisEnd.position.set(size.width / 2, 0, 0);
			axisEnd.rotation.set(0, 0, -Math.PI / 2);
			axisEnd.updateMatrix();

			var axisEndGeometry = new THREE.CylinderGeometry(0, size.depth * 2, size.depth * 4, 4, 1, false, Math.PI / 4);
			axisEndGeometry.applyMatrix(axisEnd.matrix);

			axis.geometry.merge(axisEndGeometry);
			axis.geometry = new THREE.BufferGeometry().fromGeometry(axis.geometry);

			altspaceutil.behaviors.TransformControls.Geometries['axis-position-' + name] = axis.geometry;

			return axis;
		}).bind(this);

		var createRotateAxis = (function(name, color, size, rotation, lock) {
			if(!lock) return Object.assign(new THREE.Object3D(), { name: name });

			if(!altspaceutil.behaviors.TransformControls.Geometries['axis-rotate-' + name]) altspaceutil.behaviors.TransformControls.Geometries['axis-rotate-' + name] = new THREE.RingBufferGeometry(size.radius * 0.8, size.radius * 1.5, 10, 1);

			var axis = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['axis-rotate-' + name], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: name });
			axis.rotation.set(rotation.x, rotation.y, rotation.z);
			var axisGizmo = Object.assign(new THREE.Mesh(new THREE.TorusBufferGeometry(size.radius, size.tube, size.radialSegments, size.tubularSegments), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
			axis.add(axisGizmo);
			return axis;
		}).bind(this);

		var createScaleAxis = (function(name, color, size, position, rotation, lock) {
			if(!lock) return Object.assign(new THREE.Object3D(), { name: name });

			if(altspaceutil.behaviors.TransformControls.Geometries['axis-scale-' + name]) {
				var axis = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['axis-scale-' + name].clone(), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
				axis.position.set(position.x, position.y, position.z);
				axis.rotation.set(rotation.x, rotation.y, rotation.z);

				return axis;
			}

			var axis = Object.assign(new THREE.Mesh(new THREE.BoxGeometry(size.width, size.height, size.depth), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
			axis.position.set(position.x, position.y, position.z);
			axis.rotation.set(rotation.x, rotation.y, rotation.z);

			var axisEnd = new THREE.Object3D();
			axisEnd.position.set(size.width / 2, 0, 0);
			axisEnd.rotation.set(0, 0, -Math.PI / 2);
			axisEnd.updateMatrix();

			var axisEndGeometry = new THREE.BoxGeometry(size.depth * 2, size.depth * 2, size.depth * 2);
			axisEndGeometry.applyMatrix(axisEnd.matrix);

			axis.geometry.merge(axisEndGeometry);
			axis.geometry = new THREE.BufferGeometry().fromGeometry(axis.geometry);

			altspaceutil.behaviors.TransformControls.Geometries['axis-scale-' + name] = axis.geometry;

			return axis;
		}).bind(this);

		// Position
		this.controls.position.name = 'position';
		this.controls.position.add(
			createAxisOrigin('xyz', 'yellow', { width: 0.15, height: 0.15, depth: 0.15 }, this.config.positionAxisLock.x || this.config.positionAxisLock.y || this.config.positionAxisLock.z).add(
				createPositionAxis('x', 'red', { width: 1, height: 0.05, depth: 0.05 }, { x: 0.5, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, this.config.positionAxisLock.x),
				createPositionAxis('y', 'green', { width: 1, height: 0.05, depth: 0.05 }, { x: 0, y: 0.5, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, this.config.positionAxisLock.y),
				createPositionAxis('z', 'blue', { width: 1, height: 0.05, depth: 0.05 }, { x: 0, y: 0, z: 0.5 }, { x: Math.PI / 2, y: 0, z: Math.PI / 2 }, this.config.positionAxisLock.z)
			)
		);

		// Rotate
		this.controls.rotate.name = 'rotate';
		this.controls.rotate.add(
			createAxisOrigin('xyz', 'yellow', { width: 0.05, height: 0.05, depth: 0.05 }, this.config.rotateAxisLock.x || this.config.rotateAxisLock.y || this.config.rotateAxisLock.z).add(
				createRotateAxis('x', 'red', { radius: 0.7, tube: 0.03, radialSegments: 8, tubularSegments: 28 }, { x: 0, y: Math.PI / 2, z: 0 }, this.config.rotateAxisLock.x),
				createRotateAxis('y', 'green', { radius: 0.7, tube: 0.03, radialSegments: 8, tubularSegments: 28 }, { x: Math.PI / 2, y: 0, z: 0 }, this.config.rotateAxisLock.y),
				createRotateAxis('z', 'blue',{ radius: 0.7, tube: 0.03, radialSegments: 8, tubularSegments: 28 }, { x: 0, y: 0, z: 0 }, this.config.rotateAxisLock.z)
			)
		);

		// Scale
		this.controls.scale.name = 'scale';
		this.controls.scale.add(
			createAxisOrigin('xyz', 'yellow', { width: 0.15, height: 0.15, depth: 0.15 }, this.config.scaleAxisLock.x || this.config.scaleAxisLock.y || this.config.scaleAxisLock.z).add(
				createScaleAxis('x', 'red', { width: 1, height: 0.05, depth: 0.05 }, { x: 0.5, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, this.config.scaleAxisLock.x),
				createScaleAxis('y', 'green', { width: 1, height: 0.05, depth: 0.05 }, { x:0, y: 0.5, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, this.config.scaleAxisLock.y),
				createScaleAxis('z', 'blue', { width: 1, height: 0.05, depth: 0.05 }, { x: 0, y: 0, z: 0.5 }, { x: Math.PI / 2, y: 0, z: Math.PI / 2 }, this.config.scaleAxisLock.z)
			)
		);

		// Drag Events
		this.onDragBegin = (function(event) {
			this.dragAxis = null;

			if(!this.selectedControl) return;

			this.raycaster.set(event.ray.origin, event.ray.direction);
			var intersection = this.raycaster.intersectObject(this.selectedControl, true)[0];
			if(!intersection) return;

			this.dragAxis = intersection.object.name;

			// Remove Previous Hover Effects
			if(this.hoveredAxis) {
				this.hoveredAxis.traverse((function(child) {
					if(child instanceof THREE.Mesh && child.userData.material) {
						child.material = child.userData.material;
						delete child.userData.material;
						child.geometry.uvsNeedUpdate = true;
					}
				}).bind(this));
			}

			// Apply Dragged Hover Effect
			var dragHoverAxis = this.selectedControl.getObjectByName(this.dragAxis);
			if(dragHoverAxis) {
				dragHoverAxis.traverse((function(child) {
					if(child instanceof THREE.Mesh && !child.userData.material && child.material.visible) {
						child.userData.material = child.material;
						child.material = altspaceutil.behaviors.TransformControls.Materials['orange'];
						child.geometry.uvsNeedUpdate = true;
					}
				}).bind(this));
			}

			this.scene.updateMatrixWorld();
			this.dragPointBegin = intersection.point.clone();

			this.controlbase.removeEventListener('cursordown', this.onDragBegin);
			this.scene.addEventListener('cursorup', this.onDragEnd);
			this.scene.addEventListener('cursormove', this.onDragMove);

			this.intersector.quaternion.copy(this.selectedControl.getObjectByName(this.dragAxis).quaternion);

			if(this.dragAxis === 'xyz') {
				this.originIntersectors.traverse(function(child) {
					if(child instanceof THREE.Mesh) child.visible = true;
				});

				intersection = this.raycaster.intersectObjects([this.originIntersectors.children[0], this.originIntersectors.children[1], this.originIntersectors.children[2]], true)[0];
				this.originIntersector = (intersection && intersection.object) ? intersection.object : this.intersector;
				if(intersection) this.dragPointBegin = intersection.point.clone();

				this.originIntersectors.traverse(function(child) {
					if(child instanceof THREE.Mesh) child.visible = false;
				});
			}

			this.dispatchDragBeginEvent();
		}).bind(this);

		this.onDragMove = (function(event) {
			if(!this.selectedControl) {
				this.scene.removeEventListener('cursorup', this.onDragEnd);
				this.scene.removeEventListener('cursormove', this.onDragMove);
				this.controlbase.addEventListener('cursordown', this.onDragBegin);
				this.dragAxis = null;
				return;
			}

			var intersection;
			this.raycaster.set(event.ray.origin, event.ray.direction);

			if(this.dragAxis === 'xyz') {
				this.originIntersector.visible = true;
				intersection = this.raycaster.intersectObject(this.originIntersector, true)[0];
				this.originIntersector.visible = false;
			} else {
				this.intersector.quaternion.copy(this.selectedControl.getObjectByName(this.dragAxis).quaternion);
				this.intersector.visible = true;
				intersection = this.raycaster.intersectObject(this.intersector, true)[0];
				this.intersector.visible = false;
			}

			if(!intersection) return;

			var lastRotateDragDelta = this.dragPointBegin.clone().sub(this.object3d.position);
			var rotateDragDelta = intersection.point.clone().sub(this.object3d.position);
			var dragDelta = intersection.point.clone().sub(this.dragPointBegin);
			this.dragPointBegin = intersection.point.clone();
			var eventDragDelta = new THREE.Vector3();

			if(this.selectedControlType === 'position') {
				switch(this.dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						if(this.config.positionAxisLock[this.dragAxis]) {
							eventDragDelta[this.dragAxis] += dragDelta[this.dragAxis];
							this.target.position.add(eventDragDelta);
						}
						break;
					}
					case 'xyz': {
						if(this.config.positionAxisLock.x || this.config.positionAxisLock.y || this.config.positionAxisLock.z) {
							if(this.originIntersector.name === 'x') eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, this.config.positionAxisLock.y ? dragDelta.y : 0, 0);
							else if(this.originIntersector.name === 'y') eventDragDelta.set(0, this.config.positionAxisLock.y ? dragDelta.y : 0, this.config.positionAxisLock.z ? dragDelta.z : 0);
							else if(this.originIntersector.name === 'z') eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, 0, this.config.positionAxisLock.z ? dragDelta.z : 0);
							else eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, this.config.positionAxisLock.y ? dragDelta.y : 0, this.config.positionAxisLock.z ? dragDelta.z : 0);

							this.target.position.add(eventDragDelta);
						}
						break;
					}
				}
			} else if(this.selectedControlType === 'scale') {
				switch(this.dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						if(this.config.scaleAxisLock[this.dragAxis]) {
							eventDragDelta[this.dragAxis] += dragDelta[this.dragAxis];
							this.target.scale.add(eventDragDelta);

							if(this.target.scale[this.dragAxis] === undefined || isNaN(this.target.scale[this.dragAxis]) || (!this.config.allowNegativeScale && this.target.scale[this.dragAxis] < 0)) this.target.scale[this.dragAxis] = Number.EPSILON;
						}
						break;
					}
					default: {
						if(this.config.scaleAxisLock.x || this.config.scaleAxisLock.y || this.config.scaleAxisLock.z) {
							var maxScaleFactor = dragDelta.x;
							if(Math.abs(dragDelta.y) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.y;
							if(Math.abs(dragDelta.z) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.z;

							eventDragDelta.set(this.config.scaleAxisLock.x ? maxScaleFactor : 0, this.config.scaleAxisLock.y ? maxScaleFactor : 0, this.config.scaleAxisLock.z ? maxScaleFactor : 0);
							this.target.scale.add(eventDragDelta);

							if(this.target.scale.x === undefined || isNaN(this.target.scale.x) || (!this.config.allowNegativeScale && this.target.scale.x < 0)) this.target.scale.x = Number.EPSILON;
							if(this.target.scale.y === undefined || isNaN(this.target.scale.y) || (!this.config.allowNegativeScale && this.target.scale.y < 0)) this.target.scale.y = Number.EPSILON;
							if(this.target.scale.z === undefined || isNaN(this.target.scale.z) || (!this.config.allowNegativeScale && this.target.scale.z < 0)) this.target.scale.z = Number.EPSILON;
						}
						break;
					}
				}
			} else if(this.selectedControlType === 'rotate') {
				if(this.config.rotateAxisLock[this.dragAxis]) {
					switch(this.dragAxis) {
						case 'x': {
							var deltaRotation = Math.atan2(rotateDragDelta.z, rotateDragDelta.y) - Math.atan2(lastRotateDragDelta.z, lastRotateDragDelta.y);
							eventDragDelta[this.dragAxis] += deltaRotation;
							break;
						}
						case 'y': {
							var deltaRotation = Math.atan2(rotateDragDelta.x, rotateDragDelta.z) - Math.atan2(lastRotateDragDelta.x, lastRotateDragDelta.z);
							eventDragDelta[this.dragAxis] += deltaRotation;
							break;
						}
						case 'z': {
							var deltaRotation = Math.atan2(rotateDragDelta.y, rotateDragDelta.x) - Math.atan2(lastRotateDragDelta.y, lastRotateDragDelta.x);
							eventDragDelta[this.dragAxis] += deltaRotation;
							break;
						}
					}

					this.target.rotation[this.dragAxis] += eventDragDelta[this.dragAxis];
				}
			}

			this.updateTransform();
			this.dispatchDragMoveEvent(eventDragDelta);
		}).bind(this);

		this.onDragEnd = (function(event) {
			this.scene.removeEventListener('cursorup', this.onDragEnd);
			this.scene.removeEventListener('cursormove', this.onDragMove);
			this.controlbase.addEventListener('cursordown', this.onDragBegin);

			var dragAxis = this.dragAxis;
			this.dragAxis = null;

			if(this.selectedControl && dragAxis) {
				// Remove Dragged Hover Effect
				var dragHoverAxis = this.selectedControl.getObjectByName(dragAxis);
				if(dragHoverAxis) {
					dragHoverAxis.traverse((function(child) {
						if(child instanceof THREE.Mesh && child.userData.material) {
							child.material = child.userData.material;
							delete child.userData.material;
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}

				// Apply Previous Hover Effect
				if(this.hoveredAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(child instanceof THREE.Mesh && !child.userData.material && child.material.visible) {
							child.userData.material = child.material;
							child.material = altspaceutil.behaviors.TransformControls.Materials['orange'];
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}
			}

			if(!this.selectedControl) return;

			var intersection;
			this.raycaster.set(event.ray.origin, event.ray.direction);

			if(dragAxis === 'xyz') {
				this.originIntersector.visible = true;
				intersection = this.raycaster.intersectObject(this.originIntersector, true)[0];
				this.originIntersector.visible = false;
			} else {
				this.intersector.quaternion.copy(this.selectedControl.getObjectByName(dragAxis).quaternion);
				this.intersector.visible = true;
				intersection = this.raycaster.intersectObject(this.intersector, true)[0];
				this.intersector.visible = false;
			}

			if(!intersection) return;

			var lastRotateDragDelta = this.dragPointBegin.clone().sub(this.object3d.position);
			var rotateDragDelta = intersection.point.clone().sub(this.object3d.position);
			var dragDelta = intersection.point.clone().sub(this.dragPointBegin);
			this.dragPointBegin = intersection.point.clone();
			var eventDragDelta = new THREE.Vector3();

			if(this.selectedControlType === 'position') {
				switch(dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						if(this.config.positionAxisLock[dragAxis]) {
							eventDragDelta[dragAxis] += dragDelta[dragAxis];
							this.target.position.add(eventDragDelta);
						}
						break;
					}
					case 'xyz': {
						if(this.config.positionAxisLock.x || this.config.positionAxisLock.y || this.config.positionAxisLock.z) {
							if(this.originIntersector.name === 'x') eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, this.config.positionAxisLock.y ? dragDelta.y : 0, 0);
							else if(this.originIntersector.name === 'y') eventDragDelta.set(0, this.config.positionAxisLock.y ? dragDelta.y : 0, this.config.positionAxisLock.z ? dragDelta.z : 0);
							else if(this.originIntersector.name === 'z') eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, 0, this.config.positionAxisLock.z ? dragDelta.z : 0);
							else eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, this.config.positionAxisLock.y ? dragDelta.y : 0, this.config.positionAxisLock.z ? dragDelta.z : 0);

							this.target.position.add(eventDragDelta);
						}
						break;
					}
				}
			} else if(this.selectedControlType === 'scale') {
				switch(dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						if(this.config.scaleAxisLock[dragAxis]) {
							eventDragDelta[dragAxis] += dragDelta[dragAxis];
							this.target.scale.add(eventDragDelta);

							if(this.target.scale[dragAxis] === undefined || isNaN(this.target.scale[dragAxis]) || (!this.config.allowNegativeScale && this.target.scale[dragAxis] < 0)) this.target.scale[dragAxis] = Number.EPSILON;
						}
						break;
					}
					default: {
						if(this.config.scaleAxisLock.x || this.config.scaleAxisLock.y || this.config.scaleAxisLock.z) {
							var maxScaleFactor = dragDelta.x;
							if(Math.abs(dragDelta.y) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.y;
							if(Math.abs(dragDelta.z) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.z;

							eventDragDelta.set(this.config.scaleAxisLock.x ? maxScaleFactor : 0, this.config.scaleAxisLock.y ? maxScaleFactor : 0, this.config.scaleAxisLock.z ? maxScaleFactor : 0);
							this.target.scale.add(eventDragDelta);

							if(this.target.scale.x === undefined || isNaN(this.target.scale.x) || (!this.config.allowNegativeScale && this.target.scale.x < 0)) this.target.scale.x = Number.EPSILON;
							if(this.target.scale.y === undefined || isNaN(this.target.scale.y) || (!this.config.allowNegativeScale && this.target.scale.y < 0)) this.target.scale.y = Number.EPSILON;
							if(this.target.scale.z === undefined || isNaN(this.target.scale.z) || (!this.config.allowNegativeScale && this.target.scale.z < 0)) this.target.scale.z = Number.EPSILON;
						}
						break;
					}
				}
			} else if(this.selectedControlType === 'rotate') {
				if(this.config.rotateAxisLock[dragAxis]) {
					switch(dragAxis) {
						case 'x': {
							var deltaRotation = Math.atan2(rotateDragDelta.z, rotateDragDelta.y) - Math.atan2(lastRotateDragDelta.z, lastRotateDragDelta.y);
							eventDragDelta[dragAxis] += deltaRotation;
							break;
						}
						case 'y': {
							var deltaRotation = Math.atan2(rotateDragDelta.x, rotateDragDelta.z) - Math.atan2(lastRotateDragDelta.x, lastRotateDragDelta.z);
							eventDragDelta[dragAxis] += deltaRotation;
							break;
						}
						case 'z': {
							var deltaRotation = Math.atan2(rotateDragDelta.y, rotateDragDelta.x) - Math.atan2(lastRotateDragDelta.y, lastRotateDragDelta.x);
							eventDragDelta[dragAxis] += deltaRotation;
							break;
						}
					}

					this.target.rotation[dragAxis] += eventDragDelta[dragAxis];
				}
			}

			this.updateTransform();
			this.dispatchDragMoveEvent(eventDragDelta);
			this.dispatchDragEndEvent(dragAxis);
		}).bind(this);

		// Control Type Toggle Buttons
		if(this.config.showButtons) {
			var onControlTypeButtonDown = (function(event) {
				this.buttonDownControlType = event.target.name;
			}).bind(this);

			var onControlTypeButtonUp = (function(event) {
				if(event.target.name !== this.buttonDownControlType) return;
				this.setActiveControl(this.buttonDownControlType === this.selectedControlType ? 'none' : this.buttonDownControlType);
			}).bind(this);

			this.controlTypeButtons = new THREE.Group();
			this.controlTypeButtons.position.set(0.5, 1, 0);

			var buttonPosition = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['button'], altspaceutil.behaviors.TransformControls.Materials['red-transclucent']), { name: 'position' });
			var buttonPositionIcon = this.controls.position.clone();
			buttonPositionIcon.position.set(-0.025, -0.025, -0.025);
			buttonPositionIcon.scale.multiplyScalar(0.1);
			buttonPosition.add(buttonPositionIcon);
			buttonPosition.addEventListener('cursordown', onControlTypeButtonDown);
			buttonPosition.addEventListener('cursorup', onControlTypeButtonUp);

			var buttonRotate = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['button'], altspaceutil.behaviors.TransformControls.Materials['green-transclucent']), { name: 'rotate' });
			var buttonRotateIcon = this.controls.rotate.clone();
			buttonRotateIcon.scale.multiplyScalar(0.1);
			buttonRotate.add(buttonRotateIcon);
			buttonRotate.position.set(0.25, 0, 0);
			buttonRotate.addEventListener('cursordown', onControlTypeButtonDown);
			buttonRotate.addEventListener('cursorup', onControlTypeButtonUp);

			var buttonScale = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['button'], altspaceutil.behaviors.TransformControls.Materials['blue-transclucent']), { name: 'scale' });
			var buttonScaleIcon = this.controls.scale.clone();
			buttonScaleIcon.position.set(-0.025, -0.025, -0.025);
			buttonScaleIcon.scale.multiplyScalar(0.1);
			buttonScale.add(buttonScaleIcon);
			buttonScale.position.set(0.5, 0, 0);
			buttonScale.addEventListener('cursordown', onControlTypeButtonDown);
			buttonScale.addEventListener('cursorup', onControlTypeButtonUp);

			this.controlTypeButtons.add(buttonPosition, buttonRotate, buttonScale);
		}

		// Raycaster & Intersection Plane For Drag Hit Testing
		this.raycaster = new THREE.Raycaster();

		this.intersector = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { visible: false });

		this.originIntersectors = new THREE.Group();
		this.originIntersectors.add(
			Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: 'x', visible: false }),
			Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: 'y', visible: false }),
			Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: 'z', visible: false })
		);
		this.originIntersectors.children[1].rotation.y = Math.PI / 2;
		this.originIntersectors.children[2].rotation.x = Math.PI / 2;

		// Group Transform Control Components Together
		this.controlbase = new THREE.Group();
		this.controlbase.add(this.controls.position, this.controls.rotate, this.controls.scale, this.intersector, this.originIntersectors);
		this.controlbase.traverse(function(child) {
			child.userData.isTransformControl = true;
			child.visible = false;
		});
		this.controlbase.addEventListener('cursordown', this.onDragBegin);
		this.scene.add(this.controlbase);
		this.controlbase.scale.setScalar(this.config.scale);
		if(this.controlTypeButtons) this.controlbase.add(this.controlTypeButtons);

		this.setActiveControl(this.selectedControlType);
	}

	this.dispatchDragMoveEvent = function(dragDelta) {
		if(dragDelta.x === 0 && dragDelta.y === 0 && dragDelta.z === 0) return;

		/**
		* Fires an event when the transform gizmo is being dragged.
		*
		* @event transform-controls-dragmove
		* @property {TransformControls} behavior The behavior that controls the transform gizmo.
		* @property {THREE.Object3D} parent The object that the transform gizmo is parented to.
		* @property {THREE.Object3D} transformTarget The object that the transform gizmo will manipulate.
		* @property {String} transformType - The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'.
		* @property {String} transformAxis - The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes).
		* @property {THREE.Vector3} transformDelta - The transform delta that was applied to the target object.
		* @memberof module:altspaceutil/behaviors.TransformControls
		*/
		var self = this;
		this.object3d.dispatchEvent({
			type: 'transform-controls-dragmove',
			detail: {
				behavior: self,
				parent: self.object3d,
				transformTarget: self.target,
				transformType: self.selectedControlType,
				transformAxis: self.dragAxis,
				transformDelta: dragDelta
			},
			bubbles: true,
			target: self.object3d
		});
	}

	this.dispatchDragBeginEvent = function() {
		/**
		* Fires an event when the transform gizmo starts being dragged.
		*
		* @event transform-controls-dragbegin
		* @property {TransformControls} behavior The behavior that controls the transform gizmo.
		* @property {THREE.Object3D} parent The object that the transform gizmo is parented to.
		* @property {THREE.Object3D} transformTarget The object that the transform gizmo will manipulate.
		* @property {String} transformType - The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'.
		* @property {String} transformAxis - The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes).
		* @memberof module:altspaceutil/behaviors.TransformControls
		*/
		var self = this;
		this.object3d.dispatchEvent({
			type: 'transform-controls-dragbegin',
			detail: {
				behavior: self,
				parent: self.object3d,
				transformTarget: self.target,
				transformType: self.selectedControlType,
				transformAxis: self.dragAxis
			},
			bubbles: true,
			target: self.object3d
		});
	}

	this.dispatchDragEndEvent = function(dragAxis) {
		var self = this;
		/**
		* Fires an event when the transform gizmo is no longer being dragged.
		*
		* @event transform-controls-dragend
		* @property {TransformControls} behavior The behavior that controls the transform gizmo.
		* @property {THREE.Object3D} parent The object that the transform gizmo is parented to.
		* @property {THREE.Object3D} transformTarget The object that the transform gizmo will manipulate.
		* @property {String} transformType - The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'.
		* @property {String} transformAxis - The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes).
		* @memberof module:altspaceutil/behaviors.TransformControls
		*/
		this.object3d.dispatchEvent({
			type: 'transform-controls-dragend',
			detail: {
				behavior: self,
				parent: self.object3d,
				transformTarget: self.target,
				transformType: self.selectedControlType,
				transformAxis: dragAxis
			},
			bubbles: true,
			target: self.object3d
		});
	}

	this.updateTransform = function() {
		// Transform Control Follows Object
		this.scene.updateMatrixWorld();
		this.controlbase.position.copy((this.config.followTarget ? this.target : this.object3d).getWorldPosition(new THREE.Vector3()));
	}

	this.update = function() {
		this.updateTransform();

		// Remove Cursor Colliders
		if(this.target && (this.config.disableColliders || this.config.disableChildColliders)) {
			this.target.traverse((function(child) {
				if((child === this.target && !this.config.disableColliders) || (child !== this.target && !this.config.disableChildColliders)) return;

				if(!child.userData.isTransformControl && (!child.userData.altspace || !child.userData.altspace.collider || child.userData.altspace.collider.enabled)) {
					this.objectState[child.uuid] = Object.assign(this.objectState[child.uuid] || {}, { collider: { enabled: true } });
					child.userData.altspace = { collider: { enabled: false } };
				}
			}).bind(this));
		}
	}

	this.dispose = function() {
		this.setActiveControl('none');
		if(this.intersector && this.intersector.parent) this.intersector.parent.remove(this.intersector);
		if(this.controlTypeButtons && this.controlTypeButtons.parent) this.controlTypeButtons.parent.remove(this.controlTypeButtons);

		// Restore Cursor Colliders
		if(this.target && (this.config.disableColliders || this.config.disableChildColliders)) {
			this.target.traverse((function(child) {
				if((child === this.target && !this.config.disableColliders) || (child !== this.target && !this.config.disableChildColliders)) return;

				if(!child.userData.isTransformControl && this.objectState[child.uuid]) {
					child.userData.altspace = Object.assign(child.userData.altspace || {}, { collider: this.objectState[child.uuid].collider });
					delete this.objectState[child.uuid];
				}
			}).bind(this));
		}

		this.object3d = null;
		this.target = null;
		this.scene = null;
		this.objectState = null;
		this.controls = null;
		this.selectedControlType = null;
		this.selectedControl = null;
		this.controlbase = null;
		this.controlTypeButtons = null;
		this.buttonDownControlType = null;

		this.intersector = null;
		this.raycaster = null;
		this.originIntersectors = null;
		this.originIntersector = null;

		this.dragPointBegin = null;
		this.dragAxis = null;
		this.hoveredAxis = null;

		this.onDragBegin = null;
		this.onDragEnd = null;
		this.onDragMove = null;
	}

	/**
	* Sets the active control type.
	*
	* @method setActiveControl
	* @param {String} The active control type.  Possible values are 'none', 'position', 'rotate' and 'scale'.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.setActiveControl = function(controlType) {
		if(!this.controls && ['none', 'position', 'rotate', 'scale'].indexOf(controlType) >= 0) {
			this.config.controlType = controlType;
			return;
		}

		if(this.controls && this.object3d && this.target && this.controls.hasOwnProperty(controlType)) {
			if(this.selectedControl) {
				if(controlType === this.selectedControl.name) return;
				this.selectedControl.traverse(function(child) { child.visible = false; });
			} else {
				if(controlType === 'none') return;
			}

			this.selectedControl = this.controls[controlType];
			this.selectedControlType = this.selectedControl ? this.selectedControl.name : 'none';
			if(this.selectedControl) this.selectedControl.traverse(function(child) { child.visible = true; });

			this.update();
		}
	}

	/**
	* Gets the active control type.
	*
	* @method getActiveControl
	* @returns {String} The active control type.  Possible values are 'none', 'position', 'rotate' and 'scale'.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.getActiveControl = function() {
		return this.selectedControlType;
	}

	/**
	* Sets the target object that the transform gizmo will manipulate.
	*
	* @method setTarget
	* @param {THREE.Object3D} The target object that the transform gizmo will manipulate.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.setTarget = function(target) {
		// Restore Cursor Colliders
		if(this.target && (this.config.disableColliders || this.config.disableChildColliders)) {
			this.target.traverse((function(child) {
				if((child === this.target && !this.config.disableColliders) || (child !== this.target && !this.config.disableChildColliders)) return;

				if(!child.userData.isTransformControl && this.objectState[child.uuid]) {
					child.userData.altspace = Object.assign(child.userData.altspace || {}, { collider: this.objectState[child.uuid].collider });
					delete this.objectState[child.uuid];
				}
			}).bind(this));
		}

		this.target = this.config.target = target;

		// Remove Cursor Colliders
		if(this.target && (this.config.disableColliders || this.config.disableChildColliders)) {
			this.target.traverse((function(child) {
				if((child === this.target && !this.config.disableColliders) || (child !== this.target && !this.config.disableChildColliders)) return;

				if(!child.userData.isTransformControl && (!child.userData.altspace || !child.userData.altspace.collider || child.userData.altspace.collider.enabled)) {
					this.objectState[child.uuid] = Object.assign(this.objectState[child.uuid] || {}, { collider: { enabled: true } });
					child.userData.altspace = { collider: { enabled: false } };
				}
			}).bind(this));
		}
	}

	/**
	* Gets the target object that the transform gizmo will manipulate.
	*
	* @method getTarget
	* @returns {THREE.Object3D} The target object that the transform gizmo will manipulate.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.getTarget = function() {
		return this.target;
	}
}

// A-Frame Wrapper
/**
 * The altspace-transform-controls component enables an object's position, rotation and scale to be manipulated
 * in AltspaceVR with a draggable transform gizmo.
 *
 * @class altspace-transform-controls
 * @param {String} [control-type=none] The default control type to be selected.  Supported control types are 'none', 'position', 'rotate' or 'scale'.
 * @param {Boolean} [show-buttons=false] Specifies whether buttons should be displayed to toggle between control types.
 * @param {Boolean} [follow-target=true] Specified whether the transform gizmo should follow the object that is being manipulated.
 * @param {Selector} [target] The target that the transform gizmo should manipulate when interacted with.  If omitted, the object that the 
 * behavior is associated with will be used as the target.
 * @param {Number} [scale=1] Adjusts the scale of the transform gizmo.
 * @param {Boolean} [allow-negative-scale=false] Specifies whether the scale transform gizmo will allow the target's scale to be negative.
 * @param {Boolean} [sync-events=true] Specifies whether the sync ownership is gained when drag events are fired.  Requires {sync} and {sync-transform} 
 * components be present on the target object.
 * @param {String} [position-axis-lock=xyz] Specifies which axes of the position gizmo can be displayed and manipulated.
 * @param {String} [rotate-axis-lock=xyz] Specifies which axes of the rotate gizmo can be displayed and manipulated.
 * @param {String} [scale-axis-lock=xyz] Specifies which axes of the scale gizmo can be displayed and manipulated.
 * @param {Boolean} [disable-colliders=true] Specifies whether colliders on the target object should be disabled.
 * @param {Boolean} [disable-child-colliders=true] Specifies whether colliders on the target's children should be disabled.
 * @memberof module:altspaceutil/behaviors
 **/
if(window.AFRAME) {
	if(AFRAME.components['altspace-transform-controls']) delete AFRAME.components['altspace-transform-controls'];

	AFRAME.registerComponent('altspace-transform-controls', {
		schema: {
			controlType: { type: 'string', default: 'none' },
			showButtons: { type: 'boolean', default: false },
			followTarget: { type: 'boolean', default: true },
			target: { type: 'selector' },
			scale: { type: 'number', default: 1 },
			allowNegativeScale: { type: 'boolean', default: false },
			syncEvents: { type: 'boolean', default: true },
			positionAxisLock: {
				default: 'xyz',
				parse: function(value) {
					return { x: value.indexOf('x') !== -1, y: value.indexOf('y') !== -1, z: value.indexOf('z') !== -1 };
				}
			},
			rotateAxisLock: {
				default: 'xyz',
				parse: function(value) {
					return { x: value.indexOf('x') !== -1, y: value.indexOf('y') !== -1, z: value.indexOf('z') !== -1 };
				}
			},
			scaleAxisLock: {
				default: 'xyz',
				parse: function(value) {
					return { x: value.indexOf('x') !== -1, y: value.indexOf('y') !== -1, z: value.indexOf('z') !== -1 };
				}
			},
			disableColliders: { type: 'boolean', default: true },
			disableChildColliders: { type: 'boolean', default: true }
		},
		init: function() {
			this.behavior = new altspaceutil.behaviors.TransformControls({
				controlType: this.data.controlType,
				showButtons: this.data.showButtons,
				followTarget: this.data.followTarget,
				target: this.data.target ? this.data.target.object3D : null,
				scale: this.data.scale,
				allowNegativeScale: this.data.allowNegativeScale,
				positionAxisLock: this.data.positionAxisLock,
				rotateAxisLock: this.data.rotateAxisLock,
				scaleAxisLock: this.data.scaleAxisLock,
				disableColliders: this.data.disableColliders,
				disableChildColliders: this.data.disableChildColliders
			});
			this.el.object3D.addBehavior(this.behavior);

			// Handle Sync System Ownership When Gizmo Is Dragged
			if(this.data.syncEvents) {
				var onDragEvent = (function(event) {
					var target = this.el.object3D.getBehaviorByType('TransformControls').getTarget().el;
					if(target && target.components.sync && target.components.sync.isConnected) {
						target.components.sync.takeOwnership();
						target.setAttribute('position', target.object3D.position);
						target.setAttribute('rotation', { x: THREE.Math.radToDeg(target.object3D.rotation.x), y: THREE.Math.radToDeg(target.object3D.rotation.y), z: THREE.Math.radToDeg(target.object3D.rotation.z) });
						target.setAttribute('scale', target.object3D.scale);
					}
				}).bind(this);

				this.el.object3D.addEventListener('transform-controls-dragbegin', onDragEvent);
				this.el.object3D.addEventListener('transform-controls-dragmove', onDragEvent);
				this.el.object3D.addEventListener('transform-controls-dragend', onDragEvent);
			}
		},
		remove: function() {
			if(this.behavior) this.el.object3D.removeBehavior(this.behavior);
		}
	});
}/**
 * Changes the color of an object's material when the cursor hovers over it, and restores the original color when the cursor is no longer hovering over the object.
 * 
 * @class HoverMaterialColor
 * @param {Object} [config] Optional parameters.
 * @param {THREE.Material} [config.material] A reference to the material whose color will be updated.  Defaults to material of the object the behavior is attached to.
 * @param {THREE.Color} [config.color=new THREE.Color('yellow')] The value that will be applied to the object's material color when the cursor hovers over it.
 * @param {Number} [config.beginDuration=75] Duration the hovered color adjustment effect is intended to take to complete, in milliseconds.
 * @param {Number} [config.endDuration=75] Duration the unhovered color adjustment effect is intended to take to complete, in milliseconds.
 * @param {Boolean} [config.revertOnDispose=true] Specifies whether the object's original material color should be restored when the behavior has been destroyed.
 * @param {THREE.Object3D} [config.eventListener=null] Specifies an optional object that will listen for cursor events.  By default the object that the behavior is attached to will be used as the event listener.
 * @param {Boolean} [config.hoverChildren=true] Specifies whether hovering over children of the event listener object should invoke the hover effect.
 * @memberof module:altspace/utilities/behaviors
 */
altspaceutil.behaviors.HoverMaterialColor = function(config) {
	config = config || {};

	this.type = 'HoverMaterialColor';

	this.awake = function(o) {
		this.color = config.color || new THREE.Color('yellow');
		this.beginDuration = config.beginDuration || 75; // Milliseconds
		this.endDuration = config.endDuration || 75; // Milliseconds
		this.revertOnDispose = ((config.revertOnDispose !== undefined) ? config.revertOnDispose : true);
		this.hoverChildren = ((config.hoverChildren !== undefined) ? config.hoverChildren : true);

		this.object3d = o;
		this.eventListener = config.eventListener || this.object3d;
		this.material = config.material || this.object3d.material;
		this.originalColor = this.material.color.clone();

		this.srcColor = this.color;
		this.destColor = this.originalColor;

		this.srcDuration = this.beginDuration;
		this.destDuration = this.endDuration;
		this.duration = this.destDuration;

		this.progress = 1;
		this.elapsedTime = this.duration;

		this.eventListener.addEventListener('cursorenter', this.onHoverStateChange.bind(this));
		this.eventListener.addEventListener('cursorleave', this.onHoverStateChange.bind(this));
	}

	this.update = function(deltaTime) {
		if(this.progress < 1) {
			this.elapsedTime += deltaTime;
			this.elapsedTime = THREE.Math.clamp(this.elapsedTime, 0, this.duration);

			this.progress = THREE.Math.clamp(this.elapsedTime / this.duration, 0, 1);
			this.material.color.copy(this.srcColor).lerp(this.destColor, this.progress);
		}
	}

	this.dispose = function() {
		this.eventListener.removeEventListener('cursorenter', this.onHoverStateChange.bind(this));
		this.eventListener.removeEventListener('cursorleave', this.onHoverStateChange.bind(this));

		// Restore Original Object Material Color Before Behavior Was Applied
		if(this.revertOnDispose) this.material.color.copy(this.originalColor);
	}

	this.onHoverStateChange = function(event) {
		if(!this.hoverChildren && this.eventListener !== event.target) return;

		var temp = this.srcColor;
		this.srcColor = this.destColor;
		this.destColor = temp;

		var temp = this.srcDuration;
		this.srcDuration = this.destDuration;
		this.destDuration = temp;
		this.duration = this.destDuration;

		this.progress = 1 - this.progress;
		this.elapsedTime = this.duration * this.progress;
	}
}
/**
 * Changes the opacity of an object's material when the cursor hovers over it, and restores the original opacity when the cursor is no longer hovering over the object.
 * 
 * @class HoverMaterialOpacity
 * @param {Object} [config] Optional parameters.
 * @param {THREE.Material} [config.material] A reference to the material whose opacity will be updated.  Defaults to material of the object the behavior is attached to.
 * @param {Number} [config.opacity=1] The value that will be applied to the object's material opacity when the cursor hovers over it.
 * @param {Number} [config.beginDuration=75] Duration the hovered opacity adjustment effect is intended to take to complete, in milliseconds.
 * @param {Number} [config.endDuration=75] Duration the unhovered opacity adjustment effect is intended to take to complete, in milliseconds.
 * @param {Boolean} [config.revertOnDispose=true] Specifies whether the object's original material opacity should be restored when the behavior has been destroyed.
 * @param {THREE.Object3D} [config.eventListener=null] Specifies an optional object that will listen for cursor events.  By default the object that the behavior is attached to will be used as the event listener.
 * @param {Boolean} [config.hoverChildren=true] Specifies whether hovering over children of the event listener object should invoke the hover effect.
 * @memberof module:altspace/utilities/behaviors
 */
altspaceutil.behaviors.HoverMaterialOpacity = function(config) {
	config = config || {};

	this.type = 'HoverMaterialOpacity';

	this.awake = function(o) {
		this.opacity = config.opacity || 1;
		this.beginDuration = config.beginDuration || 75; // Milliseconds
		this.endDuration = config.endDuration || 75; // Milliseconds
		this.revertOnDispose = ((config.revertOnDispose !== undefined) ? config.revertOnDispose : true);
		this.hoverChildren = ((config.hoverChildren !== undefined) ? config.hoverChildren : true);

		this.object3d = o;
		this.eventListener = config.eventListener || this.object3d;
		this.material = config.material || this.object3d.material;
		this.originalOpacity = this.material.opacity;

		this.srcOpacity = THREE.Math.clamp(this.originalOpacity + this.opacity, 0, 1);
		this.destOpacity = this.originalOpacity;

		this.srcDuration = this.beginDuration;
		this.destDuration = this.endDuration;
		this.duration = this.destDuration;

		this.progress = 1;
		this.elapsedTime = this.duration;

		this.eventListener.addEventListener('cursorenter', this.onHoverStateChange.bind(this));
		this.eventListener.addEventListener('cursorleave', this.onHoverStateChange.bind(this));
	}

	this.update = function(deltaTime) {
		if(this.progress < 1) {
			this.elapsedTime += deltaTime;
			this.elapsedTime = THREE.Math.clamp(this.elapsedTime, 0, this.duration);

			this.progress = THREE.Math.clamp(this.elapsedTime / this.duration, 0, 1);
			this.material.opacity = THREE.Math.lerp(this.srcOpacity, this.destOpacity, this.progress);
		}
	}

	this.dispose = function() {
		this.eventListener.removeEventListener('cursorenter', this.onHoverStateChange.bind(this));
		this.eventListener.removeEventListener('cursorleave', this.onHoverStateChange.bind(this));

		// Restore Original Object Material Opacity Before Behavior Was Applied
		if(this.revertOnDispose) this.material.opacity = this.originalOpacity;
	}

	this.onHoverStateChange = function(event) {
		if(!this.hoverChildren && this.eventListener !== event.target) return;

		var temp = this.srcOpacity;
		this.srcOpacity = this.destOpacity;
		this.destOpacity = temp;

		var temp = this.srcDuration;
		this.srcDuration = this.destDuration;
		this.destDuration = temp;
		this.duration = this.destDuration;

		this.progress = 1 - this.progress;
		this.elapsedTime = this.duration * this.progress;
	}
}
/**
 * Updates the color and opacity of a n-text native component using a material source.
 * 
 * @class NativeTextMaterial
 * @param {Object} [config] Optional parameters.
 * @param {THREE.Material} [config.material=null] A reference to the material whose properties will be applied to the n-text native component.  Defaults to material of the object the behavior is attached to.
 * @param {Boolean} [config.color=true] Specifies whether the n-text native component should use the color of the source material.
 * @param {Boolean} [config.opacity=true] Specifies whether the n-text native component should use the opacity of the source material.
 * @memberof module:altspace/utilities/behaviors
 */
altspaceutil.behaviors.NativeTextMaterial = function(config) {
	config = config || {};

	this.type = 'NativeTextMaterial';

	this.awake = function(o) {
		this.object3d = o;
		this.component = this.object3d.getBehaviorByType('n-text');
		this.material = config.material || this.object3d.material || new THREE.MeshBasicMaterial({ transparent: true });
		this.hasColor = ((config.color !== undefined) ? config.color : true);
		this.hasOpacity = ((config.opacity !== undefined) ? config.opacity : true);
	}

	this.update = function(deltaTime) {
		this.removeMaterialTags();
		this.component.data.text = this.getMaterialTags() + this.component.data.text;
	}

	this.dispose = function() {
		this.removeMaterialTags();
	}

	this.removeMaterialTags = function() {
		var tagBegin = this.component.data.text.indexOf('<link id="n-text-material">');
		var tagEnd = tagBegin >= 0 ? this.component.data.text.indexOf('</link>', tagBegin) : -1;
		if(tagBegin >= 0 && tagEnd >= 0) this.component.data.text = this.component.data.text.slice(0, tagBegin) + this.component.data.text.slice(tagEnd + 7);
	}

	this.getMaterialTags = function() {
		var tags = '<link id="n-text-material">';
		if(this.hasColor) tags += '<color=#' + this.getColorHexString() + this.getOpacityHexString() + '>';
		else if(this.hasOpacity) tags += '<alpha=#' + this.getOpacityHexString() + '>';
		tags += '</link>';

		return tags;
	}

	this.getColorHexString = function() {
		return this.material.color.getHexString();
	}

	this.getOpacityHexString = function() {
		var hexOpacity = (+Math.floor(this.hasOpacity && this.material.transparent ? this.material.opacity * 255 : 255)).toString(16).toUpperCase();
		if(hexOpacity.length < 2) hexOpacity = '0' + hexOpacity;
		return hexOpacity;
	}
}

/**
 * The n-text-material component updates the color and opacity of a {n-text} native component using a material source.
 *
 * @class n-text-material
 * @param {Selector} [material] A reference to the object whose material properties will be applied to the n-text native component.  Defaults to material of the object the component is attached to.
 * @param {Boolean} [color=true] Specifies whether the n-text native component should use the color of the source material.
 * @param {Boolean} [opacity=true] Specifies whether the n-text native component should use the opacity of the source material.
 * @memberof module:altspaceutil/behaviors
 **/
if(window.AFRAME) {
	if(AFRAME.components['n-text-material']) delete AFRAME.components['n-text-material'];

	AFRAME.registerComponent('n-text-material', {
		dependencies: ['n-text'],
		schema: {
			material: { type: 'selector' },
			color: { type: 'boolean', default: true },
			opacity: { type: 'boolean', default: true }
		},
		init: function() {
			this.component = this.el.getAttribute('n-text');
			this.material = this.data.material ? this.data.material.object3DMap.mesh.material : this.el.object3DMap.mesh.material;
		},
		remove: function() {
			this.removeMaterialTags();
		},
		tick: function(deltaTime) {
			this.removeMaterialTags();
			this.el.setAttribute('n-text', 'text', this.getMaterialTags() + this.component.text);
		},
		removeMaterialTags: function() {
			var tagBegin = this.component.text.indexOf('<link id="n-text-material">');
			var tagEnd = tagBegin >= 0 ? this.component.text.indexOf('</link>', tagBegin) : -1;
			if(tagBegin >= 0 && tagEnd >= 0) this.component.text = this.component.text.slice(0, tagBegin) + this.component.text.slice(tagEnd + 7);
		},
		getMaterialTags: function() {
			var tags = '<link id="n-text-material">';
			if(this.data.color) tags += '<color=#' + this.getColorHexString() + this.getOpacityHexString() + '>';
			else if(this.data.opacity) tags += '<alpha=#' + this.getOpacityHexString() + '>';
			tags += '</link>';

			return tags;
		},
		getColorHexString: function() {
			return this.material.color.getHexString();
		},
		getOpacityHexString: function() {
			var hexOpacity = (+Math.floor(this.data.opacity && this.material.transparent ? this.material.opacity * 255 : 255)).toString(16).toUpperCase();
			if(hexOpacity.length < 2) hexOpacity = '0' + hexOpacity;
			return hexOpacity;
		}
	});
}
