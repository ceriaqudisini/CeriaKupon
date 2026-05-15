const API_URL = 'https://script.google.com/macros/s/AKfycbydxd_MHuYxRl5b2x4uLKPnT9N63FTCzTTZ5MKqAtQ8OXUcmpTjDljbhQkfqg0dpfAf/exec';

let selectedClaim = null;
let currentMember = {
  valid: false,
  userId: '',
  fullName: '',
  totalCoupon: 0
};

function apiPost(payload){
  return fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  }).then(res => res.json());
}

function setStatus(message, color){
  const statusText = document.getElementById('statusText');
  statusText.innerHTML = message;
  statusText.style.borderColor = color || 'rgba(216,180,254,.4)';
}

function resetAfterInput(){
  currentMember = { valid:false, userId:'', fullName:'', totalCoupon:0 };
  selectedClaim = null;
  document.getElementById('displayUserId').textContent = '-';
  document.getElementById('displayCoupon').textContent = '0 Kupon';
  document.getElementById('claimSummary').style.display = 'none';
  document.querySelectorAll('.bonus-item').forEach(item => item.classList.remove('active'));
  setStatus('Silakan klik Check ID untuk validasi ulang.', 'rgba(216,180,254,.4)');
}

function verifyMemberId(){
  const input = document.getElementById('memberInputId');
  const userId = input.value.trim();

  if(!userId){
    setStatus('⚠️ Mohon masukkan User ID terlebih dahulu.', 'rgba(250,204,21,.65)');
    return;
  }

  setStatus('⏳ Sedang mengecek User ID dari database...', 'rgba(216,180,254,.4)');

  apiPost({ action:'checkId', userId })
    .then(data => {
      if(!data.success){
        currentMember = { valid:false, userId:'', fullName:'', totalCoupon:0 };
        document.getElementById('displayUserId').textContent = '-';
        document.getElementById('displayCoupon').textContent = '0 Kupon';
        setStatus('❌ <b>NOTICE:</b> User ID tidak ditemukan atau belum valid. Mohon cek kembali User ID yang dimasukkan ya kak.', 'rgba(239,68,68,.65)');
        return;
      }

      currentMember = {
        valid: true,
        userId: data.userId,
        fullName: data.fullName || '-',
        totalCoupon: Number(data.totalPoint || 0)
      };

      document.getElementById('displayUserId').textContent = currentMember.userId;
      document.getElementById('displayCoupon').textContent = currentMember.totalCoupon + ' Kupon';
      selectedClaim = null;
      document.getElementById('claimSummary').style.display = 'none';
      document.querySelectorAll('.bonus-item').forEach(item => item.classList.remove('active'));

      openInfoPopup(
        'ID Berhasil Diverifikasi',
        'Silakan lanjut memilih kupon yang tersedia.',
        '<b>Status:</b> ID Berhasil Diverifikasi<br>' +
        '<b>User ID:</b> ' + currentMember.userId + '<br>' +
        '<b>Full Name:</b> ' + currentMember.fullName + '<br>' +
        '<b>TOTAL KUPON:</b> ' + currentMember.totalCoupon + ' Kupon'
      );

      setStatus('✅ User ID berhasil diverifikasi dan kupon berhasil dimuat.', 'rgba(34,197,94,.65)');
      loadHistory();
    })
    .catch(err => {
      setStatus('⚠️ Gagal terhubung ke database. ' + err.message, 'rgba(250,204,21,.65)');
    });
}

function toggleScheme(){
  document.getElementById('schemeSlide').classList.toggle('show');
}

function selectBonus(button){
  const summary = document.getElementById('claimSummary');
  const coupon = parseInt(button.dataset.coupon, 10);
  const bonus = button.dataset.bonus;

  document.querySelectorAll('.bonus-item').forEach(item => item.classList.remove('active'));
  button.classList.add('active');

  if(!currentMember.valid){
    selectedClaim = null;
    summary.style.display = 'block';
    summary.innerHTML = '⚠️ Silakan verifikasi User ID terlebih dahulu sebelum memilih kupon.';
    setStatus('⚠️ User ID belum diverifikasi.', 'rgba(250,204,21,.65)');
    return;
  }

  if(coupon > currentMember.totalCoupon){
    selectedClaim = null;
    summary.style.display = 'block';
    summary.innerHTML = '⚠️ Kupon member belum mencukupi untuk claim <b>' + coupon + ' Kupon</b>. Total kupon tersedia hanya <b>' + currentMember.totalCoupon + ' Kupon</b>.';
    setStatus('⚠️ Pilih kupon sesuai total kupon tersedia.', 'rgba(250,204,21,.65)');
    return;
  }

  selectedClaim = { coupon, bonus, reward:'KUPON DEPOSIT CERIA' };

  summary.style.display = 'block';
  summary.innerHTML = '<b>Kupon yang akan diclaim:</b> ' + coupon + ' Kupon<br><b>Estimasi Bonus:</b> ' + bonus + '<br><b>Jenis Hadiah:</b> KUPON DEPOSIT CERIA';
  setStatus('✅ Kupon sudah dipilih. Silakan klik Setujui untuk melanjutkan.', 'rgba(34,197,94,.65)');
}

function openConfirmPopup(){
  if(!currentMember.valid){
    setStatus('⚠️ Silakan verifikasi User ID terlebih dahulu.', 'rgba(250,204,21,.65)');
    return;
  }

  if(!selectedClaim){
    setStatus('⚠️ Silakan pilih salah satu kupon terlebih dahulu.', 'rgba(250,204,21,.65)');
    return;
  }

  const contact = document.getElementById('contact').value || '-';
  const note = document.getElementById('note').value || '-';

  document.getElementById('modalTitle').textContent = 'Rincian Claim Kupon';
  document.getElementById('modalDesc').textContent = 'Mohon cek kembali data claim sebelum disetujui.';
  document.getElementById('modalDetail').innerHTML =
    '<div class="claim-detail-list">' +
      '<div class="claim-detail-row"><label>User ID</label><span>' + currentMember.userId + '</span></div>' +
      '<div class="claim-detail-row"><label>Full Name</label><span>' + currentMember.fullName + '</span></div>' +
      '<div class="claim-detail-row"><label>Total Kupon</label><span>' + currentMember.totalCoupon + ' Kupon</span></div>' +
      '<div class="claim-detail-row highlight"><label>Kupon Claim</label><span>' + selectedClaim.coupon + ' Kupon</span></div>' +
      '<div class="claim-detail-row"><label>Jenis Hadiah</label><span>' + selectedClaim.reward + '</span></div>' +
      '<div class="claim-detail-row highlight"><label>Nominal Bonus</label><span>' + selectedClaim.bonus + '</span></div>' +
      '<div class="claim-detail-row"><label>Kontak Aktif</label><span>' + contact + '</span></div>' +
      '<div class="claim-detail-row"><label>Catatan</label><span>' + note + '</span></div>' +
    '</div>';
  document.getElementById('modalAction').innerHTML =
    '<button type="button" class="modal-btn no" onclick="closeConfirmPopup()">No</button>' +
    '<button type="button" class="modal-btn yes" onclick="submitClaim()">Yes</button>';
  document.getElementById('confirmModal').classList.add('show');
}

function openInfoPopup(title, desc, detail){
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalDesc').textContent = desc;
  document.getElementById('modalDetail').innerHTML = detail;
  document.getElementById('modalAction').innerHTML = '<button type="button" class="modal-btn yes" onclick="closeConfirmPopup()" style="grid-column:1/3;">OK</button>';
  document.getElementById('confirmModal').classList.add('show');
}

function closeConfirmPopup(){
  document.getElementById('confirmModal').classList.remove('show');
}

function resetClaimFormAfterSuccess(){
  currentMember = { valid:false, userId:'', fullName:'', totalCoupon:0 };
  selectedClaim = null;
  document.getElementById('memberInputId').value = '';
  document.getElementById('displayUserId').textContent = '-';
  document.getElementById('displayCoupon').textContent = '0 Kupon';
  document.getElementById('contact').value = '';
  document.getElementById('note').value = '';
  document.getElementById('historyDate').value = '';
  document.getElementById('claimSummary').style.display = 'none';
  document.querySelectorAll('.bonus-item').forEach(item => item.classList.remove('active'));
  document.getElementById('historyList').innerHTML = emptyHistory('Claim sudah tersimpan. Silakan login ID kembali untuk melihat history terbaru.');
}

function submitClaim(){
  if(!currentMember.valid || !selectedClaim){
    setStatus('⚠️ Data claim belum lengkap. Silakan login ID dan pilih kupon terlebih dahulu.', 'rgba(250,204,21,.65)');
    return;
  }

  closeConfirmPopup();
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  setStatus('⏳ Sedang menyimpan claim Bonus Claim...', 'rgba(216,180,254,.4)');

  const claimData = {
    action: 'submitClaim',
    userId: currentMember.userId,
    pointClaim: selectedClaim.coupon,
    rewardType: selectedClaim.reward,
    bonusAmount: selectedClaim.bonus,
    contact: document.getElementById('contact').value || '',
    note: document.getElementById('note').value || ''
  };

  apiPost(claimData)
    .then(data => {
      submitBtn.disabled = false;

      if(!data.success){
        setStatus('❌ Claim gagal. ' + (data.message || JSON.stringify(data)), 'rgba(239,68,68,.65)');
        return;
      }

      setStatus(
        '✅ <b>Claim berhasil disimpan</b><br>' +
        'Kupon Claim: ' + claimData.pointClaim + ' Kupon<br>' +
        'Hadiah: ' + claimData.rewardType + '<br>' +
        'Nominal Bonus: ' + claimData.bonusAmount + '<br>' +
        'History claim sudah terdata di Excel.',
        'rgba(34,197,94,.65)'
      );

      setTimeout(() => {
        resetClaimFormAfterSuccess();
        setStatus('✅ Claim berhasil. Form sudah direset, silakan login ID kembali untuk claim berikutnya.', 'rgba(34,197,94,.65)');
      }, 1200);
    })
    .catch(err => {
      submitBtn.disabled = false;
      setStatus('⚠️ Gagal menyimpan ke database. ' + err.message, 'rgba(250,204,21,.65)');
    });
}

function toggleHistory(){
  const panel = document.getElementById('historyPanel');
  panel.classList.toggle('show');
  if(panel.classList.contains('show')) loadHistory();
}

function clearHistoryFilter(){
  document.getElementById('historyDate').value = '';
  loadHistory();
}

function loadHistory(){
  const historyList = document.getElementById('historyList');

  if(!currentMember.valid){
    historyList.innerHTML = emptyHistory('Silakan login ID untuk melihat riwayat claim member.');
    return;
  }

  const selectedDate = document.getElementById('historyDate').value || '';
  historyList.innerHTML = emptyHistory('⏳ Sedang mengambil history claim...');

  apiPost({ action:'history', userId: currentMember.userId, date: selectedDate })
    .then(data => {
      if(!data.success || !data.data || !data.data.length){
        historyList.innerHTML = emptyHistory('Belum ada history claim pada tanggal tersebut.');
        return;
      }

      historyList.innerHTML = data.data.map(item => `
        <div class="history-item">
          <div class="history-info">
            <strong>${item.userId || currentMember.userId} • ${item.pointClaim || '-'} KUPON</strong>
            <span>
              Hadiah: ${item.jenisHadiah || item.rewardType || 'KUPON DEPOSIT CERIA'}<br>
              Bonus: ${item.nominalBonus || item.bonus || '-'}<br>
              Sisa Kupon: ${item.sisaKupon ?? '-'}<br>
              Remarks: ${item.remarks || 'SUCCESS'}
            </span>
          </div>
          <div class="history-badge">${item.remarks || 'SUCCESS'}</div>
        </div>
      `).join('');
    })
    .catch(err => {
      historyList.innerHTML = emptyHistory('⚠️ Gagal mengambil history. ' + err.message);
    });
}

function emptyHistory(text){
  return `
    <div class="history-item">
      <div class="history-info">
        <strong>Belum ada history claim</strong>
        <span>${text}</span>
      </div>
      <div class="history-badge">EMPTY</div>
    </div>
  `;
}
