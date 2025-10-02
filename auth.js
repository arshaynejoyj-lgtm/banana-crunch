(function () {
    var AUTH_KEY = "bc_is_authenticated";
    var USERS_KEY = "bc_mock_users";
    var CURRENT_USER_KEY = "bc_current_user";

    function isAuthenticated() {
        try {
            return localStorage.getItem(AUTH_KEY) === "true";
        } catch (e) {
            return false;
        }
    }

    function setAuthenticated(value) {
        try {
            localStorage.setItem(AUTH_KEY, value ? "true" : "false");
        } catch (e) {}
    }

    function setCurrentUser(user) {
        try {
            if (user) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            } else {
                localStorage.removeItem(CURRENT_USER_KEY);
            }
        } catch (e) {}
    }

    function getUsers() {
        try {
            var raw = localStorage.getItem(USERS_KEY);
            if (!raw) return [];
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveUsers(users) {
        try {
            localStorage.setItem(USERS_KEY, JSON.stringify(users || []));
        } catch (e) {}
    }

    function seedUsersIfEmpty() {
        var users = getUsers();
        if (users.length === 0) {
            users.push({
                name: "Test User",
                email: "test@banana.com",
                password: "banana123"
            });
            saveUsers(users);
        }
    }

    function validateEmail(email) {
        return /.+@.+\..+/.test(String(email || "").toLowerCase());
    }

    function registerUser(name, email, password) {
        var users = getUsers();
        var exists = users.some(function (u) { return (u.email || "").toLowerCase() === String(email || "").toLowerCase(); });
        if (exists) {
            return { ok: false, message: "Email already registered" };
        }
        users.push({ name: name, email: email, password: password });
        saveUsers(users);
        return { ok: true };
    }

    function loginUser(email, password) {
        var users = getUsers();
        var user = users.find(function (u) {
            return (u.email || "").toLowerCase() === String(email || "").toLowerCase() && u.password === password;
        });
        if (!user) {
            return { ok: false, message: "Invalid email or password" };
        }
        return { ok: true, user: user };
    }

    function redirect(to) {
        window.location.href = to;
    }

    function onReady(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    var path = (location.pathname || "").toLowerCase();
    var isLogin = path.endsWith("/login.html") || path.endsWith("login.html");
    var isRegister = path.endsWith("/register.html") || path.endsWith("register.html");
    var isIndex = path.endsWith("/index.html") || path.endsWith("index.html") || path === "/" || path === "";

    onReady(function () {
        // Seed mock users
        seedUsersIfEmpty();

        // Auth page behavior: if already authenticated, send to index
        if ((isLogin || isRegister) && isAuthenticated()) {
            redirect("index.html#home");
            return;
        }

        // Public page behavior: if not authenticated, send to login
        if (!isLogin && !isRegister && !isAuthenticated()) {
            redirect("login.html");
            return;
        }

        // Wire login form
        if (isLogin) {
            var loginForm = document.querySelector("form.auth-form");
            if (loginForm) {
                loginForm.addEventListener("submit", function (e) {
                    e.preventDefault();
                    var email = (document.getElementById("email") || {}).value;
                    var password = (document.getElementById("password") || {}).value;
                    if (!validateEmail(email)) {
                        alert("Please enter a valid email address");
                        return;
                    }
                    var res = loginUser(email, password);
                    if (!res.ok) {
                        alert(res.message);
                        return;
                    }
                    setAuthenticated(true);
                    setCurrentUser({ name: res.user.name, email: res.user.email });
                    redirect("index.html#home");
                });
            }
        }

        // Wire register form
        if (isRegister) {
            var registerForm = document.querySelector("form.auth-form");
            if (registerForm) {
                registerForm.addEventListener("submit", function (e) {
                    e.preventDefault();
                    var name = (document.getElementById("name") || {}).value;
                    var email = (document.getElementById("email") || {}).value;
                    var password = (document.getElementById("password") || {}).value;
                    var confirm = (document.getElementById("confirm") || {}).value;
                    if (!name || !email || !password || !confirm) {
                        alert("Please fill in all fields");
                        return;
                    }
                    if (!validateEmail(email)) {
                        alert("Please enter a valid email address");
                        return;
                    }
                    if (password !== confirm) {
                        alert("Passwords do not match");
                        return;
                    }
                    var reg = registerUser(name, email, password);
                    if (!reg.ok) {
                        alert(reg.message);
                        return;
                    }
                    setAuthenticated(true);
                    setCurrentUser({ name: name, email: email });
                    redirect("index.html#home");
                });
            }
        }

        // Logout button if present
        var logoutBtn = document.querySelector("[data-action=logout]");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
                e.preventDefault();
                setAuthenticated(false);
                setCurrentUser(null);
                redirect("login.html");
            });
        }
    });
})();
