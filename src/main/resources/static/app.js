// ===== STATE =====
const API_BASE = '/employees';
let allEmployees = [];
let editMode = false;

// ===== AVATAR COLORS =====
const avatarColors = [
    'linear-gradient(135deg, #6366f1, #4f46e5)',
    'linear-gradient(135deg, #a78bfa, #7c3aed)',
    'linear-gradient(135deg, #34d399, #059669)',
    'linear-gradient(135deg, #60a5fa, #2563eb)',
    'linear-gradient(135deg, #f472b6, #db2777)',
    'linear-gradient(135deg, #fbbf24, #d97706)',
    'linear-gradient(135deg, #fb923c, #ea580c)',
    'linear-gradient(135deg, #2dd4bf, #0d9488)',
];

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

// ===== API CALLS =====
async function fetchEmployees() {
    try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error('API error');
        allEmployees = await res.json();
        setApiStatus('connected');
        updateUI();
    } catch (err) {
        setApiStatus('error');
        showToast('Failed to connect to API', 'error');
    }
}

async function addEmployeeAPI(employee) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee),
    });
    if (!res.ok) throw new Error('Failed to add');
    return await res.json();
}

async function updateEmployeeAPI(id, employee) {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee),
    });
    if (!res.ok) throw new Error('Failed to update');
    return await res.json();
}

async function deleteEmployeeAPI(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete');
}

// ===== UI UPDATES =====
function updateUI() {
    updateStats();
    updateDeptChips();
    renderTable(getFilteredEmployees());
}

function updateStats() {
    document.getElementById('totalEmployees').textContent = allEmployees.length;

    const depts = new Set(allEmployees.map(e => e.department));
    document.getElementById('totalDepts').textContent = depts.size;

    const avg = allEmployees.length > 0
        ? Math.round(allEmployees.reduce((s, e) => s + e.salary, 0) / allEmployees.length)
        : 0;
    document.getElementById('avgSalary').textContent = '₹' + avg.toLocaleString('en-IN');

    const max = allEmployees.length > 0
        ? Math.max(...allEmployees.map(e => e.salary))
        : 0;
    document.getElementById('maxSalary').textContent = '₹' + max.toLocaleString('en-IN');
}

function updateDeptChips() {
    const container = document.getElementById('filterChips');
    const depts = [...new Set(allEmployees.map(e => e.department))].sort();

    // Preserve active filter
    const activeChip = container.querySelector('.chip-active');
    const activeDept = activeChip ? activeChip.dataset.dept : 'all';

    container.innerHTML = `<button class="chip ${activeDept === 'all' ? 'chip-active' : ''}" data-dept="all" onclick="filterByDept('all', this)">All</button>`;

    depts.forEach(dept => {
        const isActive = activeDept === dept ? 'chip-active' : '';
        container.innerHTML += `<button class="chip ${isActive}" data-dept="${dept}" onclick="filterByDept('${dept}', this)">${dept}</button>`;
    });
}

function getFilteredEmployees() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const activeChip = document.querySelector('.chip-active');
    const activeDept = activeChip ? activeChip.dataset.dept : 'all';

    return allEmployees.filter(emp => {
        const matchesSearch = !search ||
            emp.name.toLowerCase().includes(search) ||
            emp.department.toLowerCase().includes(search) ||
            String(emp.id).includes(search);

        const matchesDept = activeDept === 'all' || emp.department === activeDept;

        return matchesSearch && matchesDept;
    });
}

function renderTable(employees) {
    const tbody = document.getElementById('employeeTableBody');
    const emptyState = document.getElementById('emptyState');
    const tableWrapper = document.querySelector('.table-wrapper');
    const tableCount = document.getElementById('tableCount');

    tableCount.textContent = employees.length + ' employee' + (employees.length !== 1 ? 's' : '');

    if (employees.length === 0) {
        tbody.innerHTML = '';
        tableWrapper.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    tableWrapper.classList.remove('hidden');
    emptyState.classList.add('hidden');

    tbody.innerHTML = employees.map((emp, i) => `
        <tr style="animation: rowIn 0.3s ease-out ${i * 0.04}s both;">
            <td><span style="color: var(--text-muted); font-weight: 500;">#${emp.id}</span></td>
            <td>
                <div class="emp-name-cell">
                    <div class="emp-avatar" style="background: ${getAvatarColor(emp.name)}">${getInitials(emp.name)}</div>
                    <span class="emp-name">${escapeHtml(emp.name)}</span>
                </div>
            </td>
            <td><span class="dept-badge">${escapeHtml(emp.department)}</span></td>
            <td><span class="salary-cell">₹${emp.salary.toLocaleString('en-IN')}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon edit" title="Edit" onclick="openEditModal(${emp.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon delete" title="Delete" onclick="confirmDelete(${emp.id}, '${escapeHtml(emp.name)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== FILTERS =====
function filterEmployees() {
    renderTable(getFilteredEmployees());
}

function filterByDept(dept, btn) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip-active'));
    btn.classList.add('chip-active');
    filterEmployees();
}

// ===== MODAL =====
function openModal() {
    editMode = false;
    document.getElementById('modalTitle').textContent = 'Add Employee';
    document.getElementById('formSubmitBtn').textContent = 'Add Employee';
    document.getElementById('employeeForm').reset();
    document.getElementById('empEditId').value = '';
    document.getElementById('empId').disabled = false;
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('empId').focus();
}

function openEditModal(id) {
    const emp = allEmployees.find(e => e.id === id);
    if (!emp) return;

    editMode = true;
    document.getElementById('modalTitle').textContent = 'Edit Employee';
    document.getElementById('formSubmitBtn').textContent = 'Save Changes';
    document.getElementById('empEditId').value = id;
    document.getElementById('empId').value = emp.id;
    document.getElementById('empId').disabled = true;
    document.getElementById('empName').value = emp.name;
    document.getElementById('empDept').value = emp.department;
    document.getElementById('empSalary').value = emp.salary;
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('empName').focus();
}

function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const employee = {
        id: parseInt(document.getElementById('empId').value),
        name: document.getElementById('empName').value.trim(),
        department: document.getElementById('empDept').value.trim(),
        salary: parseFloat(document.getElementById('empSalary').value),
    };

    try {
        if (editMode) {
            const editId = document.getElementById('empEditId').value;
            await updateEmployeeAPI(editId, employee);
            showToast(`${employee.name} updated successfully`, 'success');
        } else {
            await addEmployeeAPI(employee);
            showToast(`${employee.name} added successfully`, 'success');
        }

        closeModal();
        await fetchEmployees();
    } catch (err) {
        showToast('Operation failed. Please try again.', 'error');
    }
}

// ===== DELETE =====
async function confirmDelete(id, name) {
    if (!confirm(`Delete ${name}? This action cannot be undone.`)) return;

    try {
        await deleteEmployeeAPI(id);
        showToast(`${name} deleted`, 'info');
        await fetchEmployees();
    } catch (err) {
        showToast('Delete failed. Please try again.', 'error');
    }
}

// ===== STATUS =====
function setApiStatus(status) {
    const el = document.getElementById('apiStatus');
    el.className = 'nav-status ' + status;
    const text = el.querySelector('.status-text');
    if (status === 'connected') text.textContent = 'API Connected';
    else if (status === 'error') text.textContent = 'API Error';
    else text.textContent = 'Connecting...';
}

// ===== TOAST =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>',
        error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };

    toast.innerHTML = (icons[type] || icons.info) + `<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ===== UTILS =====
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ===== INIT =====
fetchEmployees();
