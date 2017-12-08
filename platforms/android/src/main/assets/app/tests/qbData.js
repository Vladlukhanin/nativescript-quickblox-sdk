
var REST_REQUESTS_TIMEOUT = 5000;
var session;

var QB = require('nativescript-quickblox');

var CREDS = require('./support/config.js').CREDS;
var CONFIG =  require('./support/config.js').CONFIG;
var QBUser1 = require('./support/config.js').QBUser1;

describe('Custom Objects API', function() {

    beforeAll(function(done){
        QB.init(CREDS.appId, CREDS.authKey, CREDS.authSecret, CONFIG);

        QB.createSession(QBUser1, function(err, res) {
            if (err) {
                done.fail('Create session error: ' + JSON.stringify(err));
            } else {
                session = res;
                expect(session).not.toBeNull();

                done();
            }
        });
    }, REST_REQUESTS_TIMEOUT);

    describe('The basic functions of Custom Objects', function() {
        it('can create custom object', function(done){
            QB.data.create('cars', {make: 'BMW', model: 'M5', value: 100, damaged: true}, function(err, result) {
                if (err) {
                    done.fail("Create custom object error: " + JSON.stringify(err));
                } else {
                    expect(result._id).not.toBeNull();
                    expect(result.make).toBe('BMW');
                    expect(result.model).toBe('M5');

                    done();
                }
            });
        }, REST_REQUESTS_TIMEOUT);

        it('can update custom object', function(done){
            QB.data.create('cars', {
                'make': 'BMW',
                'model': 'M5',
                'value': 100,
                'damaged': true
            }, function(err, result) {
                if (err) {
                    done.fail('Create custom object error: ' + JSON.stringify(err));
                } else {
                    result.model = 'M3';

                    QB.data.update('cars', result, function(err, res) {
                        if (err) {
                            done.fail('Update custom object error: ' + JSON.stringify(err));
                        } else {
                            expect(res._id).not.toBeNull();
                            expect(res.model).toBe('M3');

                            done();
                        }
                    });
                }
            });
        }, REST_REQUESTS_TIMEOUT);

        it('can list custom object', function(done){
            QB.data.list('cars', function(err, result) {
                if (err) {
                    done.fail('List custom object error: ' + JSON.stringify(err));
                } else {
                    expect(result).not.toBeNull();
                    expect(result.items.length).toBeGreaterThan(0);

                    done();
                }
            });
        }, REST_REQUESTS_TIMEOUT);

        it('can delete custom object', function(done){
            QB.data.create('cars', {make: 'BMW', model: 'M5', value: 100, damaged: true}, function(err, result) {
                if (err) {
                    done.fail('Create custom object error: ' + JSON.stringify(err));
                } else {
                    QB.data.delete('cars', result._id, function(err, res) {
                        if (err) {
                            done.fail("Create delete object error: " + JSON.stringify(err));
                        } else {
                            expect(res).not.toBeNull();
                            expect(res).toBe(true);

                            done();
                        }
                    });
                }
            });
        }, REST_REQUESTS_TIMEOUT);
    });

    describe('Some more complex searching', function() {

        it('can find instances of cars with a value over 50 (value: 100)', function(done){
            var filter = {
                'value': {
                    'gt': 50
                }
            };

            QB.data.list('cars', filter, function(err, result){
                if (err) {
                    done.fail('List custom object error: ' + JSON.stringify(err));
                } else {
                    expect(result).not.toBeNull();
                    expect(result.items.length).toBeGreaterThan(0);

                    for (var i=0,j=result.items.length; i<j; i++){
                        expect(result.items[i].value).toBeGreaterThan(50);
                    }

                    done();
                }
            });
        }, REST_REQUESTS_TIMEOUT);

        it('cannot find instances of cars with a value less than 50 (value: 100)', function(done){
            var filter = {
                'value': {
                    'lt': 50
                }
            };

            QB.data.list('cars', filter, function(err, result){
                if (err) {
                    done.fail('List custom object error: ' + JSON.stringify(err));
                } else {
                    expect(result).not.toBeNull();
                    expect(result.items.length).toBe(0);

                    done();
                }
            });
        }, REST_REQUESTS_TIMEOUT);
    });

});
