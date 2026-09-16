// ==================== COMPANY JAVASCRIPT ====================

const API_URL = '/api';
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

// ==================== POST INTERNSHIP ====================
async function postInternship() {
    const title = document.getElementById('title')?.value;
    const description = document.getElementById('description')?.value;
    const requirements = document.getElementById('requirements')?.value;
    const location = document.getElementById('location')?.value;
    const duration = document.getElementById('duration')?.value;
    const stipend = document.getElementById('stipend')?.value;
    const positionsAvailable = document.getElementById('positions')?.value;
    const deadline = document.getElementById('deadline')?.value;

    if (!title || !description || !deadline) {
        showAlert('Title, description and deadline are required', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/company/internship`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title, description, requirements, location,
                duration, stipend, positionsAvailable, deadline
            })
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Internship posted successfully!', 'success');
            document.getElementById('postForm')?.reset();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error posting internship:', error);
        showAlert('Failed to post internship', 'danger');
    }
}

// ==================== LOAD APPLICATIONS ====================
async function loadApplications() {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_URL}/company/applications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
            const container = document.getElementById('applicationsList');
            if (!container) return;

            if (result.data.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <h5>No Applications</h5>
                        <p class="text-muted">No students have applied to your internships yet</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="table-responsive"><table class="table">';
            html += `
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Roll No</th>
                        <th>Internship</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
            `;

            result.data.forEach(app => {
                const statusClass = app.status === 'pending' ? 'badge-warning' :
                                   app.status === 'shortlisted' ? 'badge-info' :
                                   app.status === 'selected' ? 'badge-success' : 'badge-danger';
                
                html += `
                    <tr>
                        <td>${app.studentName}</td>
                        <td>${app.studentRollNumber}</td>
                        <td>${app.internshipTitle}</td>
                        <td><span class="badge ${statusClass}">${app.status.toUpperCase()}</span></td>
                        <td>
                            ${app.status === 'pending' ? 
                                `<button class="btn btn-primary btn-sm" onclick="shortlistStudent(${app.id})">Shortlist</button>` :
                                app.status === 'shortlisted' ? 
                                    `<button class="btn btn-info btn-sm" onclick="showScheduleInterview(${app.id})">Schedule Interview</button>` :
                                    app.status === 'selected' ?
                                        `<button class="btn btn-success btn-sm" onclick="assignSupervisor(${app.id}, ${app.studentId})">Assign Supervisor</button>` :
                                        ''
                            }
                            <button class="btn btn-secondary btn-sm" onclick="viewApplicationDetails(${app.id})">View</button>
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading applications:', error);
        showAlert('Failed to load applications', 'danger');
    }
}

// ==================== SHORTLIST STUDENT ====================
async function shortlistStudent(applicationId) {
    try {
        const response = await fetch(`${API_URL}/company/shortlist/${applicationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Student shortlisted successfully!', 'success');
            loadApplications();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error shortlisting:', error);
        showAlert('Failed to shortlist student', 'danger');
    }
}

// ==================== SCHEDULE INTERVIEW ====================
function showScheduleInterview(applicationId) {
    window.location.href = `interview.html?id=${applicationId}`;
}


// ==================== ASSIGN SUPERVISOR ====================
async function assignSupervisor(applicationId, studentId) {
    if (!checkAuth()) return;

    try {
        // Fetch supervisors
        const response = await fetch(`${API_URL}/company/supervisors`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            let modal = document.getElementById('assignSupervisorModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'assignSupervisorModal';
                modal.className = 'modal fade';
                document.body.appendChild(modal);
            }

            let supervisorOptions = '<option value="">Select a Supervisor</option>';
            result.data.forEach(sup => {
                supervisorOptions += `<option value="${sup.id}">${sup.name} (${sup.designation})</option>`;
            });

            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Assign Supervisor</h5>
                            <button type="button" class="btn-close" onclick="closeAssignSupervisorModal()"></button>
                        </div>
                        <div class="modal-body">
                            <input type="hidden" id="assignStudentId" value="${studentId}">
                            <input type="hidden" id="assignApplicationId" value="${applicationId}">
                            <div class="mb-3">
                                <label class="form-label">Select Supervisor</label>
                                <select class="form-select" id="assignSupervisorId" required>
                                    ${supervisorOptions}
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="closeAssignSupervisorModal()">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="submitAssignSupervisor()">Assign</button>
                        </div>
                    </div>
                </div>
            `;

            modal.style.display = 'block';
            modal.classList.add('show');

            let backdrop = document.getElementById('modal-backdrop');
            if(!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'modal-backdrop';
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        }
    } catch (error) {
        console.error('Error fetching supervisors:', error);
        showAlert('Failed to load supervisors', 'danger');
    }
}

function closeAssignSupervisorModal() {
    const modal = document.getElementById('assignSupervisorModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) backdrop.remove();
}

async function submitAssignSupervisor() {
    const studentId = document.getElementById('assignStudentId').value;
    const supervisorId = document.getElementById('assignSupervisorId').value;
    const applicationId = document.getElementById('assignApplicationId').value;

    if (!supervisorId) {
        showAlert('Please select a supervisor', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/company/assign-supervisor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                studentId: parseInt(studentId),
                supervisorId: parseInt(supervisorId),
                applicationId: parseInt(applicationId)
            })
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Supervisor assigned successfully!', 'success');
            closeAssignSupervisorModal();
            loadApplications();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error assigning supervisor:', error);
        showAlert('Failed to assign supervisor', 'danger');
    }
}

// ==================== LOAD SUPERVISORS ====================
async function loadSupervisors() {
    try {
        const response = await fetch(`${API_URL}/company/supervisors`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
            const select = document.getElementById('supervisorSelect');
            if (select) {
                select.innerHTML = '<option value="">Select Supervisor</option>';
                result.data.forEach(sup => {
                    select.innerHTML += `<option value="${sup.id}">${sup.name} - ${sup.designation}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error loading supervisors:', error);
    }
}

// ==================== SHOW ALERT ====================
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer') || createAlertContainer();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `${message} <button class="close" data-dismiss="alert">&times;</button>`;
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
    if (document.getElementById('applicationsList')) {
        loadApplications();
    }
    if (document.getElementById('supervisorSelect')) {
        loadSupervisors();
    }

    // Post internship form
    document.getElementById('postBtn')?.addEventListener('click', postInternship);

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});
