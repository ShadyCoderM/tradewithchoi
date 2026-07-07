(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chartBoard = document.querySelector('[data-chart-board]');
  const progress = document.querySelector('[data-progress]');
  const drawLines = document.querySelectorAll('[data-draw-line]');
  const labLines = document.querySelectorAll('[data-lab-line]');
  const bars = document.querySelectorAll('[data-bars] path, [data-bars] rect');
  const topicPanel = document.querySelector('[data-topic-panel]');
  const topicTabs = document.querySelectorAll('[data-topic]');

  const topicData = {
    expectancy: {
      kicker: 'Expected value',
      title: 'Profit starts with positive expectancy, not confidence.',
      copy:
        'A setup can lose more often than it wins and still be profitable if average wins are large enough. It can also win often and still die if losses are larger or costs are ignored.',
      formula: 'EV = winRate * avgWinR - lossRate * avgLossR',
    },
    execution: {
      kicker: 'Execution cost',
      title: 'The spread can turn a good idea into a bad one.',
      copy:
        'The model is not real until it survives entry timing, spread, slippage, missed fills, session liquidity, and the difference between planned price and actual price.',
      formula: 'netEV = grossEV - spread - slippage - fees',
    },
    overfit: {
      kicker: 'Backtest hygiene',
      title: 'A perfect backtest can be a memorized chart.',
      copy:
        'If the rule only works on one pair, one month, one session, or after too many tweaks, it may be curve fit. Clean research separates signal from coincidence.',
      formula: 'trust = simpleRule + enoughTrades + outOfSample',
    },
    ruin: {
      kicker: 'Path risk',
      title: 'The order of wins and losses changes everything.',
      copy:
        'Two traders can have the same strategy and different outcomes because one sizes too hard during a bad sequence. Path risk is why survival comes before upside.',
      formula: 'drawdown = 1 - (1 - riskPerTrade) ^ lossStreak',
    },
  };

  function prepPaths(paths) {
    paths.forEach((line) => {
      const length = line.getTotalLength();
      line.dataset.length = String(length);
      line.style.strokeDasharray = length;
      line.style.strokeDashoffset = length;
    });
  }

  function revealPaths(paths) {
    paths.forEach((line) => {
      line.style.strokeDashoffset = 0;
    });
  }

  function replayChart() {
    if (!window.gsap || prefersReduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.set(drawLines, {
      strokeDashoffset: (index, line) => Number(line.dataset.length || line.getTotalLength()),
    })
      .set(['.pill', '.label', '.board-foot div'], { autoAlpha: 0 })
      .fromTo(bars, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.035 })
      .to(drawLines, { strokeDashoffset: 0, duration: 1.05, stagger: 0.18, ease: 'power2.inOut' }, '-=0.15')
      .fromTo('.pill, .label', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.04 }, '-=0.25')
      .fromTo('.board-foot div', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.08 }, '-=0.12');
  }

  function replayLab() {
    if (!window.gsap || prefersReduced || !labLines.length) return;
    gsap
      .timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: window.ScrollTrigger
          ? {
              trigger: '.lab-window',
              start: 'top 72%',
              once: true,
            }
          : undefined,
      })
      .set(labLines, {
        strokeDashoffset: (index, line) => Number(line.dataset.length || line.getTotalLength()),
      })
      .fromTo('.lab-window', { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.7 })
      .to(labLines, { strokeDashoffset: 0, duration: 0.9, stagger: 0.16 }, '-=0.2')
      .fromTo(
        '.chart-dot, .model-cell, .check-row, .score-ring',
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.05 },
        '-=0.28',
      );
  }

  function updateProgress() {
    if (!progress) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const amount = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, amount))}%`;
  }

  function setTopic(key) {
    const data = topicData[key];
    if (!data || !topicPanel) return;

    topicTabs.forEach((tab) => {
      const selected = tab.dataset.topic === key;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
    });

    const kicker = topicPanel.querySelector('[data-topic-kicker]');
    const title = topicPanel.querySelector('[data-topic-title]');
    const copy = topicPanel.querySelector('[data-topic-copy]');
    const formula = topicPanel.querySelector('[data-topic-formula]');

    const write = () => {
      kicker.textContent = data.kicker;
      title.textContent = data.title;
      copy.textContent = data.copy;
      formula.textContent = data.formula;
    };

    if (!window.gsap || prefersReduced) {
      write();
      return;
    }

    gsap.to(topicPanel, {
      autoAlpha: 0,
      y: 10,
      duration: 0.16,
      ease: 'power2.out',
      onComplete: () => {
        write();
        gsap.to(topicPanel, { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out' });
      },
    });
  }

  function updateCalculator() {
    const winRateInput = document.querySelector('[data-win-rate]');
    const winRInput = document.querySelector('[data-win-r]');
    const lossRInput = document.querySelector('[data-loss-r]');
    const riskInput = document.querySelector('[data-risk-trade]');
    if (!winRateInput || !winRInput || !lossRInput || !riskInput) return;

    const winRatePct = Number(winRateInput.value);
    const winRate = winRatePct / 100;
    const lossRate = 1 - winRate;
    const avgWin = Number(winRInput.value);
    const avgLoss = Number(lossRInput.value);
    const riskPct = Number(riskInput.value);
    const risk = riskPct / 100;

    const expectancy = winRate * avgWin - lossRate * avgLoss;
    const profitFactor = lossRate * avgLoss > 0 ? (winRate * avgWin) / (lossRate * avgLoss) : 0;
    const sixLossDrawdown = 1 - Math.pow(1 - risk, 6);
    const tenLossPressure = 1 - Math.pow(1 - Math.pow(lossRate, 10), 91);

    document.querySelector('[data-win-label]').textContent = `${winRatePct}%`;
    document.querySelector('[data-win-r-label]').textContent = `${avgWin.toFixed(1)}R`;
    document.querySelector('[data-loss-r-label]').textContent = `${avgLoss.toFixed(1)}R`;
    document.querySelector('[data-risk-label]').textContent = `${riskPct.toFixed(1)}%`;
    document.querySelector('[data-expectancy]').textContent = `${expectancy >= 0 ? '+' : ''}${expectancy.toFixed(2)}R`;
    document.querySelector('[data-profit-factor]').textContent = profitFactor.toFixed(2);
    document.querySelector('[data-drawdown]').textContent = `${(sixLossDrawdown * 100).toFixed(1)}%`;
    document.querySelector('[data-streak]').textContent = `${(tenLossPressure * 100).toFixed(0)}%`;
  }

  prepPaths(drawLines);
  prepPaths(labLines);
  updateProgress();
  updateCalculator();

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  topicTabs.forEach((tab) => {
    tab.addEventListener('click', () => setTopic(tab.dataset.topic));
  });

  document
    .querySelectorAll('[data-win-rate], [data-win-r], [data-loss-r], [data-risk-trade]')
    .forEach((input) => input.addEventListener('input', updateCalculator));

  if (!window.gsap || prefersReduced) {
    revealPaths(drawLines);
    revealPaths(labLines);
    return;
  }

  if (window.ScrollTrigger) {
    gsap.registerPlugin(window.ScrollTrigger);
  }

  gsap.set(['.hero-copy > *', '.market-board', '.ticker-strip', '.proof-band'], { autoAlpha: 0, y: 24 });
  gsap.set(['.edge', '.quant-lab', '.lab', '.breakdown', '.pathway', '.trust', '.plans', '.faq', '.access'], {
    autoAlpha: 0,
    y: 30,
  });

  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro
    .to('.hero-copy > *', { autoAlpha: 1, y: 0, duration: 0.62, stagger: 0.07 })
    .to('.market-board', { autoAlpha: 1, y: 0, duration: 0.7 }, '-=0.38')
    .to('.ticker-strip', { autoAlpha: 1, y: 0, duration: 0.45 }, '-=0.25')
    .to('.proof-band', { autoAlpha: 1, y: 0, duration: 0.45 }, '-=0.22')
    .add(replayChart, '-=0.25');

  if (chartBoard) {
    chartBoard.addEventListener('mouseenter', replayChart);
    chartBoard.addEventListener('focusin', replayChart);
  }

  gsap.to('.ticker-track', {
    xPercent: -50,
    duration: 28,
    ease: 'none',
    repeat: -1,
  });

  gsap.utils.toArray('.edge, .quant-lab, .lab, .breakdown, .pathway, .trust, .plans, .faq, .access').forEach((section) => {
    const options = {
      autoAlpha: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
    };

    if (window.ScrollTrigger) {
      options.scrollTrigger = {
        trigger: section,
        start: 'top 78%',
        once: true,
      };
    }

    gsap.to(section, options);
  });

  gsap.utils
    .toArray('.edge-card, .path-card, .plan-card, .faq-item, .guardrail, .concept-table article, .proof-band div')
    .forEach((item) => {
      gsap.fromTo(
        item,
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          ease: 'power3.out',
          scrollTrigger: window.ScrollTrigger
            ? {
                trigger: item,
                start: 'top 86%',
                once: true,
              }
            : undefined,
        },
      );
    });

  replayLab();

  gsap.utils.toArray('.button, form button, .console-tabs button').forEach((button) => {
    button.addEventListener('mouseenter', () => gsap.to(button, { y: -2, duration: 0.18, ease: 'power2.out' }));
    button.addEventListener('mouseleave', () => gsap.to(button, { y: 0, duration: 0.22, ease: 'power2.out' }));
  });
})();
