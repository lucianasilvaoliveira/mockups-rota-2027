(function () {
	// Menu do celular: tela cheia; o site por baixo fica travado até fechar
	var botao = document.querySelector('.menu-botao');
	var menu = document.getElementById('menu-principal');
	if (botao && menu) {
		var fechar = menu.querySelector('.menu-fechar');
		var abrir = function (sim) {
			menu.classList.toggle('is-aberto', sim);
			document.documentElement.classList.toggle('menu-aberto', sim);
			botao.setAttribute('aria-expanded', sim ? 'true' : 'false');
			// Enquanto o menu cobre a tela, o resto da página sai do Tab e do leitor de tela
			document.querySelectorAll('.topbar, main, .rodape, .cabeca__in').forEach(function (el) { el.inert = sim; });
			if (sim) { menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-modal', 'true'); }
			else { menu.removeAttribute('role'); menu.removeAttribute('aria-modal'); }
			(sim ? fechar : botao).focus();
		};
		botao.addEventListener('click', function () { abrir(true); });
		if (fechar) fechar.addEventListener('click', function () { abrir(false); });
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-aberto')) abrir(false); });
		menu.addEventListener('click', function (e) { if (e.target.closest('a')) abrir(false); });
	}

	// Compartilhar: copiar link e menu nativo do celular
	document.querySelectorAll('.compartilhar').forEach(function (bloco) {
		var aviso = bloco.querySelector('.compartilhar__aviso');
		var nativo = bloco.querySelector('.compartilhar__nativo');
		if (nativo && navigator.share) {
			nativo.hidden = false;
			nativo.querySelector('button').addEventListener('click', function () {
				navigator.share({ title: document.title, url: location.href.split('#')[0] }).catch(function () {});
			});
		}
		var imprimir = bloco.querySelector('[data-imprimir]');
		if (imprimir) imprimir.addEventListener('click', function () { window.print(); });
		var copiar = bloco.querySelector('[data-copiar]');
		if (copiar) copiar.addEventListener('click', function () {
			var ok = function () { aviso.textContent = 'Link copiado'; setTimeout(function () { aviso.textContent = ''; }, 2500); };
			if (navigator.clipboard) navigator.clipboard.writeText(copiar.dataset.copiar).then(ok, function () {});
		});
	});

	// Carrossel de apoiadores: avança uma "página" por vez, volta ao início no fim
	var parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	document.querySelectorAll('[data-carrossel]').forEach(function (bloco) {
		var trilho = bloco.querySelector('.apoio__trilho');
		if (!trilho) return;
		function andar(dir) {
			var fim = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 4;
			var inicio = trilho.scrollLeft <= 4;
			if (dir > 0 && fim) trilho.scrollTo({ left: 0, behavior: 'smooth' });
			else if (dir < 0 && inicio) trilho.scrollTo({ left: trilho.scrollWidth, behavior: 'smooth' });
			else trilho.scrollBy({ left: dir * trilho.clientWidth, behavior: 'smooth' });
		}
		bloco.querySelectorAll('.apoio__seta[data-dir]').forEach(function (b) {
			b.addEventListener('click', function () { andar(+b.dataset.dir); });
		});
		// Logo focado pelo teclado entra na área visível
		trilho.addEventListener('focusin', function (e) { var li = e.target.closest('li'); if (li) li.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
		var pausar = bloco.querySelector('.apoio__pausa');
		if (parado) { if (pausar) pausar.hidden = true; return; }
		// Gira sozinho; para no mouse/foco/toque e de vez no botão de pausa
		var pausa = false, travado = false;
		setInterval(function () { if (!pausa && !travado && !document.hidden) andar(1); }, 5000);
		['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { bloco.addEventListener(ev, function () { pausa = true; }, { passive: true }); });
		['mouseleave', 'focusout', 'touchend'].forEach(function (ev) { bloco.addEventListener(ev, function () { pausa = false; }, { passive: true }); });
		if (pausar) pausar.addEventListener('click', function () {
			travado = !travado;
			pausar.setAttribute('aria-pressed', travado ? 'true' : 'false');
			pausar.setAttribute('aria-label', travado ? 'Retomar a rolagem dos apoiadores' : 'Pausar a rolagem dos apoiadores');
		});
	});

	// Jurídica TV: troca a capa pelo player do YouTube (sem cookies) só quando o leitor clica.
	document.querySelectorAll('[data-video]').forEach(function (fig) {
		var botao = fig.querySelector('.video__botao');
		if (!botao) return;
		botao.addEventListener('click', function () {
			var f = document.createElement('iframe');
			f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(fig.dataset.video) + '?autoplay=1&rel=0';
			f.title = botao.getAttribute('aria-label');
			f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
			f.allowFullscreen = true;
			fig.replaceChild(f, botao);
			f.focus();
		});
	});

	// Datas: a página pode vir do cache, então "Há X horas" e a data do topo são calculados aqui.
	var agora = Date.now();
	document.querySelectorAll('time[data-relativo]').forEach(function (t) {
		var quando = Date.parse(t.dateTime);
		if (isNaN(quando)) return;
		var s = (agora - quando) / 1000;
		var hora = new Date(quando);
		var hhmm = hora.getHours() + 'h' + String(hora.getMinutes()).padStart(2, '0');
		var ontem = new Date(agora - 86400000);
		if (s < 0) return;
		if (s < 60) t.textContent = 'Agora';
		else if (s < 3600) t.textContent = 'Há ' + Math.floor(s / 60) + (s < 120 ? ' minuto' : ' minutos');
		else if (s < 86400) t.textContent = 'Há ' + Math.floor(s / 3600) + (s < 7200 ? ' hora' : ' horas');
		else if (hora.toDateString() === ontem.toDateString()) t.textContent = 'Ontem, ' + hhmm;
		else t.textContent = t.textContent.replace(/, \d+h\d+$/, '');
	});
	var hoje = document.querySelector('[data-hoje]');
	if (hoje && window.Intl) {
		var txt = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
		hoje.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
	}

	// Apoiadores: ordem sorteada a cada visita (a página fica no cache; sortear no PHP congelaria a ordem)
	document.querySelectorAll('[data-embaralhar]').forEach(function (lista) {
		for (var i = lista.children.length; i > 1; i--) lista.appendChild(lista.children[Math.floor(Math.random() * i)]);
	});
})();
