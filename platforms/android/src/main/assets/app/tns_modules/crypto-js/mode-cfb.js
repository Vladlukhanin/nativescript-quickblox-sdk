(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core"),require("./cipher-core")):"function"==typeof define&&define.amd?define(["./core","./cipher-core"],r):r(e.CryptoJS)})(this,function(e){return e.mode.CFB=function(){function r(e,r,t,i){var o=this._iv;if(o){var n=o.slice(0);this._iv=void 0}else var n=this._prevBlock;i.encryptBlock(n,0);for(var s=0;t>s;s++)e[r+s]^=n[s]}var t=e.lib.BlockCipherMode.extend();return t.Encryptor=t.extend({processBlock:function(e,t){var i=this._cipher,o=i.blockSize;r.call(this,e,t,o,i),this._prevBlock=e.slice(t,t+o)}}),t.Decryptor=t.extend({processBlock:function(e,t){var i=this._cipher,o=i.blockSize,n=e.slice(t,t+o);r.call(this,e,t,o,i),this._prevBlock=n}}),t}(),e.mode.CFB});