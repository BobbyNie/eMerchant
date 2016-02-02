﻿"use strict";

/**
*recursive function for toEvalString
*/
var conventer = function (o, out, addr, referedAddrIndxs, firstreferedAddrIndxs, referedBySelf) {

	if (referedAddrIndxs[addr] !== undefined && firstreferedAddrIndxs[addr] === undefined) {
		return referedAddrIndxs[addr];
	}

	var type = typeof (o);
	var rs = "";

	if (o === null) {
		return "null";
	}

	if (type == "undefined")
		return "undefined";

	switch (type) {
		case "number":
		case "boolean":
			rs = o + "";
			break;
		case "string":
			rs = quoteString(o);
			break;
		case 'object':
			if (o.constructor === Date) {
				rs = '"new Date(' + o.getTime() + ')"';
			} else if (o.constructor === Array) {
				var ret = [];
				for (var i = 0; i < o.length; i++) {
					if (referedBySelf[addr]) {
						out.push([referedBySelf[addr].name, "['", i, "']=", conventer(o[i], out, [addr, i].join("."), referedAddrIndxs, firstreferedAddrIndxs, referedBySelf), ";"].join(""));
					} else {
						ret.push(conventer(o[i], out, [addr, i].join("."), referedAddrIndxs, firstreferedAddrIndxs, referedBySelf));
					}
				}
				rs = "[" + ret.join(",") + "]";
			} else {
				var pairs = [];
				for (var k in o) {
					var name;
					type = typeof k;

					if (type == "number")
						name = '"' + k + '"';
					else if (type == "string")
						name = quoteString(k);
					else
						continue; // skip non-string or number keys 

					if (typeof o[k] == "function")
						continue; // skip pairs where the value is a function. 
					if (referedBySelf[addr]) {
						out.push([referedBySelf[addr].name, "[", name, "]=", conventer(o[k], out, [addr, dk(k)].join("."), referedAddrIndxs, firstreferedAddrIndxs, referedBySelf), ";"].join(""));
					} else {
						var val = conventer(o[k], out, [addr, dk(k)].join("."), referedAddrIndxs, firstreferedAddrIndxs, referedBySelf);
						pairs.push(name + ":" + val);
					}
				}
				rs = "{" + pairs.join(",") + "}";

			}

			if (firstreferedAddrIndxs[addr] !== undefined) {
				if (!referedBySelf[addr]) {
					out.push("var ");
					out.push(firstreferedAddrIndxs[addr]);
					out.push("=");
					out.push(rs);
					out.push(";");
				}
				rs = firstreferedAddrIndxs[addr];
			}
			break;
		case 'function':
			//can't convert functions
			break;
	}
	if (firstreferedAddrIndxs[addr] !== undefined) {
		return firstreferedAddrIndxs[addr];
	}

	return rs;
};

//mark obj members' reference infomation recursively
var mark = function (obj, addr, opt) {
	var i;
	if (obj != null && obj != undefined && typeof (obj) == 'object') {
		for (i = 0; i < opt.marked.length; i++) {
			if (opt.marked[i].obj === obj) {
				opt.referedAddrIndxs[addr] = opt.marked[i].name; //add to refered
				opt.firstreferedAddrIndxs[opt.marked[i].ref] = opt.marked[i].name; //add to first refered
				if (addr.indexOf(opt.marked[i].ref) == 0) {
					opt.referedBySelf[opt.marked[i].ref] = { name: opt.marked[i].name, cons: obj.constructor }; //the obj refered by it's descentdant
				}
				return opt.marked[i].name;
			}
		}
		//the object not find in marked then push it into marked
		opt.marked.push({ obj: obj, name: "_" + opt.indx, ref: addr });
		opt.indx++;

		for (var k in obj) {
			mark(obj[k], [addr, dk(k)].join("."), opt);
		}
	}
};
var toEvalString = function (o) {
	var indx = 0, i;
	var marked = []; //rember marked objs
	var out = []; //buffer for output
	var referedAddrIndxs = {}; //rember refered addrs
	var firstreferedAddrIndxs = {}; //rember first refered addrs
	var referedBySelf = {};

	//mark refered
	mark(o, "r", { marked: marked, indx: indx, referedAddrIndxs: referedAddrIndxs, firstreferedAddrIndxs: firstreferedAddrIndxs, referedBySelf: referedBySelf });

	//convent object
	var reto = conventer(o, out, "r", referedAddrIndxs, firstreferedAddrIndxs, referedBySelf);

	var vout = [],i;
	for (i in referedBySelf) {
		vout.push("var ");
		vout.push(referedBySelf[i].name);
		if (referedBySelf[i].cons === Array) {
			vout.push("=[];");
		} else {
			vout.push("={};");
		}
	}

	return "(function(){" + vout.join("") + out.join("") + "return " + reto + ";})()";

};

angular.module("$dwr")
    .service("dwrUtil", ["$dwr", function (dwr) {
        /*
         * Copyright 2005 Joe Walker
         *
         * Licensed under the Apache License, Version 2.0 (the "License");
         * you may not use this file except in compliance with the License.
         * You may obtain a copy of the License at
         *
         *     http://www.apache.org/licenses/LICENSE-2.0
         *
         * Unless required by applicable law or agreed to in writing, software
         * distributed under the License is distributed on an "AS IS" BASIS,
         * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
         * See the License for the specific language governing permissions and
         * limitations under the License.
         */

        /**
         * Declare an object to which we can add real functions.
         */
        if (typeof dwr == 'undefined') dwr = {};
        if (!dwr.util) dwr.util = {};

        /** @private The flag we use to decide if we should escape html */
        dwr.util._escapeHtml = true;

        /**
         * Set the global escapeHtml flag
         */
        dwr.util.setEscapeHtml = function (escapeHtml) {
            dwr.util._escapeHtml = escapeHtml;
        };

        /** @private Work out from an options list and global settings if we should be esccaping */
        dwr.util._shouldEscapeHtml = function (options) {
            if (options && options.escapeHtml != null) {
                return options.escapeHtml;
            }
            return dwr.util._escapeHtml;
        };

        /**
         * Return a string with &, < and > replaced with their entities
         * @see TODO
         */
        dwr.util.escapeHtml = function (original) {
            return original.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        };

        /**
         * Replace common XML entities with characters (see dwr.util.escapeHtml())
         * @see TODO
         */
        dwr.util.unescapeHtml = function (original) {
            return original.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
        };

        /**
         * Replace characters dangerous for XSS reasons with visually similar characters
         * @see TODO
         */
        dwr.util.replaceXmlCharacters = function (original) {
            original = original.replace("&", "+");
            original = original.replace("<", "\u2039");
            original = original.replace(">", "\u203A");
            original = original.replace("\'", "\u2018");
            original = original.replace("\"", "\u201C");
            return original;
        };

        /**
         * Return true iff the input string contains any XSS dangerous characters
         * @see TODO
         */
        dwr.util.containsXssRiskyCharacters = function (original) {
            return (original.indexOf('&') != -1
                || original.indexOf('<') != -1
                || original.indexOf('>') != -1
                || original.indexOf('\'') != -1
                || original.indexOf('\"') != -1);
        };

        /**
         * Enables you to react to return being pressed in an input
         */
        dwr.util.onReturn = function (event, action) {
            if (!event) event = window.event;
            if (event && event.keyCode && event.keyCode == 13) action();
        };

        /**
         * Select a specific range in a text box. Useful for 'google suggest' type functions.
         */
        dwr.util.selectRange = function (ele, start, end) {
            ele = dwr.util._getElementById(ele, "selectRange()");
            if (ele == null) return;
            if (ele.setSelectionRange) {
                ele.setSelectionRange(start, end);
            }
            else if (ele.createTextRange) {
                var range = ele.createTextRange();
                range.moveStart("character", start);
                range.moveEnd("character", end - ele.value.length);
                range.select();
            }
            ele.focus();
        };

        /**
         * Find the element in the current HTML document with the given id or ids
         */
        dwr.util.byId = function () {
            var elems = [];
            for (var i = 0; i < arguments.length; i++) {
                var idOrElem = arguments[i];
                var elem;
                if (typeof idOrElem == 'string') {
                    var elem = document.getElementById(idOrElem);
                    // Workaround for IE and Opera that may return element based on name
                    if (document.all && elem && dwr.util._getId(elem) != idOrElem) {
                        elem = null;
                        var maybeElems = document.all[idOrElem];
                        if (maybeElems.tagName) maybeElems = [maybeElems];
                        for (var j = 0; j < maybeElems.length; j++) {
                            if (dwr.util._getId(maybeElems[j]) == idOrElem) {
                                elem = maybeElems[j];
                                break;
                            }
                        }
                    }
                }
                else {
                    elem = idOrElem;
                }
                if (arguments.length == 1) {
                    return elem;
                }
                elems.push(elem);
            }
            return elems;
        }

        dwr.util._getId = function (elem) {
            // Get the element's real id. In some situations IE may (wrongly)
            // return another element from the getAttribute() call so we watch out for
            // this case and use the attributes.id value instead. Note that the use of
            // the attributes collection may cause problems in IE7 together with
            // cloneNode so we avoid hitting it when possible.
            var elemId = elem.getAttribute("id");
            if (dwr.util._isObject(elemId)) {
                elemId = elem.attributes.id.value;
            }
            return elemId;
        };

        /**
         * Alias $ to dwr.util.byId
         */
        if (typeof $ == 'undefined') {
            $ = dwr.util.byId;
        }

        /**
         * This function pretty-prints simple data or whole object graphs, f ex as an aid in debugging.
         */
        dwr.util.toDescriptiveString = function (data, showLevels, options) {
            if (showLevels === undefined) showLevels = 1;
            var opt = {};
            if (dwr.util._isObject(options)) opt = options;
            var defaultoptions = {
                escapeHtml: false,
                baseIndent: "",
                childIndent: "\u00A0\u00A0",
                lineTerminator: "\n",
                oneLineMaxItems: 5,
                shortStringMaxLength: 13,
                propertyNameMaxLength: 30
            };
            for (var p in defaultoptions) {
                if (!(p in opt)) {
                    opt[p] = defaultoptions[p];
                }
            }

            var skipDomProperties = {
                document: true, ownerDocument: true,
                all: true,
                parentElement: true, parentNode: true, offsetParent: true,
                children: true, firstChild: true, lastChild: true,
                previousSibling: true, nextSibling: true,
                innerHTML: true, outerHTML: true,
                innerText: true, outerText: true, textContent: true,
                attributes: true,
                style: true, currentStyle: true, runtimeStyle: true,
                parentTextEdit: true
            };

            function recursive(data, showLevels, indentDepth, options) {
                var reply = "";
                try {
                    // string
                    if (dwr.util._isString(data)) {
                        var str = data;
                        if (showLevels == 0 && str.length > options.shortStringMaxLength)
                            str = str.substring(0, options.shortStringMaxLength - 3) + "...";
                        if (options.escapeHtml) {
                            // Do the escape separately for every line as escapeHtml() on some
                            // browsers (IE) will strip line breaks and we want to preserve them
                            var lines = str.split("\n");
                            for (var i = 0; i < lines.length; i++) lines[i] = dwr.util.escapeHtml(lines[i]);
                            str = lines.join("\n");
                        }
                        if (showLevels == 0) { // Short format
                            str = str.replace(/\n|\r|\t/g, function (ch) {
                                switch (ch) {
                                    case "\n":
                                        return "\\n";
                                    case "\r":
                                        return "";
                                    case "\t":
                                        return "\\t";
                                }
                            });
                        }
                        else { // Long format
                            str = str.replace(/\n|\r|\t/g, function (ch) {
                                switch (ch) {
                                    case "\n":
                                        return options.lineTerminator + indent(indentDepth + 1, options);
                                    case "\r":
                                        return "";
                                    case "\t":
                                        return "\\t";
                                }
                            });
                        }
                        reply = '"' + str + '"';
                    }

                    // function
                    else if (dwr.util._isFunction(data)) {
                        reply = "function";
                    }

                    // Array
                    else if (dwr.util._isArrayLike(data)) {
                        if (showLevels == 0) { // Short format (don't show items)
                            if (data.length > 0)
                                reply = "[...]";
                            else
                                reply = "[]";
                        }
                        else { // Long format (show items)
                            var strarr = [];
                            strarr.push("[");
                            var count = 0;
                            for (var i = 0; i < data.length; i++) {
                                if (!(i in data) && data != "[object NodeList]") continue;
                                var itemvalue = data[i];
                                if (count > 0) strarr.push(", ");
                                if (showLevels == 1) { // One-line format
                                    if (count == options.oneLineMaxItems) {
                                        strarr.push("...");
                                        break;
                                    }
                                }
                                else { // Multi-line format
                                    strarr.push(options.lineTerminator + indent(indentDepth + 1, options));
                                }
                                if (i != count) {
                                    strarr.push(i);
                                    strarr.push(":");
                                }
                                strarr.push(recursive(itemvalue, showLevels - 1, indentDepth + 1, options));
                                count++;
                            }
                            if (showLevels > 1) strarr.push(options.lineTerminator + indent(indentDepth, options));
                            strarr.push("]");
                            reply = strarr.join("");
                        }
                    }

                    // Objects except Date
                    else if (dwr.util._isObject(data) && !dwr.util._isDate(data)) {
                        if (showLevels == 0) { // Short format (don't show properties)
                            reply = dwr.util._detailedTypeOf(data);
                        }
                        else { // Long format (show properties)
                            var strarr = [];
                            if (dwr.util._detailedTypeOf(data) != "Object") {
                                strarr.push(dwr.util._detailedTypeOf(data));
                                if (typeof data.valueOf() != "object") {
                                    strarr.push(":");
                                    strarr.push(recursive(data.valueOf(), 1, indentDepth, options));
                                }
                                strarr.push(" ");
                            }
                            strarr.push("{");
                            var isDomObject = dwr.util._isHTMLElement(data);
                            var count = 0;
                            for (var prop in data) {
                                var propvalue = data[prop];
                                if (isDomObject) {
                                    if (propvalue == null) continue;
                                    if (typeof propvalue == "function") continue;
                                    if (skipDomProperties[prop]) continue;
                                    if (prop.toUpperCase() == prop) continue;
                                }
                                if (count > 0) strarr.push(", ");
                                if (showLevels == 1) { // One-line format
                                    if (count == options.oneLineMaxItems) {
                                        strarr.push("...");
                                        break;
                                    }
                                }
                                else { // Multi-line format
                                    strarr.push(options.lineTerminator + indent(indentDepth + 1, options));
                                }
                                strarr.push(prop.length > options.propertyNameMaxLength ? prop.substring(0, options.propertyNameMaxLength - 3) + "..." : prop);
                                strarr.push(":");
                                strarr.push(recursive(propvalue, showLevels - 1, indentDepth + 1, options));
                                count++;
                            }
                            if (showLevels > 1 && count > 0) strarr.push(options.lineTerminator + indent(indentDepth, options));
                            strarr.push("}");
                            reply = strarr.join("");
                        }
                    }

                    // undefined, null, number, boolean, Date
                    else {
                        reply = "" + data;
                    }

                    return reply;
                }
                catch (err) {
                    return (err.message ? err.message : "" + err);
                }
            }

            function indent(count, options) {
                var strarr = [];
                strarr.push(options.baseIndent);
                for (var i = 0; i < count; i++) {
                    strarr.push(options.childIndent);
                }
                return strarr.join("");
            };

            return recursive(data, showLevels, 0, opt);
        };

        /**
         * Setup a GMail style loading message.
         */
        dwr.util.useLoadingMessage = function (message) {
            var loadingMessage;
            if (message) loadingMessage = message;
            else loadingMessage = "Loading";
            dwr.engine.setPreHook(function () {
                var disabledZone = dwr.util.byId('disabledZone');
                if (!disabledZone) {
                    disabledZone = document.createElement('div');
                    disabledZone.setAttribute('id', 'disabledZone');
                    disabledZone.style.position = "absolute";
                    disabledZone.style.zIndex = "1000";
                    disabledZone.style.left = "0px";
                    disabledZone.style.top = "0px";
                    disabledZone.style.width = "100%";
                    disabledZone.style.height = "100%";
                    // IE need a background color to block click. Use an invisible background.
                    if (window.ActiveXObject) {
                        disabledZone.style.background = "white";
                        disabledZone.style.filter = "alpha(opacity=0)";
                    }
                    document.body.appendChild(disabledZone);
                    var messageZone = document.createElement('div');
                    messageZone.setAttribute('id', 'messageZone');
                    messageZone.style.position = "absolute";
                    messageZone.style.top = "0px";
                    messageZone.style.right = "0px";
                    messageZone.style.background = "red";
                    messageZone.style.color = "white";
                    messageZone.style.fontFamily = "Arial,Helvetica,sans-serif";
                    messageZone.style.padding = "4px";
                    document.body.appendChild(messageZone);
                    var text = document.createTextNode(loadingMessage);
                    messageZone.appendChild(text);
                    dwr.util._disabledZoneUseCount = 1;
                }
                else {
                    dwr.util.byId('messageZone').innerHTML = loadingMessage;
                    disabledZone.style.visibility = 'visible';
                    dwr.util._disabledZoneUseCount++;
                    dwr.util.byId('messageZone').style.visibility = 'visible';
                }
            });
            dwr.engine.setPostHook(function () {
                dwr.util._disabledZoneUseCount--;
                if (dwr.util._disabledZoneUseCount == 0) {
                    dwr.util.byId('disabledZone').style.visibility = 'hidden';
                    dwr.util.byId('messageZone').style.visibility = 'hidden';
                }
            });
        };

        /**
         * Set a global highlight handler
         */
        dwr.util.setHighlightHandler = function (handler) {
            dwr.util._highlightHandler = handler;
        };

        /**
         * An example highlight handler
         */
        dwr.util.yellowFadeHighlightHandler = function (ele) {
            dwr.util._yellowFadeProcess(ele, 0);
        };
        dwr.util._yellowFadeSteps = [ "d0", "b0", "a0", "90", "98", "a0", "a8", "b0", "b8", "c0", "c8", "d0", "d8", "e0", "e8", "f0", "f8" ];
        dwr.util._yellowFadeProcess = function (ele, colorIndex) {
            ele = dwr.util.byId(ele);
            if (colorIndex < dwr.util._yellowFadeSteps.length) {
                ele.style.backgroundColor = "#ffff" + dwr.util._yellowFadeSteps[colorIndex];
                setTimeout("dwr.util._yellowFadeProcess('" + dwr.util._getId(ele) + "'," + (colorIndex + 1) + ")", 200);
            }
            else {
                ele.style.backgroundColor = "transparent";
            }
        };

        /**
         * An example highlight handler
         */
        dwr.util.borderFadeHighlightHandler = function (ele) {
            ele.style.borderWidth = "2px";
            ele.style.borderStyle = "solid";
            dwr.util._borderFadeProcess(ele, 0);
        };
        dwr.util._borderFadeSteps = [ "d0", "b0", "a0", "90", "98", "a0", "a8", "b0", "b8", "c0", "c8", "d0", "d8", "e0", "e8", "f0", "f8" ];
        dwr.util._borderFadeProcess = function (ele, colorIndex) {
            ele = dwr.util.byId(ele);
            if (colorIndex < dwr.util._borderFadeSteps.length) {
                ele.style.borderColor = "#ff" + dwr.util._borderFadeSteps[colorIndex] + dwr.util._borderFadeSteps[colorIndex];
                setTimeout("dwr.util._borderFadeProcess('" + dwr.util._getId(ele) + "'," + (colorIndex + 1) + ")", 200);
            }
            else {
                ele.style.backgroundColor = "transparent";
            }
        };

        /**
         * A focus highlight handler
         */
        dwr.util.focusHighlightHandler = function (ele) {
            try {
                ele.focus();
            }
            catch (ex) { /* ignore */
            }
        };

        /** @private the current global highlight style */
        dwr.util._highlightHandler = null;

        /**
         * Highlight that an element has changed
         */
        dwr.util.highlight = function (ele, options) {
            if (options && options.highlightHandler) {
                options.highlightHandler(dwr.util.byId(ele));
            }
            else if (dwr.util._highlightHandler != null) {
                dwr.util._highlightHandler(dwr.util.byId(ele));
            }
        };

        /**
         * Set the value an HTML element to the specified value.
         */
        dwr.util.setValue = function (ele, val, options) {
            if (val == null) val = "";
            if (options == null) options = {};

            var orig = ele;
            ele = dwr.util.byId(ele); // Returns null if argument is a name, even on IE
            var nodes = null;
            if (ele == null) {
                // Now it is time to look by name
                nodes = document.getElementsByName(orig);
                if (nodes.length >= 1) ele = nodes.item(0);
            }

            if (ele == null) {
                dwr.util._debug("setValue() can't find an element with id/name: " + orig + ".");
                return;
            }

            // All paths now lead to some update so we highlight a change
            dwr.util.highlight(ele, options);

            if (dwr.util._isHTMLElement(ele, "select")) {
                if (ele.type == "select-multiple" && dwr.util._isArray(val)) dwr.util._selectListItems(ele, val);
                else dwr.util._selectListItem(ele, val);
                return;
            }

            if (dwr.util._isHTMLElement(ele, "input")) {
                if (ele.type == "radio" || ele.type == "checkbox") {
                    if (nodes && nodes.length >= 1) {
                        for (var i = 0; i < nodes.length; i++) {
                            var node = nodes.item(i);
                            if (node.type != ele.type) continue;
                            if (dwr.util._isArray(val)) {
                                node.checked = false;
                                for (var j = 0; j < val.length; j++)
                                    if (val[j] == node.value) node.checked = true;
                            }
                            else {
                                node.checked = (node.value == val);
                            }
                        }
                    }
                    else {
                        ele.checked = (val == true);
                    }
                }
                else ele.value = val;

                return;
            }

            if (dwr.util._isHTMLElement(ele, "textarea")) {
                ele.value = val;
                return;
            }

            if (dwr.util._isHTMLElement(ele, "img")) {
                ele.src = val;
                return;
            }

            // If the value to be set is a DOM object then we try importing the node
            // rather than serializing it out
            if (val.nodeType) {
                if (val.nodeType == 9 /*Node.DOCUMENT_NODE*/) val = val.documentElement;
                val = dwr.util._importNode(ele.ownerDocument, val, true);
                ele.appendChild(val);
                return;
            }

            // Fall back to innerHTML and friends
            if (dwr.util._shouldEscapeHtml(options)) {
                if ("textContent" in ele) ele.textContent = val.toString();
                else if ("innerText" in ele) ele.innerText = val.toString();
                else ele.innerHTML = dwr.util.escapeHtml(val.toString());
            }
            else {
                ele.innerHTML = val;
            }
        };

        /**
         * @private Find multiple items in a select list and select them. Used by setValue()
         * @param ele The select list item
         * @param val The array of values to select
         */
        dwr.util._selectListItems = function (ele, val) {
            // We deal with select list elements by selecting the matching option
            // Begin by searching through the values
            var found = 0;
            var i;
            var j;
            for (i = 0; i < ele.options.length; i++) {
                ele.options[i].selected = false;
                for (j = 0; j < val.length; j++) {
                    if (ele.options[i].value == val[j]) {
                        ele.options[i].selected = true;
                        found++;
                    }
                }
            }
            // If that fails then try searching through the visible text
            if (found == val.length) return;

            for (i = 0; i < ele.options.length; i++) {
                for (j = 0; j < val.length; j++) {
                    if (ele.options[i].text == val[j]) {
                        ele.options[i].selected = true;
                    }
                }
            }
        };

        /**
         * @private Find an item in a select list and select it. Used by setValue()
         * @param ele The select list item
         * @param val The value to select
         */
        dwr.util._selectListItem = function (ele, val) {
            // We deal with select list elements by selecting the matching option
            // Begin by searching through the values
            var found = false;
            var i;
            for (i = 0; i < ele.options.length; i++) {
                if (ele.options[i].value == val) {
                    ele.options[i].selected = true;
                    found = true;
                }
                else {
                    ele.options[i].selected = false;
                }
            }

            // If that fails then try searching through the visible text
            if (found) return;

            for (i = 0; i < ele.options.length; i++) {
                ele.options[i].selected = (ele.options[i].text == val);
            }
        };

        /**
         * Read the current value for a given HTML element.
         */
        dwr.util.getValue = function (ele, options) {
            if (options == null) options = {};
            var orig = ele;
            ele = dwr.util.byId(ele); // Returns null if argument is a name, even on IE
            var nodes = null;
            if (ele == null) {
                // Now it is time to look by name
                nodes = document.getElementsByName(orig);
                if (nodes.length >= 1) ele = nodes.item(0);
            }
            if (ele == null) {
                dwr.util._debug("getValue() can't find an element with id/name: " + orig + ".");
                return "";
            }

            if (dwr.util._isHTMLElement(ele, "select")) {
                // Using "type" property instead of "multiple" as "type" is an official
                // client-side property since JS 1.1
                if (ele.type == "select-multiple") {
                    var reply = new Array();
                    for (var i = 0; i < ele.options.length; i++) {
                        var item = ele.options[i];
                        if (item.selected) {
                            var valueAttr = item.getAttributeNode("value");
                            if (valueAttr && valueAttr.specified) {
                                reply.push(item.value);
                            }
                            else {
                                reply.push(item.text);
                            }
                        }
                    }
                    return reply;
                }
                else {
                    var sel = ele.selectedIndex;
                    if (sel != -1) {
                        var item = ele.options[sel];
                        var valueAttr = item.getAttributeNode("value");
                        if (valueAttr && valueAttr.specified) {
                            return item.value;
                        }
                        return item.text;
                    }
                    else {
                        return "";
                    }
                }
            }

            if (dwr.util._isHTMLElement(ele, "input")) {
                if (ele.type == "radio") {
                    if (nodes && nodes.length >= 1) {
                        for (var i = 0; i < nodes.length; i++) {
                            var node = nodes.item(i);
                            if (node.type == ele.type) {
                                if (node.checked) return node.value;
                            }
                        }
                    }
                    return ele.checked;
                }
                if (ele.type == "checkbox") {
                    if (nodes && nodes.length >= 1) {
                        var reply = [];
                        for (var i = 0; i < nodes.length; i++) {
                            var node = nodes.item(i);
                            if (node.type == ele.type) {
                                if (node.checked) reply.push(node.value);
                            }
                        }
                        return reply;
                    }
                    return ele.checked;
                }
                if (ele.type == "file") {
                    return ele;
                }
                return ele.value;
            }

            if (dwr.util._isHTMLElement(ele, "textarea")) {
                return ele.value;
            }

            if (dwr.util._shouldEscapeHtml(options)) {
                if ("textContent" in ele) return ele.textContent;
                else if ("innerText" in ele) return ele.innerText;
            }
            return ele.innerHTML;
        };

        /**
         * getText() is like getValue() except that it reads the text (and not the value) from select elements
         */
        dwr.util.getText = function (ele) {
            ele = dwr.util._getElementById(ele, "getText()");
            if (ele == null) return null;
            if (!dwr.util._isHTMLElement(ele, "select")) {
                dwr.util._debug("getText() can only be used with select elements. Attempt to use: " + dwr.util._detailedTypeOf(ele) + " from  id: " + orig + ".");
                return "";
            }

            // This is a bit of a scam because it assumes single select
            // but I'm not sure how we should treat multi-select.
            var sel = ele.selectedIndex;
            if (sel != -1) {
                return ele.options[sel].text;
            }
            else {
                return "";
            }
        };

        /**
         * Given a map, or a recursive structure consisting of arrays and maps, call
         * setValue() for all leaf entries and use intermediate levels to form nested
         * element ids.
         */
        dwr.util.setValues = function (data, options) {
            var prefix = "";
            var depth = 100;
            if (options && "prefix" in options) prefix = options.prefix;
            if (options && "idPrefix" in options) prefix = options.idPrefix;
            if (options && "depth" in options) depth = options.depth;
            dwr.util._setValuesRecursive(data, prefix, depth, options);
        };

        /**
         * @private Recursive helper for setValues()
         */
        dwr.util._setValuesRecursive = function (data, idpath, depth, options) {
            if (depth == 0) return;
            // Array containing objects -> add "[n]" to prefix and make recursive call
            // for each item object
            if (dwr.util._isArray(data) && data.length > 0 && dwr.util._isObject(data[0])) {
                for (var i = 0; i < data.length; i++) {
                    dwr.util._setValuesRecursive(data[i], idpath + "[" + i + "]", depth - 1, options);
                }
            }
            // Object (not array) -> handle nested object properties
            else if (dwr.util._isObject(data) && !dwr.util._isArray(data)) {
                for (var prop in data) {
                    var subidpath = idpath ? idpath + "." + prop : prop;
                    // Object (not array), or array containing objects -> call ourselves recursively
                    if (dwr.util._isObject(data[prop]) && !dwr.util._isArray(data[prop]) && !dwr.util._isDate(data[prop])
                        || dwr.util._isArray(data[prop]) && data[prop].length > 0 && dwr.util._isObject(data[prop][0])) {
                        dwr.util._setValuesRecursive(data[prop], subidpath, depth - 1, options);
                    }
                    // Functions -> skip
                    else if (typeof data[prop] == "function") {
                        // NOP
                    }
                    // Only simple values left (or array of simple values, or empty array)
                    // -> call setValue()
                    else {
                        // Are there any elements with that id or name
                        if (dwr.util.byId(subidpath) != null || document.getElementsByName(subidpath).length >= 1) {
                            dwr.util.setValue(subidpath, data[prop], options);
                        }
                    }
                }
            }
        };

        /**
         * Given a map, or a recursive structure consisting of arrays and maps, call
         * getValue() for all leaf entries and use intermediate levels to form nested
         * element ids.
         * Given a string or element that refers to a form, create an object from the
         * elements of the form.
         */
        dwr.util.getValues = function (data, options) {
            if (typeof data == "string" || dwr.util._isHTMLElement(data)) {
                return dwr.util.getFormValues(data);
            }
            else {
                var prefix = "";
                var depth = 100;
                if (options != null && "prefix" in options) prefix = options.prefix;
                if (options != null && "idPrefix" in options) prefix = options.idPrefix;
                if (options != null && "depth" in options) depth = options.depth;
                dwr.util._getValuesRecursive(data, prefix, depth, options);
                return data;
            }
        };

        /**
         * Given a string or element that refers to a form, create an object from the
         * elements of the form.
         */
        dwr.util.getFormValues = function (eleOrNameOrId) {
            var ele = null;
            if (typeof eleOrNameOrId == "string") {
                ele = document.forms[eleOrNameOrId]; // arg is name
                if (ele == null) ele = dwr.util.byId(eleOrNameOrId); // arg is id
            }
            else if (dwr.util._isHTMLElement(eleOrNameOrId)) {
                ele = eleOrNameOrId; // arg is element
            }
            if (ele != null) {
                if (ele.elements == null) {
                    alert("getFormValues() requires an object or reference to a form element.");
                    return null;
                }
                var reply = {};
                var name;
                var value;
                for (var i = 0; i < ele.elements.length; i++) {
                    if (ele[i].type in {button: 0, submit: 0, reset: 0, image: 0, file: 0}) continue;
                    if (ele[i].name) {
                        name = ele[i].name;
                        value = dwr.util.getValue(name);
                    }
                    else {
                        if (ele[i].id) name = ele[i].id;
                        else name = "element" + i;
                        value = dwr.util.getValue(ele[i]);
                    }
                    reply[name] = value;
                }
                return reply;
            }
        };

        /**
         * @private Recursive helper for getValues().
         */
        dwr.util._getValuesRecursive = function (data, idpath, depth, options) {
            if (depth == 0) return;
            // Array containing objects -> add "[n]" to idpath and make recursive call
            // for each item object
            if (dwr.util._isArray(data) && data.length > 0 && dwr.util._isObject(data[0])) {
                for (var i = 0; i < data.length; i++) {
                    dwr.util._getValuesRecursive(data[i], idpath + "[" + i + "]", depth - 1, options);
                }
            }
            // Object (not array) -> handle nested object properties
            else if (dwr.util._isObject(data) && !dwr.util._isArray(data)) {
                for (var prop in data) {
                    var subidpath = idpath ? idpath + "." + prop : prop;
                    // Object, or array containing objects -> call ourselves recursively
                    if (dwr.util._isObject(data[prop]) && !dwr.util._isArray(data[prop])
                        || dwr.util._isArray(data[prop]) && data[prop].length > 0 && dwr.util._isObject(data[prop][0])) {
                        dwr.util._getValuesRecursive(data[prop], subidpath, depth - 1, options);
                    }
                    // Functions -> skip
                    else if (typeof data[prop] == "function") {
                        // NOP
                    }
                    // Only simple values left (or array of simple values, or empty array)
                    // -> call getValue()
                    else {
                        // Are there any elements with that id or name
                        if (dwr.util.byId(subidpath) != null || document.getElementsByName(subidpath).length >= 1) {
                            data[prop] = dwr.util.getValue(subidpath);
                        }
                    }
                }
            }
        };

        /**
         * Add options to a list from an array or map.
         */
        dwr.util.addOptions = function (ele, data/*, options*/) {
            ele = dwr.util._getElementById(ele, "addOptions()");
            if (ele == null) return;
            var useOptions = dwr.util._isHTMLElement(ele, "select");
            var useLi = dwr.util._isHTMLElement(ele, ["ul", "ol"]);
            if (!useOptions && !useLi) {
                dwr.util._debug("addOptions() can only be used with select/ul/ol elements. Attempt to use: " + dwr.util._detailedTypeOf(ele));
                return;
            }
            if (data == null) return;

            var argcount = arguments.length;
            var options = {};
            var lastarg = arguments[argcount - 1];
            if (argcount > 2 && dwr.util._isObject(lastarg)) {
                options = lastarg;
                argcount--;
            }
            var arg3 = null;
            if (argcount >= 3) arg3 = arguments[2];
            var arg4 = null;
            if (argcount >= 4) arg4 = arguments[3];
            if (!options.optionCreator && useOptions) options.optionCreator = dwr.util._defaultOptionCreator;
            if (!options.optionCreator && useLi) options.optionCreator = dwr.util._defaultListItemCreator;
            options.document = ele.ownerDocument;

            var text, value, li;
            if (dwr.util._isArray(data)) {
                // Loop through the data that we do have
                for (var i = 0; i < data.length; i++) {
                    options.data = data[i];
                    options.text = null;
                    options.value = null;
                    if (useOptions) {
                        if (arg3 != null) {
                            if (arg4 != null) {
                                options.text = dwr.util._getValueFrom(data[i], arg4);
                                options.value = dwr.util._getValueFrom(data[i], arg3);
                            }
                            else options.text = options.value = dwr.util._getValueFrom(data[i], arg3);
                        }
                        else options.text = options.value = dwr.util._getValueFrom(data[i]);

                        if (options.text != null || options.value) {
                            var opt = options.optionCreator(options);
                            opt.text = options.text;
                            opt.value = options.value;
                            ele.options[ele.options.length] = opt;
                        }
                    }
                    else {
                        options.value = dwr.util._getValueFrom(data[i], arg3);
                        if (options.value != null) {
                            li = options.optionCreator(options);
                            if (dwr.util._shouldEscapeHtml(options)) {
                                options.value = dwr.util.escapeHtml(options.value);
                            }
                            li.innerHTML = options.value;
                            ele.appendChild(li);
                        }
                    }
                }
            }
            else if (arg4 != null) {
                if (!useOptions) {
                    alert("dwr.util.addOptions can only create select lists from objects.");
                    return;
                }
                for (var prop in data) {
                    options.data = data[prop];
                    options.value = dwr.util._getValueFrom(data[prop], arg3);
                    options.text = dwr.util._getValueFrom(data[prop], arg4);

                    if (options.text != null || options.value) {
                        var opt = options.optionCreator(options);
                        opt.text = options.text;
                        opt.value = options.value;
                        ele.options[ele.options.length] = opt;
                    }
                }
            }
            else {
                if (!useOptions) {
                    dwr.util._debug("dwr.util.addOptions can only create select lists from objects.");
                    return;
                }
                for (var prop in data) {
                    if (typeof data[prop] == "function") continue;
                    options.data = data[prop];
                    if (arg3 == null) {
                        options.value = prop;
                        options.text = data[prop];
                    }
                    else {
                        options.value = data[prop];
                        options.text = prop;
                    }
                    if (options.text != null || options.value) {
                        var opt = options.optionCreator(options);
                        opt.text = options.text;
                        opt.value = options.value;
                        ele.options[ele.options.length] = opt;
                    }
                }
            }

            // All error routes through this function result in a return, so highlight now
            dwr.util.highlight(ele, options);
        };

        /**
         * @private Get the data from an array function for dwr.util.addOptions
         */
        dwr.util._getValueFrom = function (data, method) {
            if (method == null) return data;
            else if (typeof method == 'function') return method(data);
            else return data[method];
        };

        /**
         * @private Default option creation function
         */
        dwr.util._defaultOptionCreator = function (options) {
            return options.document.createElement("option");
        };

        /**
         * @private Default list item creation function
         */
        dwr.util._defaultListItemCreator = function (options) {
            return options.document.createElement("li");
        };

        /**
         * Remove all the options from a select list (specified by id)
         */
        dwr.util.removeAllOptions = function (ele) {
            ele = dwr.util._getElementById(ele, "removeAllOptions()");
            if (ele == null) return;
            var useOptions = dwr.util._isHTMLElement(ele, "select");
            var useLi = dwr.util._isHTMLElement(ele, ["ul", "ol"]);
            if (!useOptions && !useLi) {
                dwr.util._debug("removeAllOptions() can only be used with select, ol and ul elements. Attempt to use: " + dwr.util._detailedTypeOf(ele));
                return;
            }
            if (useOptions) {
                ele.options.length = 0;
            }
            else {
                while (ele.childNodes.length > 0) {
                    ele.removeChild(ele.firstChild);
                }
            }
        };

        /**
         * Create rows inside a the table, tbody, thead or tfoot element (given by id).
         */
        dwr.util.addRows = function (ele, data, cellFuncs, options) {
            ele = dwr.util._getElementById(ele, "addRows()");
            if (ele == null) return;
            if (!dwr.util._isHTMLElement(ele, ["table", "tbody", "thead", "tfoot"])) {
                dwr.util._debug("addRows() can only be used with table, tbody, thead and tfoot elements. Attempt to use: " + dwr.util._detailedTypeOf(ele));
                return;
            }
            if (!options) options = {};
            if (!options.rowCreator) options.rowCreator = dwr.util._defaultRowCreator;
            if (!options.cellCreator) options.cellCreator = dwr.util._defaultCellCreator;
            options.document = ele.ownerDocument;
            var tr, rowNum;
            if (dwr.util._isArray(data)) {
                for (rowNum = 0; rowNum < data.length; rowNum++) {
                    options.rowData = data[rowNum];
                    options.rowIndex = rowNum;
                    options.rowNum = rowNum;
                    options.data = null;
                    options.cellNum = -1;
                    tr = dwr.util._addRowInner(cellFuncs, options);
                    if (tr != null) ele.appendChild(tr);
                }
            }
            else if (typeof data == "object") {
                rowNum = 0;
                for (var rowIndex in data) {
                    options.rowData = data[rowIndex];
                    options.rowIndex = rowIndex;
                    options.rowNum = rowNum;
                    options.data = null;
                    options.cellNum = -1;
                    tr = dwr.util._addRowInner(cellFuncs, options);
                    if (tr != null) ele.appendChild(tr);
                    rowNum++;
                }
            }

            dwr.util.highlight(ele, options);
        };

        /**
         * @private The contents we put in empty table cells to workaround IE's border bug.
         */
        dwr.util._emptyTableCellReplacement = "<div style='width:0;height:0;overflow:hidden;'></div>";

        /**
         * @private Internal function to draw a single row of a table.
         */
        dwr.util._addRowInner = function (cellFuncs, options) {
            var tr = options.rowCreator(options);
            if (tr == null) return null;
            for (var cellNum = 0; cellNum < cellFuncs.length; cellNum++) {
                var func = cellFuncs[cellNum];
                if (typeof func == 'function') options.data = func(options.rowData, options);
                else options.data = func || "";
                options.cellNum = cellNum;
                var td = options.cellCreator(options);
                if (td != null) {
                    if ("data" in options) {
                        if (dwr.util._isHTMLElement(options.data)) td.appendChild(options.data);
                        else {
                            if (dwr.util._shouldEscapeHtml(options) && typeof(options.data) == "string") {
                                td.innerHTML = dwr.util.escapeHtml(options.data);
                            }
                            else {
                                td.innerHTML = options.data;
                            }
                        }
                    }
                    else {
                        td.innerHTML = dwr.util._emptyTableCellReplacement;
                    }
                    tr.appendChild(td);
                }
            }
            return tr;
        };

        /**
         * @private Default row creation function
         */
        dwr.util._defaultRowCreator = function (options) {
            return options.document.createElement("tr");
        };

        /**
         * @private Default cell creation function
         */
        dwr.util._defaultCellCreator = function (options) {
            return options.document.createElement("td");
        };

        /**
         * Remove all the children of a given node.
         */
        dwr.util.removeAllRows = function (ele, options) {
            ele = dwr.util._getElementById(ele, "removeAllRows()");
            if (ele == null) return;
            if (!options) options = {};
            if (!options.filter) options.filter = function () {
                return true;
            };
            if (!dwr.util._isHTMLElement(ele, ["table", "tbody", "thead", "tfoot"])) {
                dwr.util._debug("removeAllRows() can only be used with table, tbody, thead and tfoot elements. Attempt to use: " + dwr.util._detailedTypeOf(ele));
                return;
            }
            var child = ele.firstChild;
            var next;
            while (child != null) {
                next = child.nextSibling;
                if (options.filter(child)) {
                    ele.removeChild(child);
                }
                child = next;
            }
        };

        /**
         * dwr.util.byId(ele).className = "X", that we can call from Java easily.
         */
        dwr.util.setClassName = function (ele, className) {
            ele = dwr.util._getElementById(ele, "setClassName()");
            if (ele == null) return;
            ele.className = className;
        };

        /**
         * dwr.util.byId(ele).className += "X", that we can call from Java easily.
         */
        dwr.util.addClassName = function (ele, className) {
            ele = dwr.util._getElementById(ele, "addClassName()");
            if (ele == null) return;
            ele.className += " " + className;
        };

        /**
         * dwr.util.byId(ele).className -= "X", that we can call from Java easily
         * From code originally by Gavin Kistner
         */
        dwr.util.removeClassName = function (ele, className) {
            ele = dwr.util._getElementById(ele, "removeClassName()");
            if (ele == null) return;
            var regex = new RegExp("(^|\\s)" + className + "(\\s|$)", 'g');
            ele.className = ele.className.replace(regex, '');
        };

        /**
         * dwr.util.byId(ele).className |= "X", that we can call from Java easily.
         */
        dwr.util.toggleClassName = function (ele, className) {
            ele = dwr.util._getElementById(ele, "toggleClassName()");
            if (ele == null) return;
            var regex = new RegExp("(^|\\s)" + className + "(\\s|$)");
            if (regex.test(ele.className)) {
                ele.className = ele.className.replace(regex, '');
            }
            else {
                ele.className += " " + className;
            }
        };

        /**
         * Clone a node and insert it into the document just above the 'template' node
         */
        dwr.util.cloneNode = function (ele, options) {
            ele = dwr.util._getElementById(ele, "cloneNode()");
            if (ele == null) return null;
            if (options == null) options = {};
            var clone = ele.cloneNode(true);
            if ("idPrefix" in options || "idSuffix" in options) {
                dwr.util._updateIds(clone, options);
            }
            else {
                dwr.util._removeIds(clone);
            }
            ele.parentNode.insertBefore(clone, ele);
            return clone;
        };

        /**
         * @private Update all of the ids in an element tree
         */
        dwr.util._updateIds = function (ele, options) {
            if (options == null) options = {};
            if (dwr.util._getId(ele)) {
                ele.setAttribute("id",
                        ("idPrefix" in options ? options.idPrefix : "")
                        + dwr.util._getId(ele)
                        + ("idSuffix" in options ? options.idSuffix : ""));
            }
            var children = ele.childNodes;
            for (var i = 0; i < children.length; i++) {
                var child = children.item(i);
                if (child.nodeType == 1 /*Node.ELEMENT_NODE*/) {
                    dwr.util._updateIds(child, options);
                }
            }
        };

        /**
         * @private Remove all the Ids from an element
         */
        dwr.util._removeIds = function (ele) {
            if (dwr.util._getId(ele)) ele.removeAttribute("id");
            var children = ele.childNodes;
            for (var i = 0; i < children.length; i++) {
                var child = children.item(i);
                if (child.nodeType == 1 /*Node.ELEMENT_NODE*/) {
                    dwr.util._removeIds(child);
                }
            }
        };

        /**
         * Clone a template node and its embedded template child nodes according to
         * cardinalities (of arrays) in supplied data.
         */
        dwr.util.cloneNodeForValues = function (templateEle, data, options) {
            templateEle = dwr.util._getElementById(templateEle, "cloneNodeForValues()");
            if (templateEle == null) return null;
            if (options == null) options = {};
            var idpath;
            if (options.idPrefix != null)
                idpath = options.idPrefix;
            else
                idpath = dwr.util._getId(templateEle) || "";
            return dwr.util._cloneNodeForValuesRecursive(templateEle, data, idpath, options);
        };

        /**
         * @private Recursive helper for cloneNodeForValues().
         */
        dwr.util._cloneNodeForValuesRecursive = function (templateEle, data, idpath, options) {
            // Incoming array -> make an id for each item and call clone of the template
            // for each of them
            if (dwr.util._isArray(data)) {
                var clones = [];
                for (var i = 0; i < data.length; i++) {
                    var item = data[i];
                    var clone = dwr.util._cloneNodeForValuesRecursive(templateEle, item, idpath + "[" + i + "]", options);
                    clones.push(clone);
                }
                return clones;
            }
            else
            // Incoming object (not array) -> clone the template, add id prefixes, add
            // clone to DOM, and then recurse into any array properties if they contain
            // objects and there is a suitable template
            if (dwr.util._isObject(data) && !dwr.util._isArray(data)) {
                var clone = templateEle.cloneNode(true);
                if (options.updateCloneStyle && clone.style) {
                    for (var propname in options.updateCloneStyle) {
                        clone.style[propname] = options.updateCloneStyle[propname];
                    }
                }
                dwr.util._replaceIds(clone, dwr.util._getId(templateEle), idpath);
                templateEle.parentNode.insertBefore(clone, templateEle);
                dwr.util._cloneSubArrays(data, idpath, options);
                return clone;
            }

            // It is an error to end up here so we return nothing
            return null;
        };

        /**
         * @private Substitute a leading idpath fragment with another idpath for all
         * element ids tree, and remove ids that don't match the idpath.
         */
        dwr.util._replaceIds = function (ele, oldidpath, newidpath) {
            var currId = dwr.util._getId(ele);
            if (currId) {
                var newId = null;
                if (currId == oldidpath) {
                    newId = newidpath;
                }
                else if (currId.length > oldidpath.length) {
                    if (currId.substr(0, oldidpath.length) == oldidpath) {
                        var trailingChar = currId.charAt(oldidpath.length);
                        if (trailingChar == "." || trailingChar == "[") {
                            newId = newidpath + currId.substr(oldidpath.length);
                        }
                    }
                }
                if (newId) {
                    ele.setAttribute("id", newId);
                }
                else {
                    ele.removeAttribute("id");
                }
            }
            var children = ele.childNodes;
            for (var i = 0; i < children.length; i++) {
                var child = children.item(i);
                if (child.nodeType == 1 /*Node.ELEMENT_NODE*/) {
                    dwr.util._replaceIds(child, oldidpath, newidpath);
                }
            }
        };

        /**
         * @private Finds arrays in supplied data and uses any corresponding template
         * node to make a clone for each item in the array.
         */
        dwr.util._cloneSubArrays = function (data, idpath, options) {
            var prop;
            for (prop in data) {
                var value = data[prop];
                // Look for potential recursive cloning in all array properties
                if (dwr.util._isArray(value)) {
                    // Only arrays with objects are interesting for cloning
                    if (value.length > 0 && dwr.util._isObject(value[0])) {
                        var subTemplateId = idpath + "." + prop;
                        var subTemplateEle = dwr.util.byId(subTemplateId);
                        if (subTemplateEle != null) {
                            dwr.util._cloneNodeForValuesRecursive(subTemplateEle, value, subTemplateId, options);
                        }
                    }
                }
                // Continue looking for arrays in object properties
                else if (dwr.util._isObject(value)) {
                    dwr.util._cloneSubArrays(value, idpath + "." + prop, options);
                }
            }
        };

        /**
         * @private Helper to turn a string into an element with an error message
         */
        dwr.util._getElementById = function (ele, source) {
            var orig = ele;
            ele = dwr.util.byId(ele);
            if (ele == null) {
                dwr.util._debug(source + " can't find an element with id: " + orig + ".");
            }
            return ele;
        };

        /**
         * @private Is the given node an HTML element (optionally of a given type)?
         * @param ele The element to test
         * @param nodeName eg "input", "textarea" - check for node name (optional)
         *         if nodeName is an array then check all for a match.
         */
        dwr.util._isHTMLElement = function (ele, nodeName) {
            if (ele == null || typeof ele != "object" || ele.nodeName == null) {
                return false;
            }
            if (nodeName != null) {
                var test = ele.nodeName.toLowerCase();
                if (typeof nodeName == "string") {
                    return test == nodeName.toLowerCase();
                }
                if (dwr.util._isArray(nodeName)) {
                    var match = false;
                    for (var i = 0; i < nodeName.length && !match; i++) {
                        if (test == nodeName[i].toLowerCase()) {
                            match = true;
                        }
                    }
                    return match;
                }
                dwr.util._debug("dwr.util._isHTMLElement was passed test node name that is neither a string or array of strings");
                return false;
            }
            return true;
        };

        /**
         * @private Like typeOf except that more information for an object is returned other than "object"
         */
        dwr.util._detailedTypeOf = function (x) {
            var reply = typeof x;
            if (reply == "object") {
                reply = Object.prototype.toString.apply(x); // Returns "[object class]"
                reply = reply.substring(8, reply.length - 1);  // Just get the class bit
            }
            return reply;
        };

        /**
         * @private Object detector. Excluding null from objects.
         */
        dwr.util._isObject = function (data) {
            return (data && typeof data == "object");
        };

        /**
         * @private Array detector. Note: instanceof doesn't work with multiple frames.
         */
        dwr.util._isArray = function (data) {
            return (data && Object.prototype.toString.call(data) == "[object Array]");
        };

        /**
         * @private Array like detector. Note: instanceof doesn't work with multiple frames.
         */
        dwr.util._isArrayLike = function (data) {
            return data
                && (typeof data.length == "number") // must have .length
                && ((data.propertyIsEnumerable && data.propertyIsEnumerable("length") == false) || !data.constructor || data != "[object Object]") // .length must be native prop
                && !dwr.util._isString(data) // don't be fooled by string
                && !dwr.util._isFunction(data) // don't be fooled by function
                && !data.tagName; // don't be fooled by elements
        };

        /**
         * @private String detector.
         */
        dwr.util._isString = function (data) {
            return (data && (typeof data == "string" || Object.prototype.toString.call(data) == "[object String]"));
        };

        /**
         * @private Function detector.
         */
        dwr.util._isFunction = function (data) {
            return (data && (typeof data == "function" || Object.prototype.toString.call(data) == "[object Function]")
                && data != "[object NodeList]"); // need to workaround NodeList on Safari
        };

        /**
         * @private Date detector. Note: instanceof doesn't work with multiple frames.
         */
        dwr.util._isDate = function (data) {
            return (data && Object.prototype.toString.call(data) == "[object Date]");
        };

        /**
         * @private Used by setValue. Gets around the missing functionallity in IE.
         */
        dwr.util._importNode = function (doc, importedNode, deep) {
            var newNode;

            if (importedNode.nodeType == 1 /*Node.ELEMENT_NODE*/) {
                newNode = doc.createElement(importedNode.nodeName);

                for (var i = 0; i < importedNode.attributes.length; i++) {
                    var attr = importedNode.attributes[i];
                    if (attr.nodeValue != null && attr.nodeValue != '') {
                        newNode.setAttribute(attr.name, attr.nodeValue);
                    }
                }

                if (importedNode.style != null) {
                    newNode.style.cssText = importedNode.style.cssText;
                }
            }
            else if (importedNode.nodeType == 3 /*Node.TEXT_NODE*/) {
                newNode = doc.createTextNode(importedNode.nodeValue);
            }

            if (deep && importedNode.hasChildNodes()) {
                for (i = 0; i < importedNode.childNodes.length; i++) {
                    newNode.appendChild(dwr.util._importNode(doc, importedNode.childNodes[i], true));
                }
            }

            return newNode;
        };

        /** @private Used internally when some message needs to get to the programmer */
        dwr.util._debug = function (message, stacktrace) {
            var written = false;
            try {
                if (window.console) {
                    if (stacktrace && window.console.trace) window.console.trace();
                    window.console.log(message);
                    written = true;
                }
                else if (window.opera && window.opera.postError) {
                    window.opera.postError(message);
                    written = true;
                }
            }
            catch (ex) { /* ignore */
            }

            if (!written) {
                var debug = document.getElementById("dwr-debug");
                if (debug) {
                    var contents = message + "<br/>" + debug.innerHTML;
                    if (contents.length > 2048) contents = contents.substring(0, 2048);
                    debug.innerHTML = contents;
                }
            }
        };
        return dwr;
    }]);
