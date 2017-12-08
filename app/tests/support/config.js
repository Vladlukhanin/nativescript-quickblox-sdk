var CREDS =  {
    'appId': 29650,
    'authKey': 'WULOyezrmxpOgQ-',
    'authSecret': 'TqQmBFbANJ6cfu4'
};

var CONFIG = {
    endpoints: {
        api: "api.quickblox.com", // set custom API endpoint
        chat: "chat.quickblox.com" // set custom Chat endpoint
    },
    chatProtocol: {
        active: 2 // set 1 to use BOSH, set 2 to use WebSockets (default)
    },
    'debug': {
        'mode': 1,
        'file': null
    }
};

var QBUser1 = {
        'id': 26904575,
        'login': "js_jasmine22",
        'password': "js_jasmine22",
        'email': "js_jasmine22@quickblox.com"
    },
    QBUser2 = {
        'id': 26904594,
        'login': "js_jasmine222",
        'password': "js_jasmine222"
    };

exports.CREDS = CREDS;
exports.CONFIG = CONFIG;
exports.QBUser1 = QBUser1;
exports.QBUser2 = QBUser2;
