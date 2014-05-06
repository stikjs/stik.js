// ==========================================================================
// Project:   Stik.js - JavaScript Separation Of Concerns
// Copyright: Copyright 2013-2014 Lukas Alexandre
// License:   Licensed under MIT license
//            See https://github.com/stikjs/stik.js/blob/master/LICENSE
// ==========================================================================

// Version: 1.0.0 | From: 06-05-2014

// Version: 1.0.0 | From: 21-04-2014

if ( window.stik ){
  throw "Stik is already loaded. Check your requires ;)";
}

window.stik = {};

window.stik.injectable = function injectable( spec ){
  spec.instantiable = spec.instantiable || false;
  spec.resolvable = spec.resolvable || false;
  spec.cache = spec.cache || false;

  spec.resolve = function resolve( dependencies ){
    if ( !!spec.cachedValue ) { return spec.cachedValue; }

    if ( spec.instantiable === true ) {
      return buildModule(
        resolveDependencies( dependencies )
      );
    } else if ( spec.resolvable === true ) {
      return callWithDependencies(
        {},
        resolveDependencies( dependencies )
      );
    } else {
      return spec.module;
    }
  };

  function buildModule( dependencies ){
    var newInstance, value;

    function TempConstructor(){}
    TempConstructor.prototype = spec.module.prototype;
    newInstance = new TempConstructor();

    value = callWithDependencies(
      newInstance, dependencies
    );

    return Object( value ) === value ? value : newInstance;
  }

  function resolveDependencies( dependencies ){
    var injector = window.stik.injector({
      executionUnit: spec.module,
      modules: dependencies
    });

    return injector.resolveDependencies();
  }

  function callWithDependencies( context, dependencies ){
    var result = spec.module.apply( context, dependencies );

    cacheValue(result);

    return result;
  }

  function cacheValue( value ){
    if ( spec.cache === true ){
      spec.cachedValue = value;
    }
  }

  return spec;
};

window.stik.createController = function controller( spec ){
  if ( !spec.name ) { throw "Stik: Controller needs a name"; }

  spec.actions = {};

  spec.action = function action( actionName, executionUnit ){
    var newAction = window.stik.action({
      name: actionName,
      controller: spec.name,
      executionUnit: executionUnit
    });
    spec.actions[ actionName ] = newAction;
    return newAction;
  };

  spec.bind = function bind( modules ){
    var name,
        boundAny = false;

    for ( name in spec.actions ){
      if ( spec.actions[ name ].bind( modules ) ) {
        boundAny = true;
      }
    }

    return boundAny;
  };

  return spec;
};

window.stik.action = function action( spec ){
  if ( !spec.controller ) { throw "Stik: Action needs an controller name"; }
  if ( !spec.name ) { throw "Stik: Action name can't be empty"; }
  if ( !spec.executionUnit ) { throw "Stik: Action needs a function to use as its execution unit"; }

  spec.bind = function bind( modules ){
    var templates = spec.findTemplates(),
        i = templates.length;

    while( i-- ){
      bindWithTemplate(
        templates[ i ]
      ).context.load( spec.executionUnit, modules );
      markAsBound( templates[ i ] );
    }

    return templates.length > 0;
  };

  spec.findTemplates = function findTemplates( DOMInjection ){
    var DOMHandler = document;
    if (DOMInjection) { DOMHandler = DOMInjection; }

    var selector = "[data-controller=" + spec.controller + "]" +
                   "[data-action=" + spec.name + "]" +
                   ":not([class*=stik-bound])";
    return DOMHandler.querySelectorAll( selector );
  };

  function bindWithTemplate( template ){
    return {
      context: window.stik.context({
        controller: spec.controller,
        action: spec.name,
        template: template
      }),
      executionUnit: spec.executionUnit
    };
  } spec.bindWithTemplate = bindWithTemplate;

  function markAsBound( template ){
    template.className = ( template.className + ' stik-bound').trim();
  }

  return spec;
};

window.stik.context = function context( spec ){
  spec.template = window.stik.injectable({
    module: spec.template
  });

  spec.load = function load( executionUnit, modules ){
    var dependencies = resolveDependencies(
      executionUnit,
      mergeModules( modules )
    );

    executionUnit.apply( spec, dependencies );
  };

  function resolveDependencies( executionUnit, modules ){
    var injector = window.stik.injector({
      executionUnit: executionUnit,
      modules: modules
    });

    return injector.resolveDependencies();
  }

  function mergeModules( modules ){
    modules.$template = spec.template;

    return modules;
  }

  return spec;
};

window.stik.createBehavior = function behavior( spec ){
  if ( !spec.name ) { throw "Stik: Behavior name is missing"; }
  if ( spec.name.indexOf(" ") !== -1 ) { throw "Stik: '" + spec.name + "' is not a valid Behavior name. Please replace empty spaces with dashes ('-')"; }
  if ( !spec.executionUnit ) { throw "Stik: Behavior needs a function to use as its execution unit"; }

  var behaviorKey = "data-behaviors";

  spec.bind = function bind( modules ){
    var templates = spec.findTemplates(),
        i = templates.length;

    while ( i-- ) {
      bindWithTemplate(
        templates[ i ]
      ).context.load( spec.executionUnit, modules );
      markAsApplyed( templates[ i ] );
    }

    return templates.length > 0;
  };

  function bindWithTemplate( template ){
    return {
      context: window.stik.context({
        behavior: spec.behavior,
        template: template
      }),
      executionUnit: spec.executionUnit
    };
  } spec.bindWithTemplate = bindWithTemplate;

  function findTemplates(){
    var selector = "[class*=" + spec.name + "]" +
                   ":not([data-behaviors*=" + spec.name + "])";

    return document.querySelectorAll( selector );
  } spec.findTemplates = findTemplates;

  function resolveDependencies( modules ){
    var injector = window.stik.injector({
      executionUnit: spec.executionUnit,
      modules: modules
    });

    return injector.resolveDependencies();
  }

  function markAsApplyed( template ){
    var behaviors = template.getAttribute( behaviorKey );
    behaviors = ( ( behaviors || "" ) + " " + spec.name ).trim();

    template.setAttribute( behaviorKey, behaviors );
  }

  return spec;
};

window.stik.createBoundary = function boundary( spec ){
  if ( spec.as.indexOf(" ") !== -1 ) { throw "Stik: '" + spec.as + "' is not a valid Boundary name. Please replace empty spaces with dashes ('-')"; }
  if ( !spec.to ) { throw "Stik: Boundary needs an object or function as 'to'"; }

  var obj = {};

  obj.to = window.stik.injectable({
    module: spec.to,
    instantiable: spec.instantiable,
    resolvable: spec.resolvable,
    cache: spec.cache
  });

  obj.name = spec.as;

  return obj;
};

window.stik.injector = function injector( spec ){
  if ( !spec.executionUnit ) { throw "Stik: Injector needs a function to use as its execution unit"; }

  spec.resolveDependencies = function resolveDependencies(){
    var args = extractArguments();

    return grabModules( args );
  };

  function extractArguments(){
    var argsPattern, funcString, args;

    argsPattern = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;

    funcString = spec.executionUnit.toString();

    args = funcString.match( argsPattern )[ 1 ].split( ',' );

    return trimmedArgs( args );
  }

  function trimmedArgs( args ){
    var result = [];
    args.forEach( function( arg ){
      result.push( arg.trim() );
    });
    return result;
  }

  function grabModules( args ){
    var module, dependencies;

    dependencies = [];

    if ( args.length === 1 && args[ 0 ] === "" ) { return []; }

    for ( var i = 0; i < args.length; i++ ) {
      if ( !( module = spec.modules[ args[ i ] ] ) ) {
        throw "Stik could not find this module (" + args[ i ] + ")";
      }

      dependencies.push(
        module.resolve( spec.modules )
      );
    }

    return dependencies;
  }

  return spec;
};

window.stik.manager = function manager(){
  var behaviors   = {},
      controllers = {},
      boundaries  = { all: {}, controller:{}, behavior:{} },
      obj = {};

  obj.addControllerWithAction = function addControllerWithAction( controllerName, actionName, executionUnit ){
    var ctrl = storeController( controllerName ),
        action = ctrl.action( actionName, executionUnit );
    action.bind( extractBoundaries( boundaries.controller ) );
    return ctrl;
  };

  obj.addController = function addController( controllerName, executionUnit ){
    var ctrl = storeController( controllerName );
    executionUnit.call( {}, ctrl );
    bindController( ctrl );
    return ctrl;
  };

  obj.addBehavior = function addBehavior( name, executionUnit ){
    if ( isBehaviorRegistered( name ) ) { throw "Stik: Another behavior already exist with name '" + name + "'"; }

    var behavior = createBehavior({
      name: name,
      executionUnit: executionUnit
    });
    behaviors[name] = behavior;

    obj.applyBehavior( behavior );

    return behavior;
  };

  obj.addBoundary = function addBoundary( spec ){
    var boundary;

    spec.from = spec.from || "all";

    if ( [ "all", "controller", "behavior" ].indexOf( spec.from ) === -1 ) {
      throw "Stik: Invalid boundary 'from' specified. Please use 'controller', 'behavior', 'all' or leave it blank to default to 'all'";
    } else {
      boundary = window.stik.createBoundary( spec );
      boundaries[ spec.from ][ spec.as ] = boundary;
    }

    return boundary;
  };

  obj.applyBehaviors = function applyBehaviors(){
    var boundAny = false,
        behavior;

    for ( behavior in behaviors ) {
      if ( obj.applyBehavior( behaviors[ behavior ] ) ) {
        boundAny = true;
      }
    }

    return boundAny;
  };

  obj.applyBehavior = function applyBehavior( behavior ){
    var modules = extractBoundaries( boundaries.behavior );
    return behavior.bind( modules );
  };

  obj.bindActionWithTemplate = function bindActionWithTemplate( controller, action, template ){
    var modules = extractBoundaries( boundaries.controller ),
        result;

    result = controllers[ controller ].actions[ action ].bindWithTemplate(
      template, modules
    );
    result.modules = modules;

    return result;
  };

  obj.bindBehaviorWithTemplate = function bindBehaviorWithTemplate( behavior, template ){
    var modules = extractBoundaries( boundaries.behavior ),
        result;

    result = behaviors[ behavior ].bindWithTemplate(
      template, modules
    );
    result.modules = modules;

    return result;
  };

  obj.bindActions = function bindActions(){
    var modules = extractBoundaries( boundaries.controller ),
        boundAny = false,
        ctrl;

    for ( ctrl in controllers ) {
      if ( controllers[ ctrl ].bind( modules ) ) {
        boundAny = true;
      }
    }

    return boundAny;
  };

  obj.getBoundary = function getBoundary(name){
    var type, boundaryName;

    for ( type in boundaries ) {
      for ( boundaryName in boundaries[ type ] ) {
        if ( boundaryName === name ) {
          return boundaries[ type ][ boundaryName ];
        }
      }
    }
  };

  obj.boundariesFor = function boundariesFor( which ){
    return extractBoundaries( boundaries[ which ] );
  };

  obj.$reset = function $reset(){
    controllers = {};
    behaviors = {};
  };

  function storeController( controllerName ){
    var ctrl = window.stik.createController({
      name: controllerName
    });
    controllers[ controllerName ] = ctrl;
    return ctrl;
  }

  function isBehaviorRegistered( name ){
    return !!behaviors[ name ];
  }

  function createBehavior( name, executionUnit ){
    return window.stik.createBehavior( name, executionUnit );
  }

  function extractBoundaries( collection ){
    var key,
        modules = {};

    for ( key in collection ) {
      modules[ key ] = collection[ key ].to;
    }
    for ( key in boundaries.all ) {
      modules[ key ] = boundaries.all[ key ].to;
    }

    return modules;
  }

  function bindController( controller ){
    var modules = extractBoundaries( boundaries.controller );
    controller.bind( modules );
  }

  return obj;
};

window.stik.$$manager = window.stik.manager();

window.stik.controller = function controller( controllerName, action, executionUnit ){
  if ( typeof action === "string" ) {
    return window.stik.$$manager.addControllerWithAction(
      controllerName, action, executionUnit
    );
  } else {
    return window.stik.$$manager.addController(
      controllerName, action
    );
  }
};

window.stik.behavior = function behavior( name, executionUnit ){
  return window.stik.$$manager.addBehavior( name, executionUnit );
};

window.stik.lazyBind = window.stik.bindLazy = function bindLazy(){
  if ( !window.stik.$$manager.bindActions() & !window.stik.$$manager.applyBehaviors() ) {
    throw "Stik: Nothing new to bind!";
  }
};

window.stik.boundary = function boundary( spec ){
  return window.stik.$$manager.addBoundary( spec );
};

// Version: 0.1.0 | From: 21-04-2014

(function(){
  var helpers = {},
      modules = {},
      tmpDependencies = {};

  window.stik.helper = function helper( as, func ){
    if ( !as ) { throw "Stik: Helper needs a name"; }
    if ( !func || typeof func !== "function" ) { throw "Stik: Helper needs a function"; }

    modules[ as ] = window.stik.injectable({
      module: func,
      resolvable: true
    });
    helpers[ as ] = function(){
      var func = modules[ as ].resolve( withDependencies() );
      return func.apply( {}, arguments );
    };

    return helpers[ as ];
  };

  function withDependencies(){
    for ( var name in modules ) {
      if ( !tmpDependencies.hasOwnProperty( name ) ) {
        tmpDependencies[ name ] = modules[ name ];
      }
    }

    return tmpDependencies;
  }

  helpers.pushDoubles = function pushDoubles( doubles ){
    for ( var name in doubles ) {
      tmpDependencies[ name ] = window.stik.injectable({
        module: doubles[ name ]
      });
    }
  };

  helpers.cleanDoubles = function cleanDoubles(){
    tmpDependencies = {};
  };

  window.stik.boundary( { as: "$h", to: helpers } );
}());

window.stik.boundary( { as: "$window", to: window } );

window.stik.helper( "$window", function(){
  return window;
});

window.stik.helper( "debounce", function(){
  return function debounce( func, wait, immediate ){
    // copied from underscore.js
    var timeout;
    return function(){
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if ( !immediate ) func.apply( context, args );
      };
      var callNow = immediate && !timeout;
      clearTimeout( timeout );
      timeout = setTimeout( later, wait );
      if ( callNow ) func.apply( context, args );
    };
  };
});

window.stik.helper( "deepExtend", function(){
  return function deepExtend( destination, source ){
    for ( var property in source ) {
      if ( Object.isObjectLiteral( destination[ property ] ) && Object.isObjectLiteral( source[ property ] ) ) {
        destination[ property ] = destination[ property ] || {};
        arguments.callee( destination[ property ], source[ property ]);
      } else {
        destination[ property ] = source[ property ];
      }
    }
    return destination;
  };
});

// Version: 0.1.0 | From: 21-04-2014

window.stik.boundary({
  as: "$viewBag",
  resolvable: true,
  to: function viewBag( $template ){
    if (!$template) { throw "Stik: ViewBag needs a template to be attached to"; }

    var obj = {},
        bindingKey = "data-key";

    obj.push = function push( dataSet ){
      var fields = fieldsToBind(),
          i = fields.length,
          dataToBind;

      while( i-- ) {
        dataToBind = fields[ i ].getAttribute( bindingKey );

        if ( dataSet[ dataToBind ] !== undefined ) {
          updateElementValue( fields[ i ], dataSet[ dataToBind ] );
        }
      }
    };

    obj.pull = function pull(){
      var fields = fieldsToBind( $template ),
          dataSet = {},
          i = fields.length,
          key;

      while( i-- ) {
        key = fields[ i ].getAttribute( bindingKey );
        dataSet[ key ] = extractValueOf( fields[ i ] );
      }

      return dataSet;
    };

    function extractValueOf( element ){
      if ( isInput( element ) ) {
        return element.value;
      } else {
        return element.textContent;
      }
    }

    function updateElementValue( element, value ){
      if ( isInput( element ) ) {
        element.value = value;
      } else {
        element.textContent = value;
      }
    }

    function fieldsToBind(){
      if ( $template.getAttribute( bindingKey ) ) {
        return [ $template ];
      }

      return $template.querySelectorAll(
        "[" + bindingKey + "]"
      );
    }

    function isInput( element ){
      return element.nodeName.toUpperCase() === "INPUT" || element.nodeName.toUpperCase() === "TEXTAREA";
    }

    return obj;
  }
});

// Version: 0.1.0 | From: 21-04-2014

window.stik.boundary({
  as: "$courier",
  resolvable: true,
  cache: true,
  to: function courier(){
    var obj = {},
        subscriptions = {};

    obj.receive = function receive( box, opener ){
      var subscription = createSubscription({
        box: box, opener: opener
      });

      subscriptions[ box ] = ( subscriptions[ box ] || [] );
      subscriptions[ box ].push( subscription );

      return unsubscribe.bind( {}, subscription );
    };

    obj.send = function send( box, message ){
      var i = 0,
          foundAny = false;

      fetchSubscriptions( box , function( openers ){
        foundAny = true;
        i = openers.length;
        while ( i-- ) {
          openers[ i ].opener( message );
        }
      });

      if ( !foundAny ) { throw "Stik: No receiver registered for '" + box + "'"; }
    };

    function fetchSubscriptions( box, callback ){
      var pattern = new RegExp( box );

      for ( var sub in subscriptions ) {
        if ( pattern.exec( sub ) ) {
          callback( subscriptions[ sub ] );
        }
      }
    }

    function unsubscribe( subscription ){
      subscriptions[ subscription.box ] =
      subscriptions[ subscription.box ].filter( function( subs ){
        return subs.id !== subscription.id;
      });

      if ( subscriptions[ subscription.box ].length === 0 ) {
        delete subscriptions[ subscription.box ];
      }
    }

    function createSubscription( spec ){
      spec.id = '#' + Math.floor(
        Math.random()*16777215
      ).toString( 16 );

      return spec;
    }

    return obj;
  }
});

(function(){
  var methods = {},
      modules = {},
      tmpDependencies = {};

  window.stik.dom = function dom( as, func ){
    if ( !as ) { throw "Stik: DOM needs a name"; }
    if ( !func || typeof func !== "function" ) { throw "Stik: DOM needs a function"; }

    modules[ as ] = window.stik.injectable({
      module: func,
      resolvable: true
    });
    methods[ as ] = function(){
      var func = modules[ as ].resolve( withDependencies() );
      return func.apply( {}, arguments );
    };

    return methods[ as ];
  };

  function withDependencies(){
    for ( var name in modules ) {
      if ( !tmpDependencies.hasOwnProperty( name ) ) {
        tmpDependencies[ name ] = modules[ name ];
      }
    }

    return tmpDependencies;
  }

  methods.pushDoubles = function pushDoubles( doubles ){
    for ( var name in doubles ) {
      tmpDependencies[ name ] = window.stik.injectable({
        module: doubles[ name ]
      });
    }
  };

  methods.cleanDoubles = function cleanDoubles(){
    tmpDependencies = {};
  };

  window.stik.boundary( { as: "$dom", to: methods } );
}());

window.stik.dom( "hasClass", function(){
  return function hasClass( elm, selector ){
    var className = " " + selector + " ";
    return ( " " + elm.className + " " ).
      replace( /[\n\t]/g, " " ).
      indexOf( className ) > -1;
  };
});

window.stik.dom( "removeClass", function( hasClass ){
  return function removeClass( elm, selector ){
    if ( hasClass( elm, selector ) ){
      var regex = new RegExp( "\\b\\s?" + selector + "\\b", "g" );
      elm.className = elm.className.replace( regex, '' );
    }
  };
});

window.stik.dom( "addClass", function( hasClass ){
  return function addClass( elm, selector ){
    if ( !hasClass( elm, selector ) ){
      elm.className = ( elm.className + " " + selector ).trim();
    }
  };
});

window.stik.dom( "toggleClass", function( hasClass, addClass, removeClass ){
  return function toggleClass( elm, selector ){
    if ( hasClass( elm, selector ) ) {
      removeClass( elm, selector );
    } else if ( !hasClass( elm, selector ) ) {
      addClass( elm, selector );
    }
  };
});

window.stik.dom( "hide", function(){
  return function hideElm( elm ){
    elm.style.display = "none";
  };
});

window.stik.dom( "isHidden", function(){
  return function isHidden( elm ) {
    // return elm.offsetWidth > 0 && elm.offsetHeight > 0;
    return elm.offsetParent === null;
  }
});

window.stik.dom( "isVisible", function( isHidden ){
  return function isVisible( elm ) {
    return !isHidden( elm );
  }
});

window.stik.dom( "show", function( isHidden ){
  return function showElm( elm ){
    elm.style.display = "block";
  };
});

window.stik.dom( "remove", function(){
  return function removeElm( elm ){
    elm.parentNode.removeChild( elm );
  };
});

window.stik.dom( "parse", function(){
  return function( elmStr ){
    var div = document.createElement( "div" );
    div.innerHTML = elmStr;
    if (div.childNodes.length > 1) {
      return div.childNodes;
    } else {
      return div.firstChild;
    }
  };
});

window.stik.dom( "append", function(){
  return function append( parent, newChild ) {
    if ( typeof newChild === "string" ) {
      var div = document.createElement( "div" );
      div.innerHTML = newChild;

      while ( div.firstChild ) {
        parent.appendChild( div.firstChild );
      }
    } else {
      parent.appendChild( newChild );
    }
  };
});

window.stik.dom( "prepend", function( insertBefore, append ){
  return function prepend( parent, newChild ){
    if ( parent.childNodes.length > 0 ) {
      insertBefore( parent.firstChild, newChild );
    } else {
      append( parent, newChild );
    }
  };
});

window.stik.dom( "insertAfter", function(){
  return function insertAfter( referenceNode, newChild ) {
    if ( typeof newChild === "string" ) {
      var div = document.createElement( "div" );
      div.innerHTML = newChild;

      while ( div.firstChild ) {
        referenceNode.parentNode.insertBefore(
          div.firstChild, referenceNode.nextSibling
        );
      }
    } else {
      referenceNode.parentNode.insertBefore(
        newChild, referenceNode.nextSibling
      );
    }
  };
});

window.stik.dom( "insertBefore", function(){
  return function insertBefore( referenceNode, newChild ){
    if ( typeof newChild === "string" ) {
      var div = document.createElement( "div" );
      div.innerHTML = newChild;

      while ( div.firstChild ) {
        referenceNode.parentNode.insertBefore(
          div.firstChild, referenceNode
        );
      }
    } else {
      referenceNode.parentNode.insertBefore(
        newChild, referenceNode
      );
    }
  };
});

window.stik.dom( "data", function(){
  return function data( elm ){
    var attrs = {},
        attr, name;

    for ( attr in elm.attributes ) {
      if ( elm.attributes[ attr ].value ) {
        name = elm.attributes[ attr ].name;
        if (name.match(/^data-/m)) {
          attrs[ parseName( name ) ] =
            elm.attributes[ attr ].value;
        }
      }
    }

    function parseName( name ){
      return toCamelCase( name.match( /(data-)(.+)/ )[ 2 ] );
    }

    function toCamelCase(name){
      return name.replace( /-([a-z])/g, function( match ){
        return match[ 1 ].toUpperCase();
      });
    }

    return attrs;
  };
});

window.stik.boundary({
  as: "$data",
  resolvable: true,
  to: function( $template, $dom ){
    return $dom.data( $template );
  }
});

window.stik.dom( "serialize", function(){
  return function serializeForm( form ){
    // https://raw.githubusercontent.com/yurikoval/serialize-form/master/serialize.js
    var i, j, q;
    if (!form || form.nodeName !== "FORM") {
      return;
    }
    i = j = void 0;
    q = [];
    i = form.elements.length - 1;
    while (i >= 0) {
      if (form.elements[i].name === "") {
        i = i - 1;
        continue;
      }
      switch (form.elements[i].nodeName) {
        case "INPUT":
          switch (form.elements[i].type) {
            case "text":
            case "hidden":
            case "password":
            case "button":
            case "reset":
            case "submit":
              q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
              break;
            case "checkbox":
            case "radio":
              if (form.elements[i].checked) {
                q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
              }
              break;
            case "file":
              break;
          }
          break;
        case "TEXTAREA":
          q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
          break;
        case "SELECT":
          switch (form.elements[i].type) {
            case "select-one":
              q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
              break;
            case "select-multiple":
              j = form.elements[i].options.length - 1;
              while (j >= 0) {
                if (form.elements[i].options[j].selected) {
                  q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].options[j].value));
                }
                j = j - 1;
              }
          }
          break;
        case "BUTTON":
          switch (form.elements[i].type) {
            case "reset":
            case "submit":
            case "button":
              q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
          }
      }
      i = i - 1;
    }
    return q.join("&");
  };
});

// Version: 0.2.1 | From: 21-04-2014

window.stik.boundary({
  as: '$url',
  resolvable: true,
  to: function( $window ){
    return {
      baseUrl: function baseUrl(){
        return $window.location.href;
      },
      relativeUrl: function relativeUrl(){
        return this.baseUrl.match(/http:\/\/.+?(\/.+$)/)[1];
      },
      pathName: function pathName(){
        return $window.location.pathname;
      },
      hash: function hash( newHashValue ){
        return this.locationHash( newHashValue ).replace( /^#/, '' );
      },
      locationHash: function locationHash( newHashValue ){
        if ( newHashValue ) {
          $window.location.hash = newHashValue;
        }
        return location.hash;
      },
      mainPath: function mainPath() {
        return '/' + this.pathName().split( '/' )[ 1 ];
      },
      goTo: function goTo( url ){
        $window.location = url;
      },
      queries: function queries(){
        var result, queries, query;

        queries = this.baseUrl().split( '?' )[ 1 ];

        if ( queries ) {
          queries = queries.split( '&' );
          result = {};
          for ( var i = 0; i < queries.length; i++ ) {
            query = queries[ i ].split( '=' );
            result[ query[ 0 ] ] = query[ 1 ];
          }
          return result;
        } else {
          return {};
        }
      }
    };
  }
});

// Version: 0.1.0 | From: 20-04-2014

window.stik.labs = {};

window.stik.labs.behavior = function behaviorLab( spec ){
  if ( !spec ) { throw "Stik: Behavior Lab needs an environment to run"; }
  if ( !spec.name ) { throw "Stik: Behavior Lab needs a name"; }
  if ( !spec.template ) { throw "Stik: Behavior Lab needs a template"; }

  var env = {},
      result;

  env.template = parseAsDOM();

  result = window.stik.$$manager.bindBehaviorWithTemplate(
    spec.name, env.template
  );

  env.run = function run( doubles ){
    result.context.load(
      result.executionUnit, mergeModules( doubles )
    );
  };

  function parseAsDOM(){
    var container = document.implementation.createHTMLDocument();
    container.body.innerHTML = spec.template;
    return container.body.firstChild;
  }

  function mergeModules( doubles ){
    for ( var dbl in doubles ) {
      result.modules[ dbl ] = window.stik.injectable({
        module: doubles[ dbl ]
      });
    }
    return result.modules;
  }

  return env;
};

window.stik.labs.boundary = function boundaryLab( spec ){
  if ( !spec ) { throw "Stik: Boundary Lab needs an environment to run"; }
  if ( !spec.name ) { throw "Stik: Boundary Lab needs a name"; }

  var env = {},
      boundary = window.stik.$$manager.getBoundary( spec.name );

  env.run = function run( doubles ){
    return boundary.to.resolve( mergeModules( doubles ) );
  };

  function mergeModules( doubles ){
    var modules = window.stik.$$manager.boundariesFor( "behavior" );

    for ( var dbl in doubles ) {
      modules[ dbl ] = window.stik.injectable({
        module: doubles[ dbl ]
      });
    }

    return modules;
  }

  return env;
};

window.stik.labs.controller = function controllerLab( spec ){
  if ( !spec ) { throw "Stik: Controller Lab needs an environment to run"; }
  if ( !spec.name ) { throw "Stik: Controller Lab needs a name"; }
  if ( !spec.action ) { throw "Stik: Controller Lab needs the action name"; }
  if ( !spec.template ) { throw "Stik: Controller Lab needs a template"; }

  var env = {},
      result;

  env.template = parseAsDOM();

  result = window.stik.$$manager.bindActionWithTemplate(
    spec.name, spec.action, env.template
  );

  env.run = function run( doubles ){
    result.context.load(
      result.executionUnit, mergeModules( doubles )
    );
  };

  function parseAsDOM(){
    var container = document.implementation.createHTMLDocument();
    container.body.innerHTML = spec.template;
    return container.body.firstChild;
  }

  function mergeModules( doubles ){
    for ( var dbl in doubles ) {
      result.modules[ dbl ] = window.stik.injectable({
        module: doubles[ dbl ]
      });
    }
    return result.modules;
  }

  return env;
};

window.stik.labs.helper = function helperLab( spec ){
  if ( !spec ) { throw "Stik: Helper Lab needs an environment to run"; }
  if ( !spec.name ) { throw "Stik: Helper Lab needs a name"; }

  var env = {},
      boundary = window.stik.labs.boundary( { name: "$h" } );

  env.run = function run( doubles ){
    var helpers = boundary.run( doubles );
    helpers.pushDoubles( doubles );
    return function(){
      return helpers[ spec.name ].apply( {}, arguments );
    };
    // helpers.cleanDoubles();
  };

  return env;
};

window.stik.labs.dom = function domLab( spec ){
  if ( !spec ) { throw "Stik: Helper Lab needs an environment to run"; }
  if ( !spec.name ) { throw "Stik: Helper Lab needs a name"; }

  var env = {},
      boundary = window.stik.labs.boundary( { name: "$dom" } );

  env.run = function run( doubles ){
    var methods = boundary.run( doubles );
    methods.pushDoubles( doubles );
    return function(){
      return methods[ spec.name ].apply( {}, arguments );
    };
  };

  return env;
};
