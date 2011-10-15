Mootools Autocompleter
=

This is a lightweight autocompleter plugin for Mootools. It's designed to be attached to text input fields and provide them with a flexible autocompletion mechanism.

Initialization
-
In order to attach the widget to an input element you'd use code like this:

```javascript
window.addEvent('domready', function() {
    var input = $('elementId'); // Or other means of getting a DOM element.
    var options = { 'source': dataSource };
    input.autocompleter(options);
});
```

While attaching itself to an element the widget will do some DOM operations that allow it operate.

Example HTML before attaching:

```html
<div class="input text">
    <label>Choose a fruit</label>
    <input id="fruitSelect" type="text" name="fruit" />
</div>
```

Example HTML after attaching:

```html
<div class="input text">
    <label>Choose a fruit</label>
    <input type="text" id="fruitSelect" class="mui-autocompleter-input " autocomplete="off" />
    <input type="hidden" name="fruit" value="134" />
</div>
```

Menu container is injected into `<body>` element and its HTML looks like this:

```html
<div id="Autocompleter-fruitSelect" class="mui-autocompleter">
    <div class="mui-autocompleter-menu" style="display: none;">
        <ul></ul>
    </div>
</div>
```

Styling and positioning of the container is done entirely via CSS. JavaScript code performs no operations other than showing and hiding the menu container.

Default value
-
Since 1.2 the widget allows setting default value. To set it you need to modify input's markup before attaching the widget:

```html
<input id="fruitSelect" type="text" name="fruit" data-autocompleter-default="<value>" value="<label>" />
```

Value of _data-autocompleter-default_ attribute corresponds to _value_ field of data source response and will be set as vallue to be sent with form. Value of _value_ attribute will be visible in the text box.

Options
-
The widget's behavior can be configured using options you can provide when attaching the widget. You can also use option accessors to modify settings at runtime.

Available options:

* _id_ - ID for autocompleter menu wrapper DIV. If not supplied the widget will use input's attributes (name, id etc.) to create this attribute. Defaults to `null`.
* _className_ - HTML class name prefix used to attach classes to elements. Useful for cases where you'd like to have many autompleter widgets with different appearance. Defaults to  `mui-autocompleter`.
* _delay_ - delay between the last keystroke and invoking the data source. Defaults to 300ms.
* _minLength_ - minimum length of text to search for. Defaults to 3 characters.
* _allowNewValues_ - boolean flag defining widget's behavior concerning not found strings. If `true` then the widget will treat not found text as value. Defaults to `false`.
* _source_ - data source for the widget.
* _onCreate_, _onSearch_, _onSuggest_, _onChange_ - pseudo-events.

Data source
-
The widget expects data source to be a function. It's invoked with text entered into the input as an argument.

Two behavior scenarios are now implemented:

1. The function searches synchronously (e.g. in `<select>` options) and returns result.
1. The function searches asynchronously (e.g. sends a request via AJAX to the backend) and upon completion calls the widget's `suggest` method.

Data format
-
The widget expects data source to respond with an array of objects.

JSON representation of an example response:

```javascript
[
	{ "value": "apple", "label": "Apple", "html":"<img src=\"images\/apple.png\" \/><span>Apple<\/span>", "data": "arbitrary data to be attached to the item" }
]
```

Object fields:

* _value_ - value to be sent in the form,
* _label_ - text that will be put into the input after the element is selected,
* _html_ - optional HTML to be used in the menu instead of _label_ text,
* _data_ - arbitrary data to be attached to the item.

Methods
-
The widget uses jQuery UI like logic for calling its methods and accessing its options.

Available methods:

* _value_ - getter for the widget's current value that'll be sent in the form,
* _option_ - getter and setter for configuration options,
* _suggest_ - used to pass an array of results to the widget and make it show the menu,
* _menu_ - returns DOM element of the menu container,
* _data_ - returns arbitrary data (if any) attached to the last selected item.

Calling methods is simple:

```javascript
$('elementId').autocompleter('value'); // Returns value.
$('elementId').autocompleter('option', 'minLength'); // Returns minLength option.
$('elementId').autocompleter('option', 'minLength', 1); // Sets minLength option.
$('elementId').autocompleter('suggest', items); // Passes items to widget to show it in menu.
```

Events
-
The widget supports a number of pseudo-events that allow further integration with it. Event handlers are invoked with DOM element of the input that the widget wraps. To operate on the widget use methods described above.

Available events:

* _onCreate_ - executed right after the widget's initialization,
* _onSearch_ - executed before invoking the data source,
* _onSuggest_ - executed after the data source and bofore displaying the menu, regardless of search results,
* _onChange_ - executed after selecting one of suggestions, clearing the input or (if enabled) entering a not found text.

Compatibility
-
The widget has been tested on IE 7 and 8, Opera 11, Firefox 3.6 and 4, Google Chrome 8 and 10, Safari 5 on Windows and Mac OS X. It requires Mootools version 1.2 or 1.3. In case of 1.3 please use version with compatibility code.

Demo
-
See the plugin in action at http://weeby.github.com/Mootools-Autocompleter/

License
-
BSD License