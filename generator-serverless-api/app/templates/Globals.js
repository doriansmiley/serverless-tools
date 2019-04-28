module.exports = function(){
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        var jsdom = require('jsdom');
        const window = (new jsdom.JSDOM()).window;
        global.window = this;
        global.document = window.document;
        global.Element = window.Element;
        global.HTMLDivElement = window.HTMLDivElement;
        global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        global.window.atob = require('atob');
        global.window.btoa = require('btoa');
    }
};
