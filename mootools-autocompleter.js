/**
 * Mootools Autocompleter
 * 
 * Copyright (c) 2011, Weeby
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *  - Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *  - Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *  - Neither the name of the Weeby nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @version 1.2
 * @category visual
 * @package mootools
 * @subpakage ui.autocompleter
 * @author Tomasz Wójcik (t.wojcik@weeby.pl)
 */

var Autocompleter = new Class({
	_defaults: {
		'id': null,
		'className': 'mui-autocompleter',
		'delay': 300,
		'minLength': 3,
		'allowNewValues': false,
		'onCreate': function () {},
		'onSearch': function () {},
		'onSuggest': function () {},
		'onChange': function () {},
        'onBeforeShow': function() {}
	},
	initialize: function (element, options) {
		options = $merge(this._defaults, options);
		
		if (options.id == null) {
			var _id = element.get('id');
			if (_id == null) {
				_id = element.get('name').replace('_', '-').camelCase();
			} // eof if()
			
			options.id = 'Autocompleter-' + _id;
		} // eof if()
		
		this.wrapper = new Element('div', {
			'id': options.id,
			'class': options.className,
			'html': '<div style="display: none;" class="' + options.className + '-menu"><ul></ul></div>'
		});
		
		this.element = element;
        
        var defaultValue = '';
        if (this.element.get('data-autocompleter-default') != null) {
            defaultValue = this.element.get('data-autocompleter-default');
        } // eof if()
		
		this.hiddenInput = new Element('input', {
			'type': 'hidden',
			'name': this.element.get('name'),
			'value': defaultValue
		});
		this.element.erase('name').addClass(options.className + '-input').set('autocomplete', 'off');
		this.hiddenInput.inject(this.element, 'after');
		this.wrapper.inject(document.getElement('body'));
		this.options = options;
		
		this.selectors = {
			menuWrapper: 'div.' + options.className + '-menu'
		};
		
		this.timeout = null;
		this.lastFilter = null;
		
		this._addEvents();
	},
	_input: function () {
		return this.element.getNext("input['hidden']");
	},
	_onInputKeyDown: function (event) {
		if ((event.control == true) || (event.meta == true)) {
			return true;
		} // eof if()
		
		var isNonSpecialKey = function (keyName, keyCode) {
			var _nonSpecialKeyNames = [ 'left', 'right', 'tab' ];
			var _nonSpecialKeyCodes = [ 33, 34, 35, 36 ];
			
			if ((_nonSpecialKeyNames.indexOf(keyName) != -1) || (_nonSpecialKeyCodes.indexOf(keyCode) != -1)) {
				return true;
			} // eof if()
			
			return false;
		} // eof isNonSpecialKey()
		
		var _return = false;
		if (event.key == 'esc') {
			this._handleNewValue();
			this._hideMenu();
		} else if (event.key == 'up') {
			this._moveActive('up');
		} else if (event.key == 'down') {
			this._moveActive('down');
		} else if (event.key == 'enter') {
			this._chooseItem();
		} else if (isNonSpecialKey(event.key, event.code)) {
			_return = true;
		} else {
			_return = true;
			if (this.timeout != null) {
				window.clearTimeout(this.timeout);
			} // eof if()
			
			this.timeout = window.setTimeout(this._onInputChange.bind(this), this.options.delay);
		} // eof if()
		
		if (_return == false) {
			event.stop();
		} // eof if()
		return _return;
	},
	_onInputChange: function (timeout, term) {
		var _value = term || this.element.get('value');
		this._input().set('value', '');
		if (_value.length >= this.options.minLength) {
			this.lastFilter = _value;
			var _items = [];
			
			this._fireEvent('onSearch', this.element);
			
			if (this.options.source != null) {
				_items = this.options.source(this.element, _value);
			} // eof if()
			
			this.suggest(_items);
		} else {
			this.lastFilter = _value;
			this._handleNewValue();
			this._hideMenu();
		} // eof if()
	},
	_handleNewValue: function (shouldFireEvent) {
		shouldFireEvent = (shouldFireEvent == null) ? true : shouldFireEvent;
		if (this._input().get('value') == '') {
			if (this.options.allowNewValues == true) {
				this._input().set('value', this.element.get('value'));
			} else {
				this._input().set('value', '');
			} // eof if()
            this._input().store('itemdata', null);
			
			if (shouldFireEvent == true) {
				this._fireEvent('onChange', this.element);
			}
		}
	},
	_onInputBlur: function () {
		if (this.options.allowNewValues == true) {
			this._handleNewValue();
		}
		this._hideMenu();
		return true;
	},
	_onMenuItemMousedown: function (event) {
        event.stop();
        var _item = $(event.target);
        if (_item.get('tag') != 'li') {
            _item = _item.getParent('li');
        } // eof if()
        
		this._chooseItem(_item);
	},
	_chooseItem: function (item) {
		var _item = null;
		
		if (item == null) {
			_item = this.wrapper.getElement('li.active');
		} else {
			_item = $(item);
		} // eof if()
		
		if (_item != null) {
			this.element.set('value', _item.retrieve('label'));
			this._input().set('value', _item.retrieve('value'));
            this._input().store('itemdata', _item.retrieve('itemdata', null));
			_item.removeClass('active');
		} else {
			this._handleNewValue(false);
		} // eof if()
		
		this._fireEvent('onChange', this.element);
		
		this._hideMenu();
	},
	_fireEvent: function () {
		var _arguments = Array.clone(arguments);
		var event = _arguments.shift();
		var eventFunction = this.options[event];
		
		if (eventFunction != null) {
			eventFunction = eventFunction.pass(_arguments);
			return eventFunction();
		} // eof if()
		
		return false;
	},
	_created: function () {
		this._fireEvent('onCreate', this.element);
	},
	_showMenu: function () {
		var _menuWrapper = this.wrapper.getElement(this.selectors.menuWrapper);
        this._fireEvent('onBeforeShow', this.element);
		_menuWrapper.setStyle('display', 'block');
		_menuWrapper.scrollTo(0, 0);
		//document.addEvent('mousedown', this._hideMenu.bind(this));
		document.addEvent('mousedown', this._onInputBlur.bind(this));
	},
	_hideMenu: function () {
		this.wrapper.getElement(this.selectors.menuWrapper).setStyle('display', 'none');
		document.removeEvent('mousedown', this._onInputBlur.bind(this));
	},
	_moveActive: function (direction) {
		direction = direction || 'up';
		
		var _newActive = null;
		
		var _currentActive = this.wrapper.getElement('li.active');
		if (_currentActive == null) {
			_newActive = this.wrapper.getElement('li');
		} else {				
			if (direction == 'up') {
				_newActive = _currentActive.getPrevious('li');
			} else {
				_newActive = _currentActive.getNext('li');
			} // eof if()
		} // eof if()
		
		if (_newActive != null) {
			if (_currentActive != null) {
				_currentActive.removeClass('active');
			} // eof if()
			_newActive.addClass('active');

			// This is based on code from jQuery UI Autocompleter widget.
			var _menuWrapper = this.wrapper.getElement(this.selectors.menuWrapper);
			var _list = _menuWrapper.getElement('ul');
			if (_list.getSize().y > _menuWrapper.getSize().y) {
				var _offset = _newActive.getPosition(this.selectors.menuWrapper).y - _menuWrapper.getPosition().y;
				var _scroll = _menuWrapper.getScroll().y;
				var _height = _menuWrapper.getSize().y;
				var _elementHeight = _newActive.getSize().y;
				_menuWrapper.scrollTo(0, _scroll + _offset - _height + _elementHeight);
			} // eof if()
		} // eof if()
	},
	_populateMenu: function (items) {
		var _menu = this.wrapper.getElement('ul');
		_menu.empty();
		this.wrapper.getElement(this.selectors.menuWrapper).scrollTo(0);
		
		if (items.length == 0) {
			return;
		} // eof if()
		
		var _item = null;
		Array.each(items, function (item, index) {
			_item = new Element('li');
			
			if (item['html'] == null) {
				_item.set('html', item['label']);
			} else {
				_item.set('html', item['html']);
			}
			_item.store('label', item['label']);
			_item.store('value', item['value']);
            
            if (typeOf(item['data']) != 'null') {
                _item.store('itemdata', item['data']);
            } // eof if()
            
			_item.inject(_menu);
		});
		
		if (items.length == 1) {
			_menu.getElement('li').addClass('active');
		} // eof if()
		
		_menu.getElements('li').addEvent('mousedown', this._onMenuItemMousedown.bind(this));
	},
	_addEvents: function () {
		this.element.addEvent('keydown', this._onInputKeyDown.bind(this));	
		this.wrapper.getElement(this.selectors.menuWrapper).addEvent('mousedown', function (event) {
			event.stop();
		});
	},
	_call: function () {
		var _method = arguments[0];
		
		if ((_method == 'initialize') || (_method[0] == '_')) {
			return null;
		} // eof if()
		
		_method = this[_method];
		
		if (typeof(_method) == 'function') {
			var _arguments = Array.clone(arguments);
			_arguments.shift();
			_method = _method.pass(_arguments, this);
			return _method();
		} else {
			return null;
		} // eof if()
	},
	value: function () {
		return this._input().get('value');
	},
    data: function() {
        return this._input().retrieve('itemdata', null);
    },
	suggest: function (items) {
		if (items instanceof Array == false) {
			return false;
		} // eof if()
		
		this._fireEvent('onSuggest', this.element);
		
		this._populateMenu(items);
		
		if (items.length == 0) {
			this._handleNewValue();
			this._hideMenu();
		} else {
			this._showMenu();
		} // eof if()
		
		return true;
	},
	option: function (option, value) {
		if (value == null) {
			return this.options[option];
		} else {
			this.options[option] = value;
			return null;
		} // eof if()
	},
	menu: function () {
		return this.wrapper;
	}
});


if (typeof (Array.clone) == 'undefined') {
	Array.clone = function (src) {
		var dest = [];
		Array.each(src, function (item, index) {
			dest[index] = item;
		});
		
		return dest;
	}
} // eof if()

if (typeof (typeOf) == 'undefined') {
    typeOf = function(something) {
        var result = $type(something);
        if (result == false) {
            return 'null'
        } else {
            return result;
        }
    }
} // eof if()

Element.implement({
	autocompleter: function () {
		if (arguments.length == 0) {
			return this;
		}
		
		var options = arguments[0];
		if (typeof (options) == 'object') {
			var _autocompleter = new Autocompleter(this, options);
			this.store('ui.autocompleter', _autocompleter);
			_autocompleter._created();
		} else {
			var _autocompleter = this.retrieve('ui.autocompleter', null);
			if (_autocompleter != null) {
				var _call = _autocompleter._call.pass(arguments, _autocompleter);
				return _call();
			} // eof if()
		} // eof if()
		
		return this;
	}
});