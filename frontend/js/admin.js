// ==================== ADMIN JAVASCRIPT ====================

const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

function checkAuth() {
    if (!token) {
        window.location.href = '../login.html';
        return false;
    }
    return true;
}

function getUser() {
    return JSON.parse(localStorage.getItem('user') || '{}');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

// ==================== LOAD USERS ====================
async function loadUsers() {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
            // Update stats
            if (document.getElementById('stats')) {
                document.getElementById('stats').innerHTML = `
                    <div class="row mt-4">
                        <div class="col-md-2"><div class="stat-card"><div class="number">${result.stats.total}</div><div class="label">Total Users</div></div></div>
                        <div class="col-md-2"><div class="stat-card"><div class="number">${result.stats.students}</div><div class="label">Students</div></div></div>
                        <div class="col-md-2"><div class="stat-card"><div class="number">${result.stats.companyHR}</div><div class="label">Companies</div></div></div>
                        <div class="col-md-2"><div class="stat-card"><div class="number">${result.stats.supervisors}</div><div class="label">Supervisors</div></div></div>
                        <div class="col-md-2"><div class="stat-card"><div class="number">${result.stats.pending}</div><div class="label">Pending</div></div></div>
                        <div class="col-md-2"><div class="stat-card"><div class="number">${result.stats.blocked}</div><div class="label">Blocked</div></div></div>
                    </div>
                `;
            }

            const container = document.getElementById('usersList');
            if (!container) return;

            if (result.data.length === 0) {
                container.innerHTML = '<div class="text-center p-4"><h5>No users found</h5></div>';
                return;
            }

            let html = '<div class="table-responsive"><table class="table">';
            html += `
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
            `;

            result.data.forEach(user => {
                if (user.role === 'admin') {
                    html += `
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td><span class="badge badge-danger">${user.role.toUpperCase()}</span></td>
                            <td><span class="badge badge-success">${user.status.toUpperCase()}</span></td>
                            <td><span class="text-muted">Admin - Cannot manage</span></td>
                        </tr>
                    `;
                } else {
                    const statusClass = user.status === 'approved' ? 'badge-success' :
                                       user.status === 'pending' ? 'badge-warning' :
                                       user.status === 'blocked' ? 'badge-danger' : 'badge-secondary';
                    
                    html += `
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td><span class="badge badge-info">${user.role.toUpperCase()}</span></td>
                            <td><span class="badge ${statusClass}">${user.status.toUpperCase()}</span></td>
                            <td>
                                ${user.status === 'pending' ? 
                                    `<button class="btn btn-success btn-sm" onclick="approveUser(${user.id})">Approve</button>
                                     <button class="btn btn-danger btn-sm" onclick="rejectUser(${user.id})">Reject</button>` :
                                    user.status === 'approved' ?
                                        `<button class="btn btn-danger btn-sm" onclick="blockUser(${user.id})">Block</button>
                                         <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Delete</button>` :
                                        user.status === 'blocked' ?
                                            `<button class="btn btn-success btn-sm" onclick="unblockUser(${user.id})">Unblock</button>
                                             <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Delete</button>` :
                                            user.status === 'rejected' ?
                                                `<button class="btn btn-success btn-sm" onclick="approveUser(${user.id})">Approve</button>
                                                 <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Delete</button>` :
                                                `<button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Delete</button>`
                                }
                            </td>
                        </tr>
                    `;
                }
            });

            html += '</tbody></table></div>';
            container.innerHTML = html;
        } else {
            showAlert(result.message || 'Failed to load users', 'danger');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Failed to load users', 'danger');
    }
}

// ==================== USER ACTIONS ====================
async function approveUser(userId) {
    if (!confirm('Approve this user?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            showAlert(result.message, 'success');
            loadUsers();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error approving user:', error);
        showAlert('Failed to approve user', 'danger');
    }
}

function rejectUser(userId) {
    // Create modal dynamically
    const modalHtml = `
        <div class="modal fade" id="rejectModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Reject User</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Reason for rejection <span class="text-danger">*</span></label>
                            <textarea class="form-control" id="rejectReason" rows="3" required></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirmRejectBtn">Reject</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Append to body if not exists
    let oldModal = document.getElementById('rejectModal');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const rejectModal = new bootstrap.Modal(document.getElementById('rejectModal'));
    rejectModal.show();
    
    document.getElementById('confirmRejectBtn').addEventListener('click', async () => {
        const reason = document.getElementById('rejectReason').value.trim();
        if (!reason) {
            showAlert('Reason is required', 'warning');
            return;
        }
        
        rejectModal.hide();
        
        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });

            const result = await response.json();
            if (result.success) {
                showAlert(result.message, 'success');
                loadUsers();
            } else {
                showAlert(result.message, 'danger');
            }
        } catch (error) {
            console.error('Error rejecting user:', error);
            showAlert('Failed to reject user', 'danger');
        }
    });
}

async function blockUser(userId) {
    if (!confirm('Block this user?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/block`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            showAlert(result.message, 'success');
            loadUsers();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error blocking user:', error);
        showAlert('Failed to block user', 'danger');
    }
}

async function unblockUser(userId) {
    if (!confirm('Unblock this user?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/unblock`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            showAlert(result.message, 'success');
            loadUsers();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error unblocking user:', error);
        showAlert('Failed to unblock user', 'danger');
    }
}

async function deleteUser(userId) {
    if (!confirm('Permanently delete this user? This cannot be undone!')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            showAlert(result.message, 'success');
            loadUsers();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Failed to delete user', 'danger');
    }
}

// ==================== VERIFY INTERNSHIPS ====================
async function loadInternshipsForVerification() {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_URL}/admin/internships/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
            const container = document.getElementById('internshipsList');
            if (!container) return;

            if (result.data.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                        <h5>No Internships Pending Verification</h5>
                        <p class="text-muted">All internships have been verified</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="list-group">';
            result.data.forEach(internship => {
                html += `
                    <div class="list-group-item">
                        <h5>${internship.title}</h5>
                        <p><strong>Company:</strong> ${internship.companyName}</p>
                        <p><strong>Students:</strong> ${internship.students.length} assigned</p>
                        <button class="btn btn-primary" onclick="verifyInternship(${internship.id})">Verify Completion</button>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading internships:', error);
        showAlert('Failed to load internships', 'danger');
    }
}

async function verifyInternship(internshipId) {
    if (!confirm('Verify this internship as completed?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/internships/${internshipId}/verify`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            showAlert(result.message, 'success');
            loadInternshipsForVerification();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error verifying internship:', error);
        showAlert('Failed to verify internship', 'danger');
    }
}

// ==================== GENERATE REPORTS ====================
async function generateReport(type) {
    try {
        const response = await fetch(`${API_URL}/admin/reports/${type}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
            const container = document.getElementById('reportContent');
            if (!container) return;

            let html = `<h4>${result.title}</h4>`;
            html += `<p><small>Generated: ${new Date(result.generatedAt).toLocaleString()}</small></p>`;
            
            // Format data nicely
            let dataHtml = '<pre class="bg-light p-3 rounded" style="white-space:pre-wrap;word-wrap:break-word;">';
            dataHtml += JSON.stringify(result.data, null, 2);
            dataHtml += '</pre>';
            
            html += dataHtml;
            container.innerHTML = html;
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showAlert('Failed to generate report', 'danger');
    }
}

// ==================== SHOW ALERT ====================
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer') || createAlertContainer();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `${message} <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>`;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alertContainer';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:400px;';
    document.body.appendChild(container);
    return container;
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('usersList')) {
        loadUsers();
    }
    if (document.getElementById('internshipsList')) {
        loadInternshipsForVerification();
    }

    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});