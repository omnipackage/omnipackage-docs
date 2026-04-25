(async () => {
  const debContainer = document.getElementById('supported-distros-deb');
  const rpmContainer = document.getElementById('supported-distros-rpm');
  if (!debContainer && !rpmContainer) return;

  const SOURCE_URL = 'https://raw.githubusercontent.com/omnipackage/omnipackage-rs/master/src/distros.yml';
  const REPO_URL = 'https://github.com/omnipackage/omnipackage-rs/blob/master/src/distros.yml';

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const renderRow = (d) => {
    let note = '';
    if (d.deprecated) {
      note = typeof d.deprecated === 'string'
        ? `<em>deprecated</em> — ${d.deprecated}`
        : '<em>deprecated</em>';
    }
    const pkgType = (d.package_type || '').toUpperCase();
    return `<tr>
      <td><code>${escapeHtml(d.id)}</code></td>
      <td>${escapeHtml(d.name)}</td>
      <td>${escapeHtml(pkgType)}</td>
      <td>${note}</td>
    </tr>`;
  };

  const renderTable = (items) => {
    if (!items.length) return '<p>No entries.</p>';
    return `<table>
      <thead>
        <tr>
          <th>Distro ID</th>
          <th>Display name</th>
          <th>Package type</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${items.map(renderRow).join('')}</tbody>
    </table>`;
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

    // Active entries first (preserve YAML order), deprecated at the bottom.
    const sorted = [...distros].sort((a, b) =>
      (a.deprecated ? 1 : 0) - (b.deprecated ? 1 : 0)
    );

    const deb = sorted.filter((d) => d.package_type === 'deb');
    const rpm = sorted.filter((d) => d.package_type === 'rpm');

    if (debContainer) debContainer.innerHTML = renderTable(deb);
    if (rpmContainer) rpmContainer.innerHTML = renderTable(rpm);
  } catch (err) {
    setError(debContainer);
    setError(rpmContainer);
    console.error('Failed to load distros.yml:', err);
  }
})();
