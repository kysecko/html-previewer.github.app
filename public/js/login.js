
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const emailMessage = document.getElementById("emailMessage");
  const passwordMessage = document.getElementById("passwordMessage");
  const spinner = document.getElementById("redirectSpinner");

  /* ALERT ELEMENT */
  const alertContainer = document.createElement("div");
  alertContainer.style.position = "fixed";
  alertContainer.style.top = "24px";
  alertContainer.style.left = "50%";
  alertContainer.style.transform = "translateX(-50%)";
  alertContainer.style.background = "#ff4d4d";
  alertContainer.style.color = "#fff";
  alertContainer.style.padding = "14px 22px";
  alertContainer.style.borderRadius = "12px";
  alertContainer.style.boxShadow = "0 6px 18px rgba(0,0,0,0.4)";
  alertContainer.style.fontSize = "14px";
  alertContainer.style.fontWeight = "600";
  alertContainer.style.opacity = "0";
  alertContainer.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  alertContainer.style.zIndex = "9999";
  alertContainer.style.pointerEvents = "none"; // allow clicking through
  document.body.appendChild(alertContainer);

  let alertTimer;

  const showAlert = (message) => {
    clearTimeout(alertTimer);

    alertContainer.textContent = message;
    alertContainer.style.opacity = "1";
    alertContainer.style.transform = "translateX(-50%) translateY(0)";

    // hide after 2.5s
    alertTimer = setTimeout(() => {
      alertContainer.style.opacity = "0";
      alertContainer.style.transform = "translateX(-50%) translateY(-10px)";
    }, 2000);
  };

  /* HELPERS */
  const isValidEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const showFieldError = (input, msgDiv, msg) => {
    msgDiv.textContent = msg;
    msgDiv.style.display = "block";
    msgDiv.style.color = "#ff4d4d";
    input.parentElement.style.borderColor = "#ff4d4d";
  };

  const showFieldSuccess = (input, msgDiv, msg = "") => {
    msgDiv.textContent = msg;
    msgDiv.style.display = msg ? "block" : "none";
    msgDiv.style.color = "#22c55e";
    input.parentElement.style.borderColor = "#22c55e";
  };

  const clearField = (input, msgDiv) => {
    msgDiv.textContent = "";
    msgDiv.style.display = "none";
    input.parentElement.style.borderColor = "";
  };

  /* ===== REAL-TIME VALIDATION ===== */
  emailInput.addEventListener("input", () => {
    const val = emailInput.value.trim();
    if (!val) clearField(emailInput, emailMessage);
    else if (!isValidEmail(val))
      showFieldError(emailInput, emailMessage, "Invalid email");
    else showFieldSuccess(emailInput, emailMessage, "Valid email");
  });

  passwordInput.addEventListener("input", () => {
    const val = passwordInput.value;
    if (!val) clearField(passwordInput, passwordMessage);
    else if (val.length < 8)
      showFieldError(passwordInput, passwordMessage, "Minimum 8 characters");
    else showFieldSuccess(passwordInput, passwordMessage, "Valid password");
  });

  /* ===== FORM SUBMIT ===== */
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    clearField(emailInput, emailMessage);
    clearField(passwordInput, passwordMessage);

    if (!email) {
      showFieldError(emailInput, emailMessage, "Required");
      showAlert("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      showFieldError(emailInput, emailMessage, "Invalid email");
      showAlert("Invalid email address");
      return;
    }

    if (!password) {
      showFieldError(passwordInput, passwordMessage, "Required");
      showAlert("Password is required");
      return;
    }

    if (password.length < 8) {
      showFieldError(passwordInput, passwordMessage, "Minimum 8 characters");
      showAlert("Password must be at least 8 characters");
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";
    submitBtn.style.opacity = "0.6";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error("Invalid credentials");

      // loader + redirect
      spinner.style.display = "flex";

      setTimeout(() => {
        window.location.href = data.redirect || "/user";
      }, 500);
    } catch (err) {
      showAlert("Invalid email or password");

      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
      submitBtn.style.opacity = "1";
    }
  });
});
