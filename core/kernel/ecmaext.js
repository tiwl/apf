/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

jpf.parseUri = function(sourceUri){
    var uriPartNames = ["source", "protocol", "authority", "domain", "port", "path", "directoryPath", "fileName", "query", "anchor"];
    var uriParts     = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)?((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?").exec(sourceUri);
    var uri          = {};
    
    for (var i = 0; i < 10; i++) {
        uri[uriPartNames[i]] = (uriParts[i] ? uriParts[i] : "");
    }
    
    // Always end directoryPath with a trailing backslash if a path was present in the source URI
    // Note that a trailing backslash is NOT automatically inserted within or appended to the "path" key
    if (uri.directoryPath.length > 0) {
        uri.directoryPath = uri.directoryPath.replace(/\/?$/, "/");
    }
    
    return uri;
};

/**
 * This random number generator has been added to provide a more robust and
 * reliable random number spitter than the native Ecmascript Math.random()
 * function.
 * is an implementation of the Park-Miller algorithm. (See 'Random Number
 * Generators: Good Ones Are Hard to Find', by Stephen K. Park and Keith W.
 * Miller, Communications of the ACM, 31(10):1192-1201, 1988.)
 * @author David N. Smith of IBM's T. J. Watson Research Center.
 * @author Mike de Boer (mdeboer AT javeline DOT com)
 * @class randomGenerator
 */
jpf.randomGenerator = {
    d: new Date(),
    seed: null,
    A: 48271,
    M: 2147483647,
    Q: null,
    R: null,
    oneOverM: null,
    
    /**
     * Generates a random Number between a lower and upper boundary.
     * The algorithm uses the system time, in minutes and seconds, to 'seed'
     * itself, that is, to create the initial values from which it will generate
     * a sequence of numbers. If you are familiar with random number generators,
     * you might have reason to use some other value for the seed. Otherwise,
     * you should probably not change it.
     * @param {Number} lnr Lower boundary
     * @param {Number} unr Upper boundary
     * @result A random number between <i>lnr</i> and <i>unr</i>
     * @type Number
     */
    generate: function(lnr, unr) {
        if (this.seed == null)
            this.seed = 2345678901 + (this.d.getSeconds() * 0xFFFFFF) + (this.d.getMinutes() * 0xFFFF);
        this.Q = this.M / this.A;
        this.R = this.M % this.A;
        this.oneOverM = 1.0 / this.M;
        return Math.floor((unr - lnr + 1) * this.next() + lnr);
    },
    
    /**
     * Returns a new random number, based on the 'seed', generated by the
     * <i>generate</i> method.
     * @type Number
     */
    next: function() {
        var hi = this.seed / this.Q;
        var lo = this.seed % this.Q;
        var test = this.A * lo - this.R * hi;
        if (test > 0)
            this.seed = test;
        else
            this.seed = test + this.M;
        return (this.seed * this.oneOverM);
    }
};

jpf.extend = function(dest){
    for (var i = 1; i < arguments.length; i++) {
        var src = arguments[i];
        for (var prop in src) 
            dest[prop] = src[prop];
    }
    return dest;
};

jpf.formatNumber = function(nr){
    var str = new String(Math.round(parseFloat(nr) * 100) / 100).replace(/(\.\d?\d?)$/, function(m1){
        return m1.pad(3, "0", PAD_RIGHT);
    });
    if (str.indexOf(".") == -1) 
        str += ".00";
    return str;
};

jpf.unserialize = function(str){
    if (!str) 
        return str;
    eval("var data = " + str);
    return data;
};

// #ifdef __WITH_ECMAEXT

jpf.isNull = function(value){
    if (value) 
        return false;
    return (value == null || !String(value).length);
};

jpf.isArray = function(o){
    return (o && typeof o == "object" && o.length);
};

jpf.isTrue = function(c){
    return (c === true || c === "true" || c === "on" || typeof c == "number" && c > 0 || c === "1");
};

jpf.isFalse = function(c){
    return (c === false || c === "false" || c === "off" || c === 0 || c === "0");
};

jpf.isNot = function(c){
    // a var that is null, false, undefined, Infinity, NaN and c isn't a string
    return (!c && typeof c != "string" && c !== 0 || (typeof c == "number" && !isFinite(c)));
};

jpf.copyObject = function(o){
    var rv = new Object();
    for (prop in o) 
        rv[prop] = o[prop];
    return rv;
};

jpf.copyArray = function(ar, Type){
    if (!ar) 
        return ar;
    for (var car = [], i = 0; i < ar.length; i++) 
        car[i] = Type ? new Type(ar[i]) : ar[i];
    
    return car;
};

jpf.getFilename = function(url){
    return (url.split("?")[0].match(/(?:\/|^)([^\/]+)$/) || {})[1];
};

jpf.getAbsolutePath = function(base, src){
    return src.match(/^\w+\:\/\//) ? src : base + src;
};

jpf.removePathContext = function(base, src){
    if (!src) 
        return "";
    if (src.indexOf(base) > -1) 
        return src.substr(base.length);
    return src;
};

if (!self.isFinite) {
    function isFinite(val){
        return val + 1 != val;
    }
}

//Mac workaround...
if (!Function.prototype.call) {
    Function.prototype.call = function(obj, arg1, arg2, arg3){
        obj.tf = this;
        var rv = obj.tf(arg1, arg2, arg3);
        obj.tf = null;
        return rv;
    }
}

Array.prototype.copy = function(){
    var ar = [];
    for (var i = 0; i < this.length; i++) 
        ar[i] = this[i] && this[i].copy ? this[i].copy() : this[i];
    
    return ar;
};

Array.prototype.merge = function(){
    for (var i = 0; i < arguments.length; i++) {
        for (var j = 0; j < arguments[i].length; j++) {
            this.push(arguments[i][j]);
        }
    }
};

Array.prototype.arrayAdd = function(){
    var s = this.copy();
    for (var i = 0; i < arguments.length; i++) {
        for (var j = 0; j < s.length; j++) {
            s[j] += arguments[i][j];
        }
    }
    
    return s;
};

Array.prototype.equals = function(obj){
    for (var i = 0; i < this.length; i++) 
        if (this[i] != obj[i]) 
            return false;
    return true;
};

Array.prototype.makeUnique = function(){
    var newArr = [];
    for (var i = 0, length = this.length; i < length; i++) 
        if (!newArr.contains(this[i])) 
            newArr.push(this[i]);
    
    this.length = 0;
    for (var i = 0, length = newArr.length; i < length; i++) 
        this.push(newArr[i]);
};

Array.prototype.contains = function(obj){
    return this.indexOf(obj) > -1;
};

//July 29, 2008: added 'from' argument support to indexOf()
Array.prototype.indexOf = Array.prototype.indexOf || function(obj, from){
    var len = this.length;
	for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++){
		if (this[i] === obj)
            return i;
	}
	return -1;
};

Array.prototype.lastIndexOf = Array.prototype.lastIndexOf || function(obj, from) {
    //same as indexOf(), but in reverse loop, JS spec 1.6
    var len = this.length;
    for (var i = (from >= len) ? len - 1 : (from < 0) ? from + len : len - 1; i >= 0; i--) {
        if (this[i] === obj)
            return i;
    }
    return -1;
};

Array.prototype.pushUnique = function(item){
    if (!this.contains(item)) 
        this.push(item);
};

Array.prototype.search = function(){
    for (var i = 0, length = arguments.length; i < length; i++) {
        if (typeof this[i] != "array") 
            continue;
        for (var j = 0; j < length; j++) {
            if (this[i][j] != arguments[j]) 
                break;
            else if (j == (length - 1)) 
                return this[i];
        }
    }
};

Array.prototype.forEach = Array.prototype.forEach || function(fn) {
    for (var i = 0, l = this.length; i < l; i++)
		fn.apply(this, [this[i], i, this]);
}

/*Object.prototype.runEvent = function(eventname, arg1, arg2, arg3){
 if(this[eventname]) this[eventname](arg1, arg2, arg3);
 }*/
//TBD: explain the inner workings of this function please...
Array.prototype.remove = function(obj){
    for (var i = 0; i < this.length; i++) {
        if (this[i] != obj) 
            continue;
        
        for (var j = i; j < this.length; j++) 
            this[j] = this[j + 1];
        this.length--;
        i--;
    }
};

Array.prototype.removeIndex = function(i){
    if (!this.length) return;
    
    for (var j = i, l = this.length; j < l; j++) 
        this[j] = this[j + 1];
    this.length--;
};

Array.prototype.insertIndex = function(obj, i){
    for (var j = this.length; j >= i; j--) 
        this[j] = this[j - 1];
    
    this[i] = obj;
};


//TBD: rename this function to reverse() - JS 1.5 spec
Array.prototype.invert = function(){
    var l = this.length - 1;
    for (var temp, i = 0; i < Math.ceil(0.5 * l); i++) {
        temp        = this[i];
        this[i]     = this[l - i]
        this[l - i] = temp;
    }
    
    return this;
};
Array.prototype.reverse = Array.prototype.reverse || Array.prototype.invert;

/*
    These functions are really old, is there any browser that
    doesn't support them? I don't think so. Lets opt for 
    removal
*/

if (!Array.prototype.push) {
    Array.prototype.push = function(){
        for (var i = arguments.length - 1; i >= 0; i--)
            this[this.length] = arguments[i];
        return this.length;
    }
}

if (!Array.prototype.pop) {
    Array.prototype.pop = function(item){
        var item = this[this.length - 1];
        delete this[this.length - 1];
        this.length--;
        return item;
    }
}

if (!Array.prototype.shift) {
    Array.prototype.shift = function(){
        var item = this[0];
        for (var i = 0, l = this.length; i < l; i++) 
            this[i] = this[i + 1];
        this.length--;
        return item;
    }
}

if (!Array.prototype.join) {
    Array.prototype.join = function(connect){
        for (var str = "", i = 0, l = this.length; i < l; i++) 
            str += this[i] + (i < l - 1 ? connect : "");
        return str;
    }
}

/**
 * Attempt to fully comply (in terms of functionality) with the JS specification,
 * up till version 1.7: 
 * @link http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array
 */
Array.prototype.filter = Array.prototype.filter || function(fn, bind){
    var results = [];
    for (var i = 0, l = this.length; i < l; i++) {
        if (fn.call(bind, this[i], i, this))
            results.push(this[i]);
    }
    return results;
};

Array.prototype.every = Array.prototype.every || function(fn, bind){
    for (var i = 0, l = this.length; i < l; i++) {
        if (!fn.call(bind, this[i], i, this))
            return false;
    }
    return true;
};

Array.prototype.map = Array.prototype.map || function(fn, bind){
    var results = [];
    for (var i = 0, l = this.length; i < l; i++)
        results[i] = fn.call(bind, this[i], i, this);
    return results;
};

Array.prototype.some = Array.prototype.some || function(fn, bind){
    for (var i = 0, l = this.length; i < l; i++) {
        if (fn.call(bind, this[i], i, this))
            return true;
    }
    return false;
};

Math.hexlist  = "0123456789ABCDEF";
Math.decToHex = function(value){
    var hex = this.floor(value / 16);
    hex = (hex > 15 ? this.decToHex(hex) : this.hexlist.charAt(hex));
    
    return hex + "" + this.hexlist.charAt(this.floor(value % 16));
};

Math.hexToDec = function(value){
    if (!/(.)(.)/.exec(value.toUpperCase())) 
        return false;
    return this.hexlist.indexOf(RegExp.$1) * 16 + this.hexlist.indexOf(RegExp.$2);
};

String.prototype.uCaseFirst = function(str){
    return this.substr(0, 1).toUpperCase() + this.substr(1)
};

String.prototype.trim = function(){
    return this.replace(/\s*$/, "").replace(/^\s*/, "");
};

String.prototype.repeat = function(times){
    for (var out = "", i = 0; i < times; i++) 
        out += this;
    return out;
};

String.prototype.count = function(str){
    return this.split(str).length - 1;
};

String.prototype.escape = function() {
    return escape(this);
};

String.prototype.pad = function(l, s, t){
    return s || (s = " "), (l -= this.length) > 0
        ? (s = new Array(Math.ceil(l / s.length) + 1).join(s)).substr(0,
              (t = !t) ? l : (t == 1) ? 0 : Math.ceil(l / 2))
              + this + s.substr(0, l - t)
        : this;
};
PAD_LEFT  = 0;
PAD_RIGHT = 1;
PAD_BOTH  = 2;

/**
 * Appends a random number with a specified length to this String instance.
 * @see randomGenerator
 * @param {Number} length
 * @type String
 */
String.prototype.appendRandomNumber = function(length) {
    // Create a new string from the old one, don't just create a copy
    var source = this.toString();
    for (var i = 1; i <= length; i++) {
        source += jpf.randomGenerator.generate(1, 9);
    }
    return source;
};

/**
 * Prepends a random number with a specified length to this String instance.
 * @see randomGenerator
 * @param {Number} length
 * @type String
 */
String.prototype.prependRandomNumber = function(length) {
    // Create a new string from the old one, don't just create a copy
    var source = this.toString();
    for (var i = 1; i <= length; i++) {
        source = jpf.randomGenerator.generate(1, 9) + source;
    }
    return source;
};

/**
 * Returns a string produced according to the formatting string. It replaces
 * all <i>%s</i> occurrences with the arguments provided.
 * @link http://www.php.net/sprintf
 * @type String
 */
String.prototype.sprintf = function() {
    // Create a new string from the old one, don't just create a copy
    var str = this.toString();
	var i = 0, inx = str.indexOf('%s');
	while (inx >= 0) {
        var replacement = arguments[i++] || ' ';
		str = str.substr(0, inx) + replacement + str.substr(inx + 2);
		inx = str.indexOf('%s');
	}
	return str;
};

jpf.formatXML = function(output){
    output = output.trim();
    
    var lines = output.split("\n");
    for (var i = 0; i < lines.length; i++) 
        lines[i] = lines[i].trim();
    lines = lines.join("\n").replace(/\>\r\n/g, ">").replace(/\>/g, ">\n")
        .replace(/\n\</g, "<").replace(/\</g, "\n<").split("\n");
    lines.removeIndex(0);//test if this is actually always fine
    lines.removeIndex(lines.length);
    
    for (var depth = 0, i = 0; i < lines.length; i++) 
        lines[i] = "\t".repeat((lines[i].match(/^\s*\<\//)
            ? --depth
            : (lines[i].match(/^\s*\<[^\?][^>]+[^\/]\>/) ? depth++ : depth))) + lines[i];
    
    return lines.join("\n");
};

jpf.formatJS = function(x){
    var d = 0;
    return x.replace(/;+/g, ';').replace(/;}/g, '}').replace(/{;/g, '{').replace(/({)|(})|(;)/g,
        function(m, a, b, c){
            if (a) d++;
            if (b) d--;
            
            var o = '';
            for (var i = 0; i < d; i++) 
                o += '\t\t';
                
            if (a) return '{\n' + o;
            if (b) return '\n' + o + '}';
            if (c) return ';\n' + o;
        }).replace(/\>/g, '&gt;').replace(/\</g, '&lt;');
};

jpf.pasteWindow = function(str){
    var win = window.open("about:blank");
    win.document.write(str);
};

jpf.htmlentities = function(str){
    return str.replace(/</g, "&lt;");
};

jpf.html_entity_decode = function(str){
    return str.replace(/\&\#38;/g, "&").replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
};

// #endif
