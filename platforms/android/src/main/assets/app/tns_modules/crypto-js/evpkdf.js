(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./sha1"),require("./hmac")):"function"==typeof define&&define.amd?define(["./core","./sha1","./hmac"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.lib,i=t.Base,n=t.WordArray,o=r.algo,s=o.MD5,a=o.EvpKDF=i.extend({cfg:i.extend({keySize:4,hasher:s,iterations:1}),init:function(e){this.cfg=this.cfg.extend(e)},compute:function(e,r){for(var t=this.cfg,i=t.hasher.create(),o=n.create(),s=o.words,a=t.keySize,c=t.iterations;a>s.length;){f&&i.update(f);var f=i.update(e).finalize(r);i.reset();for(var u=1;c>u;u++)f=i.finalize(f),i.reset();o.concat(f)}return o.sigBytes=4*a,o}});r.EvpKDF=function(e,r,t){return a.create(t).compute(e,r)}}(),e.EvpKDF});