'use strict';

window.altspaceutil = window.altspaceutil || {};
altspaceutil.behaviors = altspaceutil.behaviors || {};

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
						this._renderer = new THREE.WebGLRenderer({ antialias: true });

						Object.assign(this._camera, { fov: 90, near: 1, far: 2000 });
						this._camera.position.z = 20;

						let addRendererToDOM = () => {
							this._renderer.setClearColor('#99AACC');
							document.body.style.margin = '0px';
							document.body.style.overflow = 'hidden';
							document.body.appendChild(this._renderer.domElement);
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
				obj.addBehavior(new altspaceutil.behaviors.NativeComponent('n-gltf', { url: url }, { useCollider: config.cursorCollider }));
				return Promise.resolve(obj);
			}

			return new Promise((resolve, reject) => {
				altspaceutil.loadScript('https://cdn.jsdelivr.net/npm/three@0.' + THREE.REVISION + '.0/examples/js/loaders/GLTFLoader.min.js', { scriptTest: () => THREE.GLTFLoader }).then(() => {
					let loader = new THREE.GLTFLoader();
					loader.setCrossOrigin(config.crossOrigin);
					loader.load(url, obj => resolve(obj.scene), null, () => reject('Could not retrieve asset from ' + url));
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
