/// <reference path="http://code.jquery.com/jquery-1.4.1-vsdoc.js" />
/*
* Print Element Plugin 1.2.1
*
* Copyright (c) 2010 Erik Zaadi, 2014 Igor Bedek
*
* Changelog 1.2 to 1.2.1:
* $.browser replaced with $.uaMatch() since $.browser is deprecated and removed from jQuery 1.9
*
* Inspired by PrintArea (http://plugins.jquery.com/project/PrintArea) and
* http://stackoverflow.com/questions/472951/how-do-i-print-an-iframe-from-javascript-in-safari-chrome
*
*  Fork : https://github.com/cfabianski/jQueryPlugins 
*  Compatibility for jQuery > 1.5.x
*  Home Page : http://projects.erikzaadi/jQueryPlugins/jQuery.printElement 
*  Issues (bug reporting) : http://github.com/erikzaadi/jQueryPlugins/issues/labels/printElement
*  jQuery plugin page : http://plugins.jquery.com/project/printElement 
*  
*  Thanks to David B (http://github.com/ungenio) and icgJohn (http://www.blogger.com/profile/11881116857076484100)
*  For their great contributions!
* 
* Dual licensed under the MIT and GPL licenses:
*   http://www.opensource.org/licenses/mit-license.php
*   http://www.gnu.org/licenses/gpl.html
*   
*   Note, Iframe Printing is not supported in Opera and Chrome 3.0, a popup window will be shown instead
*/
// Limit scope pollution from any deprecated API
(function() {

    var matched, browser;

// Use of jQuery.browser is frowned upon.
// More details: http://api.jquery.com/jQuery.browser
// jQuery.uaMatch maintained for back-compat
    jQuery.uaMatch = function( ua ) {
        ua = ua.toLowerCase();

        var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
            /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
            /(msie) ([\w.]+)/.exec( ua ) ||
            ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
            [];

        return {
            browser: match[ 1 ] || "",
            version: match[ 2 ] || "0"
        };
    };

    matched = jQuery.uaMatch( navigator.userAgent );
    browser = {};

    if ( matched.browser ) {
        browser[ matched.browser ] = true;
        browser.version = matched.version;
    }

// Chrome is Webkit, but Webkit is also Safari.
    if ( browser.chrome ) {
        browser.webkit = true;
    } else if ( browser.webkit ) {
        browser.safari = true;
    }

    jQuery.browser = browser;

    jQuery.sub = function() {
        function jQuerySub( selector, context ) {
            return new jQuerySub.fn.init( selector, context );
        }
        jQuery.extend( true, jQuerySub, this );
        jQuerySub.superclass = this;
        jQuerySub.fn = jQuerySub.prototype = this();
        jQuerySub.fn.constructor = jQuerySub;
        jQuerySub.sub = this.sub;
        jQuerySub.fn.init = function init( selector, context ) {
            if ( context && context instanceof jQuery && !(context instanceof jQuerySub) ) {
                context = jQuerySub( context );
            }

            return jQuery.fn.init.call( this, selector, context, rootjQuerySub );
        };
        jQuerySub.fn.init.prototype = jQuerySub.fn;
        var rootjQuerySub = jQuerySub(document);
        return jQuerySub;
    };

})();


; (function (window, undefined) {
    var document = window["document"];
    var $ = window["jQuery"];
    var $browser = jQuery.uaMatch(navigator.userAgent).browser.toLowerCase();
    $.fn["printElement"] = function (options) {
        var mainOptions = $.extend({}, $.fn["printElement"]["defaults"], options);
        //iframe mode is not supported for opera and chrome 3.0 (it prints the entire page).
        //http://www.google.com/support/forum/p/Webmasters/thread?tid=2cb0f08dce8821c3&hl=en
        if (mainOptions["printMode"] == 'iframe') {
            if ($browser == 'opera' || (/chrome/.test(navigator.userAgent.toLowerCase())))
                mainOptions["printMode"] = 'popup';
        }
        //Remove previously printed iframe if exists
        $("[id^='printElement_']").remove();

        return this.each(function () {
            //Support Metadata Plug-in if available
            var opts = $.meta ? $.extend({}, mainOptions, $(this).data()) : mainOptions;
            _printElement($(this), opts);
        });
    };
    $.fn["printElement"]["defaults"] = {
        "printMode": 'iframe', //Usage : iframe / popup
        "pageTitle": '', //Print Page Title
        "overrideElementCSS": null,
        /* Can be one of the following 3 options:
        * 1 : boolean (pass true for stripping all css linked)
        * 2 : array of $.fn.printElement.cssElement (s)
        * 3 : array of strings with paths to alternate css files (optimized for print)
        */
        "printBodyOptions": {
            "styleToAdd": 'padding:10px;margin:10px;', //style attributes to add to the body of print document
            "classNameToAdd": '' //css class to add to the body of print document
        },
        "leaveOpen": false, // in case of popup, leave the print page open or not
        "iframeElementOptions": {
            "styleToAdd": 'border:none;position:absolute;width:0px;height:0px;bottom:0px;left:0px;', //style attributes to add to the iframe element
            "classNameToAdd": '' //css class to add to the iframe element
        }
    };
    $.fn["printElement"]["cssElement"] = {
        "href": '',
        "media": ''
    };
    function _printElement(element, opts) {
        //Create markup to be printed
        var html = _getMarkup(element, opts);

        var popupOrIframe = null;
        var documentToWriteTo = null;
        if (opts["printMode"].toLowerCase() == 'popup') {
            popupOrIframe = window.open('about:blank', 'printElementWindow', 'width=650,height=440,scrollbars=yes');
            documentToWriteTo = popupOrIframe.document;
        }
        else {
            //The random ID is to overcome a safari bug http://www.cjboco.com.sharedcopy.com/post.cfm/442dc92cd1c0ca10a5c35210b8166882.html
            var printElementID = "printElement_" + (Math.round(Math.random() * 99999)).toString();
            //Native creation of the element is faster..
            var iframe = document.createElement('IFRAME');
            $(iframe).attr({
                style: opts["iframeElementOptions"]["styleToAdd"],
                id: printElementID,
                className: opts["iframeElementOptions"]["classNameToAdd"],
                frameBorder: 0,
                scrolling: 'no',
                src: 'about:blank'
            });
            document.body.appendChild(iframe);
            documentToWriteTo = (iframe.contentWindow || iframe.contentDocument);
            if (documentToWriteTo.document)
                documentToWriteTo = documentToWriteTo.document;
            iframe = document.frames ? document.frames[printElementID] : document.getElementById(printElementID);
            popupOrIframe = iframe.contentWindow || iframe;
        }
        focus();
        documentToWriteTo.open();
        documentToWriteTo.write(html);
        documentToWriteTo.close();
        _callPrint(popupOrIframe);
    };

    function _callPrint(element) {
        if (element && element["printPage"])
            element["printPage"]();
        else
            setTimeout(function () {
                _callPrint(element);
            }, 50);
    }

    function _getElementHTMLIncludingFormElements(element) {
        var $element = $(element);
        //Radiobuttons and checkboxes
        $(":checked", $element).each(function () {
            this.setAttribute('checked', 'checked');
        });
        //simple text inputs
        $("input[type='text']", $element).each(function () {
            this.setAttribute('value', $(this).val());
        });
        $("select", $element).each(function () {
            var $select = $(this);
            $("option", $select).each(function () {
                if ($select.val() == $(this).val())
                    this.setAttribute('selected', 'selected');
            });
        });
        $("textarea", $element).each(function () {
            //Thanks http://blog.ekini.net/2009/02/24/jquery-getting-the-latest-textvalue-inside-a-textarea/
            var value = $(this).attr('value');
            //fix for issue 7 (http://plugins.jquery.com/node/13503 and http://github.com/erikzaadi/jQueryPlugins/issues#issue/7)
            if ($browser == 'mozilla' && this.firstChild)
                this.firstChild.textContent = value;
            else
                this.innerHTML = value;
        });
        //http://dbj.org/dbj/?p=91
        var elementHtml = $('<div></div>').append($element.clone()).html();
        return elementHtml;
    }

    function _getBaseHref() {
        var port = (window.location.port) ? ':' + window.location.port : '';
        return window.location.protocol + '//' + window.location.hostname + port + window.location.pathname;
    }

    function _getMarkup(element, opts) {
        var $element = $(element);
        var elementHtml = _getElementHTMLIncludingFormElements(element);

        var html = new Array();
        html.push('<html><head><title>' + opts["pageTitle"] + '</title>');
        if (opts["overrideElementCSS"]) {
            if (opts["overrideElementCSS"].length > 0) {
                for (var x = 0; x < opts["overrideElementCSS"].length; x++) {
                    var current = opts["overrideElementCSS"][x];
                    if (typeof (current) == 'string')
                        html.push('<link type="text/css" rel="stylesheet" href="' + current + '" >');
                    else
                        html.push('<link type="text/css" rel="stylesheet" href="' + current["href"] + '" media="' + current["media"] + '" >');
                }
            }
        }
        else {
            $("link", document).filter(function () {
                return $(this).attr("rel").toLowerCase() == "stylesheet";
            }).each(function () {
                html.push('<link type="text/css" rel="stylesheet" href="' + $(this).attr("href") + '" media="' + ($(this).attr('media') || '') + '" >');
            });
        }
        //Ensure that relative links work
        html.push('<base href="' + _getBaseHref() + '" />');
        html.push('</head><body style="' + opts["printBodyOptions"]["styleToAdd"] + '" class="' + opts["printBodyOptions"]["classNameToAdd"] + '">');
        html.push('<div class="' + $element.attr('class') + '">' + elementHtml + '</div>');
        html.push('<script type="text/javascript">function printPage(){focus();print();' + ((/*$browser != 'opera' && */!opts["leaveOpen"] && opts["printMode"].toLowerCase() == 'popup') ? 'close();' : '') + '}</script>');
        html.push('</body></html>');

        return html.join('');
    };
})(window);
