document.addEventListener("DOMContentLoaded", function () {
    loadAdminInfo();
    loadUsers();
    loadRoles();
    setActiveNavLink();
});

function setActiveNavLink() {
    const currentPath = window.location.pathname;
    document.getElementById("adminLink").classList.toggle("active", currentPath === "/admin");
    document.getElementById("userLink").classList.toggle("active", currentPath === "/user");
}

document.getElementById("usersTab").addEventListener("click", function () {
    document.getElementById("usersPanel").style.display = "block";
    document.getElementById("newUserPanel").style.display = "none";
    this.classList.add("active");
    document.getElementById("newUserTab").classList.remove("active");
});

document.getElementById("newUserTab").addEventListener("click", function () {
    document.getElementById("usersPanel").style.display = "none";
    document.getElementById("newUserPanel").style.display = "block";
    this.classList.add("active");
    document.getElementById("usersTab").classList.remove("active");
});

function loadAdminInfo() {
    fetch('/api/user')
        .then(response => response.json())
        .then(user => {
            document.getElementById("adminInfo").textContent =
                `${user.email} with roles: ${user.roles.map(role => role.name).join(", ")}`;
        })
        .catch(error => {
            document.getElementById("adminInfo").textContent = "Ошибка загрузки данных пользователя";
        });

}

function logout() {
    fetch('/logout', {method: 'POST'})
        .then(() => window.location.href = '/login')
        .catch(error => console.error("Ошибка выхода:", error));
}

function loadUsers() {
    fetch('/api/admin')
        .then(response => response.json())
        .then(users => {
            let usersTable = document.getElementById("usersTable");
            usersTable.innerHTML = "";

            users.forEach(user => {
                let roles = user.roles.map(role => role.name).join(", ");
                usersTable.innerHTML += `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${roles}</td>
                    <td><button onclick='openEditModal(${JSON.stringify(user)})' 
                    class="btn btn-primary">Edit</button></td>
                    <td><button onclick='openDeleteModal(${user.id}, "${user.username}", 
                    "${user.email}", "${roles}")' class="btn btn-danger">Delete</button></td>
                    </tr>
                `;
            });
        })
        .catch(error => console.error("Ошибка загрузки пользователей:", error));
}

function loadRoles() {
    fetch('/api/admin/roles')
        .then(response => response.json())
        .then(roles => {

            let rolesSelect = document.getElementById("roles");
            rolesSelect.innerHTML = "";

            roles.forEach(role => {
                let option = document.createElement("option");
                option.value = role.id;
                option.textContent = role.name;
                rolesSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Ошибка загрузки ролей:", error));
}


function addNewUser() {
    let user = {
        username: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        roles: Array.from(document.getElementById("roles").selectedOptions)
            .map(option => ({id: option.value}))
    };

    fetch('/api/admin/new', {
        method: 'POST', headers: {
            "Content-Type": "application/json"
        }, body: JSON.stringify(user)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Создан пользователь:", data);
            document.getElementById("newUserForm").reset();
            loadUsers();
            window.location.href = '/admin';
        })
        .catch(error => console.error("Ошибка создания пользователя:", error));
}

function openDeleteModal(userId, username, email, roles) {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = `deleteUserModal${userId}`;
    modal.tabIndex = -1;
    modal.setAttribute("role", "dialog");
    modal.innerHTML = `
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Delete user</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Delete this user?</p>
                        <div class="user-info">
                            <p><strong>ID:</strong> <span>${userId}</span></p>
                            <p><strong>Name:</strong> <span>${username}</span></p>
                            <p><strong>Email:</strong> <span>${email}</span></p>
                            <p><strong>Role:</strong> <span>${roles}</span></p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" onclick="deleteUser(${userId})">Delete</button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();

    modal.addEventListener('hidden.bs.modal', function () {
        modal.remove();
    });
}

function deleteUser(userId) {
    fetch(`/api/admin/${userId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            loadUsers();
            bootstrap.Modal.getInstance(document.getElementById(`deleteUserModal${userId}`)).hide();
        })
        .catch(error => {
            console.error("Ошибка удаления пользователя:", error);
            alert("Ошибка при удалении пользователя: " + error.message);
        });
}

function openEditModal(user) {
    fetch('/api/admin/roles')
        .then(response => response.json())
        .then(availableRoles => {
            const modal = document.createElement("div");
            modal.className = "modal fade";
            modal.id = `editUserModal${user.id}`;
            modal.tabIndex = -1;
            modal.setAttribute("aria-hidden", "true");
            modal.setAttribute("role", "dialog");
            modal.innerHTML = `
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit user</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editForm${user.id}">
                            <input type="hidden" name="id" value="${user.id}">
                            <div class="form-group">
                                <label>Name:</label>
                                <input type="text" name="username" class="form-control" 
                                value="${user.username}" required>
                            </div>
                            <div class="form-group">
                                <label>Email:</label>
                                <input type="email" name="email" class="form-control" value="${user.email}" required>
                            </div>
                            <div class="form-group">
                                <label>Password:</label>
                                <input type="password" name="password" class="form-control" 
                                placeholder="Оставьте поле пустым, чтобы сохранить текущий пароль.">
                            </div>
                            <div class="form-group">
                                <label>Role:</label>
                                <select name="roleIds" class="form-control" multiple>
                                    ${availableRoles.map(role => `
                                        <option value="${role.id}" ${user.roles.some(r => r.id == role.id) 
                                        ? 'selected' : ''}>${role.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" 
                                onclick="saveUserChanges(${user.id})">Save changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

            document.body.appendChild(modal);
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();

            modal.addEventListener('hidden.bs.modal', function () {
                modal.remove();
            });
        })
        .catch(error => console.error("Ошибка загрузки ролей для редактирования:", error));
}

function saveUserChanges(userId) {
    const form = document.getElementById(`editForm${userId}`);
    const formData = new FormData(form);
    const user = {
        id: userId,
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password') || undefined,
        roleIds: Array.from(form.querySelectorAll('select[name="roleIds"] option:checked'))
            .map(option => parseInt(option.value))
    };

    fetch(`/api/admin/${userId}`, {
        method: 'PUT', headers: {
            "Content-Type": "application/json"
        }, body: JSON.stringify(user)
    })
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            loadUsers();
            bootstrap.Modal.getInstance(document.getElementById(`editUserModal${userId}`)).hide();
        })
        .catch(error => {
            console.error("Ошибка обновления пользователя:", error);
            alert("Ошибка при обновлении пользователя: " + error.message);
        });
}