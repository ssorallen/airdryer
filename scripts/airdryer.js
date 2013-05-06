(function($) {
	'use strict';

	var pm;
	var $sorterHeader;

	var CONTROL_TEMPLATE = [
		'<p style="margin: 0; padding: 0; position: absolute; margin-left: 45px;">',
		'<a class="airdry-unresolved" href="javascript:void(0);" style="background-position-x: left; height: 25px; width: 60px; padding: 0;"></a>',
		'</p>'
	].join('');

	function setSorterHeader(el, direction) {
		var $el = $(el);

		// Reset existing header if it is not the one being used
		if ($sorterHeader && ($sorterHeader[0] !== el)) {
			$sorterHeader.text($sorterHeader.data('text'));
		}

		if (!$el.data('text')) {
			$el.data('text', $el.text());
		}

		$el.text($el.data('text') + ((direction > 0) ? '▼' : '▲'));
		$sorterHeader = $el;
	}

	function CountSorter(direction) {
		this.direction = direction;
	}

	CountSorter.prototype.sort = function(a, b) {
		if (a.count < b.count) {
			return 1 * this.direction;
		} else if (a.count > b.count) {
			return -1 * this.direction;
		} else {
			return 0;
		}
	};

	function DateSorter(direction) {
		this.direction = direction;
	}

	DateSorter.prototype.sort = function(a, b) {
		if (a.latest < b.latest) {
			return 1 * this.direction;
		} else if (a.latest > b.latest) {
			return -1 * this.direction;
		} else {
			return 0;
		}
	};

	// For clicks in the `<thead>` of the error table, if the clicked element
	// matches one of the keys the associated Sorter class will be used to sort
	// the table.
	var SORTER_SELECTORS = {
		'th.count': CountSorter,
		'th:nth-child(5)': DateSorter
	};

	function ProjectError(el) {
		this.$el = $(el);
		this.count = parseInt(this.$el.find('.count').text(), 10);
		this.environment = this.$el.find('.environment_icon a').text();
		this.latest = Date.parse(this.$el.find('.latest .timeago').attr('title'));
	}

	function ProjectErrorManager(el) {
		var _this = this;

		this.$el = $(el);
		this.projectErrors = [];

		// Default sort on pageload, provided by Airbrake, is date occurred in
		// ascending order.
		this.sorter = new DateSorter(1);
		setSorterHeader(this.$el.find('thead th')[4], this.sorter.direction);

		this.$el.find('tbody tr').each(function(i, tr) {
			_this.projectErrors.push(new ProjectError(tr));
		});
	}

	ProjectErrorManager.prototype.delegateEvents = function() {
		var _this = this;

		this.$el.on('click.airdryer', '.airdry-unresolved', function(event) {
			var $link = $(this);
			var $parent = $link.parents('tr');
			var url = $parent.find('.message a').attr('href');
			var resolved = $parent.hasClass('resolved');

			$.post(
				url,
				{
					_method: 'put',

					// Invert here, if resolved already set it to unresolved
					'group[resolved]': (resolved ? 0 : 1)
				},
				function() {},
				'xml'
			);

			// Sent the request, consider everything inverted
			$link.parent()
				.toggleClass('resolved-link', !resolved)
				.toggleClass('unresolved-link', resolved);
			$parent
				.toggleClass('resolved', !resolved)
				.toggleClass('unresolved', resolved);
			event.preventDefault();
		});

		this.$el.find('thead').on('click.airdryer', 'th', function() {
			var _$this = $(this);

			$.each(SORTER_SELECTORS, function(selector, Klass) {
				if (_$this.is(selector)) {
					var direction;

					if (_this.sorter instanceof Klass) {
						direction = _this.sorter.direction * -1;
					} else {
						direction = 1;
					}

					setSorterHeader(_$this, direction);
					_this.sorter = new Klass(direction);
					_this.sort(_this.sorter);

					// Break execution; no other selectors will match.
					return false;
				}
			});
		});
	};

	ProjectErrorManager.prototype.render = function() {
		var i, len, resolved;
		var $control, $controlTemplate, $icon;
		var $icons = this.$el.find('.environment_icon');

		$controlTemplate = $(CONTROL_TEMPLATE);
		for (i = 0, len = $icons.length; i < len; i++) {
			$icon = $icons.eq(i);
			resolved = $icon.parents('tr').hasClass('resolved');

			$control = $($controlTemplate[0].cloneNode(true));
			$control.addClass(resolved ? 'resolved-link' : 'unresolved-link');
			$icon.prepend($control);
		}

		this.delegateEvents();
	};

	ProjectErrorManager.prototype.sort = function(sorter) {
		var i, len;
		var $tbody = this.$el.find('tbody');

		this.projectErrors.sort($.proxy(sorter.sort, sorter));

		for (i = 0, len = this.projectErrors.length; i < len; i++) {
			$tbody.append(this.projectErrors[i].$el[0]);
		}
	};

	pm = new ProjectErrorManager('table.groups');
	pm.render();
})(jQuery);
