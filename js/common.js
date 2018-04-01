'use strict';

window.altspaceutil = window.altspaceutil || {};
altspaceutil.behaviors = altspaceutil.behaviors || {};

// Native Event Helpers
altspaceutil.addNativeEventListener = function(name, callback) {
	return (altspace.inClient && altspace._internal && altspace._internal.couiEngine) ? altspace._internal.couiEngine.on(name, callback) : null;
}

altspaceutil.removeNativeEventListener = function(name, callback) {
	if(altspace.inClient && altspace._internal && altspace._internal.couiEngine) altspace._internal.couiEngine.off(name, callback);
}

altspaceutil.removeAllNativeEventListeners = function(name) {
	if(altspace.inClient && altspace._internal && altspace._internal.couiEngine && altspace._internal.couiEngine.events[name]) delete altspace._internal.couiEngine.events[name];
}

altspaceutil.getObject3DById = function(meshId) {
	return (altspace.inClient && altspace._internal) ? altspace._internal.getObject3DById(meshId) : null;
}

altspaceutil.getThreeJSScene = function() {
	return (altspace.inClient && altspace._internal) ? altspace._internal.getThreeJSScene() : null;
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
* Create an absolute URL from the specified relative URL, using the current host as the URL base.
* @function getAbsoluteURL
* @param {String} [url] A relative URL.  Providing an absolute URL will return itself unchanged.
* @returns {String} An absolute URL of the given relative URL.
* @memberof module:altspaceutil
*/
altspaceutil.getAbsoluteURL = function(url) {
	if(url && !url.startsWith('http')) {
		if(url.startsWith('/')) {
			url = location.origin + url;
		} else {
			var currPath = location.pathname;
			if(!currPath.endsWith('/')) currPath = location.pathname.split('/').slice(0, -1).join('/') + '/';
			url = location.origin + currPath + url;
		}
	}

	return url;
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
