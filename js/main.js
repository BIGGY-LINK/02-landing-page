/**
 * Initializes the responsive navigation menu and its keyboard behavior.
 */
const initMobileMenu = () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNavigation = document.querySelector("#primary-navigation");

  if (!menuToggle || !primaryNavigation) return;

  const setMenuOpen = (isOpen) => {
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    primaryNavigation.classList.toggle("is-open", isOpen);
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  primaryNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });
};

/**
 * Expands one FAQ answer at a time with a height transition.
 */
const initAccordion = () => {
  const buttons = document.querySelectorAll(".faq-question");
  const transitionHandlers = new WeakMap();

  const setPanelOpen = (button, isOpen) => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;

    button.setAttribute("aria-expanded", String(isOpen));
    const previousHandler = transitionHandlers.get(panel);
    if (previousHandler) panel.removeEventListener("transitionend", previousHandler);

    if (isOpen) {
      panel.hidden = false;
      panel.style.paddingBottom = "18px";
      panel.style.height = "0px";
      requestAnimationFrame(() => {
        panel.style.height = `${panel.scrollHeight}px`;
      });
    } else {
      panel.style.height = `${panel.scrollHeight}px`;
      panel.style.paddingBottom = "0px";
      panel.offsetHeight;
      requestAnimationFrame(() => {
        panel.style.height = "0px";
      });
    }

    const transitionHandler = (event) => {
      if (event.target !== panel || event.propertyName !== "height") return;
      if (isOpen) {
        panel.style.height = "auto";
      } else {
        panel.hidden = true;
      }
      panel.removeEventListener("transitionend", transitionHandler);
      transitionHandlers.delete(panel);
    };
    transitionHandlers.set(panel, transitionHandler);
    panel.addEventListener("transitionend", transitionHandler);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      buttons.forEach((otherButton) => {
        if (otherButton !== button && otherButton.getAttribute("aria-expanded") === "true") {
          setPanelOpen(otherButton, false);
        }
      });

      setPanelOpen(button, !isExpanded);
    });
  });
};

/**
 * Switches displayed prices and the yearly savings badge.
 */
const initPricingToggle = () => {
  const billingToggle = document.querySelector(".toggle-switch");
  if (!billingToggle) return;

  const savingsBadge = document.querySelector(".billing-toggle small");
  const billingNotes = document.querySelectorAll(".billing-note");
  const prices = document.querySelectorAll(".price-amount");

  billingToggle.addEventListener("click", () => {
    const isYearly = billingToggle.getAttribute("aria-checked") !== "true";
    billingToggle.setAttribute("aria-checked", String(isYearly));
    billingToggle.setAttribute("aria-label", isYearly ? "Switch to monthly billing" : "Switch to yearly billing");

    prices.forEach((price) => {
      const amount = isYearly ? price.dataset.yearly : price.dataset.monthly;
      if (amount) price.textContent = `$${Number(amount).toLocaleString("en-US")}`;
    });

    billingNotes.forEach((note) => {
      note.textContent = isYearly ? "Billed yearly · save 20%" : "Billed monthly";
    });

    if (savingsBadge) savingsBadge.hidden = !isYearly;
  });
};

/**
 * Adds a shadow class to the sticky header after scrolling past 10px.
 */
const initHeaderShadow = () => {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const updateHeaderShadow = () => {
    header.classList.toggle("site-header--scrolled", window.scrollY > 10);
  };

  window.addEventListener("scroll", updateHeaderShadow, { passive: true });
  updateHeaderShadow();
};

/**
 * Keeps the footer copyright year current.
 */
const initFooterYear = () => {
  const year = document.querySelector("#current-year");
  if (year) year.textContent = String(new Date().getFullYear());
};

/**
 * Validates the sign-up form, prevents duplicate emails, and saves signups locally.
 */
const initSignupForm = () => {
  const signupForm = document.querySelector(".signup-form");
  const formMessage = document.querySelector(".form-message");

  if (!signupForm || !formMessage) return;

  const fields = {
    name: signupForm.elements.namedItem("name"),
    email: signupForm.elements.namedItem("email"),
    plan: signupForm.elements.namedItem("plan"),
    terms: signupForm.elements.namedItem("terms"),
  };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const getFieldError = (fieldName) => signupForm.querySelector(`#${fieldName}-error`);

  const setFieldError = (fieldName, message) => {
    const field = fields[fieldName];
    const error = getFieldError(fieldName);
    if (!field || !error) return;

    field.setAttribute("aria-invalid", String(Boolean(message)));
    error.textContent = message;
    error.hidden = !message;
  };

  const validateField = (fieldName) => {
    const field = fields[fieldName];
    if (!field) return false;

    let message = "";
    if (fieldName === "name" && field.value.trim().length < 2) {
      message = "Please enter a name with at least 2 characters.";
    } else if (fieldName === "email" && !emailPattern.test(field.value.trim())) {
      message = "Please enter a valid email address.";
    } else if (fieldName === "plan" && !field.value) {
      message = "Please choose a plan or service.";
    } else if (fieldName === "terms" && !field.checked) {
      message = "Please agree to the terms to continue.";
    }

    setFieldError(fieldName, message);
    return !message;
  };

  const clearFormErrors = () => {
    Object.keys(fields).forEach((fieldName) => setFieldError(fieldName, ""));
  };

  Object.entries(fields).forEach(([fieldName, field]) => {
    const eventName = fieldName === "plan" || fieldName === "terms" ? "change" : "input";
    field.addEventListener(eventName, () => {
      validateField(fieldName);
      formMessage.textContent = "";
    });
  });

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formMessage.textContent = "";

    const isValid = Object.keys(fields).map(validateField).every(Boolean);
    if (!isValid) {
      const firstInvalidField = Object.values(fields).find(
        (field) => field.getAttribute("aria-invalid") === "true",
      );
      firstInvalidField?.focus();
      return;
    }

    const signup = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      plan: fields.plan.value,
      createdAt: new Date().toISOString(),
    };

    try {
      const storedSignups = localStorage.getItem("signups");
      const signups = storedSignups ? JSON.parse(storedSignups) : [];
      if (!Array.isArray(signups)) throw new TypeError("Saved signups are not an array.");

      const alreadySignedUp = signups.some(
        (savedSignup) => savedSignup.email?.toLowerCase() === signup.email.toLowerCase(),
      );
      if (alreadySignedUp) {
        formMessage.textContent = "You've already signed up";
        return;
      }

      signups.push(signup);
      localStorage.setItem("signups", JSON.stringify(signups));
    } catch (error) {
      console.error("Unable to save the signup to localStorage.", error);
      formMessage.textContent = "We couldn’t save your signup in this browser. Please try again.";
      return;
    }

    signupForm.reset();
    clearFormErrors();
    formMessage.textContent = `Thanks, ${signup.name}! Your signup has been saved.`;
  });
};

/**
 * Initializes all page interactions after the document is ready.
 */
const init = () => {
  initMobileMenu();
  initAccordion();
  initPricingToggle();
  initHeaderShadow();
  initFooterYear();
  initSignupForm();
};

document.addEventListener("DOMContentLoaded", init, { once: true });
