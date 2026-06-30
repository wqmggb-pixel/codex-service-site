const leadEndpoint = window.CODEX_SERVICE_ENDPOINT || document.querySelector('meta[name="lead-endpoint"]')?.content || '';
const navToggle = document.querySelector('[data-menu-toggle]');
const navLinks = document.querySelector('[data-nav-links]');

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