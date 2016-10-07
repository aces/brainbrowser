(function ($) {
	'use strict';

	var cache = {};

	var defaultSettings = {
		templatePath: '',
		templateExtension: 'handlebars',
		partialPath: '',
		partialExtension: 'partial'
	};

	var settings = $.extend({}, defaultSettings);

	function resolvePath(basePath, name, extension) {
		basePath = basePath.replace(/[(^\s)(\s$)]/g, '');
		if (basePath.length) {
			return basePath + '/' + name + '.' + extension;
		} else {
			return name + '.' + extension;
		}
	}

	function resolveTemplatePath(name) {
		return resolvePath(settings.templatePath, name, settings.templateExtension);
	}

	function resolvePartialPath(name) {
		return resolvePath(settings.partialPath, name, settings.partialExtension);
	}

	function registerPartial(path, name) {
		$.get(resolvePartialPath(path), function (partial) {
			Handlebars.registerPartial(name, partial);
		}, 'text');
	}

  /*
    Manage the settings
  */
	$.hbs = function () {
		if (typeof arguments[0] !== 'string') {
			var options = arguments[0];
			settings = $.extend(defaultSettings, options);
			settings.templatePath = settings.templatePath.replace(/\\\/$/, '');
			settings.partialPath = settings.partialPath.replace(/\\\/$/, '');
			if (options.hasOwnProperty('partials')) {
				var names;
				if (typeof options.partials !== 'string') {
					names = options.partials;
				} else {
					names = options.partials.split(/\s+/g);
				}
				for (var i = 0; i < names.length; i++) {
					registerPartial(names[i], names[i]);
				}
			}
		} else {
			switch (arguments[0]) {
			case 'partial':
				if (arguments.length < 3) {
					registerPartial(arguments[1], arguments[1]);
				} else {
					registerPartial(arguments[1], arguments[2]);
				}
				break;
			case 'helper':
				Handlebars.registerHelper(arguments[1], arguments[2]);
				break;
			default:
				throw 'invalid action specified to jQuery.handlebars: ' + arguments[0];
			}
		}
	};


  /*
    Replace the content of the element by the generated html
  */
	$.fn.hbsRender = function (templateName, data) {
		var url = resolveTemplatePath(templateName);
		if (cache.hasOwnProperty(url)) {
			this.html(cache[url](data)).trigger('render.handlebars', [templateName, data]);
		} else {
			var $this = this;
			$.get(url, function (template) {
				cache[url] = Handlebars.compile(template);
				$this.html(cache[url](data)).trigger('render.handlebars', [templateName, data]);
			}, 'text');
		}
		return this;
	};


  /*
    Appends the generated html to the existing content of the div
  */
  $.fn.hbsAppend = function (templateName, data) {
		var url = resolveTemplatePath(templateName);
		if (cache.hasOwnProperty(url)) {
			this.append(cache[url](data)).trigger('render.handlebars', [templateName, data]);
		} else {
			var $this = this;
			$.get(url, function (template) {
				cache[url] = Handlebars.compile(template);
				$this.append(cache[url](data)).trigger('render.handlebars', [templateName, data]);
			}, 'text');
		}
		return this;
	};


  /*
    Prepend the generated html to the existing content of the div
  */
  $.fn.hbsPrepend = function (templateName, data) {
    var url = resolveTemplatePath(templateName);
    if (cache.hasOwnProperty(url)) {
      this.prepend(cache[url](data)).trigger('render.handlebars', [templateName, data]);
    } else {
      var $this = this;
      $.get(url, function (template) {
        cache[url] = Handlebars.compile(template);
        $this.prepend(cache[url](data)).trigger('render.handlebars', [templateName, data]);
      }, 'text');
    }
    return this;
  };


  /*
    Generates an element
  */
  $.hbsGenerate = function (templateName, data, callback) {
    var generated = null;
		var url = resolveTemplatePath(templateName);
		if (cache.hasOwnProperty(url)) {
			generated = cache[url](data);
      console.log("using the chached version of " + templateName);
      callback(generated);
		} else {
      console.log("Caching and using " + templateName);
			$.get(url, function (template) {
				cache[url] = Handlebars.compile(template);
				generated = cache[url](data);
        callback(generated);
			}, 'text');
		}
	};


  /*
    preload and compile a template.
    Useful to avoid the async pbm.
    Because sometimes, you need something, and you need it right now!
  */
  $.hbsPreload = function(templateName){
    var url = resolveTemplatePath(templateName);
    console.log("Preloading " + templateName);
    $.get(url, function (template) {
      cache[url] = Handlebars.compile(template);
    }, 'text');
  }



}(jQuery));
