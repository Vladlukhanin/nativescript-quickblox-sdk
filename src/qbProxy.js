'use strict';

var config = require('./qbConfig');
var Utils = require('./qbUtils');

/**
 * For server-side applications through using npm package 'quickblox'
 * you should include the following lines
 */

function ServiceProxy() {
    this.qbInst = {
        config: config,
        session: null
    };

    this.reqCount = 0;
}

ServiceProxy.prototype = {
    setSession: function(session) {
        this.qbInst.session = session;
    },

    getSession: function() {
        return this.qbInst.session;
    },

    handleResponse: function(error, response, next, retry) {
        // can add middleware here...

        if (error && typeof config.on.sessionExpired === 'function' && (error.message === 'Unauthorized' || error.status === '401 Unauthorized')) {
            config.on.sessionExpired(function() {
                next(error,response);
            }, retry);
        } else {
            if (error) {
                next(error, null);
            } else {
                if (config.addISOTime) {
                    response = Utils.injectISOTimes(response);
                }

                next(null, response);
            }
        }
    },

    startLogger: function(params) {
        var clonedData;

        ++this.reqCount;

        if (params.data && params.data.file) {
            clonedData = JSON.parse(JSON.stringify(params.data));
            clonedData.file = "...";
        } else {
            clonedData = JSON.stringify(params.data);
        }

        Utils.QBLog('[Request][' + this.reqCount + ']', (params.type || 'GET') + ' ' + params.url, clonedData ? clonedData : "");
    },

    ajax: function(params, callback) {
        this.startLogger(params);

        var self = this,
            isGetOrHeadType = !params.type || params.type === 'GET' || params.type === 'HEAD',
            qbSessionToken = self.qbInst && self.qbInst.session && self.qbInst.session.token,
            isQBRequest = params.url.indexOf('s3.amazonaws.com') === -1,
            isMultipartFormData = params.contentType === false,
            qbDataType = params.dataType || 'json',
            qbUrl = params.url,
            qbRequest = {},
            qbRequestBody,
            qbResponse;

        qbRequest.method = params.type || 'GET';

        if (params.data) {
            qbRequestBody = _getBodyRequest();

            if (isGetOrHeadType) {
                qbUrl += '?' + qbRequestBody;
            } else {
                qbRequest.body = qbRequestBody;
            }
        }

        if (!isMultipartFormData) {
            qbRequest.headers = {
                'Content-Type': params.contentType || 'application/x-www-form-urlencoded; charset=UTF-8'
            };
        }

        if (isQBRequest && qbSessionToken) {
            if (!qbRequest.headers) {
                qbRequest.headers = {};
            }

            qbRequest.headers['QB-Token'] = qbSessionToken;
            qbRequest.headers['QB-SDK'] = 'JS ' + config.version + ' - Server';
        }

        if (config.timeout) {
            qbRequest.timeout = config.timeout;
        }

        fetch(qbUrl, qbRequest)
            .then(function(response) {
                qbResponse = response;

                if (qbDataType === 'text') {
                    return response.text();
                } else {
                    return response.json();
                }
            })
            .then(function(body) {
                _requestCallback(null, qbResponse, body);
            })
            .catch(function(error) {
                // TODO: find status 200 for NativeScript
                if (typeof error === 'object' && !Object.keys(error).length) {
                    _requestCallback(null, {status: 200}, ' ');
                } else {
                    _requestCallback(error);
                }
            });

        /*
         * Private functions
         * Only for ServiceProxy.ajax() method closure
         */
        function _getBodyRequest() {
            var data = params.data,
                qbData;

            if (isMultipartFormData) {
                qbData = new FormData();
                Object.keys(data).forEach(function(item) {
                    if (params.fileToCustomObject && (item === 'file')) {
                        qbData.append(item, data[item].data, data[item].name);
                    } else {
                        qbData.append(item, params.data[item]);
                    }
                });
            } else if (params.isNeedStringify) {
                qbData = JSON.stringify(data);
            } else {
                qbData = Object.keys(data).map(function(k) {
                    if (Utils.isObject(data[k])) {
                        return Object.keys(data[k]).map(function(v) {
                            return k + '[' + (Utils.isArray(data[k]) ? '' : v) + ']=' + data[k][v];
                        }).sort().join('&');
                    } else {
                        return k + (Utils.isArray(data[k]) ? '[]' : '' ) + '=' + data[k];
                    }
                }).sort().join('&');
            }

            return qbData;
        }

        function _requestCallback(error, response, body) {
            var statusCode = response && (response.status || response.statusCode),
                responseMessage,
                responseBody;

            if (error || (statusCode !== 200 && statusCode !== 201 && statusCode !== 202)) {
                var errorMsg;

                try {
                    errorMsg = {
                        code: response && statusCode || error && error.code,
                        status: response && response.headers && response.headers.status || 'error',
                        message: body || error && error.errno,
                        detail: body && body.errors || error && error.syscall
                    };
                } catch(e) {
                    errorMsg = error;
                }

                responseBody = body || error || body.errors;
                responseMessage = JSON.stringify(responseBody);

                Utils.QBLog('[Response][' + self.reqCount + ']', 'error', statusCode, responseMessage);

                if (params.url.indexOf(config.urls.session) === -1) {
                    self.handleResponse(errorMsg, null, callback, retry);
                } else {
                    callback(errorMsg, null);
                }
            } else {
                responseBody = (body && body !== ' ') ? body : 'empty body';
                responseMessage = JSON.stringify(responseBody);

                Utils.QBLog('[Response][' + self.reqCount + ']', responseMessage);

                if (params.url.indexOf(config.urls.session) === -1) {
                    self.handleResponse(null, body, callback, retry);
                } else {
                    callback(null, body);
                }
            }
        }

        function retry(session) {
            if (!!session) {
                self.setSession(session);
                self.ajax(params, callback);
            }
        }
    }
};

module.exports = ServiceProxy;
