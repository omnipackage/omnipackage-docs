(async () => {
  const debContainer = document.getElementById('supported-distros-deb');
  const rpmContainer = document.getElementById('supported-distros-rpm');
  if (!debContainer && !rpmContainer) return;

  const SOURCE_URL = 'https://raw.githubusercontent.com/omnipackage/omnipackage-rs/master/src/distros.yml';
  const REPO_URL = 'https://github.com/omnipackage/omnipackage-rs/blob/master/src/distros.yml';

  const FAMILY_LABELS = {
    opensuse: 'openSUSE',
    almalinux: 'AlmaLinux',
    rockylinux: 'Rocky Linux',
    debian: 'Debian',
    ubuntu: 'Ubuntu',
    fedora: 'Fedora',
    mageia: 'Mageia',
  };

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const familyOf = (d) => (d.id || '').split('_')[0];

  const groupByFamily = (distros) => {
    const map = new Map();
    for (const d of distros) {
      const fam = familyOf(d);
      if (!map.has(fam)) map.set(fam, []);
      map.get(fam).push(d);
    }
    return map;
  };

  const renderFamilyRow = (family, items) => {
    const label = FAMILY_LABELS[family] || family;
    const stripFamily = (name) => {
      const stripped = (name || '').replace(label, '').trim();
      return stripped || name || '';
    };
    const versionSpan = (d) =>
      `<span title="${escapeHtml(d.id)}">${escapeHtml(stripFamily(d.name))}</span>`;

    const active = items.filter((d) => !d.deprecated);
    const deprecated = items.filter((d) => d.deprecated);

    const activeNames = active.map(versionSpan).join(', ');

    let cell = activeNames || '<em>none</em>';
    if (deprecated.length) {
      const lines = deprecated.map((d) => {
        const reason = typeof d.deprecated === 'string' ? ` — ${d.deprecated}` : '';
        return `${versionSpan(d)} deprecated${reason}`;
      });
      cell += `<br><small><em>${lines.join('<br>')}</em></small>`;
    }

    return `<tr>
      <td>${escapeHtml(label)}</td>
      <td>${cell}</td>
    </tr>`;
  };

  const renderTable = (distros) => {
    if (!distros.length) return '<p>No entries.</p>';
    const groups = groupByFamily(distros);
    const rows = [...groups.entries()].map(([fam, items]) => renderFamilyRow(fam, items)).join('');
    return `<table><tbody>${rows}</tbody></table>`;
  };

  const setLoading = (c) => {
    if (c) c.innerHTML = '<p><em>Loading supported distros…</em></p>';
  };
  const setError = (c) => {
    if (c) c.innerHTML = `<p>Could not load the distro list. See <a href="${REPO_URL}" target="_blank"><code>distros.yml</code></a> on GitHub.</p>`;
  };

  setLoading(debContainer);
  setLoading(rpmContainer);

  try {
    const res = await fetch(SOURCE_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = jsyaml.load(await res.text());
    const distros = data.distros || [];

    const deb = distros.filter((d) => d.package_type === 'deb');
    const rpm = distros.filter((d) => d.package_type === 'rpm');

    if (debContainer) debContainer.innerHTML = renderTable(deb);
    if (rpmContainer) rpmContainer.innerHTML = renderTable(rpm);
  } catch (err) {
    setError(debContainer);
    setError(rpmContainer);
    console.error('Failed to load distros.yml:', err);
  }
})();
