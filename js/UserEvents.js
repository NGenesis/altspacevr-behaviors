/**
 * An identifier that represents the user's avatar type preference.
 * @typedef {String} module:altspace/utilities/behaviors.UserEvents~AvatarId
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
 * @memberof module:altspace/utilities/behaviors
 **/
function UserEventsBehavior(config) {
	config = config || {};

	/**
	* A precondition callback returning a boolean that determines if a user should have their data requested.
	* User data is requested if the callback returns true, otherwise no action is taken.
	* @callback onRequestData
	* @param {String} userId User ID of a user who will have their data requested.
	* @param {THREE.Object3D} object The object that will emit the request.
	* @memberof module:altspace/utilities/behaviors.UserEvents
	*/
	var onRequestData = config.onRequestData || null;

	var refreshTime = config.refreshTime || 5000;
	var trace = config.trace || false;
	var object3d;
	var time = 0;
	var loading = false;
	var dataRequest;

	var username;
	var avatarId;
	var displayName;

	var users = {};
	var userIds = config.userIds || [];

	function awake(o) {
		object3d = o;
		userIds = userIds.constructor === Array ? userIds : [userIds];

		dataRequest = (THREE.FileLoader ? new THREE.FileLoader() : new THREE.XHRLoader(/* DEPRECATED: r83 */));
		dataRequest.setWithCredentials(true);

		if(userIds.length <= 0) {
			altspace.getUser().then(function(user) {
				userIds.push(user.userId);
				requestUserData();
			});
		}
		else {
			requestUserData();
		}
	}

	function update(deltaTime) {
		if(!loading && userIds.length > 0) {
			time -= deltaTime;
			if(time <= 0) requestUserData();
		}
	}

	function onLoaded(obj) {
		var json = JSON.parse(obj);

		for(var jsonuser of json.users) {
			if(jsonuser && jsonuser.user_id) {
				var userId = jsonuser.user_id;

				var user = users[userId] || { userId: userId };
				users[userId] = user;

				var oldUsername = user.username;
				user.username = jsonuser.username || null;

				var oldDisplayName = user.displayName;
				user.displayName = jsonuser.display_name || null;

				var oldOnline = user.online;
				user.online = jsonuser.online || false;

				var jsonavatar = jsonuser.user_avatar.config.avatar;

				var oldAvatarId = user.avatarId;
				user.avatarId = jsonavatar.avatar_sid || null;

				var oldAvatarColors = user.avatarColors;
				var oldAvatarTextures = user.avatarTextures;
				var avatarAppearanceChanged = (user.avatarId !== oldAvatarId);
				var avatarClass;

				switch(user.avatarId) {
					// Rubenoid Avatars
					case 'rubenoid-male-01':
					case 'rubenoid-female-01': {
						avatarClass = 'Rubenoid';
						var texturePrefix = (user.avatarId === 'rubenoid-male-01') ? 'rubenoid-male-texture-' : 'rubenoid-female-texture-';
						user.avatarTextures = { 'hair': jsonavatar[texturePrefix + '1'][0], 'skin': jsonavatar[texturePrefix + '2'][0], 'clothing': jsonavatar[texturePrefix + '3'][0] };
						user.avatarColors = {};
						if(!avatarAppearanceChanged) avatarAppearanceChanged = (oldAvatarTextures['hair'] !== user.avatarTextures['hair'] || oldAvatarTextures['skin'] !== user.avatarTextures['skin'] || oldAvatarTextures['clothing'] !== user.avatarTextures['clothing']);
						break;
					}

					// Robothead Avatars
					case 'robothead-roundguy-01':
					case 'robothead-propellerhead-01': {
						avatarClass = 'Robothead';
						user.avatarColors = { 'highlight': getAvatarColor(jsonavatar['robothead-highlight-color']) };
						user.avatarTextures = {};
						if(!avatarAppearanceChanged) avatarAppearanceChanged = (!oldAvatarColors['highlight'] || !oldAvatarColors['highlight'].equals(user.avatarColors['highlight']));
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
						user.avatarColors = { 'primary': getAvatarColor(jsonavatar['primary-color']), 'highlight': getAvatarColor(jsonavatar['highlight-color']) };
						user.avatarTextures = {};
						if(!avatarAppearanceChanged) avatarAppearanceChanged = (!oldAvatarColors['primary'] || !oldAvatarColors['highlight'] || !oldAvatarColors['primary'].equals(user.avatarColors['primary']) || !oldAvatarColors['highlight'].equals(user.avatarColors['highlight']));
						break;
					}

					default: {
						avatarClass = '';
						user.avatarColors = {};
						user.avatarTextures = {};
						if(trace) console.log('Unknown avatar type: ' + user.avatarId);
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
					* @memberof module:altspace/utilities/behaviors.UserEvents
					*/
					object3d.dispatchEvent({
						type: 'userchange',
						detail: {
							userId: user.userId,
							username: user.username,
							displayName: user.displayName
						},
						bubbles: true,
						target: object3d
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
					* @property {Object} textures Texture identifier preferences for the avatar.  This typically provides
					* 'hair', 'skin' and 'clothing' properties for Rubenoid avatars.
					* @property {THREE.Object3D} target - The object which emitted the event.
					* @memberof module:altspace/utilities/behaviors.UserEvents
					*/
					object3d.dispatchEvent({
						type: 'avatarchange',
						detail: {
							userId: user.userId,
							avatarId: user.avatarId,
							avatarClass: avatarClass,
							colors: user.avatarColors,
							textures: user.avatarTextures
						},
						bubbles: true,
						target: object3d
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
					* @memberof module:altspace/utilities/behaviors.UserEvents
					*/
					object3d.dispatchEvent({
						type: 'avatarstatus',
						detail: {
							userId: user.userId,
							displayName: user.displayName,
							online: (user.online ? true : false)
						},
						bubbles: true,
						target: object3d
					});
				}
			}
		}

		loading = false;
	}

	function onError(xhr) {
		if(trace) {
			var url = xhr.target.responseURL || '';
			console.log('Error loading avatar data ' + url);
		}

		loading = false;
	}

	/**
	* Subscribe to receiving events for a given User ID
	*
	* @method subscribeUser
	* @param {String} userId - User ID to receive events for.
	* @memberof module:altspace/utilities/behaviors.UserEvents
	*/
	function subscribeUser(userId) {
		var index = userIds.indexOf(userId);
		if(index === -1) userIds.push(userId);
	}

	/**
	* Unsubscribe from receiving events for a given User ID
	*
	* @method unsubscribeUser
	* @param {String} userId - User ID to stop receiving events for.
	* @memberof module:altspace/utilities/behaviors.UserEvents
	*/
	function unsubscribeUser(userId) {
		var index = userIds.indexOf(userId);
		if(index >= 0) userIds.splice(index, 1);
	}

	function requestUserData() {
		if(!dataRequest || loading || userIds.length <= 0) return;

		var requestUserIds = [];
		for(var userId of userIds) {
			if(!onRequestData || onRequestData(userId, object3d)) requestUserIds.push(userId);
		}

		if(requestUserIds.length > 0) {
			// Authenticates Using Positron Session Exposed By AltspaceSDK
			// https://account.altvr.com/api/v1/users/<userid1>,<userid2>,...
			dataRequest.load('https://account.altvr.com/api/v1/users/' + requestUserIds.join(), onLoaded, undefined, onError);

			time = refreshTime;
			loading = true;
		}
	}

	function getAvatarColor(color) {
		function getColorFromRGB(r, g, b) {
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

		if(typeof(color[0]) === 'string') return getColorFromName(color[0]);
		return getColorFromRGB(color[0], color[1], color[2]);
	}

	return { awake: awake, update: update, subscribeUser: subscribeUser, unsubscribeUser: unsubscribeUser, type: 'UserEvents' };
}

altspace = altspace || {};
altspace.utilities = altspace.utilities || {};
altspace.utilities.behaviors = altspace.utilities.behaviors || {};
altspace.utilities.behaviors.UserEvents = UserEventsBehavior;