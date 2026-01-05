export const views = {
    auth: document.getElementById('view-auth'),
    authorization: document.getElementById('view-authorization'),
    search: document.getElementById('view-search'),
    loading: document.getElementById('view-loading'),
    generating: document.getElementById('view-generating'),
    moodboard: document.getElementById('view-moodboard'),
    details: document.getElementById('view-details'),
    'mini-prd': document.getElementById('view-mini-prd'),
    confirmation: document.getElementById('view-confirmation'),
    empty: document.getElementById('view-empty')
};

const wrapper = document.getElementById('view-wrapper');

export const tabs = {
    moodboard: document.getElementById('tab-moodboard'),
    colors: document.getElementById('tab-colors'),
    typography: document.getElementById('tab-typography'),
    layout: document.getElementById('tab-layout')
};

export const sections = {
    moodboard: document.getElementById('moodboardGrid'),
    colors: document.getElementById('section-colors'),
    typography: document.getElementById('section-typography'),
    layout: document.getElementById('section-layout')
};

export function showView(viewId: string) {
    const center = ['auth', 'authorization', 'search', 'loading', 'generating', 'confirmation', 'empty'].includes(viewId);
    wrapper?.classList.toggle('centered', center);
    Object.values(views).forEach(v => v?.classList.remove('active'));
    // @ts-ignore
    views[viewId]?.classList.add('active');
}

export function showToast(msg: string) {
    const t = document.getElementById('toast');
    if (t) {
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2000);
    }
}
