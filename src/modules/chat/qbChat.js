'use strict';

/** JSHint inline rules */
/* globals $pres, $msg, $iq */

var chatUtils = require('./qbChatHelpers'),
    config = require('../../qbConfig'),
    Utils = require('../../qbUtils'),
    XMPP = require('nativescript-xmpp-client'),
    StreamManagement = require('../../plugins/streamManagement');

function ChatProxy(service) {
    var self = this;

    self.Client = new XMPP.Client({
        'websocket': {
            'url': config.chatProtocol.websocket
        },
        'reconnect': true,
        'autostart': false
    });

    // override 'send' function to add some logs
    var originSendFunction = self.Client.send;
    
    self.Client.send = function(stanza) {
        Utils.QBLog('[QB-Chat]', 'SENT:', stanza.toString());
        originSendFunction.call(self.Client, stanza);
    };

    self.nodeStanzasCallbacks = {};

    this.service = service;

    this._isLogout = false;
    this._isDisconnected = false;

    //
    this.helpers = new Helpers();
    //
    var options = {
        service: service,
        helpers: self.helpers,
        stropheClient: self.connection,
        xmppClient: self.Client,
        nodeStanzasCallbacks: self.nodeStanzasCallbacks
    };

    this.roster = new RosterProxy(options);
    this.privacylist = new PrivacyListProxy(options);
    this.muc = new MucProxy(options);
    //
    this.chatUtils = chatUtils;

    if (config.streamManagement.enable){
        if (config.chatProtocol.active === 2) {
            this.streamManagement = new StreamManagement(config.streamManagement);
            self._sentMessageCallback = function(messageLost, messageSent) {
                if (typeof self.onSentMessageCallback === 'function') {
                    if (messageSent) {
                        self.onSentMessageCallback(null, messageSent);
                    } else {
                        self.onSentMessageCallback(messageLost);
                    }
                }
            };
        } else {
            Utils.QBLog('[QB-Chat] StreamManagement:', 'BOSH protocol doesn\'t support stream management. Set WebSocket as the "chatProtocol" parameter to use this functionality. https://quickblox.com/developers/Javascript#Configuration');
        }
    }

    /**
     * User's callbacks (listener-functions):
     * - onMessageListener (userId, message)
     * - onMessageErrorListener (messageId, error)
     * - onSentMessageCallback (messageLost, messageSent)
     * - onMessageTypingListener (isTyping, userId, dialogId)
     * - onDeliveredStatusListener (messageId, dialogId, userId);
     * - onReadStatusListener (messageId, dialogId, userId);
     * - onSystemMessageListener (message)
     * - onKickOccupant(dialogId, initiatorUserId)
     * - onJoinOccupant(dialogId, userId)
     * - onLeaveOccupant(dialogId, userId)
     * - onContactListListener (userId, type)
     * - onSubscribeListener (userId)
     * - onConfirmSubscribeListener (userId)
     * - onRejectSubscribeListener (userId)
     * - onLastUserActivityListener (userId, seconds)
     * - onDisconnectedListener
     * - onReconnectListener
     */

    /**
     * You need to set onMessageListener function, to get messages. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Create_new_dialog More info.}
     * @function onMessageListener
     * @memberOf QB.chat
     * @param {Number} userId - Sender id
     * @param {Object} message - The message model object
     **/

    /**
     * Blocked entities receive an error when try to chat with a user in a 1-1 chat and receivie nothing in a group chat. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Blocked_user_attempts_to_communicate_with_user More info.}
     * @function onMessageErrorListener
     * @memberOf QB.chat
     * @param {Number} messageId - The message id
     * @param {Object} error - The error object
     **/

    /**
     * This feature defines an approach for ensuring is the message delivered to the server. This feature is unabled by default. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Sent_message More info.}
     * @function onSentMessageCallback
     * @memberOf QB.chat
     * @param {Object} messageLost - The lost message model object (Fail)
     * @param {Object} messageSent - The sent message model object (Success)
     **/

    /**
     * Show typing status in chat or groupchat. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Typing_status More info.}
     * @function onMessageTypingListener
     * @memberOf QB.chat
     * @param {Boolean} isTyping - Typing Status (true - typing, false - stop typing)
     * @param {Number} userId - Typing user id
     * @param {String} dialogId - The dialog id
     **/

    /**
     * Receive delivery confirmations {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Delivered_status More info.}
     * @function onDeliveredStatusListener
     * @memberOf QB.chat
     * @param {String} messageId - Delivered message id
     * @param {String} dialogId - The dialog id
     * @param {Number} userId - User id
     **/

    /**
     * You can manage 'read' notifications in chat. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Read_status More info.}
     * @function onReadStatusListener
     * @memberOf QB.chat
     * @param {String} messageId - Read message id
     * @param {String} dialogId - The dialog id
     * @param {Number} userId - User Id
     **/

    /**
     * These messages work over separated channel and won't be mixed with the regular chat messages. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#System_notifications More info.}
     * @function onSystemMessageListener
     * @memberOf QB.chat
     * @param {Object} message - The system message model object. Always have type: 'headline'
     **/

    /**
     * You will receive this callback when you are in group chat dialog(joined) and other user (chat dialog's creator) removed you from occupants.
     * @function onKickOccupant
     * @memberOf QB.chat
     * @param {String} dialogId - An id of chat dialog where you was kicked from.
     * @param {Number} initiatorUserId - An id of user who has kicked you.
     **/

    /**
     * You will receive this callback when some user joined group chat dialog you are in.
     * @function onJoinOccupant
     * @memberOf QB.chat
     * @param {String} dialogId - An id of chat dialog that user joined.
     * @param {Number} userId - An id of user who joined chat dialog.
     **/

    /**
     * You will receive this callback when some user left group chat dialog you are in.
     * @function onLeaveOccupant
     * @memberOf QB.chat
     * @param {String} dialogId - An id of chat dialog that user left.
     * @param {Number} userId - An id of user who left chat dialog.
     **/

    /**
     * Receive user status (online / offline). {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Roster_callbacks More info.}
     * @function onContactListListener
     * @memberOf QB.chat
     * @param {Number} userId - The sender ID
     * @param {String} type - If user leave the chat, type will be 'unavailable'
     **/

    /**
     * Receive subscription request. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Roster_callbacks More info.}
     * @function onSubscribeListener
     * @memberOf QB.chat
     * @param {Number} userId - The sender ID
     **/

    /**
     * Receive confirm request. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Roster_callbacks More info.}
     * @function onConfirmSubscribeListener
     * @memberOf QB.chat
     * @param {Number} userId - The sender ID
     **/

    /**
     * Receive reject request. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Roster_callbacks More info.}
     * @function onRejectSubscribeListener
     * @memberOf QB.chat
     * @param {Number} userId - The sender ID
     **/

    /**
     * Receive user's last activity (time ago). {@link https://xmpp.org/extensions/xep-0012.html More info.}
     * @function onLastUserActivityListener
     * @memberOf QB.chat
     * @param {Number} userId - The user's ID which last activity time we receive
     * @param {Number} seconds - Time ago (last activity in seconds or 0 if user online or undefined if user never registered in chat)
     */

    /**
     * Run after disconnect from chat. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Logout_from_Chat More info.}
     * @function onDisconnectedListener
     * @memberOf QB.chat
     **/

    /**
     * By default Javascript SDK reconnects automatically when connection to server is lost. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Reconnection More info.}
     * @function onReconnectListener
     * @memberOf QB.chat
     **/


    this._onMessage = function(stanza) {
        var from = chatUtils.getAttr(stanza, 'from'),
            to = chatUtils.getAttr(stanza, 'to'),
            type = chatUtils.getAttr(stanza, 'type'),
            messageId = chatUtils.getAttr(stanza, 'id'),
            markable = chatUtils.getElement(stanza, 'markable'),
            delivered = chatUtils.getElement(stanza, 'received'),
            read = chatUtils.getElement(stanza, 'displayed'),
            composing = chatUtils.getElement(stanza, 'composing'),
            paused = chatUtils.getElement(stanza, 'paused'),
            invite = chatUtils.getElement(stanza, 'invite'),
            delay = chatUtils.getElement(stanza, 'delay'),
            extraParams = chatUtils.getElement(stanza, 'extraParams'),
            bodyContent = chatUtils.getElementText(stanza, 'body'),
            forwarded = chatUtils.getElement(stanza, 'forwarded'),
            extraParamsParsed,
            recipientId,
            recipient,
            jid;

        if (forwarded) {
            var forwardedMessage = chatUtils.getElement(forwarded, 'message');

            recipient = chatUtils.getAttr(forwardedMessage, 'to');
            recipientId = recipient ? self.helpers.getIdFromNode(recipient) : null;
        }

        jid = self.Client.options.jid.user;

        var dialogId = type === 'groupchat' ? self.helpers.getDialogIdFromNode(from) : null,
            userId = type === 'groupchat' ? self.helpers.getIdFromResource(from) : self.helpers.getIdFromNode(from),
            marker = delivered || read || null;

        // ignore invite messages from MUC
        if (invite) return true;

        if (extraParams) {
            extraParamsParsed = chatUtils.parseExtraParams(extraParams);

            if (extraParamsParsed.dialogId) {
                dialogId = extraParamsParsed.dialogId;
            }
        }

        if (composing || paused) {
            if (typeof self.onMessageTypingListener === 'function' && (type === 'chat' || type === 'groupchat' || !delay)){
                Utils.safeCallbackCall(self.onMessageTypingListener, !!composing, userId, dialogId);
            }

            return true;
        }

        if (marker) {
            if (delivered) {
                if (typeof self.onDeliveredStatusListener === 'function' && type === 'chat') {
                    Utils.safeCallbackCall(self.onDeliveredStatusListener, chatUtils.getAttr(delivered, 'id'), dialogId, userId);
                }
            } else {
                if (typeof self.onReadStatusListener === 'function' && type === 'chat') {
                    Utils.safeCallbackCall(self.onReadStatusListener, chatUtils.getAttr(read, 'id'), dialogId, userId);
                }
            }

            return true;
        }

        // autosend 'received' status (ignore messages from yourself)
        if (markable && userId != self.helpers.getIdFromNode(jid)) {
            var autoSendReceiveStatusParams = {
                messageId: messageId,
                userId: userId,
                dialogId: dialogId
            };

            self.sendDeliveredStatus(autoSendReceiveStatusParams);
        }

        var message = {
            id: messageId,
            dialog_id: dialogId,
            recipient_id: recipientId,
            type: type,
            body: bodyContent,
            extension: extraParamsParsed ? extraParamsParsed.extension : null,
            delay: delay
        };

        if (markable) {
            message.markable = 1;
        }

        if (typeof self.onMessageListener === 'function' && (type === 'chat' || type === 'groupchat')){
            Utils.safeCallbackCall(self.onMessageListener, userId, message);
        }

        // we must return true to keep the handler alive
        // returning false would remove it after it finishes
        return true;
    };

    this._onPresence = function(stanza) {
        var from = chatUtils.getAttr(stanza, 'from'),
            to = chatUtils.getAttr(stanza, 'to'),
            id = chatUtils.getAttr(stanza, 'id'),
            type = chatUtils.getAttr(stanza, 'type'),
            currentUserId = self.helpers.getIdFromNode(self.helpers.userCurrentJid(self.Client)),
            x = chatUtils.getElement(stanza, 'x'),
            xXMLNS, status, statusCode, dialogId, userId;

        if (x) {
            xXMLNS = chatUtils.getAttr(x, 'xmlns');
            status = chatUtils.getElement(x, 'status');

            if (status) {
                statusCode = chatUtils.getAttr(status, 'code');
            }
        }

        // MUC presences go here
        if (xXMLNS && xXMLNS === "http://jabber.org/protocol/muc#user") {
            dialogId = self.helpers.getDialogIdFromNode(from);
            userId = self.helpers.getUserIdFromRoomJid(from);

            // KICK from dialog event
            if (status && statusCode == "301") {
                if (typeof self.onKickOccupant === 'function') {
                    var actorElement = chatUtils.getElement(chatUtils.getElement(x, 'item'), 'actor');
                    var initiatorUserJid = chatUtils.getAttr(actorElement, 'jid');

                    Utils.safeCallbackCall(self.onKickOccupant,
                        dialogId,
                        self.helpers.getIdFromNode(initiatorUserJid)
                    );
                }

                delete self.muc.joinedRooms[self.helpers.getRoomJidFromRoomFullJid(from)];

                return true;
            // Occupants JOIN/LEAVE events
            } else if (!status) {
                if (userId != currentUserId) {
                    // Leave
                    if (type && type === 'unavailable') {
                        if (typeof self.onLeaveOccupant === 'function') {
                            Utils.safeCallbackCall(self.onLeaveOccupant, dialogId, parseInt(userId));
                        }

                        return true;
                    // Join
                    } else {
                        if (typeof self.onJoinOccupant === 'function') {
                            Utils.safeCallbackCall(self.onJoinOccupant, dialogId, parseInt(userId));
                        }

                        return true;
                    }
                }
            }
        }

        /** MUC */
        if (xXMLNS) {
            if (xXMLNS === "http://jabber.org/protocol/muc#user") {
                /**
                 * if you make 'leave' from dialog
                 * stanza will be contains type="unavailable"
                 */
                if (type && type === 'unavailable') {
                    /** LEAVE from dialog */
                    if (status && statusCode == "110") {
                        if (typeof self.nodeStanzasCallbacks['muc:leave'] === 'function') {
                            Utils.safeCallbackCall(self.nodeStanzasCallbacks['muc:leave'], null);
                        }

                        return true;
                    }
                }

                /** JOIN to dialog success */
                if (id.endsWith(":join") && status && statusCode == "110") {
                    if (typeof self.nodeStanzasCallbacks[id] === 'function') {
                        Utils.safeCallbackCall(self.nodeStanzasCallbacks[id], stanza);
                    }

                    return true;
                }
            // an error
            } else if (type && type === 'error' && xXMLNS == "http://jabber.org/protocol/muc") {
                /** JOIN to dialog error */
                if (id.endsWith(":join")) {
                    if (typeof self.nodeStanzasCallbacks[id] === 'function') {
                        Utils.safeCallbackCall(self.nodeStanzasCallbacks[id], stanza);
                    }

                    return true;
                }
            }
        }

        // ROSTER presences go here
        userId = self.helpers.getIdFromNode(from);

        if (!type) {
            if (typeof self.onContactListListener === 'function' && self.roster.contacts[userId] && self.roster.contacts[userId].subscription !== 'none'){
                Utils.safeCallbackCall(self.onContactListListener, userId);
            }
        } else {
            switch (type) {
                case 'subscribe':
                    if (self.roster.contacts[userId] && self.roster.contacts[userId].subscription === 'to') {
                        self.roster.contacts[userId] = {
                            subscription: 'both',
                            ask: null
                        };

                        self.roster._sendSubscriptionPresence({
                            jid: from,
                            type: 'subscribed'
                        });
                    } else {
                        if (typeof self.onSubscribeListener === 'function') {
                            Utils.safeCallbackCall(self.onSubscribeListener, userId);
                        }
                    }
                    break;
                case 'subscribed':
                    if (self.roster.contacts[userId] && self.roster.contacts[userId].subscription === 'from') {
                        self.roster.contacts[userId] = {
                            subscription: 'both',
                            ask: null
                        };
                    } else {
                        self.roster.contacts[userId] = {
                            subscription: 'to',
                            ask: null
                        };

                        if (typeof self.onConfirmSubscribeListener === 'function'){
                            Utils.safeCallbackCall(self.onConfirmSubscribeListener, userId);
                        }
                    }
                    break;
                case 'unsubscribed':
                    self.roster.contacts[userId] = {
                        subscription: 'none',
                        ask: null
                    };

                    if (typeof self.onRejectSubscribeListener === 'function') {
                        Utils.safeCallbackCall(self.onRejectSubscribeListener, userId);
                    }

                    break;
                case 'unsubscribe':
                    self.roster.contacts[userId] = {
                        subscription: 'to',
                        ask: null
                    };

                    break;
                case 'unavailable':
                    if (typeof self.onContactListListener === 'function' && self.roster.contacts[userId] && self.roster.contacts[userId].subscription !== 'none') {
                        Utils.safeCallbackCall(self.onContactListListener, userId, type);
                    }

                    // send initial presence if one of client (instance) goes offline
                    if (userId === currentUserId) {
                        self.Client.send(chatUtils.createStanza(XMPP.Stanza, null,'presence'));
                    }

                    break;
            }
        }

        // we must return true to keep the handler alive
        // returning false would remove it after it finishes
        return true;
    };

    this._onIQ = function(stanza) {
        var stanzaId = chatUtils.getAttr(stanza, 'id'),
            isLastActivity = stanzaId.indexOf('lastActivity') > -1;

        if (typeof self.onLastUserActivityListener === 'function' && isLastActivity) {
            var from = chatUtils.getAttr(stanza, 'from'),
                userId = self.helpers.getIdFromNode(from),
                query = chatUtils.getElement(stanza, 'query'),
                error = chatUtils.getElement(stanza, 'error'),
                seconds = error ? undefined : +chatUtils.getAttr(query, 'seconds');

            Utils.safeCallbackCall(self.onLastUserActivityListener, userId, seconds);
        }

        if (self.nodeStanzasCallbacks[stanzaId]) {
            Utils.safeCallbackCall(self.nodeStanzasCallbacks[stanzaId], stanza);
            delete self.nodeStanzasCallbacks[stanzaId];
        }

        return true;
    };

    this._onSystemMessageListener = function(stanza) {
        var from = chatUtils.getAttr(stanza, 'from'),
            to = chatUtils.getAttr(stanza, 'to'),
            messageId = chatUtils.getAttr(stanza, 'id'),
            extraParams = chatUtils.getElement(stanza, 'extraParams'),
            userId = self.helpers.getIdFromNode(from),
            delay = chatUtils.getElement(stanza, 'delay'),
            moduleIdentifier = chatUtils.getElementText(extraParams, 'moduleIdentifier'),
            bodyContent = chatUtils.getElementText(stanza, 'body'),
            extraParamsParsed = chatUtils.parseExtraParams(extraParams),
            message;

        if (moduleIdentifier === 'SystemNotifications' && typeof self.onSystemMessageListener === 'function') {
            message = {
                id: messageId,
                userId: userId,
                body: bodyContent,
                extension: extraParamsParsed.extension
            };

            Utils.safeCallbackCall(self.onSystemMessageListener, message);
        }

        /**
         * we must return true to keep the handler alive
         * returning false would remove it after it finishes
         */
        return true;
    };

    this._onMessageErrorListener = function(stanza) {
        // <error code="503" type="cancel">
        //   <service-unavailable xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"/>
        //   <text xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" xml:lang="en">Service not available.</text>
        // </error>

        var messageId = chatUtils.getAttr(stanza, 'id');
        var error = chatUtils.getErrorFromXMLNode(stanza);

        // fire 'onMessageErrorListener'
        //
        if (typeof self.onMessageErrorListener === 'function') {
            Utils.safeCallbackCall(self.onMessageErrorListener, messageId, error);
        }

        // we must return true to keep the handler alive
        // returning false would remove it after it finishes
        return true;
    };
}

/* Chat module: Core
 ----------------------------------------------------------------------------- */
ChatProxy.prototype = {

    /**
     * self.connection to the chat. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Login_to_Chat More info.}
     * @memberof QB.chat
     * @param {Object} params - Connect to the chat parameters
     * @param {Number} params.userId - Connect to the chat by user id (use instead params.email and params.jid)
     * @param {String} params.jid - Connect to the chat by user jid (use instead params.userId and params.email)
     * @param {String} params.email - Connect to the chat by user's email (use instead params.userId and params.jid)
     * @param {String} params.password - The user's password or session token
     * @param {Boolean} [params.connectWithoutGettingRoster=false] - true if you don't need to get roster of subscriptions
     * @param {chatConnectCallback} callback - The chatConnectCallback callback
     * */
    connect: function(params, callback) {
        /**
         * This callback Returns error or contact list.
         * @callback chatConnectCallback
         * @param {Object} error - The error object
         * @param {(Object|Boolean)} response - Object of subscribed users (roster) or empty body.
         * */
        Utils.QBLog('[QB-Chat]', 'connect', JSON.stringify(params));

        var self = this,
            rooms,
            err;

        var userJid = chatUtils.buildUserJid(params);
        
        self.Client.options.jid = userJid;
        self.Client.options.password = params.password;

        /** HANDLERS */
        self.Client.on('auth', function () {
            Utils.QBLog('[QB-Chat]', 'Status.CONNECTED at ' + chatUtils.getLocalTime());
        });

        self.Client.on('online', function () {
            Utils.QBLog('[QB-Chat]', 'Status.CONNECTED at ' + chatUtils.getLocalTime());

            if (config.streamManagement.enable) {
                self.streamManagement.enable(self.Client, XMPP);
                self.streamManagement.sentMessageCallback = self._sentMessageCallback;
            }

            self._isDisconnected = false;
            self._isLogout = false;

            self.helpers.setUserCurrentJid(self.helpers.userCurrentJid(self.Client));

            /** Send first presence if user is online */
            var presence = chatUtils.createStanza(XMPP.Stanza, null, 'presence');

            self.Client.send(presence);

            if (typeof callback === 'function') {
                if (params.connectWithoutGettingRoster) {
                    // connected and return nothing as result
                    callback(null, true);
                    // get the roster and save
                    self.roster.get(function(contacts) {
                        self.roster.contacts = contacts;
                    });
                } else {
                    // get the roster and save
                    self.roster.get(function(contacts) {
                        self.roster.contacts = contacts;
                        // connected and return roster as result
                        callback(null, self.roster.contacts);
                    });
                }
            } else {
                // recover the joined rooms
                rooms = Object.keys(self.muc.joinedRooms);

                Utils.QBLog('[QB-Chat]', 'Re-joining ' + rooms.length + " rooms.");
                for (var i = 0, len = rooms.length; i < len; i++) {
                    self.muc.join(rooms[i]);
                }

                // fire 'onReconnectListener'
                if (typeof self.onReconnectListener === 'function'){
                    Utils.safeCallbackCall(self.onReconnectListener);
                }
            }
        });

        self.Client.on('connect', function () {
            Utils.QBLog('[QB-Chat] client is connected');
            self._enableCarbons();
        });

        self.Client.on('reconnect', function () {
            Utils.QBLog('[QB-Chat] client is reconnected');

            self._isDisconnected = true;
            self._isLogout = true;
        });

        self.Client.on('disconnect', function () {
            Utils.QBLog('[QB-Chat] client is disconnected');

            // fire 'onDisconnectedListener' only once
            if (!self._isDisconnected && typeof self.onDisconnectedListener === 'function'){
                Utils.safeCallbackCall(self.onDisconnectedListener);
            }

            self._isLogout = true;
            self._isDisconnected = true;
        });

        self.Client.on('stanza', function (stanza) {
            Utils.QBLog('[QB-Chat] RECV:', stanza.toString());

            /**
             * Detect typeof incoming stanza
             * and fire the Listener
             */
            if (stanza.is('presence')) {
                self._onPresence(stanza);
            } else if (stanza.is('iq')) {
                self._onIQ(stanza);
            } else if(stanza.is('message')){
                if(stanza.attrs.type === 'headline') {
                    self._onSystemMessageListener(stanza);
                }else if(stanza.attrs.type === 'error') {
                    self._onMessageErrorListener(stanza);
                } else {
                    self._onMessage(stanza);
                }
            }
        });

        self.Client.on('offline', function() {
            Utils.QBLog('[QB-Chat] client goes offline');

            self._isDisconnected = true;
            self._isLogout = true;
        });

        self.Client.on('error', function(e) {
            Utils.QBLog('[QB-Chat] client got error', JSON.stringify(e));

            self._isDisconnected = true;
            self._isLogout = true;

            err = Utils.getError(422, 'Status.ERROR - An error has occurred');

            if (typeof callback === 'function') {
                callback(err, null);
            }
        });

        self.Client.connect();
    },

    /**
     * Send message to 1 to 1 or group dialog. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Chat_in_dialog More info.}
     * @memberof QB.chat
     * @param {String | Number} jid_or_user_id - Use opponent id or jid for 1 to 1 chat, and room jid for group chat.
     * @param {Object} message - The message object.
     * @returns {String} messageId - The current message id (was generated by SDK)
     * */
    send: function(jid_or_user_id, message) {
        var self = this,
            builder = XMPP.Stanza;

        var paramsCreateMsg = {
            from: self.helpers.getUserCurrentJid(),
            to: this.helpers.jidOrUserId(jid_or_user_id),
            type: message.type ? message.type : 'chat',
            id: message.id ? message.id : Utils.getBsonObjectId()
        };

        var stanza = chatUtils.createStanza(builder, paramsCreateMsg);

        if (message.body) {
            stanza.c('body', {
                xmlns: chatUtils.MARKERS.CLIENT,
            }).t(message.body).up();
        }

        if (message.markable) {
            stanza.c('markable', {
                xmlns: chatUtils.MARKERS.CHAT
            }).up();
        }

        if (message.extension) {
            stanza.c('extraParams', {
                xmlns: chatUtils.MARKERS.CLIENT
            });

            stanza = chatUtils.filledExtraParams(stanza, message.extension);
        }

        if (config.streamManagement.enable) {
            message.id = paramsCreateMsg.id;
            message.jid_or_user_id = jid_or_user_id;
            self.Client.send(stanza, message);
        } else {
            self.Client.send(stanza);
        }

        return paramsCreateMsg.id;
    },

    /**
     * Send system message (system notification) to 1 to 1 or group dialog. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#System_notifications More info.}
     * @memberof QB.chat
     * @param {String | Number} jid_or_user_id - Use opponent id or jid for 1 to 1 chat, and room jid for group chat.
     * @param {Object} message - The message object.
     * @returns {String} messageId - The current message id (was generated by SDK)
     * */
    sendSystemMessage: function(jid_or_user_id, message) {
        var self = this,
            builder = XMPP.Stanza,
            paramsCreateMsg = {
                type: 'headline',
                id: message.id ? message.id : Utils.getBsonObjectId(),
                to: this.helpers.jidOrUserId(jid_or_user_id)
            };

        var stanza = chatUtils.createStanza(builder, paramsCreateMsg);

        if (message.body) {
            stanza.c('body', {
                xmlns: chatUtils.MARKERS.CLIENT,
            }).t(message.body).up();
        }

        if (message.extension) {
            stanza.c('extraParams',  {
                xmlns: chatUtils.MARKERS.CLIENT
            }).c('moduleIdentifier').t('SystemNotifications');

            stanza = chatUtils.filledExtraParams(stanza, message.extension);
        }

        self.Client.send(stanza);

        return paramsCreateMsg.id;
    },

    /**
     * Send is typing status. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Typing_status More info.}
     * @memberof QB.chat
     * @param {String | Number} jid_or_user_id - Use opponent id or jid for 1 to 1 chat, and room jid for group chat.
     * */
    sendIsTypingStatus: function(jid_or_user_id) {
        var self = this,
            stanzaParams = {
                from: self.helpers.getUserCurrentJid(),
                to: this.helpers.jidOrUserId(jid_or_user_id),
                type: this.helpers.typeChat(jid_or_user_id)
            },
            builder = XMPP.Stanza;

        var stanza = chatUtils.createStanza(builder, stanzaParams);

        stanza.c('composing', {
            xmlns: chatUtils.MARKERS.STATES
        });

        self.Client.send(stanza);
    },

    /**
     * Send is stop typing status. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Typing_status More info.}
     * @memberof QB.chat
     * @param {String | Number} jid_or_user_id - Use opponent id or jid for 1 to 1 chat, and room jid for group chat.
     * */
    sendIsStopTypingStatus: function(jid_or_user_id) {
        var self = this,
            stanzaParams = {
                from: self.helpers.getUserCurrentJid(),
                to: this.helpers.jidOrUserId(jid_or_user_id),
                type: this.helpers.typeChat(jid_or_user_id)
            },
            builder = XMPP.Stanza;

        var stanza = chatUtils.createStanza(builder, stanzaParams);

        stanza.c('paused', {
            xmlns: chatUtils.MARKERS.STATES
        });

        self.Client.send(stanza);
    },

    /**
     * Send is delivered status. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Delivered_status More info.}
     * @memberof QB.chats
     * @param {Object} params - Object of parameters
     * @param {Number} params.userId - The receiver id
     * @param {Number} params.messageId - The delivered message id
     * @param {Number} params.dialogId - The dialog id
     * */
    sendDeliveredStatus: function(params) {
        var self = this,
            stanzaParams = {
                type: 'chat',
                from: self.helpers.getUserCurrentJid(),
                id: Utils.getBsonObjectId(),
                to: this.helpers.jidOrUserId(params.userId)
            },
            builder = XMPP.Stanza;

        var stanza = chatUtils.createStanza(builder, stanzaParams);

        stanza.c('received', {
            xmlns: chatUtils.MARKERS.MARKERS,
            id: params.messageId
        }).up();

        stanza.c('extraParams', {
            xmlns: chatUtils.MARKERS.CLIENT
        }).c('dialog_id').t(params.dialogId);

        self.Client.send(stanza);
    },

    /**
     * Send is read status. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Read_status More info.}
     * @memberof QB.chat
     * @param {Object} params - Object of parameters
     * @param {Number} params.userId - The receiver id
     * @param {Number} params.messageId - The delivered message id
     * @param {Number} params.dialogId - The dialog id
     * */
    sendReadStatus: function(params) {
        var self = this,
            stanzaParams = {
                type: 'chat',
                from: self.helpers.getUserCurrentJid(),
                to: this.helpers.jidOrUserId(params.userId),
                id: Utils.getBsonObjectId()
            },
            builder = XMPP.Stanza;

        var stanza = chatUtils.createStanza(builder, stanzaParams);

        stanza.c('displayed', {
            xmlns: chatUtils.MARKERS.MARKERS,
            id: params.messageId
        }).up();

        stanza.c('extraParams', {
            xmlns: chatUtils.MARKERS.CLIENT
        }).c('dialog_id').t(params.dialogId);

        self.Client.send(stanza);
    },

    /**
     * Send query to get last user activity by QB.chat.onLastUserActivityListener(userId, seconds). {@link https://xmpp.org/extensions/xep-0012.html More info.}
     * @memberof QB.chat
     * @param {(Number|String)} jid_or_user_id - The user id or jid, that the last activity we want to know
     * */
    getLastUserActivity: function(jid_or_user_id) {
        var iqParams,
            builder,
            iq;

        iqParams = {
            'from': this.helpers.getUserCurrentJid(),
            'id': this.helpers.getUniqueId('lastActivity'),
            'to': this.helpers.jidOrUserId(jid_or_user_id),
            'type': 'get'
        };

        builder = XMPP.Stanza;

        iq = chatUtils.createStanza(builder, iqParams, 'iq');

        iq.c('query', {
            'xmlns': chatUtils.MARKERS.LAST
        });

        this.Client.send(iq);
    },

    /**
     * Logout from the Chat. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Logout_from_Chat More info.}
     * @memberof QB.chat
     * */
    disconnect: function() {
        this.muc.joinedRooms = {};
        this._isLogout = true;
        this.helpers.setUserCurrentJid('');

        this.Client.end();
    },

    /**
     * Carbons XEP [http://xmpp.org/extensions/xep-0280.html]
     */
    _enableCarbons: function(cb) {
        var self = this,
            carbonParams = {
                type: 'set',
                from: self.helpers.getUserCurrentJid(),
                id: chatUtils.getUniqueId('enableCarbons')
            },
            builder = XMPP.Stanza;

        var iq = chatUtils.createStanza(builder, carbonParams, 'iq');

        iq.c('enable', {
            xmlns: chatUtils.MARKERS.CARBONS
        });

        self.Client.send(iq);
    }
};

/* Chat module: Roster
 *
 * Integration of Roster Items and Presence Subscriptions
 * http://xmpp.org/rfcs/rfc3921.html#int
 * default - Mutual Subscription
 *
 ----------------------------------------------------------------------------- */
/**
 * @namespace QB.chat.roster
 **/
function RosterProxy(options) {
    this.service = options.service;
    this.helpers = options.helpers;
    this.connection = options.stropheClient;
    this.Client = options.xmppClient;
    this.nodeStanzasCallbacks = options.nodeStanzasCallbacks;
    //
    this.contacts = {};
}

RosterProxy.prototype = {

    /**
     * Receive contact list. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Contact_List More info.}
     * @memberof QB.chat.roster
     * @param {getRosterCallback} callback - The callback function.
     * */
    get: function(callback) {
        /**
         * This callback Return contact list.
         * @callback getRosterCallback
         * @param {Object} roster - Object of subscribed users.
         * */

        var self = this,
            contacts = {},
            iqParams = {
                'type': 'get',
                'from': self.helpers.getUserCurrentJid(),
                'id': chatUtils.getUniqueId('getRoster')
            },
            builder = XMPP.Stanza;

        var iq = chatUtils.createStanza(builder, iqParams, 'iq');

        function _getItems(stanza) {
            return stanza.getChild('query').children;
        }

        function _callbackWrap(stanza) {
            var items = _getItems(stanza);
            /** TODO */
            for (var i = 0, len = items.length; i < len; i++) {
                var userId = self.helpers.getIdFromNode( chatUtils.getAttr(items[i], 'jid') ),
                    ask = chatUtils.getAttr(items[i], 'ask'),
                    subscription = chatUtils.getAttr(items[i], 'subscription');

                contacts[userId] = {
                    subscription: subscription,
                    ask: ask || null
                };
            }

            callback(contacts);
        }

        iq.c('query', {
            xmlns: chatUtils.MARKERS.ROSTER
        });

        self.nodeStanzasCallbacks[iqParams.id] = _callbackWrap;
        self.Client.send(iq);
    },

    /**
     * Add users to contact list. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Add_users More info.}
     * @memberof QB.chat.roster
     * @param {String | Number} jidOrUserId - Use opponent id for 1 to 1 chat, and jid for group chat.
     * @param {addRosterCallback} callback - The callback function.
     * */
    add: function(jidOrUserId, callback) {

        /**
         * Callback for QB.chat.roster.add(). Run without parameters.
         * @callback addRosterCallback
         * */
        var self = this;
        var userJid = this.helpers.jidOrUserId(jidOrUserId);
        var userId = this.helpers.getIdFromNode(userJid).toString();

        self.contacts[userId] = {
            subscription: 'none',
            ask: 'subscribe'
        };

        self._sendSubscriptionPresence({
            jid: userJid,
            type: 'subscribe'
        });

        if (typeof callback === 'function') {
            callback();
        }
    },

    /**
     * Confirm subscription with some user. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Confirm_subscription_request More info.}
     * @memberof QB.chat.roster
     * @param {String | Number} jidOrUserId - Use opponent id for 1 to 1 chat, and jid for group chat.
     * @param {confirmRosterCallback} callback - The callback function.
     * */
    confirm: function(jidOrUserId, callback) {

        /**
         * Callback for QB.chat.roster.confirm(). Run without parameters.
         * @callback confirmRosterCallback
         * */
        var self = this;
        var userJid = this.helpers.jidOrUserId(jidOrUserId);
        var userId = this.helpers.getIdFromNode(userJid).toString();

        self.contacts[userId] = {
            subscription: 'from',
            ask: 'subscribe'
        };

        self._sendSubscriptionPresence({
            jid: userJid,
            type: 'subscribed'
        });

        self._sendSubscriptionPresence({
            jid: userJid,
            type: 'subscribe'
        });

        if (typeof callback === 'function') {
            callback();
        }
    },

    /**
     * Reject subscription with some user. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Reject_subscription_request More info.}
     * @memberof QB.chat.roster
     * @param {String | Number} jidOrUserId - Use opponent id for 1 to 1 chat, and jid for group chat.
     * @param {rejectRosterCallback} callback - The callback function.
     * */
    reject: function(jidOrUserId, callback) {
        /**
         * Callback for QB.chat.roster.reject(). Run without parameters.
         * @callback rejectRosterCallback
         * */
        var self = this;
        var userJid = this.helpers.jidOrUserId(jidOrUserId);
        var userId = this.helpers.getIdFromNode(userJid).toString();

        self.contacts[userId] = {
            subscription: 'none',
            ask: null
        };

        self._sendSubscriptionPresence({
            jid: userJid,
            type: 'unsubscribed'
        });

        if (typeof callback === 'function') {
            callback();
        }
    },

    /**
     * Remove subscription with some user from your contact list. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Remove_users More info.}
     * @memberof QB.chat.roster
     * @param {String | Number} jidOrUserId - Use opponent id for 1 to 1 chat, and jid for group chat.
     * @param {removeRosterCallback} callback - The callback function.
     * */
    remove: function(jidOrUserId, callback) {
        /**
         * Callback for QB.chat.roster.remove(). Run without parameters.
         * @callback removeRosterCallback
         * */
        var self = this,
            userJid = this.helpers.jidOrUserId(jidOrUserId),
            userId = this.helpers.getIdFromNode(userJid);

        var iqParams = {
            'type': 'set',
            'from': self.connection ? self.connection.jid : self.Client.jid.user,
            'id': chatUtils.getUniqueId('getRoster')
        };

        var builder = XMPP.Stanza,
            iq = chatUtils.createStanza(builder, iqParams, 'iq');

        function _callbackWrap() {
            delete self.contacts[userId];

            if (typeof callback === 'function') {
                callback();
            }
        }

        iq.c('query', {
            xmlns: chatUtils.MARKERS.ROSTER
        }).c('item', {
            jid: userJid,
            subscription: 'remove'
        });

        self.nodeStanzasCallbacks[iqParams.id] = _callbackWrap;
        self.Client.send(iq);
    },

    _sendSubscriptionPresence: function(params) {
        var builder = XMPP.Stanza,
            presParams = {
                to: params.jid,
                type: params.type
            };

        var pres = chatUtils.createStanza(builder, presParams, 'presence');

        this.Client.send(pres);
    }
};

/* Chat module: Group Chat (Dialog)
 *
 * Multi-User Chat
 * http://xmpp.org/extensions/xep-0045.html
 *
 ----------------------------------------------------------------------------- */

/**
 * @namespace QB.chat.muc
 * */
function MucProxy(options) {
    this.service = options.service;
    this.helpers = options.helpers;
    this.connection = options.stropheClient;
    this.Client = options.xmppClient;
    this.nodeStanzasCallbacks = options.nodeStanzasCallbacks;
    //
    this.joinedRooms = {};
}

MucProxy.prototype = {
    /**
     * Join to the group dialog. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Chat_in_group_dialog More info.}
     * @memberof QB.chat.muc
     * @param {String} dialogJid - Use dialog jid to join to this dialog.
     * @param {joinMacCallback} callback - The callback function.
     * */
    join: function(dialogJid, callback) {
        /**
         * Callback for QB.chat.muc.join().
         * @param {Object} resultStanza - Returns the stanza.
         * @callback joinMacCallback
         * */

        var self = this,
            id = chatUtils.getUniqueId('join');

        var presParams = {
                id: id,
                from: self.helpers.getUserCurrentJid(),
                to: self.helpers.getRoomJid(dialogJid)
            },
            builder = XMPP.Stanza;

        var pres = chatUtils.createStanza(builder, presParams, 'presence');

        pres.c('x', {
            xmlns: chatUtils.MARKERS.MUC
        }).c('history', { maxstanzas: 0 });

        this.joinedRooms[dialogJid] = true;

        if (typeof callback === 'function') {
            self.nodeStanzasCallbacks[id] = callback;
        }

        self.Client.send(pres);
    },

    /**
     * Leave group chat dialog. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Chat_in_group_dialog More info.}
     * @memberof QB.chat.muc
     * @param {String} dialogJid - Use dialog jid to join to this dialog.
     * @param {leaveMacCallback} callback - The callback function.
     * */
    leave: function(jid, callback) {
        /**
         * Callback for QB.chat.muc.leave().
         * run without parameters;
         * @callback leaveMacCallback
         * */

        var self = this,
            presParams = {
                type: 'unavailable',
                from: self.helpers.getUserCurrentJid(),
                to: self.helpers.getRoomJid(jid)
            },
            builder = XMPP.Stanza;

        var pres = chatUtils.createStanza(builder, presParams, 'presence');

        delete this.joinedRooms[jid];

        /** The answer don't contain id */
        if (typeof callback === 'function') {
            self.nodeStanzasCallbacks['muc:leave'] = callback;
        }

        self.Client.send(pres);
    },

    /**
     * Leave group chat dialog. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Chat_in_group_dialog More info.}
     * @memberof QB.chat.muc
     * @param {String} dialogJid - Use dialog jid to join to this dialog.
     * @param {listOnlineUsersMacCallback} callback - The callback function.
     * */
    listOnlineUsers: function(dialogJID, callback) {
        /**
         * Callback for QB.chat.muc.leave().
         * @param {Object} Users - list of online users
         * @callback listOnlineUsersMacCallback
         * */

        var self = this,
            onlineUsers = [];

        var iqParams = {
                type: 'get',
                to: dialogJID,
                from: self.helpers.getUserCurrentJid(),
                id: chatUtils.getUniqueId('muc_disco_items'),
            },
            builder = XMPP.Stanza;

        var iq = chatUtils.createStanza(builder, iqParams, 'iq');

        iq.c('query', {
            xmlns: 'http://jabber.org/protocol/disco#items'
        });

        function _getUsers(stanza) {
            var stanzaId = stanza.attrs.id;

            if(self.nodeStanzasCallbacks[stanzaId]) {
                var users = [],
                    items = stanza.getChild('query').getChildElements('item'),
                    userId;

                for (var i = 0, len = items.length; i < len; i++) {
                    userId = self.helpers.getUserIdFromRoomJid(items[i].attrs.jid);
                    users.push(parseInt(userId));
                }

                callback(users);
            }
        }

        self.Client.send(iq);
        self.nodeStanzasCallbacks[iqParams.id] = _getUsers;
    }
};

/* Chat module: Privacy list
 *
 * Privacy list
 * http://xmpp.org/extensions/xep-0016.html
 * by default 'mutualBlock' is work in one side
----------------------------------------------------------------------------- */
function PrivacyListProxy(options) {
    this.service = options.service;
    this.helpers = options.helpers;
    this.connection = options.stropheClient;
    this.Client = options.xmppClient;
    this.nodeStanzasCallbacks = options.nodeStanzasCallbacks;
}

/**
 * @namespace QB.chat.privacylist
 **/
PrivacyListProxy.prototype = {
    /**
     * Create a privacy list. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Create_a_privacy_list_or_edit_existing_list More info.}
     * @memberof QB.chat.privacylist
     * @param {Object} list - privacy list object.
     * @param {createPrivacylistCallback} callback - The callback function.
     * */
    create: function(list, callback) {
        /**
         * Callback for QB.chat.privacylist.create().
         * @param {Object} error - The error object
         * @callback createPrivacylistCallback
         * */
        var self = this,
            userId, userJid, userMuc,
            userAction,
            mutualBlock,
            listPrivacy = {},
            listUserId = [];

        /** Filled listPrivacys */
        for (var i = list.items.length - 1; i >= 0; i--) {
            var user = list.items[i];

            listPrivacy[user.user_id] = {
                action: user.action,
                mutualBlock: user.mutualBlock === true ? true : false
            };
        }

        /** Filled listUserId */
        listUserId = Object.keys(listPrivacy);

        var iqParams = {
                type: 'set',
                from: self.helpers.getUserCurrentJid(),
                id: chatUtils.getUniqueId('edit')
            },
            builder = XMPP.Stanza;

        var iq = chatUtils.createStanza(builder, iqParams, 'iq');

        iq.c('query', {
            xmlns: chatUtils.MARKERS.PRIVACY
        }).c('list', {
            name: list.name
        });

        function createPrivacyItem(iq, params){
            var list = iq.getChild('query').getChild('list');

            list.c('item', {
                type: 'jid',
                value: params.jidOrMuc,
                action: params.userAction,
                order: params.order
            }).c('message', {})
                .up().c('presence-in', {})
                .up().c('presence-out', {})
                .up().c('iq', {})
                .up().up();

            return iq;
        }

        function createPrivacyItemMutal(iq, params) {
            var list = iq.getChild('query').getChild('list');

            list.c('item', {
                type: 'jid',
                value: params.jidOrMuc,
                action: params.userAction,
                order: params.order
            }).up();

            return iq;
        }

        for (var index = 0, j = 0, len = listUserId.length; index < len; index++, j = j + 2) {
            userId = listUserId[index];
            mutualBlock = listPrivacy[userId].mutualBlock;

            userAction = listPrivacy[userId].action;
            userJid = self.helpers.jidOrUserId(parseInt(userId, 10));
            userMuc = self.helpers.getUserNickWithMucDomain(userId);

            if (mutualBlock && userAction === 'deny') {
                iq = createPrivacyItemMutal(iq, {
                    order: j+1,
                    jidOrMuc: userJid,
                    userAction: userAction
                });
                iq = createPrivacyItemMutal(iq, {
                    order: j+2,
                    jidOrMuc: userMuc,
                    userAction: userAction
                }).up().up();
            } else {
                iq = createPrivacyItem(iq, {
                    order: j+1,
                    jidOrMuc: userJid,
                    userAction: userAction
                });
                iq = createPrivacyItem(iq, {
                    order: j+2,
                    jidOrMuc: userMuc,
                    userAction: userAction
                });
            }
        }

        self.Client.send(iq);

        self.nodeStanzasCallbacks[iqParams.id] = function (stanza) {
            if(!stanza.getChildElements('error').length){
                callback(null);
            } else {
                callback(Utils.getError(408));
            }
        };
    },

    /**
     * Get the privacy list. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Retrieve_a_privacy_list More info.}
     * @memberof QB.chat.privacylist
     * @param {String} name - The name of the list.
     * @param {getListPrivacylistCallback} callback - The callback function.
     * */
    getList: function(name, callback) {
        /**
         * Callback for QB.chat.privacylist.getList().
         * @param {Object} error - The error object
         * @param {Object} response - The privacy list object
         * @callback getListPrivacylistCallback
         * */

        var self = this;

        var iqParams = {
                type: 'get',
                from: self.helpers.getUserCurrentJid(),
                id: chatUtils.getUniqueId('getlist')
            },
            builder = XMPP.Stanza;

        var iq = chatUtils.createStanza(builder, iqParams, 'iq');

        iq.c('query', {
            xmlns: chatUtils.MARKERS.PRIVACY
        }).c('list', {
            name: name
        });

        self.nodeStanzasCallbacks[iqParams.id] = function(stanza){
            var stanzaQuery = stanza.getChild('query'),
                list = stanzaQuery ? stanzaQuery.getChild('list') : null,
                items = list ? list.getChildElements('item') : null,
                userJid, userId, usersList = [];

            for (var i = 0, len = items.length; i < len; i=i+2) {
                userJid = items[i].attrs.value;
                userId = self.helpers.getIdFromNode(userJid);
                usersList.push({
                    user_id: userId,
                    action: items[i].attrs.action
                });
            }

            list = {
                name: list.attrs.name,
                items: usersList
            };

            callback(null, list);

            delete self.nodeStanzasCallbacks[iqParams.id];
        };

        self.Client.send(iq);
    },

    /**
     * Update the privacy list.
     * @memberof QB.chat.privacylist
     * @param {String} name - The name of the list.
     * @param {updatePrivacylistCallback} callback - The callback function.
     * */
    update: function(listWithUpdates, callback) {
        /**
         * Callback for QB.chat.privacylist.update().
         * @param {Object} error - The error object
         * @param {Object} response - The privacy list object
         * @callback updatePrivacylistCallback
         * */

        var self = this;

        self.getList(listWithUpdates.name, function(error, existentList) {
            if (error) {
                callback(error, null);
            } else {
                var updatedList = {};
                updatedList.items = Utils.MergeArrayOfObjects(existentList.items, listWithUpdates.items);
                updatedList.name = listWithUpdates.name;

                self.create(updatedList, function(err, result) {
                    if (error) {
                        callback(err, null);
                    } else {
                        callback(null, result);
                    }
                });
            }
        });
    },

    /**
     * Get names of privacy lists. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Retrieve_privacy_lists_names More info.}
     * Run without parameters
     * @memberof QB.chat.privacylist
     * @param {getNamesPrivacylistCallback} callback - The callback function.
     * */
    getNames: function(callback) {
        /**
         * Callback for QB.chat.privacylist.getNames().
         * @param {Object} error - The error object
         * @param {Object} response - The privacy list object (var names = response.names;)
         * @callback getNamesPrivacylistCallback
         * */

        var self = this,
            iq,
            stanzaParams = {
                'type': 'get',
                'from': self.helpers.getUserCurrentJid(),
                'id': chatUtils.getUniqueId('getNames')
            };

        iq = new XMPP.Stanza('iq', stanzaParams);

        iq.c('query', {
            xmlns: chatUtils.MARKERS.PRIVACY
        });

        self.nodeStanzasCallbacks[iq.attrs.id] = function(stanza){
            if(stanza.attrs.type !== 'error'){

                var allNames = [], namesList = {},
                    query = stanza.getChild('query'),
                    defaultList = query.getChild('default'),
                    activeList = query.getChild('active'),
                    allLists = query.getChildElements('list');

                var defaultName = defaultList ? defaultList.attrs.name : null,
                    activeName = activeList ? activeList.attrs.name : null;

                for (var i = 0, len = allLists.length; i < len; i++) {
                    allNames.push(allLists[i].attrs.name);
                }

                namesList = {
                    'default': defaultName,
                    'active': activeName,
                    'names': allNames
                };

                callback(null, namesList);
            } else {
                callback(Utils.getError(408));
            }
        };

        self.Client.send(iq);
    },

    /**
     * Delete privacy list. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Delete_existing_privacy_list More info.}
     * @param {String} name - The name of privacy list.
     * @memberof QB.chat.privacylist
     * @param {deletePrivacylistCallback} callback - The callback function.
     * */
    delete: function(name, callback) {
        /**
         * Callback for QB.chat.privacylist.delete().
         * @param {Object} error - The error object
         * @callback deletePrivacylistCallback
         * */

        var iq,
            stanzaParams = {
                'from': this.connection ? this.connection.jid : this.Client.jid.user,
                'type': 'set',
                'id': chatUtils.getUniqueId('remove')
            };

        iq = new XMPP.Stanza('iq', stanzaParams);

        iq.c('query', {
            xmlns: chatUtils.MARKERS.PRIVACY
        }).c('list', {
            name: name ? name : ''
        });

        this.nodeStanzasCallbacks[stanzaParams.id] = function(stanza) {
            if (!stanza.getChildElements('error').length) {
                callback(null);
            } else {
                callback(Utils.getError(408));
            }
        };

        this.Client.send(iq);
    },

    /**
     * Set as default privacy list. {@link https://quickblox.com/developers/Web_XMPP_Chat_Sample#Activate_a_privacy_list More info.}
     * @param {String} name - The name of privacy list.
     * @memberof QB.chat.privacylist
     * @param {setAsDefaultPrivacylistCallback} callback - The callback function.
     * */
    setAsDefault: function(name, callback) {
        /**
         * Callback for QB.chat.privacylist.setAsDefault().
         * @param {Object} error - The error object
         * @callback setAsDefaultPrivacylistCallback
         * */

        var iq,
            stanzaParams = {
                'from': this.connection ? this.connection.jid : this.Client.jid.user,
                'type': 'set',
                'id': chatUtils.getUniqueId('default')
            };

        iq = new XMPP.Stanza('iq', stanzaParams);

        iq.c('query', {
            xmlns: chatUtils.MARKERS.PRIVACY
        }).c('default', name && name.length > 0 ? {name: name} : {});

        this.nodeStanzasCallbacks[stanzaParams.id] = function(stanza){
            if(!stanza.getChildElements('error').length){
                callback(null);
            } else {
                callback(Utils.getError(408));
            }
        };

        this.Client.send(iq);
    }

};

/* Helpers
 ----------------------------------------------------------------------------- */
function Helpers() {
    this._userCurrentJid = '';
}
/**
 * @namespace QB.chat.helpers
 * */
Helpers.prototype = {

    /**
     * Get unique id.
     * @memberof QB.chat.helpers
     * @param {String | Number} suffix - not required parameter.
     * @returns {String} - UniqueId.
     * */
    getUniqueId: chatUtils.getUniqueId,

    /**
     * Get unique id.
     * @memberof QB.chat.helpers
     * @param {String | Number} jid_or_user_id - Jid or user id.
     * @returns {String} - jid.
     * */
    jidOrUserId: function(jid_or_user_id) {
        var jid;
        if (typeof jid_or_user_id === 'string') {
            jid = jid_or_user_id;
        } else if (typeof jid_or_user_id === 'number') {
            jid = jid_or_user_id + '-' + config.creds.appId + '@' + config.endpoints.chat;
        } else {
            throw new Error('The method "jidOrUserId" may take jid or id');
        }
        return jid;
    },

    /**
     * Get the chat type.
     * @memberof QB.chat.helpers
     * @param {String | Number} jid_or_user_id - Jid or user id.
     * @returns {String} - jid.
     * */
    typeChat: function(jid_or_user_id) {
        var chatType;
        if (typeof jid_or_user_id === 'string') {
            chatType = jid_or_user_id.indexOf("muc") > -1 ? 'groupchat' : 'chat';
        } else if (typeof jid_or_user_id === 'number') {
            chatType = 'chat';
        } else {
            throw new Error('unsupported');
        }
        return chatType;
    },

    /**
     * Get the recipint id.
     * @memberof QB.chat.helpers
     * @param {Array} occupantsIds - Array of user ids.
     * @param {Number} UserId - Jid or user id.
     * @returns {Number} recipient - recipient id.
     * */
    getRecipientId: function(occupantsIds, UserId) {
        var recipient = null;
        occupantsIds.forEach(function(item) {
            if(item != UserId){
                recipient = item;
            }
        });
        return recipient;
    },

    /**
     * Get the User jid id.
     * @memberof QB.chat.helpers
     * @param {Number} UserId - The user id.
     * @param {Number} appId - The application id.
     * @returns {String} jid - The user jid.
     * */
    getUserJid: function(userId, appId) {
        if(!appId){
            return userId + '-' + config.creds.appId + '@' + config.endpoints.chat;
        }
        return userId + '-' + appId + '@' + config.endpoints.chat;
    },

    /**
     * Get the User nick with the muc domain.
     * @memberof QB.chat.helpers
     * @param {Number} UserId - The user id.
     * @returns {String} mucDomainWithNick - The mac domain with he nick.
     * */
    getUserNickWithMucDomain: function(userId) {
        return config.endpoints.muc + '/' + userId;
    },

    /**
     * Get the User id from jid.
     * @memberof QB.chat.helpers
     * @param {String} jid - The user jid.
     * @returns {Number} id - The user id.
     * */
    getIdFromNode: function(jid) {
        return (jid.indexOf('@') < 0) ? null : parseInt(jid.split('@')[0].split('-')[0]);
    },

    /**
     * Get the dialog id from jid.
     * @memberof QB.chat.helpers
     * @param {String} jid - The dialog jid.
     * @returns {String} dialogId - The dialog id.
     * */
    getDialogIdFromNode: function(jid) {
        if (jid.indexOf('@') < 0) return null;
        return jid.split('@')[0].split('_')[1];
    },

    /**
     * Get the room jid from dialog id.
     * @memberof QB.chat.helpers
     * @param {String} dialogId - The dialog id.
     * @returns {String} jid - The dialog jid.
     * */
    getRoomJidFromDialogId: function(dialogId) {
        return config.creds.appId + '_' + dialogId + '@' + config.endpoints.muc;
    },

    /**
     * Get the full room jid from room bare jid & user jid.
     * @memberof QB.chat.helpers
     * @param {String} jid - dialog's bare jid.
     * @param {String} userJid - user's jid.
     * @returns {String} jid - dialog's full jid.
     * */
    getRoomJid: function(jid) {
        return jid + '/' + this.getIdFromNode(this._userCurrentJid);
    },

    /**
     * Get user id from dialog's full jid.
     * @memberof QB.chat.helpers
     * @param {String} jid - dialog's full jid.
     * @returns {String} user_id - User Id.
     * */
    getIdFromResource: function(jid) {
        var s = jid.split('/');
        if (s.length < 2) return null;
        s.splice(0, 1);
        return parseInt(s.join('/'));
    },

    /**
     * Get bare dialog's jid from dialog's full jid.
     * @memberof QB.chat.helpers
     * @param {String} jid - dialog's full jid.
     * @returns {String} room_jid - dialog's bare jid.
     * */
    getRoomJidFromRoomFullJid: function(jid) {
        var s = jid.split('/');
        if (s.length < 2) return null;
        return s[0];
    },

    /**
     * Generate BSON ObjectId.
     * @memberof QB.chat.helpers
     * @returns {String} BsonObjectId - The bson object id.
     **/
    getBsonObjectId: function() {
        return Utils.getBsonObjectId();
    },

    /**
     * Get the user id from the room jid.
     * @memberof QB.chat.helpers
     * @param {String} jid - resourse jid.
     * @returns {String} userId - The user id.
     * */
    getUserIdFromRoomJid: function(jid) {
        var arrayElements = jid.toString().split('/');
        if(arrayElements.length === 0){
            return null;
        }
        return arrayElements[arrayElements.length-1];
    },

    userCurrentJid: function(client){
        return client.jid.user + '@' + client.jid._domain + '/' + client.jid._resource;
    },

    getUserCurrentJid: function() {
        return this._userCurrentJid;
    },

    setUserCurrentJid: function(jid) {
        this._userCurrentJid = jid;
    }
};
/**
 * @namespace QB.chat
 * */
module.exports = ChatProxy;
