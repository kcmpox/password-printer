let cardSendoEditado = null;

function importar() {
  const input = document.getElementById('inputArquivo');
  const arquivo = input.files[0];
  const leitor = new FileReader();
  leitor.onload = (e) => {
    const dados = JSON.parse(e.target.result);
    dados.forEach((item) =>
      criarCard(
        item.dominio,
        item.site,
        item.usuario,
        item.email,
        item.senha,
        item.secretKey,
        item.codes,
        item.notes,
      ),
    );
    // desativa o input de arquivo e o botão de importar após uma importação bem-sucedida
    try {
      const inputEl = document.getElementById('inputArquivo');
      if (inputEl) inputEl.disabled = true;
      const importBtn = document.getElementById('btnImportar');
      if (importBtn) importBtn.disabled = true;
    } catch (err) {
      // não bloquear execução em caso de erro ao desativar elementos
    }
  };
  leitor.readAsText(arquivo);
}

document.getElementById('inputArquivo').addEventListener('change', importar);

function criarCard(
  dominio,
  site,
  usuario,
  email,
  senha,
  secretKey,
  codes,
  notes,
) {
  const div = document.createElement('div');
  div.className = 'card';
  // armazenar dados originais no dataset para edição posterior
  div.dataset.dominio = dominio || '';
  div.dataset.site = site || '';
  div.dataset.usuario = usuario || '';
  div.dataset.email = email || '';
  div.dataset.senha = senha || '';
  div.dataset.secretKey = secretKey || '';
  try {
    div.dataset.codes = JSON.stringify(codes || []);
  } catch (e) {
    div.dataset.codes = JSON.stringify([]);
  }
  div.dataset.notes = notes || '';
  // determinar presença de conteúdo nas colunas
  const leftHasContent = [usuario, email, senha, notes].some(
    (v) => v !== undefined && v !== null && String(v).trim() !== '',
  );
  const rightHasContent =
    secretKey !== undefined &&
    secretKey !== null &&
    String(secretKey).trim() !== '';

  const badgeHtml = rightHasContent ? `<div class="badge">2FA</div>` : '';

  const leftAttr = rightHasContent ? '' : ' style="width:100%"';
  const rightAttr = leftHasContent ? '' : ' style="width:100%"';

  const leftColumn = leftHasContent
    ? `
        <div class="col" id="col-left"${leftAttr}>
          <label class="label">Usuário / E-mail</label>
          <div class="field mono">${usuario}/${email}</div>
          <label class="label">Senha</label>
          <div class="field mono">${senha}</div>
          <label class="label">Anotações</label>
          <div class="field mono">${notes}</div>
        </div>
      `
    : '';

  const rightColumn = rightHasContent
    ? `
        <div class="col" id="col-right"${rightAttr}>

          <div class="qr-wrap">
            <div class="qr"></div>
            <div class="col">
              <label class="label">Chave secreta</label>
              <div class="field mono">${secretKey}</div>
            </div>
          </div>

          <label class="label">Códigos Únicos</label>
          <div class="field mono">${(codes || []).join('<br>')}</div>
        </div>
      `
    : '';

  div.innerHTML = `
    <div class="card-header">
      <div class="card-header-icon">
      <img class="icon" src="https://raw.githubusercontent.com/kcmpox/password-printer/refs/heads/main/assets/icons/${dominio}.svg" alt=" " class="card-icon">
      <button onclick="abrirModal(this)">Editar</button>
      </div>

      <div class="card-header-text">
        <div class="service">${site}</div>
        ${badgeHtml}
      </div>

      <div class="row">
        ${leftColumn}
        ${rightColumn}
      </div>
    </div>
    `;
  document.getElementById('container-cards').appendChild(div);

  if (rightHasContent) {
    const qrContainer = div.querySelector('.qr');
    const otpauth = `otpauth://totp/${encodeURIComponent(site)}:${encodeURIComponent(usuario || '')}?secret=${encodeURIComponent(secretKey)}&issuer=${encodeURIComponent(site)}`;

    new QRCode(qrContainer, {
      text: otpauth,
      width: 160,
      height: 160,
    });
  }
}

function abrirModal(botao) {
  const card = botao.closest('.card');
  if (!card) return;
  cardSendoEditado = card;

  document.getElementById('editDominio').value = card.dataset.dominio || '';
  document.getElementById('editSite').value = card.dataset.site || '';
  document.getElementById('editUsuario').value = card.dataset.usuario || '';
  document.getElementById('editEmail').value = card.dataset.email || '';
  document.getElementById('editSenha').value = card.dataset.senha || '';
  document.getElementById('editSecretKey').value =
    card.dataset.secretKey || '';
  try {
    const codes = JSON.parse(card.dataset.codes || '[]');
    document.getElementById('editCodes').value = (codes || []).join('\n');
  } catch (e) {
    document.getElementById('editCodes').value = '';
  }
  document.getElementById('editNotes').value = card.dataset.notes || '';

  document.getElementById('meuModal').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('meuModal').style.display = 'none';
  cardSendoEditado = null;
}

function salvarEdicao() {
  if (!cardSendoEditado) return;

  const dominio = document.getElementById('editDominio').value.trim();
  const site = document.getElementById('editSite').value.trim();
  const usuario = document.getElementById('editUsuario').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const senha = document.getElementById('editSenha').value.trim();
  const secretKey = document.getElementById('editSecretKey').value.trim();
  const codesRaw = document.getElementById('editCodes').value || '';
  const codes = codesRaw
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s !== '');
  const notes = document.getElementById('editNotes').value.trim();

  // remover card antigo e recriar com novos valores
  try {
    cardSendoEditado.remove();
  } catch (e) {}

  criarCard(dominio, site, usuario, email, senha, secretKey, codes, notes);
  fecharModal();
}
