/* Buttons for DataTables
 * 2015 SpryMedia Ltd - datatables.net/license
 */
(function(window, document, undefined) {


var factory = function( $, DataTable ) {
"use strict";

// Used for namespacing events added to the document by each instance, so they
// can be removed on destroy
var _instCounter = 0;


/**
 * [Buttons description]
 * @param {[type]}
 * @param {[type]}
 */
var Buttons = function( dt, config )
{
	// Allow a boolean true for defaults
	if ( config === true ) {
		config = {};
	}

	// For easy configuration of buttons an array can be given
	if ( $.isArray( config ) ) {
		config = { buttons: config };
	}

	this.c = $.extend( true, {}, Buttons.defaults, config );

	// Don't want a deep copy for the buttons
	if ( config.buttons ) {
		this.c.buttons = config.buttons;
	}

	this.s = {
		dt: new DataTable.Api( dt ),
		buttons: [],
		subButtons: [],
		listenKeys: '',
		namespace: 'dtb'+(_instCounter++)
	};

	this.dom = {
		container: $('<'+this.c.dom.container.tag+'/>')
			.addClass( this.c.dom.container.className )
	};

	this._constructor();
};


Buttons.prototype = {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public methods
	 */

	/**
	 * Get the action of a button
	 * @param  {int|string} Button index
	 * @return {function}
	 *//**
	 * Set the action of a button
	 * @param  {int|string} Button index
	 * @param  {function} Function to set
	 * @return {Buttons} Self for chaining
	 */
	action: function ( idx, action )
	{
		var button = this._indexToButton( idx ).conf;

		if ( action === undefined ) {
			return button.action;
		}

		button.action = action;

		return this;
	},

	/**
	 * Add an active class to the button to make to look active
	 * @param  {int|string} Button index
	 * @param  {boolean} [flag=true] Enable / disable flag
	 * @return {Buttons} Self for chaining
	 */
	active: function ( idx, flag ) {
		var button = this._indexToButton( idx );
		button.node.toggleClass(
			this.c.dom.button.active,
			flag === undefined ? true : flag
		);

		return this;
	},

	/**
	 * Add a new button
	 * @param {int|string} Button index for where to insert the button
	 * @param {object} Button configuration object, base string name or function
	 * @return {Buttons} Self for chaining
	 */
	add: function ( idx, config )
	{
		if ( typeof idx === 'string' && idx.indexOf('-') !== -1 ) {
			var idxs = idx.split('-');
			this.c.buttons[idxs[0]*1].buttons.splice( idxs[1]*1, 0, config );
		}
		else {
			this.c.buttons.splice( idx*1, 0, config );
		}

		this.dom.container.empty();
		this._buildButtons( this.c.buttons );

		return this;
	},

	/**
	 * Get the container node for the buttons
	 * @return {jQuery} Buttons node
	 */
	container: function ()
	{
		return this.dom.container;
	},

	/**
	 * Disable a button
	 * @param  {int|string} Button index
	 * @return {Buttons} Self for chaining
	 */
	disable: function ( idx ) {
		var button = this._indexToButton( idx );
		button.node.addClass( this.c.dom.button.disabled );

		return this;
	},

	/**
	 * Destroy the instance, cleaning up event handlers and removing DOM
	 * elements
	 * @return {Buttons} Self for chaining
	 */
	destroy: function ()
	{
		$('body').off( 'keyup.'+this.s.namespace );
		this.dom.container.remove();

		var buttonInsts = this.s.dt.settings()[0];

		for ( var i=0, ien=buttonInsts.length ; i<ien ; i++ ) {
			if ( buttonInsts.inst === this ) {
				buttonInsts.splice( i, 1 );
				break;
			}
		}

		return this;
	},

	/**
	 * Enable / disable a button
	 * @param  {int|string} Button index
	 * @param  {boolean} [flag=true] Enable / disable flag
	 * @return {Buttons} Self for chaining
	 */
	enable: function ( idx, flag )
	{
		if ( flag === false ) {
			return this.disable( idx );
		}

		var button = this._indexToButton( idx );
		button.node.removeClass( this.c.dom.button.disabled );

		return this;
	},

	/**
	 * Get the instance name for the button set selector
	 * @return {string} Instance name
	 */
	name: function ()
	{
		return this.c.name;
	},

	/**
	 * Get a button's node
	 * @param  {int|string} Button index
	 * @return {jQuery} Button element
	 */
	node: function ( idx )
	{
		var button = this._indexToButton( idx );
		return button.node;
	},

	/**
	 * Tidy up any buttons that have been scheduled for removal. This is
	 * required so multiple buttons can be removed without upsetting the button
	 * indexes while removing them.
	 * @param  {int|string} Button index
	 * @return {Buttons} Self for chaining
	 */
	removeCommit: function ()
	{
		var buttons = this.s.buttons;
		var subButtons = this.s.subButtons;
		var i, ien, j;

		for ( i=buttons.length-1 ; i>=0 ; i-- ) {
			if ( buttons[i] === null ) {
				buttons.splice( i, 1 );
				subButtons.splice( i, 1 );
				this.c.buttons.splice( i, 1 );
			}
		}

		for ( i=0, ien=subButtons.length ; i<ien ; i++ ) {
			for ( j=subButtons[i].length-1 ; j>=0 ; j-- ) {
				if ( subButtons[i][j] === null ) {
					subButtons[i].splice( j, 1 );
					this.c.buttons[i].buttons.splice( j, 1 );
				}
			}
		}

		return this;
	},

	/**
	 * Scheduled a button for removal. This is required so multiple buttons can
	 * be removed without upsetting the button indexes while removing them.
	 * @return {Buttons} Self for chaining
	 */
	removePrep: function ( idx )
	{
		var button;

		if ( typeof idx === 'number' || idx.indexOf('-') === -1 ) {
			button = this.s.buttons[ idx*1 ];

			button.node.remove();
			this._removeKey( button.conf );
			this.s.buttons[ idx*1 ] = null;
		}
		else {
			var idxs = idx.split('-');
			button = this.s.subButtons[ idxs[0]*1 ][ idxs[1]*1 ];

			button.node.remove();
			this._removeKey( button.conf );
			this.s.subButtons[ idxs[0]*1 ][ idxs[1]*1 ] = null;
		}

		return this;
	},

	/**
	 * Get the text for a button
	 * @param  {int|string} Button index
	 * @return {string} Button text
	 *//**
	 * Set the text for a button
	 * @param  {int|string|function} Button index
	 * @param  {string} Text
	 * @return {Buttons} Self for chaining
	 */
	text: function ( idx, label )
	{
		var button = this._indexToButton( idx );
		var linerTag = this.c.dom.buttonLiner.tag;
		var dt = this.s.dt;
		var text = function ( opt ) {
			return typeof opt === 'function' ?
				opt( dt, button.node, button.conf ) :
				opt;
		};

		if ( label === undefined ) {
			return text( button.conf.text );
		}

		button.conf.text = label;

		if ( linerTag ) {
			button.node.children( linerTag ).html( text(label) );
		}
		else {
			button.node.html( text(label) );
		}

		return this;
	},

	/**
	 * Calculate button index from a node
	 * @param  {node} Button node (_not_ a jQuery object)
	 * @return {string} Index. Undefined if not found
	 */
	toIndex: function ( node )
	{
		var i, ien, j, jen;
		var buttons = this.s.buttons;
		var subButtons = this.s.subButtons;

		// Loop the main buttons first
		for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
			if ( buttons[i].node[0] === node ) {
				return i+'';
			}
		}

		// Then the sub-buttons
		for ( i=0, ien=subButtons.length ; i<ien ; i++ ) {
			for ( j=0, jen=subButtons[i].length ; j<jen ; j++ ) {
				if ( subButtons[i][j].node[0] === node ) {
					return i+'-'+j;
				}
			}
		}
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */

	/**
	 * Buttons constructor
	 * @private
	 */
	_constructor: function ()
	{
		var that = this;
		var dt = this.s.dt;
		var dtSettings = dt.settings()[0];

		if ( ! dtSettings._buttons ) {
			dtSettings._buttons = [];
		}

		dtSettings._buttons.push( {
			inst: this,
			name: this.c.name
		} );

		this._buildButtons( this.c.buttons );

		dt.on( 'destroy', function () {
			that.destroy();
		} );

		// Global key event binding to listen for button keys
		$('body').on( 'keyup.'+this.s.namespace, function ( e ) {
			if ( ! document.activeElement || document.activeElement === document.body ) {
				// SUse a string of characters for fast lookup of if we need to
				// handle this
				var character = String.fromCharCode(e.keyCode).toLowerCase();

				if ( that.s.listenKeys.toLowerCase().indexOf( character ) !== -1 ) {
					that._keypress( character, e );
				}
			}
		} );
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods
	 */

	/**
	 * Add a new button to the key press listener
	 * @param {object} Resolved button configuration object
	 * @private
	 */
	_addKey: function ( conf )
	{
		if ( conf.key ) {
			this.s.listenKeys += $.isPlainObject( conf.key ) ?
				conf.key.key :
				conf.key;
		}
	},

	/**
	 * Create buttons from an array of buttons
	 * @param  {array} Buttons to create
	 * @param  {jQuery} Container node into which the created button should be
	 *   inserted.
	 * @param  {int} Counter for sub-buttons to be stored in a collection
	 * @private
	 */
	_buildButtons: function ( buttons, container, collectionCounter )
	{
		var dtButtons = DataTable.ext.buttons;
		var dt = this.s.dt;

		if ( ! container ) {
			container = this.dom.container;
			this.s.buttons = [];
			this.s.subButtons = [];
		}

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			var conf = this._resolveExtends( buttons[i] );
			var button = this._buildButton(
				conf,
				collectionCounter!==undefined ? true : false
			);

			var buttonNode = button.node;
			container.append( button.inserter );

			if ( collectionCounter === undefined ) {
				this.s.buttons.push( {
					node:     buttonNode,
					conf:     conf,
					inserter: button.inserter
				} );
				this.s.subButtons.push( [] );
			}
			else {
				this.s.subButtons[ collectionCounter ].push( {
					node:     buttonNode,
					conf:     conf,
					inserter: button.inserter
				} );
			}

			if ( conf.buttons ) {
				var collectionDom = this.c.dom.collection;
				conf._collection = $('<'+collectionDom.tag+'/>')
					.addClass( collectionDom.className );

				this._buildButtons( conf.buttons, conf._collection, i );
			}

			// init call is made here, rather than buildButton as it needs to
			// have been added to the buttons / subButtons array first
			if ( conf.init ) {
				conf.init.call( dt.button( buttonNode ), dt, buttonNode, conf );
			}
		}
	},

	/**
	 * Create an individual button
	 * @param  {object} config            Resolved button configuration
	 * @param  {boolean} collectionButton `true` if a collection button
	 * @return {jQuery} Created button node (jQuery)
	 * @private
	 */
	_buildButton: function ( config, collectionButton )
	{
		var that = this;
		var buttonDom = this.c.dom.button;
		var linerDom = this.c.dom.buttonLiner;
		var collectionDom = this.c.dom.collection;
		var dt = this.s.dt;
		var text = function ( opt ) {
			return typeof opt === 'function' ?
				opt( dt, button, config ) :
				opt;
		};

		if ( collectionButton && collectionDom.button ) {
			buttonDom = collectionDom.button;
		}

		if ( collectionButton && collectionDom.buttonLiner ) {
			linerDom = collectionDom.buttonLiner;
		}

		// Need a pre-check method to ensure that the button can be used
		// i.e. for Flash buttons, check Flash is available - xxx

		var button = $('<'+buttonDom.tag+'/>')
			.addClass( buttonDom.className )
			.attr( 'tabindex', this.s.dt.settings()[0].iTabIndex )
			.attr( 'aria-controls', this.s.dt.table().node().id )
			.on( 'click.dtb', function (e) {
				e.preventDefault();

				if ( ! button.hasClass( buttonDom.disabled ) && config.action ) {
					config.action.call( dt.button( button ), e, dt, button, config );
				}

				button.blur();
			} )
			.on( 'keyup.dtb', function (e) {
				if ( e.keyCode === 13 ) {
					if ( ! button.hasClass( buttonDom.disabled ) && config.action ) {
						config.action.call( dt.button( button ), e, dt, button, config );
					}
				}
			} );

		if ( linerDom.tag ) {
			button.append(
				$('<'+linerDom.tag+'/>')
					.html( text( config.text ) )
					.addClass( linerDom.className )
			);
		}
		else {
			button.html( text( config.text ) );
		}

		if ( config.enabled === false ) {
			button.addClass( buttonDom.disabled );
		}

		if ( config.className ) {
			button.addClass( config.className );
		}

		var buttonContainer = this.c.dom.buttonContainer;
		var inserter;
		if ( buttonContainer ) {
			inserter = $('<'+buttonContainer.tag+'/>')
				.addClass( buttonContainer.className )
				.append( button );
		}
		else {
			inserter = button;
		}

		this._addKey( config );

		return {
			node: button,
			inserter: inserter
		};
	},

	/**
	 * Get a button's host information from a button index
	 * @param  {int|string} Button index
	 * @return {object} Button information - object contains `node` and `conf`
	 *   properties
	 * @private
	 */
	_indexToButton: function ( idx )
	{
		if ( typeof idx === 'number' || idx.indexOf('-') === -1 ) {
			return this.s.buttons[ idx*1 ];
		}

		var idxs = idx.split('-');
		return this.s.subButtons[ idxs[0]*1 ][ idxs[1]*1 ];
	},

	/**
	 * Handle a key press - determine if any button's key configured matches
	 * what was typed and trigger the action if so.
	 * @param  {string} The character pressed
	 * @param  {object} Key event that triggered this call
	 * @private
	 */
	_keypress: function ( character, e )
	{
		var i, ien, j, jen;
		var buttons = this.s.buttons;
		var subButtons = this.s.subButtons;
		var run = function ( conf, node ) {
			if ( ! conf.key ) {
				return;
			}

			if ( conf.key === character ) {
				node.click();
			}
			else if ( $.isPlainObject( conf.key ) ) {
				if ( conf.key.key !== character ) {
					return;
				}

				if ( conf.key.shiftKey && ! e.shiftKey ) {
					return;
				}

				if ( conf.key.altkey && ! e.altkey ) {
					return;
				}

				if ( conf.key.ctrlKey && ! e.ctrlKey ) {
					return;
				}

				if ( conf.key.metaKey && ! e.metaKey ) {
					return;
				}

				// Made it this far - it is good
				node.click();
			}
		};

		// Loop the main buttons first
		for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
			run( buttons[i].conf, buttons[i].node );
		}

		// Then the sub-buttons
		for ( i=0, ien=subButtons.length ; i<ien ; i++ ) {
			for ( j=0, jen=subButtons[i].length ; j<jen ; j++ ) {
				run( subButtons[i][j].conf, subButtons[i][j].node );
			}
		}
	},

	/**
	 * Remove a key from the key listener for this instance (to be used when a
	 * button is removed)
	 * @param  {object} Button configuration
	 */
	_removeKey: function ( conf )
	{
		if ( conf.key ) {
			var character = $.isPlainObject( conf.key ) ?
				conf.key.key :
				conf.key;

			// Remove only one character, as multiple buttons could have the
			// same listening key
			var a = this.s.listenKeys.split('');
			var idx = $.inArray( character, a );
			a.splice( idx, 1 );
			this.s.listenKeys = a.join('');
		}
	},

	/**
	 * Resolve a button configuration
	 * @param  {string|function|object} Button config to resolve
	 * @return {object} Button configuration
	 */
	_resolveExtends: function ( conf )
	{
		var dt = this.s.dt;
		var dtButtons = DataTable.ext.buttons;
		var toConfObject = function ( base ) {
			if ( typeof base === 'function' ) {
				base = base( dt );
			}

			if ( typeof base === 'string' ) {
				if ( ! dtButtons[ base ] ) {
					throw 'Unknown button type: '+base;
				}
				base = $.extend( {}, dtButtons[ base ] );
			}

			return base;
		};

		conf = toConfObject( conf );

		while ( conf.extend ) {
			// Use `toConfObject` in case the button definition being extended
			// is itself a string or a function
			conf = $.extend( {}, toConfObject( dtButtons[ conf.extend ] ), conf );

			// Although we want the `conf` object to overwrite almost all of
			// the properties of the object being extended, the `extend`
			// property should from from the object being extended
			if ( ! dtButtons[ conf.extend ] ) {
				throw 'Unknown button type: '+conf.extend;
			}
			conf.extend = dtButtons[ conf.extend ].extend;
		}

		return conf;
	}
};



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Statics
 */

/**
 * Show / hide a background layer behind a collection
 * @param  {boolean} Flag to indicate if the background should be shown or
 *   hidden 
 * @param  {string} Class to assign to the background
 * @static
 */
Buttons.background = function ( show, className ) {
	if ( show ) {
		$('<div/>')
			.addClass( className )
			.appendTo( 'body' );
	}
	else {
		$('body > div.'+className).remove();
	}
};

/**
 * Instance selector - select Buttons instances based on an instance selector
 * value from the buttons assigned to a DataTable. This is only useful if
 * multiple instances are attached to a DataTable.
 * @param  {string|int|array} Instance selector - see `instance-selector`
 *   documentation on the DataTables site
 * @param  {array} Button instance array that was attached to the DataTables
 *   settings object
 * @return {array} Buttons instances
 * @static
 */
Buttons.instanceSelector = function ( group, buttons )
{
	if ( ! group ) {
		return $.map( buttons, function ( v ) {
			return v.inst;
		} );
	}

	var ret = [];
	var names = $.map( buttons, function ( v ) {
		return v.name;
	} );

	// Flatten the group selector into an array of single options
	var process = function ( input ) {
		if ( $.isArray( input ) ) {
			for ( var i=0, ien=input.length ; i<ien ; i++ ) {
				process( input[i] );
			}
			return;
		}

		if ( typeof input === 'string' ) {
			if ( input.indexOf( ',' ) !== -1 ) {
				// String selector, list of names
				process( input.split(',') );
			}
			else {
				// String selector individual name
				var idx = $.inArray( $.trim(input), names );

				if ( idx !== -1 ) {
					ret.push( buttons[ idx ].inst );
				}
			}
		}
		else if ( typeof input === 'number' ) {
			// Index selector
			ret.push( buttons[ input ].inst );
		}
	};
	
	process( group );

	return ret;
};

/**
 * Button selector - select one or more buttons from a selector input so some
 * operation can be performed on them.
 * @param  {array} Button instances array that the selector should operate on
 * @param  {string|int|node|jQuery|array} Button selector - see
 *   `button-selector` documentation on the DataTables site
 * @return {array} Array of objects containing `inst` and `idx` properties of
 *   the selected buttons so you know which instance each button belongs to.
 * @static
 */
Buttons.buttonSelector = function ( insts, selector )
{
	var ret = [];
	var run = function ( selector, inst ) {
		var i, ien, j, jen;
		var buttons = [];

		$.each( inst.s.buttons, function (i, v) {
			buttons.push( {
				node: v.node[0],
				name: v.name
			} );
		} );

		$.each( inst.s.subButtons, function (i, v) {
			$.each( v, function (j, w) {
				buttons.push( {
					node: w.node[0],
					name: w.name
				} );
			} );
		} );

		var nodes = $.map( buttons, function (v) {
			return v.node;
		} );

		if ( $.isArray( selector ) || selector instanceof $ ) {
			for ( i=0, ien=selector.length ; i<ien ; i++ ) {
				run( selector[i], inst );
			}
			return;
		}

		if ( selector === null || selector === undefined || selector === '*' ) {
			// Select all
			for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
				ret.push( {
					inst: inst,
					idx: inst.toIndex( buttons[i].node )
				} );
			}
		}
		else if ( typeof selector === 'number' ) {
			// Main button index selector
			ret.push( {
				inst: inst,
				idx: selector
			} );
		}
		else if ( typeof selector === 'string' ) {
			if ( selector.indexOf( ',' ) !== -1 ) {
				// Split
				var a = selector.split(',');

				for ( i=0, ien=a.length ; i<ien ; i++ ) {
					run( $.trim(a[i]), inst );
				}
			}
			else if ( selector.match( /^\d+(\-\d+)?$/ ) ) {
				// Sub-button index selector
				ret.push( {
					inst: inst,
					idx: selector
				} );
			}
			else if ( selector.indexOf( ':name' ) !== -1 ) {
				// Button name selector
				var name = selector.replace( ':name', '' );

				for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
					if ( buttons[i].name === name ) {
						ret.push( {
							inst: inst,
							idx: inst.toIndex( buttons[i].node )
						} );
					}
				}
			}
			else {
				// jQuery selector on the nodes
				$( nodes ).filter( selector ).each( function () {
					ret.push( {
						inst: inst,
						idx: inst.toIndex( this )
					} );
				} );
			}
		}
		else if ( typeof selector === 'object' && selector.nodeName ) {
			// Node selector
			var idx = $.inArray( selector, nodes );

			if ( idx !== -1 ) {
				ret.push( {
					inst: inst,
					idx: inst.toIndex( nodes[ idx ] )
				} );
			}
		}
	};


	for ( var i=0, ien=insts.length ; i<ien ; i++ ) {
		var inst = insts[i];

		run( selector, inst );
	}

	return ret;
};


/**
 * Buttons defaults. For full documentation, please refer to the docs/option
 * directory or the DataTables site.
 * @type {Object}
 * @static
 */
Buttons.defaults = {
	buttons: [ 'copy', 'csv', 'pdf', 'print' ],
	name: 'main',
	tabIndex: 0,
	dom: {
		container: {
			tag: 'div',
			className: 'dt-buttons'
		},
		collection: {
			tag: 'div',
			className: 'dt-button-collection'
		},
		button: {
			tag: 'a',
			className: 'dt-button',
			active: 'active',
			disabled: 'disabled'
		},
		buttonLiner: {
			tag: 'span',
			className: ''
		}
	}
};

/**
 * Version information
 * @type {string}
 * @static
 */
Buttons.version = '0.0.1-dev';



$.extend( DataTable.ext.buttons, {
	text: {
		text: '',
		className: 'buttons-text',
		action: function ( e, dt, button, config ) {
			console.log( 'action: text' );
		}
	},
	collection: {
		text: function ( dt, button, config ) {
			return dt.i18n( 'buttons.collection', 'Collection' );
		},
		className: 'buttons-collection',
		action: function ( e, dt, button, config ) {
			var background;
			var host = button;
			var hostOffset = host.offset();
			var tableContainer = $( dt.table().container() );

			config._collection
				.addClass( config.collectionLayout )
				.appendTo( 'body' );

			if ( config._collection.css( 'position' ) === 'absolute' ) {
				config._collection.css( {
					top: hostOffset.top + host.outerHeight(),
					left: hostOffset.left
				} );

				var listRight = hostOffset.left + config._collection.outerWidth();
				var tableRight = tableContainer.offset().left + tableContainer.width();
				if ( listRight > tableRight ) {
					config._collection.css( 'left', hostOffset.left - ( listRight - tableRight ) );
				}
			}
			else {
				// Fix position - centre on screen
				var top = config._collection.height() / 2;
				if ( top > $(window).height() / 2 ) {
					top = $(window).height() / 2;
				}

				config._collection.css( 'marginTop', top*-1 );
			}

			if ( config.background ) {
				Buttons.background( true, config.backgroundClassName );
			}

			// Need to break the 'thread' for the collection button being
			// activated by a click - it would also trigger this event
			setTimeout( function () {
				$(document).on( 'click.dtb-collection', function (e) {
					if ( ! $(e.target).parents().andSelf().filter( config._collection ).length ) {
						config._collection.detach();

						Buttons.background( false, config.backgroundClassName );

						$(document).off( 'click.dtb-collection' );
					}
				} );
			}, 10 );
		},
		background: true,
		collectionLayout: '',
		backgroundClassName: 'dt-button-background',
		fade: true // xxx
	},
	copy: {
		text: 'Copy',
		className: 'buttons-copy',
		action: function ( e, dt, button, config ) {
			console.log( 'action: copy' );
		}
	},
	csv: {
		text: 'CSV',
		className: 'buttons-csv',
		action: function ( e, dt, button, config ) {
			console.log( 'action: csv' );
		}
	},
	pdf: {
		text: 'PDF',
		className: 'buttons-pdf',
		action: function ( e, dt, button, config ) {
			console.log( 'action: pdf' );
		}
	},
	print: {
		text: 'Print',
		className: 'buttons-print',
		action: function ( e, dt, button, config ) {
			console.log( 'action: print' );
		}
	}
} );


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables API
 *
 * For complete documentation, please refer to the docs/api directory or the
 * DataTables site
 */

// Buttons group and individual button selector
DataTable.Api.register( 'buttons()', function ( group, selector ) {
	// Argument shifting
	if ( selector === undefined ) {
		selector = group;
		group = undefined;
	}

	return this.iterator( true, 'table', function ( ctx ) {
		if ( ctx._buttons ) {
			return Buttons.buttonSelector(
				Buttons.instanceSelector( group, ctx._buttons ),
				selector
			);
		}
	}, true );
} );

// Individual button selector
DataTable.Api.register( 'button()', function ( group, selector ) {
	// just run buttons() and truncate
	var buttons = this.buttons( group, selector );

	if ( buttons.length > 1 ) {
		buttons.splice( 1, buttons.length );
	}

	return buttons;
} );

// Active buttons
DataTable.Api.register( ['buttons().active()', 'button().active()'], function ( flag ) {
	return this.each( function ( set ) {
		set.inst.active( set.idx, flag );
	} );
} );

// Get / set button action
DataTable.Api.registerPlural( 'buttons().action()', 'button().action()', function ( action ) {
	if ( action === undefined ) {
		return this.map( function ( set ) {
			 return set.inst.action( set.idx );
		} );
	}

	return this.each( function ( set ) {
		set.inst.action( set.idx, action );
	} );
} );

// Enable / disable buttons
DataTable.Api.register( ['buttons().enable()', 'button().enable()'], function ( flag ) {
	return this.each( function ( set ) {
		set.inst.enable( set.idx, flag );
	} );
} );

// Disable buttons
DataTable.Api.register( ['buttons().disable()', 'button().disable()'], function () {
	return this.each( function ( set ) {
		set.inst.disable( set.idx );
	} );
} );

// Get button nodes
DataTable.Api.registerPlural( 'buttons().nodes()', 'button().node()', function () {
	var jq = $();

	// jQuery will automatically reduce duplicates to a single entry
	$( this.each( function ( set ) {
		jq = jq.add( set.inst.node( set.idx ) );
	} ) );

	return jq;
} );

// Get / set button text (i.e. the button labels)
DataTable.Api.registerPlural( 'buttons().text()', 'button().text()', function ( label ) {
	if ( label === undefined ) {
		return this.map( function ( set ) {
			 return set.inst.text( set.idx );
		} );
	}

	return this.each( function ( set ) {
		set.inst.text( set.idx, label );
	} );
} );

// Trigger a button's action
DataTable.Api.registerPlural( 'buttons().trigger()', 'button().trigger()', function () {
	return this.each( function ( set ) {
		set.inst.node( set.idx ).trigger( 'click' );
	} );
} );

// Get the container elements for the button sets selected
DataTable.Api.registerPlural( 'buttons().containers()', 'buttons().container()', function () {
	var jq = $();

	// jQuery will automatically reduce duplicates to a single entry
	$( this.each( function ( set ) {
		jq = jq.add( set.inst.container() );
	} ) );

	return jq;
} );

// Add a new button
DataTable.Api.register( 'button().add()', function ( idx, conf ) {
	if ( this.length === 1 ) {
		this[0].inst.add( idx, conf );
	}

	return this.button( idx );
} );

// Destroy the button sets selected
DataTable.Api.register( 'buttons().destroy()', function ( idx ) {
	this.pluck( 'inst' ).unique().each( function ( inst ) {
		inst.destroy();
	} );

	return this;
} );

// Remove a button
DataTable.Api.registerPlural( 'buttons().remove()', 'buttons().remove()', function () {
	// Need to split into prep and commit so the indexes remain constant during the remove
	this.each( function ( set ) {
		set.inst.removePrep( set.idx );
	} );

	this.pluck( 'inst' ).unique().each( function ( inst ) {
		inst.removeCommit();
	} );

	return this;
} );



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables interface
 */

// Attach to DataTables objects for global access
$.fn.dataTable.Buttons = Buttons;
$.fn.DataTable.Buttons = Buttons;



// DataTables creation - check if the buttons have been defined for this table,
// they will have been if the `B` option was used in `dom`, otherwise we should
// create the buttons instance here so they can be inserted into the document
// using the API
$(document).on( 'init.dt.dtb', function (e, settings, json) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	var opts = settings.oInit.buttons || DataTable.defaults.buttons;

	if ( opts && ! settings._buttons ) {
		new Buttons( settings, opts ).container();
	}
} );

// DataTables `dom` feature option
DataTable.ext.feature.push( {
	fnInit: function( settings ) {
		var api = new DataTable.Api( settings );
		var opts = api.init().buttons;

		return new Buttons( api, opts ).container();
	},
	cFeature: "B"
} );


return Buttons;
}; // /factory


// Define as an AMD module if possible
if ( typeof define === 'function' && define.amd ) {
	define( ['jquery', 'datatables'], factory );
}
else if ( typeof exports === 'object' ) {
    // Node/CommonJS
    factory( require('jquery'), require('datatables') );
}
else if ( jQuery && !jQuery.fn.dataTable.Buttons ) {
	// Otherwise simply initialise as normal, stopping multiple evaluation
	factory( jQuery, jQuery.fn.dataTable );
}


})(window, document);

