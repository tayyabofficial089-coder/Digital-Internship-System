// ==================== STUDENT JAVASCRIPT ====================

// ==================== API BASE ====================
const API_URL = '/api';
const token = localStorage.getItem('token');

// ==================== CHECK AUTH ====================
function checkAuth() {
    if (!token) {
        window.location.href = '../login.html';
        return false;
    }
    return true;
}

// ==================== GET USER DATA ====================
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// ==================== LOGOUT ====================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

// ==================== VIEW INTERNSHIPS ====================
async function loadInternships() {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_URL}/student/internships`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const container = document.getElementById('internshipsList');
            if (!container) return;

            if (result.data.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <h5>No Internships Available</h5>
                        <p class="text-muted">Check back later for new opportunities</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="row">';
            result.data.forEach(internship => {
                html += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <h5 class="card-title">${internship.title}</h5>
                                <p class="text-primary"><i class="fas fa-building"></i> ${internship.companyName}</p>
                                <p class="text-muted"><i class="fas fa-map-marker-alt"></i> ${internship.location || 'Remote'}</p>
                                <p class="text-muted"><i class="fas fa-money-bill"></i> ${internship.stipend || 'Unpaid'}</p>
                                <p class="text-muted"><i class="fas fa-calendar"></i> Deadline: ${new Date(internship.deadline).toLocaleDateString()}</p>
                                ${internship.hasApplied ? 
                                    `<span class="badge badge-success">Applied</span>` :
                                    `<button class="btn btn-primary btn-sm" onclick="applyForInternship(${internship.id})">Apply Now</button>`
                                }
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error loading internships:', error);
        showAlert('Failed to load internships', 'danger');
    }
}

// ==================== APPLY FOR INTERNSHIP ====================
async function applyForInternship(internshipId) {
    if (!checkAuth()) return;

    // Show modal or form
    const cvInput = document.createElement('input');
    cvInput.type = 'file';
    cvInput.accept = '.pdf,.doc,.docx';
    cvInput.onchange = async function() {
        const formData = new FormData();
        formData.append('cv', this.files[0]);
        formData.append('coverLetter', document.getElementById('coverLetter')?.value || '');

        try {
            const response = await fetch(`${API_URL}/student/apply/${internshipId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showAlert('Application submitted successfully!', 'success');
                loadInternships();
            } else {
                showAlert(result.message, 'danger');
            }
        } catch (error) {
            console.error('Error applying:', error);
            showAlert('Failed to apply', 'danger');
        }
    };
    cvInput.click();
}

// ==================== VIEW APPLICATIONS ====================
async function loadApplications() {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_URL}/student/applications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const container = document.getElementById('applicationsList');
            if (!container) return;

            if (result.data.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                        <h5>No Applications</h5>
                        <p class="text-muted">You haven't applied for any internship yet</p>
                        <a href="internships.html" class="btn btn-primary">Browse Internships</a>
                    </div>
                `;
                return;
            }

            let html = '<div class="table-responsive"><table class="table">';
            html += `
                <thead>
                    <tr>
                        <th>Internship</th>
                        <th>Company</th>
                        <th>Applied Date</th>
                        <th>Status</th>
                        <th>Action</th>
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
                        <td>${app.internshipTitle}</td>
                        <td>${app.companyName}</td>
                        <td>${new Date(app.appliedDate).toLocaleDateString()}</td>
                        <td><span class="badge ${statusClass}">${app.status.toUpperCase()}</span></td>
                        <td>
                            ${app.status === 'shortlisted' ? 
                                `<button class="btn btn-primary btn-sm" onclick="viewInterviewDetails(${app.id})">View Interview</button>` :
                                app.status === 'pending' ? 
                                    `<span class="text-muted">Waiting for response</span>` : ''
                            }
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

// ==================== VIEW INTERVIEW DETAILS ====================
async function viewInterviewDetails(applicationId) {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_URL}/student/interview/${applicationId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const data = result.data;
            
            // Check if modal exists, else create it
            let modal = document.getElementById('interviewModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'interviewModal';
                modal.className = 'modal fade';
                modal.innerHTML = `
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Interview Details</h5>
                                <button type="button" class="btn-close" onclick="closeInterviewModal()"></button>
                            </div>
                            <div class="modal-body" id="interviewModalBody">
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="closeInterviewModal()">Close</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            const body = document.getElementById('interviewModalBody');
            body.innerHTML = `
                <p><strong>Date:</strong> ${new Date(data.interviewDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${data.interviewTime}</p>
                <p><strong>Mode:</strong> <span class="badge bg-info">${data.interviewMode}</span></p>
                ${data.interviewMode === 'online' && data.meetingLink ? `<p><strong>Link:</strong> <a href="${data.meetingLink}" target="_blank">Join Meeting</a></p>` : ''}
                ${data.status ? `<p><strong>Status:</strong> ${data.status.toUpperCase()}</p>` : ''}
            `;

            modal.style.display = 'block';
            modal.classList.add('show');
            
            // Add a simple backdrop
            let backdrop = document.getElementById('modal-backdrop');
            if(!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'modal-backdrop';
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        } else {
            showAlert(result.message || 'Interview details not available yet', 'info');
        }
    } catch (error) {
        console.error('Error fetching interview details:', error);
        showAlert('Failed to load interview details', 'danger');
    }
}

function closeInterviewModal() {
    const modal = document.getElementById('interviewModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

// ==================== VIEW TASKS ====================
async function loadTasks() {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_URL}/student/tasks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const container = document.getElementById('tasksList');
            if (!container) return;

            if (result.data.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-tasks fa-3x text-muted mb-3"></i>
                        <h5>No Tasks Assigned</h5>
                        <p class="text-muted">Your supervisor hasn't assigned any tasks yet</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="row">';
            result.data.forEach(task => {
                const statusClass = task.status === 'pending' ? 'badge-warning' :
                                   task.status === 'in_progress' ? 'badge-info' :
                                   task.status === 'completed' ? 'badge-success' : 'badge-danger';
                
                html += `
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">${task.title}</h5>
                                <p class="text-muted">${task.description}</p>
                                <p><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleDateString()}</p>
                                <p><span class="badge ${statusClass}">${task.status.toUpperCase()}</span></p>
                                ${task.status !== 'completed' ? 
                                    `<button class="btn btn-primary btn-sm" onclick="uploadProgress(${task.id})">Upload Progress</button>` :
                                    ''
                                }
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showAlert('Failed to load tasks', 'danger');
    }
}

// ==================== UPLOAD PROGRESS ====================
function uploadProgress(taskId) {
    window.location.href = `progress.html?taskId=${taskId}`;
}

function createProgressModal() {
    const modal = document.createElement('div');
    modal.id = 'progressModal';
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Upload Learning Progress</h5>
                    <button type="button" class="close" onclick="document.getElementById('progressModal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="progressForm">
                        <input type="hidden" id="taskId">
                        <div class="mb-3">
                            <label class="form-label">Week Number</label>
                            <input type="number" class="form-control" id="weekNumber" required min="1">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Title</label>
                            <input type="text" class="form-control" id="progressTitle" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="progressDescription" rows="3" required></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Attach File (Optional)</label>
                            <input type="file" class="form-control" id="progressFile" accept=".pdf,.doc,.docx,.png,.jpg">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('progressModal').style.display='none'">Cancel</button>
                    <button class="btn btn-primary" onclick="submitProgress()">Submit</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

async function submitProgress() {
    const taskId = document.getElementById('taskId').value;
    const weekNumber = document.getElementById('weekNumber').value;
    const title = document.getElementById('progressTitle').value;
    const description = document.getElementById('progressDescription').value;
    const file = document.getElementById('progressFile').files[0];

    if (!weekNumber || !title || !description) {
        showAlert('Please fill all required fields', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('weekNumber', weekNumber);
    formData.append('title', title);
    formData.append('description', description);
    if (file) {
        formData.append('file', file);
    }

    try {
        const response = await fetch(`${API_URL}/student/progress`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Progress uploaded successfully!', 'success');
            document.getElementById('progressModal').style.display = 'none';
            loadTasks();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error uploading progress:', error);
        showAlert('Failed to upload progress', 'danger');
    }
}

// ==================== VIEW FEEDBACK ====================
async function loadFeedback() {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_URL}/student/feedback`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const container = document.getElementById('feedbackList');
            if (!container) return;

            if (result.data.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-comment fa-3x text-muted mb-3"></i>
                        <h5>No Feedback Yet</h5>
                        <p class="text-muted">Your supervisor will provide feedback on your progress</p>
                    </div>
                `;
                return;
            }

            let html = '';
            result.data.forEach(fb => {
                const stars = '★'.repeat(fb.rating || 0) + '☆'.repeat(5 - (fb.rating || 0));
                html += `
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <h6><strong>${fb.supervisorName}</strong></h6>
                                <span class="text-warning">${stars}</span>
                            </div>
                            <p class="text-muted">Week ${fb.weekNumber}: ${fb.progressTitle}</p>
                            <p>${fb.feedbackText}</p>
                            <small class="text-muted">${new Date(fb.createdAt).toLocaleDateString()}</small>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
        showAlert('Failed to load feedback', 'danger');
    }
}

// ==================== SHOW ALERT ====================
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert">&times;</button>
    `;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
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
    // Load data based on page
    if (document.getElementById('internshipsList')) {
        loadInternships();
    }
    if (document.getElementById('applicationsList')) {
        loadApplications();
    }
    if (document.getElementById('tasksList')) {
        loadTasks();
    }
    if (document.getElementById('feedbackList')) {
        loadFeedback();
    }

    // Setup logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});
