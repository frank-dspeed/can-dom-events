var KeyTree = require('can-key-tree');
var canReflect = require('can-reflect');

// Some events do not bubble, so delegating them requires registering the handler in the
// capturing phase.
// http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
var useCapture = function(eventType) {
	return eventType === 'focus' || eventType === 'blur';
};

function makeDelegator (domEvents) {
	var Delegator = function Delegator (parentKey){
		this.element = parentKey; // HTMLElement
		this.events = {}; // {[eventType: string]: Array<(event) -> void>}
		this.delegated = {}; // {[eventType: string]: (event) -> void}
	};
	
	canReflect.assignSymbols( Delegator.prototype, {
		"can.setKeyValue": function(eventType, handlersBySelector){
			var handler = this.delegated[eventType] = function(ev){
				canReflect.each(handlersBySelector, function(handlers, selector){
					var cur = ev.target;
					do {
						if (cur.matches(selector)) {
							handlers.forEach(function(handler){
								handler.call(cur, ev);
							});
						}
						cur = cur.parentNode;
					} while (cur && cur !== ev.currentTarget);
				});
			};
			this.events[eventType] = handlersBySelector;
			domEvents.addEventListener(this.element, eventType, handler, useCapture(eventType));
		},
		"can.getKeyValue": function(eventType) {
			return this.events[eventType];
		},
		"can.deleteKeyValue": function(eventType) {
			domEvents.removeEventListener(this.element, eventType, this.delegated[eventType], useCapture(eventType));
			delete this.delegated[eventType];
			delete this.events[eventType];
		},
		"can.getOwnEnumerableKeys": function() {
			return Object.keys(this.events);
		}
	});

	return Delegator;
}

module.exports = function makeDelegateEventTree (domEvents) {
	var Delegator = makeDelegator(domEvents);
	return new KeyTree([Map, Delegator, Object, Array]);
};
