(function() {
	var $control, $controlTemplate, i, $icon, len, resolved;

	var $icons = $(".environment_icon");
	var TEMPLATE = [
		'<p style="margin: 0; padding: 0; position: absolute; margin-left: 45px;">',
			'<a class="airdry-unresolved" href="javascript:void(0);" style="background-position-x: left; height: 25px; width: 60px; padding: 0;"></a>',
		'</p>'
	].join('');

	$controlTemplate = $(TEMPLATE);
	for (i = 0, len = $icons.length; i < len; i++) {
		$icon = $icons.eq(i);
		resolved = $icon.parents("tr").hasClass("resolved");

		$control = $($controlTemplate[0].cloneNode(true));
		$control.addClass(resolved ? "resolved-link" : "unresolved-link");
		$icon.prepend($control);
	}

	$("table.groups").on("click", ".airdry-unresolved", function(event) {
		var $link = $(this);
		var $parent = $link.parents("tr");
		var url = $parent.find(".message a").attr("href");
		var resolved = $parent.hasClass("resolved");

		$.post(
			url,
			{
				_method: "put",
				"group[resolved]": (resolved ? 0 : 1) // Invert here, if resolved already set it to unresolved
			},
			function() {},
			"xml"
		);

		// Sent the request, consider everything inverted
		$link.parent()
			.toggleClass("resolved-link", !resolved)
			.toggleClass("unresolved-link", resolved);
		$parent
			.toggleClass("resolved", !resolved)
			.toggleClass("unresolved", resolved);
		event.preventDefault();
	});
})();