// ==================== SUPERVISOR JAVASCRIPT ====================

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
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

// ==================== LOAD STUDENTS ====================
async function loadStudents() {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_URL}/supervisor/students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
            const container = document.getElementById('studentsList');
            if (!container) return;

            if (result.data.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <h5>No Students Assigned</h5>
                        <p class="text-muted">You haven't been assigned any students yet</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="row">';
            result.data.forEach(student => {
                html += `
                    <div class="col-md-4 mb-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">${student.name}</h5>
                                <p class="text-muted">Roll: ${student.rollNumber}</p>
                                <p class="text-muted">${student.department || 'N/A'} - Semester ${student.semester || 'N/A'}</p>
                                <p><span class="badge ${student.internshipStatus === 'active' ? 'badge-success' : 'badge-warning'}">${(student.internshipStatus || 'Pending').toUpperCase()}</span></p>
                                <button class="btn btn-primary btn-sm" onclick="viewStudentProgress(${student.id})">View Progress</button>
                                <button class="btn btn-info btn-sm" onclick="assignTask(${student.id})">Assign Task</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            showAlert(result.message || 'Failed to load students', 'danger');
        }
    } catch (error) {
        console.error('Error loading students:', error);
        showAlert('Failed to load students', 'danger');
    }
}

// ==================== ASSIGN TASK ====================
function assignTask(studentId) {
    window.location.href = `assign-task.html?studentId=${studentId}`;
}

function createTaskModal() {
    const modal = document.createElement('div');
    modal.id = 'taskModal';
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Assign Task</h5>
                    <button class="close" onclick="document.getElementById('taskModal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    <form>
                        <input type="hidden" id="taskStudentId">
                        <div class="mb-3">
                            <label class="form-label">Task Title</label>
                            <input type="text" class="form-control" id="taskTitle" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="taskDescription" rows="3" required></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Deadline</label>
                            <input type="datetime-local" class="form-control" id="taskDeadline" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('taskModal').style.display='none'">Cancel</button>
                    <button class="btn btn-primary" onclick="submitTask()">Assign</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

async function submitTask() {
    const studentId = document.getElementById('taskStudentId').value;
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const deadline = document.getElementById('taskDeadline').value;

    if (!title || !description || !deadline) {
        showAlert('All fields are required', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/supervisor/task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                studentId: parseInt(studentId),
                title,
                description,
                deadline
            })
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Task assigned successfully!', 'success');
            document.getElementById('taskModal').style.display = 'none';
            loadStudents();
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error assigning task:', error);
        showAlert('Failed to assign task', 'danger');
    }
}

// ==================== VIEW STUDENT PROGRESS ====================
function viewStudentProgress(studentId) {
    window.location.href = `feedback.html?studentId=${studentId}`;
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
    if (document.getElementById('studentsList')) {
        loadStudents();
    }

    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});