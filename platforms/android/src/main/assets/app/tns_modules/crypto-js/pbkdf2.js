(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./sha1"),require("./hmac")):"function"==typeof define&&define.amd?define(["./core","./sha1","./hmac"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.lib,n=t.Base,i=t.WordArray,o=r.algo,a=o.SHA1,s=o.HMAC,c=o.PBKDF2=n.extend({cfg:n.extend({keySize:4,hasher:a,iterations:1}),init:function(e){this.cfg=this.cfg.extend(e)},compute:function(e,r){for(var t=this.cfg,n=s.create(t.hasher,e),o=i.create(),a=i.create([1]),c=o.words,f=a.words,u=t.keySize,h=t.iterations;u>c.length;){var d=n.update(r).finalize(a);n.reset();for(var p=d.words,l=p.length,y=d,m=1;h>m;m++){y=n.finalize(y),n.reset();for(var g=y.words,v=0;l>v;v++)p[v]^=g[v]}o.concat(d),f[0]++}return o.sigBytes=4*u,o}});r.PBKDF2=function(e,r,t){return c.create(t).compute(e,r)}}(),e.PBKDF2});