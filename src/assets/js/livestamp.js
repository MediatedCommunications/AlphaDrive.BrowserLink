// Livestamp.js / v1.1.2 / (c) 2012 Matt Bradley / MIT License
(function ($, moment) {
	let updateInterval = 1e3;
	let paused = false;
	let $livestamps = $([]);

	const init = function () {
		livestampGlobal.resume();
	};

	const prep = function ($el, timestamp) {
		const oldData = $el.data('livestampdata');
		if (typeof timestamp === 'number') {
			timestamp *= 1e3;
		}

		$el.removeAttr('data-livestamp')
			.removeData('livestamp');

		timestamp = moment(timestamp);
		if (moment.isMoment(timestamp) && !isNaN(Number(timestamp))) {
			const newData = $.extend({ }, {original: $el.contents()}, oldData);
			newData.moment = moment(timestamp);

			$el.data('livestampdata', newData).empty();
			$livestamps.push($el[0]);
		}
	};

	var run = function () {
		if (paused) {
			return;
		}

		livestampGlobal.update();
		setTimeout(run, updateInterval);
	};

	var livestampGlobal = {
		update() {
			$('[data-livestamp]').each(function () {
				const $this = $(this);
				prep($this, $this.data('livestamp'));
			});

			const toRemove = [];
			$livestamps.each(function () {
				const $this = $(this);
				const data = $this.data('livestampdata');

				if (data === undefined) {
					toRemove.push(this);
				} else if (moment.isMoment(data.moment)) {
					const from = $this.html();
					const to = data.moment.fromNow();

					if (from != to) {
						const e = $.Event('change.livestamp');
						$this.trigger(e, [from, to]);
						if (!e.isDefaultPrevented()) {
							$this.html(to);
						}
					}
				}
			});

			$livestamps = $livestamps.not(toRemove);
		},

		pause() {
			paused = true;
		},

		resume() {
			paused = false;
			run();
		},

		interval(interval) {
			if (interval === undefined) {
				return updateInterval;
			}

			updateInterval = interval;
		}
	};

	const livestampLocal = {
		add($el, timestamp) {
			if (typeof timestamp === 'number') {
				timestamp *= 1e3;
			}

			timestamp = moment(timestamp);

			if (moment.isMoment(timestamp) && !isNaN(Number(timestamp))) {
				$el.each(function () {
					prep($(this), timestamp);
				});
				livestampGlobal.update();
			}

			return $el;
		},

		destroy($el) {
			$livestamps = $livestamps.not($el);
			$el.each(function () {
				const $this = $(this);
				const data = $this.data('livestampdata');

				if (data === undefined) {
					return $el;
				}

				$this
					.html(data.original ? data.original : '')
					.removeData('livestampdata');
			});

			return $el;
		},

		isLivestamp($el) {
			return $el.data('livestampdata') !== undefined;
		}
	};

	$.livestamp = livestampGlobal;
	$(init);
	$.fn.livestamp = function (method, options) {
		if (!livestampLocal[method]) {
			options = method;
			method = 'add';
		}

		return livestampLocal[method](this, options);
	};
})(jQuery, moment);
