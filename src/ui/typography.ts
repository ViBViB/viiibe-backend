export function generateTypographySystem() {
    const container = document.getElementById('typographyContent');
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const term = (searchInput?.value || '').toLowerCase();

    if (!container) return;
    if (container.children.length > 1 && !container.innerHTML.includes('Analyzing')) return;
    container.innerHTML = '';

    const pairs = {
        modern: { name: 'Modern Geometric', head: { family: 'Inter', weight: '700' }, body: { family: 'Inter', weight: '400' } },
        elegant: { name: 'Editorial Serif', head: { family: 'Playfair Display', weight: '700' }, body: { family: 'Lato', weight: '400' } },
        tech: { name: 'Tech Mono', head: { family: 'Space Mono', weight: '700' }, body: { family: 'Roboto', weight: '400' } },
        corporate: { name: 'Clean Corp', head: { family: 'Roboto', weight: '700' }, body: { family: 'Roboto', weight: '400' } }
    };
    const scales = { majorThird: { name: 'Major Third', ratio: '1.250' }, minorThird: { name: 'Minor Third', ratio: '1.200' }, perfectFourth: { name: 'Perfect Fourth', ratio: '1.333' } };
    let pair = pairs.modern; let scale = scales.majorThird; let desc = "Balanced contrast.";

    if (term.match(/fashion|wedding|luxury|art/)) { pair = pairs.elegant; scale = scales.perfectFourth; desc = "High contrast."; }
    else if (term.match(/dashboard|data|crypto|future/)) { pair = pairs.tech; scale = scales.minorThird; desc = "Tight hierarchy."; }
    else if (term.match(/bank|corporate|law|finance/)) { pair = pairs.corporate; scale = scales.majorThird; desc = "Standard ratio."; }

    const tokens = [
        { role: 'Display 3XL', size: '72px', lh: '120%', ls: '-0.02em', font: pair.head, weight: pair.head.weight, text: "The quick brown fox" },
        { role: 'Display 2XL', size: '56px', lh: '120%', ls: '-0.02em', font: pair.head, weight: pair.head.weight, text: "The quick brown fox" },
        { role: 'Heading XL', size: '48px', lh: '120%', ls: '-0.02em', font: pair.head, weight: pair.head.weight, text: "The quick brown fox" },
        { role: 'Heading L', size: '36px', lh: '120%', ls: '-0.02em', font: pair.head, weight: pair.head.weight, text: "The quick brown fox" },
        { role: 'Heading M', size: '30px', lh: '120%', ls: '-0.02em', font: pair.head, weight: pair.head.weight, text: "The quick brown fox" },
        { role: 'Heading S', size: '24px', lh: '120%', ls: '-0.02em', font: pair.head, weight: pair.head.weight, text: "The quick brown fox" },
        { role: 'Heading XS', size: '20px', lh: '150%', ls: '-0.015em', font: pair.head, weight: pair.head.weight, text: "The quick brown fox" },
        { role: 'Heading 2XS', size: '18px', lh: '150%', ls: '-0.015em', font: pair.head, weight: pair.head.weight, text: "The quick brown fox" },
        { role: 'Heading 3XS', size: '16px', lh: '150%', ls: '-0.015em', font: pair.head, weight: pair.head.weight, text: "The quick brown fox" },
        { isDivider: true, label: 'Body & Paragraphs', role: '', size: '', lh: '', ls: '', font: { family: '' }, weight: '', text: '' },
        { role: 'Body XL', size: '20px', lh: '150%', ls: '-0.015em', font: pair.body, weight: pair.body.weight, text: "Lorum ipsum dolor sit amet." },
        { role: 'Body L', size: '18px', lh: '150%', ls: '-0.012em', font: pair.body, weight: pair.body.weight, text: "Lorum ipsum dolor sit amet." },
        { role: 'Body M', size: '16px', lh: '150%', ls: '-0.01em', font: pair.body, weight: pair.body.weight, text: "Lorum ipsum dolor sit amet." },
        { role: 'Body S', size: '14px', lh: '150%', ls: '-0.005em', font: pair.body, weight: 400, text: "Metadata info label" }
    ];

    let listHtml = '';
    tokens.forEach(t => {
        if (t.isDivider) listHtml += `<h4 style="font-size:10px; font-weight:600; text-transform:uppercase; color:#bbb; margin:32px 0 8px 0; letter-spacing:1px;">${t.label}</h4>`;
        else listHtml += `<div class="scale-item"><div class="scale-meta"><span class="scale-role">${t.role}</span><span class="scale-specs">${t.size} / ${t.lh}</span></div><div class="scale-preview" style="font-family:'${t.font.family}'; font-weight:${t.weight}; font-size:${t.size}; line-height:${t.lh}; letter-spacing:${t.ls};">${t.text}</div></div>`;
    });
    container.innerHTML = `<div class="scale-list">${listHtml}</div>`;
}
