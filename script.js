const moduleData = {
  patients: {title:'Patients', kicker:'PATIENT MANAGEMENT', icon:'♡', color:'blue', description:'Register patients and search existing demo records.', columns:['Patient name','Patient ID','Details','Status'], stories:['As a receptionist, I want to register a patient so their details are stored.','As a staff member, I want to search patient records so I can find information quickly.'], records:[{name:'Arun Kumar',id:'PT-1001',detail:'General consultation',status:'Active'},{name:'Meena Ravi',id:'PT-1002',detail:'Follow-up visit',status:'Pending'},{name:'Kavin S',id:'PT-1003',detail:'Cardiology',status:'Active'}]},
  doctors: {title:'Doctors & Staff', kicker:'STAFF MANAGEMENT', icon:'⚕', color:'purple', description:'View staff roles and basic team information.', columns:['Name','Staff ID','Role / Department','Status'], stories:['As an admin, I want to register doctor and staff details so the team directory stays updated.','As a manager, I want to manage doctor and staff roles.'], records:[{name:'Dr. Priya N',id:'ST-201',detail:'Cardiology',status:'Active'},{name:'Dr. Sanjay R',id:'ST-202',detail:'General Medicine',status:'Active'},{name:'Anitha M',id:'ST-203',detail:'Nursing',status:'Pending'}]},
  rooms: {title:'Beds & Rooms', kicker:'ROOM ALLOCATION', icon:'▤', color:'green', description:'Check room availability and allocation status.', columns:['Room','Room ID','Type','Status'], stories:['As a staff member, I want to view bed and room availability so I can allocate a suitable room.','As a staff member, I want to assign a room to a patient.','As an admin, I want to search rooms by type.'], records:[{name:'Room 101',id:'RM-101',detail:'General ward',status:'Available'},{name:'Room 102',id:'RM-102',detail:'Private room',status:'Active'},{name:'Room 103',id:'RM-103',detail:'General ward',status:'Available'}]},
  laboratory: {title:'Laboratory & Tests', kicker:'LABORATORY MANAGEMENT', icon:'⚗', color:'orange', description:'Track test orders and sample collection status.', columns:['Test / Sample','Order ID','Details','Status'], stories:['As a lab technician, I want to create a laboratory test order.','As a staff member, I want to track sample status.','As a lab technician, I want to validate and confirm a test order.'], records:[{name:'Blood count',id:'LB-301',detail:'Sample collected',status:'Active'},{name:'Blood glucose',id:'LB-302',detail:'Awaiting sample',status:'Pending'},{name:'Lipid profile',id:'LB-303',detail:'Under review',status:'Needs review'}]},
  pharmacy: {title:'Pharmacy & Stock', kicker:'MEDICINE INVENTORY', icon:'▣', color:'pink', description:'Review sample medicine inventory and stock status.', columns:['Medicine / Item','Item ID','Stock details','Status'], stories:['As a pharmacy staff member, I want to add and manage medicine stock.','As a manager, I want to monitor medicine stock levels.','As an admin, I want to view stock movement and inventory reports.'], records:[{name:'Paracetamol',id:'MD-401',detail:'120 units',status:'Available'},{name:'Antiseptic solution',id:'MD-402',detail:'8 bottles',status:'Needs review'},{name:'Bandage roll',id:'MD-403',detail:'45 units',status:'Available'}]},
  billing: {title:'Billing & Payments', kicker:'FINANCIAL MANAGEMENT', icon:'₹', color:'yellow', description:'View illustrative billing and payment records.', columns:['Patient / Record','Bill ID','Details','Status'], stories:['As a billing staff member, I want to calculate a bill amount.','As a staff member, I want to generate and manage receipts.','As an admin, I want to view payment history and transaction records.'], records:[{name:'Arun Kumar',id:'BL-501',detail:'₹1,200 · Consultation',status:'Active'},{name:'Meena Ravi',id:'BL-502',detail:'₹850 · Lab tests',status:'Pending'}]}
};
let currentPage='dashboard';
async function loadPatients() {
  try {
    const response = await fetch('/api/patients');

    if (!response.ok) {
      throw new Error('Failed to load patients');
    }

    const patients = await response.json();

    moduleData.patients.records = patients.map(patient => ({
      name: patient.name,
      id: 'PT-' + String(patient.id).padStart(4, '0'),
      detail: [
        patient.age ? 'Age: ' + patient.age : '',
        patient.gender || '',
        patient.phone || ''
      ].filter(Boolean).join(' · ') || 'Patient registered',
      status: 'Active'
    }));

    if (currentPage === 'patients') {
      renderModule();
    }

    const count = document.getElementById('patient-count');

    if (count) {
      count.textContent = patients.length;
    }
  } catch (error) {
    console.error('Patient loading error:', error);
    showToast('Could not load patients from database.');
  }
}
let toastTimer;
const $=id=>document.getElementById(id);
function showToast(message){const toast=$('toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2600)}
function openPage(page){
 currentPage=page;
 document.querySelectorAll('.nav-item').forEach(btn=>btn.classList.toggle('active',btn.dataset.page===page));
 $('dashboard-page').classList.toggle('hidden',page!=='dashboard');
 $('module-page').classList.toggle('hidden',page==='dashboard');
 $('page-title').textContent=page==='dashboard'?'Dashboard':moduleData[page].title;
 if(page!=='dashboard')renderModule();
}
function renderModule(){
 const m=moduleData[currentPage];if(!m)return;
 $('module-kicker').textContent=m.kicker;$('module-heading').textContent=m.title;$('module-description').textContent=m.description;
 $('module-big-icon').textContent=m.icon;$('module-big-icon').className='module-icon '+m.color;
 $('table-head').innerHTML=m.columns.map(c=>`<th>${escapeHtml(c)}</th>`).join('');
 $('story-list').innerHTML=m.stories.map(s=>`<li>${escapeHtml(s)}</li>`).join('');
 const q=$('search-input').value.trim().toLowerCase();
 const rows=m.records.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q)));
 $('record-total').textContent=`${rows.length} record${rows.length===1?'':'s'}`;
 $('table-body').innerHTML=rows.length?rows.map(r=>`<tr><td><strong>${escapeHtml(r.name)}</strong></td><td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.detail)}</td><td><span class="pill">${escapeHtml(r.status)}</span></td></tr>`).join(''):`<tr><td class="empty" colspan="4">No matching records found.</td></tr>`;
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
document.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>openPage(btn.dataset.page)));
document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>openPage(btn.dataset.go)));
$('search-input').addEventListener('input',renderModule);
function openDialog(){
 if(currentPage==='dashboard')openPage('patients');
 $('dialog-title').textContent='Add '+moduleData[currentPage].title.replace(/s$/,'')+' record';
 $('record-form').reset();$('record-dialog').showModal();$('record-name').focus();
}
$('add-record-btn').addEventListener('click',openDialog);
$('close-dialog').addEventListener('click',()=>$('record-dialog').close());
$('cancel-dialog').addEventListener('click',()=>$('record-dialog').close());
$('record-form').addEventListener('submit', async event => {
  event.preventDefault();

  const name = $('record-name').value.trim();
  const detail = $('record-detail').value.trim();
  const status = $('record-status').value;

  if (!name) {
    showToast('Please enter a name.');
    return;
  }

  // Save patient to database
  if (currentPage === 'patients') {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          age: null,
          gender: '',
          phone: ''
        })
      });

      if (!response.ok) {
        throw new Error('Could not save patient');
      }

      await loadPatients();

      $('record-dialog').close();
      $('search-input').value = '';
      renderModule();
      showToast('Patient saved to database!');
    } catch (error) {
      console.error(error);
      showToast('Could not save patient. Check the server.');
    }

    return;
  }

  // Keep other modules working as before
  const m = moduleData[currentPage];
  const nextId = String(Date.now()).slice(-5);

  m.records.unshift({
    name: name,
    id: 'NEW-' + nextId,
    detail: detail || 'Added from website',
    status: status
  });

  $('record-dialog').close();
  $('search-input').value = '';
  renderModule();
  showToast('Record added to this demo session.');
});
$('record-dialog').addEventListener('click',event=>{if(event.target===$('record-dialog'))$('record-dialog').close()});
openPage('dashboard');
