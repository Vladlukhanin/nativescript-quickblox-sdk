(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define(["./core"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.lib,n=t.WordArray,i=r.enc;i.Base64={stringify:function(e){var r=e.words,t=e.sigBytes,n=this._map;e.clamp();for(var i=[],o=0;t>o;o+=3)for(var s=255&r[o>>>2]>>>24-8*(o%4),c=255&r[o+1>>>2]>>>24-8*((o+1)%4),a=255&r[o+2>>>2]>>>24-8*((o+2)%4),f=s<<16|c<<8|a,u=0;4>u&&t>o+.75*u;u++)i.push(n.charAt(63&f>>>6*(3-u)));var d=n.charAt(64);if(d)for(;i.length%4;)i.push(d);return i.join("")},parse:function(e){var r=e.length,t=this._map,i=t.charAt(64);if(i){var o=e.indexOf(i);-1!=o&&(r=o)}for(var s=[],c=0,a=0;r>a;a++)if(a%4){var f=t.indexOf(e.charAt(a-1))<<2*(a%4),u=t.indexOf(e.charAt(a))>>>6-2*(a%4);s[c>>>2]|=(f|u)<<24-8*(c%4),c++}return n.create(s,c)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}}(),e.enc.Base64});