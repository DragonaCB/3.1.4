document.addEventListener("DOMContentLoaded", () => {
    loadUser();
    setActiveNavLink();
});

function setActiveNavLink() {
    const currentPath = window.location.pathname;
    document.getElementById("adminLink").classList.toggle("active", currentPath === "/admin");
    document.getElementById("userLink").classList.toggle("active", currentPath === "/user");
}

function loadUser() {
    fetch('/api/user')
        .then(response => response.json())
        .then(user => {
            $("#userDetails").text(`${user.email} with roles:
                ${user.roles.map(role => role.name).join(", ")}`);

            const isAdmin = user.roles.some(role => role.name === "ROLE_ADMIN");
            const adminLink = document.getElementById("adminLink");

            if (!isAdmin) {
                adminLink.style.display = "none";
            } else {
                adminLink.style.display = "block";
            }

            let tableBody = $("#userTable tbody");
            tableBody.empty();

            let roles = user.roles.map(role => role.name).join(", ");
            tableBody.append(`
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${roles}</td>
                    </tr>
                `);
        })
        .catch(error => console.error("Ошибка загрузки данных пользователя:", error));
}

