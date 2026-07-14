const leadEndpoint = window.CODEX_SERVICE_ENDPOINT || document.querySelector('meta[name="lead-endpoint"]')?.content || '';
const navToggle = document.querySelector('[data-menu-toggle]');
const navLinks = document.querySelector('[data-nav-links]');
const ambientCanvas = document.querySelector('[data-ambient-canvas]');
const coreCanvas = document.querySelector('[data-core-canvas]');
const progressBar = document.querySelector('[data-page-progress]');
const coreLoad = document.querySelector('[data-core-load]');
const customCursor = document.querySelector('[data-custom-cursor]');
const cursorLabel = document.querySelector('[data-cursor-label]');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionEnabled = !motionQuery.matches;

const fitCanvas = (canvas, context, width, height) => {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
};

const setupAmbientCanvas = (canvas) => {
  const context = canvas.getContext('2d');
  if (!context) return;
  let width = 0;
  let height = 0;
  let particles = [];
  let animationFrame = 0;

  const reset = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    fitCanvas(canvas, context, width, height);
    particles = Array.from({ length: Math.min(68, Math.max(30, Math.floor(width / 24))) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      radius: Math.random() * 1.5 + 0.35,
    }));
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < -16) particle.x = width + 16;
      if (particle.x > width + 16) particle.x = -16;
      if (particle.y < -16) particle.y = height + 16;
      if (particle.y > height + 16) particle.y = -16;

      for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
        const next = particles[nextIndex];
        const distance = Math.hypot(particle.x - next.x, particle.y - next.y);
        if (distance < 138) {
          context.strokeStyle = `rgba(124, 232, 255, ${(1 - distance / 138) * 0.16})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(next.x, next.y);
          context.stroke();
        }
      }

      context.fillStyle = 'rgba(162, 255, 207, 0.58)';
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    });
    animationFrame = window.requestAnimationFrame(draw);
  };

  reset();
  draw();
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(animationFrame);
    reset();
    draw();
  });
};

const setupCoreCanvas = (canvas) => {
  const context = canvas.getContext('2d');
  const stage = canvas.closest('.core-stage');
  if (!context || !stage) return;
  let width = 0;
  let height = 0;
  let animationFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  const particles = Array.from({ length: 54 }, (_, index) => ({
    angle: (Math.PI * 2 * index) / 54,
    radius: 0.56 + (index % 7) * 0.047,
    speed: 0.08 + (index % 5) * 0.012,
    size: 0.8 + (index % 4) * 0.35,
  }));

  const reset = () => {
    const bounds = stage.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    fitCanvas(canvas, context, width, height);
  };

  const draw = (time) => {
    const seconds = time / 1000;
    context.clearRect(0, 0, width, height);
    const centerX = width * (0.5 + pointerX * 0.035);
    const centerY = height * (0.5 + pointerY * 0.035);
    const baseRadius = Math.min(width, height) * 0.22;

    const aura = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 2.4);
    aura.addColorStop(0, 'rgba(124, 232, 255, 0.28)');
    aura.addColorStop(0.32, 'rgba(102, 131, 255, 0.11)');
    aura.addColorStop(1, 'rgba(6, 7, 8, 0)');
    context.fillStyle = aura;
    context.beginPath();
    context.arc(centerX, centerY, baseRadius * 2.4, 0, Math.PI * 2);
    context.fill();

    [1, 1.24, 1.52].forEach((scale, ringIndex) => {
      context.save();
      context.translate(centerX, centerY);
      context.rotate(seconds * (ringIndex % 2 ? -0.08 : 0.06) + ringIndex);
      context.scale(1, 0.42 + ringIndex * 0.04);
      context.strokeStyle = `rgba(${ringIndex === 2 ? '194, 161, 255' : '124, 232, 255'}, ${0.5 - ringIndex * 0.11})`;
      context.lineWidth = ringIndex === 0 ? 1.4 : 1;
      context.beginPath();
      context.arc(0, 0, baseRadius * scale, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    });

    particles.forEach((particle, index) => {
      const angle = particle.angle + seconds * particle.speed * (index % 2 ? -1 : 1);
      const orbitRadius = baseRadius * particle.radius;
      const x = centerX + Math.cos(angle) * orbitRadius;
      const y = centerY + Math.sin(angle) * orbitRadius * 0.46;
      if (index % 8 === 0) {
        context.strokeStyle = 'rgba(162, 255, 207, 0.12)';
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.lineTo(x, y);
        context.stroke();
      }
      context.fillStyle = index % 5 === 0 ? 'rgba(194, 161, 255, 0.95)' : 'rgba(162, 255, 207, 0.78)';
      context.beginPath();
      context.arc(x, y, particle.size, 0, Math.PI * 2);
      context.fill();
    });

    const core = context.createRadialGradient(centerX - baseRadius * 0.35, centerY - baseRadius * 0.42, 0, centerX, centerY, baseRadius);
    core.addColorStop(0, '#f3ffff');
    core.addColorStop(0.12, '#b5f5ff');
    core.addColorStop(0.32, '#6683ff');
    core.addColorStop(0.68, '#1b2734');
    core.addColorStop(1, 'rgba(9, 12, 15, 0.15)');
    context.fillStyle = core;
    context.beginPath();
    context.arc(centerX, centerY, baseRadius * (0.72 + Math.sin(seconds * 1.4) * 0.018), 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = 'rgba(239, 255, 255, 0.82)';
    context.lineWidth = 1.4;
    context.beginPath();
    context.arc(centerX, centerY, baseRadius * 0.82, seconds * 0.6, seconds * 0.6 + Math.PI * 1.2);
    context.stroke();
    context.strokeStyle = 'rgba(162, 255, 207, 0.7)';
    context.beginPath();
    context.arc(centerX, centerY, baseRadius * 0.96, -seconds * 0.42, -seconds * 0.42 + Math.PI * 0.72);
    context.stroke();

    animationFrame = window.requestAnimationFrame(draw);
  };

  stage.addEventListener('pointermove', (event) => {
    const bounds = stage.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    pointerY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    stage.style.setProperty('--stage-rotate', `${pointerX * 1.8}deg`);
  });
  stage.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
    stage.style.setProperty('--stage-rotate', '0deg');
  });
  window.addEventListener('resize', reset);
  reset();
  animationFrame = window.requestAnimationFrame(draw);
  return () => window.cancelAnimationFrame(animationFrame);
};

if (motionEnabled) {
  if (ambientCanvas) setupAmbientCanvas(ambientCanvas);
  if (coreCanvas) setupCoreCanvas(coreCanvas);
}

const updateProgress = () => {
  if (!progressBar) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
};

updateProgress();
window.addEventListener('scroll', updateProgress, { passive: true });

const revealItems = document.querySelectorAll('.reveal');
if (motionEnabled && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (window.gsap) {
        window.gsap.fromTo(entry.target, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.72, ease: 'power3.out' });
      } else {
        entry.target.classList.add('is-visible');
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

if (coreLoad && motionEnabled) {
  window.setInterval(() => {
    const wave = Math.round(Math.sin(Date.now() / 1300) * 3);
    coreLoad.textContent = `${82 + wave}%`;
  }, 900);
}

document.querySelectorAll('[data-count-target]').forEach((item) => {
  const target = Number(item.dataset.countTarget || item.textContent || 0);
  let current = 0;
  const step = () => {
    current += Math.max(1, Math.ceil((target - current) / 5));
    item.textContent = String(Math.min(current, target));
    if (current < target) window.requestAnimationFrame(step);
  };
  step();
});

if (navLinks) {
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
  navLinks.querySelectorAll('a').forEach((link) => {
    const linkPath = new URL(link.getAttribute('href'), window.location.href).pathname.replace(/\/index\.html$/, '/');
    if (linkPath === currentPath) link.setAttribute('aria-current', 'page');
  });
}

if (navToggle && navLinks) navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

if (customCursor && window.matchMedia('(pointer: fine)').matches && motionEnabled) {
  let cursorX = 0;
  let cursorY = 0;
  let cursorFrame = 0;
  let cursorVisible = false;

  const moveCursor = () => {
    customCursor.style.left = `${cursorX}px`;
    customCursor.style.top = `${cursorY}px`;
    cursorFrame = 0;
  };

  document.addEventListener('pointermove', (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    if (!cursorFrame) cursorFrame = window.requestAnimationFrame(moveCursor);
  });

  document.querySelectorAll('[data-cursor-text]').forEach((target) => {
    target.addEventListener('pointerenter', () => {
      if (cursorLabel) cursorLabel.textContent = target.dataset.cursorText || 'OPEN';
      customCursor.classList.add('is-visible');
      cursorVisible = true;
    });
    target.addEventListener('pointerleave', () => {
      customCursor.classList.remove('is-visible');
      cursorVisible = false;
    });
  });

  document.addEventListener('pointerleave', () => {
    if (cursorVisible) customCursor.classList.remove('is-visible');
  });
}

document.querySelectorAll('[data-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    const group = button.closest('[data-tabs]');
    if (!group) return;
    group.querySelectorAll('[data-tab]').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    document.querySelectorAll('[data-pipeline-view]').forEach((view) => {
      view.hidden = view.dataset.pipelineView !== button.dataset.tab;
    });
  });
});

const saveLocalLead = (payload) => {
  const previous = JSON.parse(localStorage.getItem('codexServiceLeads') || '[]');
  previous.push(payload);
  localStorage.setItem('codexServiceLeads', JSON.stringify(previous));
};

const setFormMessage = (form, titleText, detailText, isError = false) => {
  const message = form.parentElement.querySelector('.form-success');
  if (!message) return;
  message.classList.add('is-visible');
  message.classList.toggle('is-error', isError);
  message.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = titleText;
  const detail = document.createElement('span');
  detail.textContent = detailText;
  message.append(title, detail);
};

const submitLead = async (payload) => {
  if (!leadEndpoint) return { mode: 'local' };
  const response = await fetch(leadEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Lead endpoint failed: ' + response.status);
  return response.json().catch(() => ({ ok: true }));
};

document.querySelectorAll('.lead-form').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton?.textContent;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = '提交中...';
    }

    const formData = new FormData(form);
    const payload = {
      type: form.dataset.formType || 'lead',
      submittedAt: new Date().toISOString(),
      source: window.location.href,
      data: Object.fromEntries(formData.entries()),
    };

    saveLocalLead(payload);

    try {
      const result = await submitLead(payload);
      if (result.mode === 'local') {
        setFormMessage(
          form,
          '已收到：' + (payload.data.name || payload.data.title || '你的提交'),
          '当前还没有配置飞书接口，记录已先保存在此浏览器。配置中转接口后，提交会自动进入飞书多维表格。'
        );
      } else {
        setFormMessage(
          form,
          '提交成功：' + (payload.data.name || payload.data.title || '你的提交'),
          '需求已进入后台表格。下一步会先确认目标、材料和交付标准，再进入报价或陪跑安排。'
        );
      }
      form.reset();
    } catch (error) {
      console.error(error);
      setFormMessage(
        form,
        '后台提交失败，已本地备份',
        '这条记录已保存在当前浏览器。请稍后重试，或直接联系站点负责人确认需求。',
        true
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
});
