(() => {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = doc.querySelector("[data-header]");
  const nav = doc.querySelector("[data-nav]");
  const menuButton = doc.querySelector("[data-menu]");

  doc.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const normalizePath = (value) => {
    const path = value.replace(/index\.html$/, "").replace(/\/+$/, "");
    return path || "/";
  };

  const currentPath = normalizePath(window.location.pathname);
  doc.querySelectorAll("[data-nav] a").forEach((link) => {
    const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
    if (linkPath === currentPath) link.setAttribute("aria-current", "page");
  });

  const closeMenu = () => {
    if (!nav || !menuButton) return;
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    doc.body.classList.remove("menu-open");
  };

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      doc.body.classList.toggle("menu-open", open);
    });

    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    const desktopNavigation = window.matchMedia("(min-width: 901px)");
    const resetNavigation = (event) => {
      if (event.matches) closeMenu();
    };
    if (desktopNavigation.addEventListener) desktopNavigation.addEventListener("change", resetNavigation);
    else desktopNavigation.addListener(resetNavigation);
  }

  let scrollQueued = false;
  const updateScrollUI = () => {
    const maxScroll = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100));
    root.style.setProperty("--page-progress", `${progress}%`);
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
    scrollQueued = false;
  };

  window.addEventListener("scroll", () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  updateScrollUI();

  const revealNodes = doc.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px" });
    revealNodes.forEach((node) => revealObserver.observe(node));
  }

  if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    doc.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-3px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  const story = doc.querySelector("[data-story]");
  if (story && !reducedMotion && window.innerWidth > 900) {
    const cards = [...story.querySelectorAll("[data-story-card]")];
    const copies = [...story.querySelectorAll("[data-story-copy]")];
    const dots = [...story.querySelectorAll("[data-story-dot]")];
    let active = -1;
    let storyQueued = false;

    const renderStory = () => {
      const rect = story.getBoundingClientRect();
      const travel = Math.max(1, story.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const exact = progress * (cards.length - 1);
      const nextActive = Math.min(cards.length - 1, Math.max(0, Math.round(exact)));

      cards.forEach((card, index) => {
        const delta = index - exact;
        const behind = Math.max(0, -delta);
        const ahead = Math.max(0, delta);
        const y = ahead * 42 - behind * 12;
        const z = -Math.abs(delta) * 95;
        const rotate = delta * -4.5;
        const scale = 1 - Math.min(0.12, Math.abs(delta) * 0.045);
        card.style.transform = `translate3d(0, ${y}px, ${z}px) rotateX(${rotate}deg) scale(${scale})`;
        card.style.opacity = String(Math.max(0.12, 1 - Math.abs(delta) * 0.48));
        card.style.zIndex = String(30 - Math.round(Math.abs(delta) * 5));
        card.style.pointerEvents = index === nextActive ? "auto" : "none";
      });

      if (active !== nextActive) {
        active = nextActive;
        copies.forEach((copy, index) => copy.classList.toggle("is-active", index === active));
        dots.forEach((dot, index) => {
          dot.classList.toggle("is-active", index === active);
          dot.setAttribute("aria-pressed", String(index === active));
        });
        const counter = story.querySelector("[data-story-counter]");
        if (counter) counter.textContent = `Chapter ${String(active + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
      }
      storyQueued = false;
    };

    const requestStory = () => {
      if (!storyQueued) {
        storyQueued = true;
        window.requestAnimationFrame(renderStory);
      }
    };

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        const travel = story.offsetHeight - window.innerHeight;
        const target = story.offsetTop + (travel * index) / Math.max(1, cards.length - 1);
        window.scrollTo({ top: target, behavior: "smooth" });
      });
    });

    window.addEventListener("scroll", requestStory, { passive: true });
    window.addEventListener("resize", requestStory);
    renderStory();
  }

  const canvas = doc.getElementById("joy-field");
  if (canvas && !reducedMotion) {
    const context = canvas.getContext("2d", { alpha: true });
    const nodeCount = window.matchMedia("(max-width: 640px)").matches ? 26 : 48;
    const nodes = Array.from({ length: nodeCount }, (_, index) => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 2 - 1,
      size: 0.8 + Math.random() * 1.9,
      tone: index % 3
    }));
    const pointer = { x: 0, y: 0 };
    let width = 0;
    let height = 0;
    let ratio = 1;
    let visible = true;

    const resizeCanvas = () => {
      ratio = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    window.addEventListener("pointermove", (event) => {
      pointer.x = (event.clientX / Math.max(1, width) - 0.5) * 0.5;
      pointer.y = (event.clientY / Math.max(1, height) - 0.5) * 0.5;
    }, { passive: true });

    doc.addEventListener("visibilitychange", () => { visible = !doc.hidden; });
    window.addEventListener("resize", resizeCanvas);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const palette = ["23,142,142", "201,150,56", "109,151,62"];
    const draw = (time) => {
      if (visible) {
        context.clearRect(0, 0, width, height);
        const scrollRotation = window.scrollY * 0.00022;
        const angle = time * 0.00005 + scrollRotation + pointer.x;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const projected = nodes.map((node) => {
          const rx = node.x * cos - node.z * sin;
          const rz = node.x * sin + node.z * cos;
          const ry = node.y + Math.sin(time * 0.00035 + node.x * 4) * 0.035 + pointer.y;
          const depth = 1.9 + rz;
          const scale = 0.68 / depth;
          return {
            x: width * 0.5 + rx * Math.min(width, 1100) * 0.56 * scale,
            y: height * 0.5 + ry * Math.min(height, 850) * 0.62 * scale,
            r: node.size * (1.2 + scale * 2.8),
            a: Math.max(0.08, Math.min(0.35, scale * 0.72)),
            tone: node.tone
          };
        });

        for (let i = 0; i < projected.length; i += 1) {
          const a = projected[i];
          for (let j = i + 1; j < projected.length; j += 1) {
            const b = projected[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 125) {
              context.beginPath();
              context.moveTo(a.x, a.y);
              context.lineTo(b.x, b.y);
              context.strokeStyle = `rgba(23,142,142,${(1 - distance / 125) * 0.07})`;
              context.lineWidth = 1;
              context.stroke();
            }
          }
          context.beginPath();
          context.arc(a.x, a.y, a.r, 0, Math.PI * 2);
          context.fillStyle = `rgba(${palette[a.tone]},${a.a})`;
          context.fill();
        }
      }
      window.requestAnimationFrame(draw);
    };
    window.requestAnimationFrame(draw);
  }

  const siteConfig = window.JOY_SITE_CONFIG || {};
  const intakeUrl = typeof siteConfig.supabaseIntakeUrl === "string"
    ? siteConfig.supabaseIntakeUrl.trim()
    : "";
  const publishableKey = typeof siteConfig.supabasePublishableKey === "string"
    ? siteConfig.supabasePublishableKey.trim()
    : "";
  const fallbackEmail = typeof siteConfig.fallbackEmail === "string" && siteConfig.fallbackEmail.includes("@")
    ? siteConfig.fallbackEmail.trim()
    : "info@joycorporatesolutions.com";

  const setFormStatus = (form, message, state = "") => {
    const status = form.querySelector("[data-form-status]");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-success", state === "success");
    status.classList.toggle("is-error", state === "error");
  };

  const setSubmitting = (form, submitting) => {
    const button = form.querySelector("button[type='submit']");
    if (!button) return;
    if (!button.dataset.defaultLabel) button.dataset.defaultLabel = button.textContent.trim();
    button.disabled = submitting;
    button.setAttribute("aria-busy", String(submitting));
    button.textContent = submitting ? "Sending securely..." : button.dataset.defaultLabel;
  };

  const openEmailFallback = (form, subject, body, message) => {
    setFormStatus(form, message, "error");
    window.location.href = `mailto:${fallbackEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const sendIntake = async (form, kind, payload, emailSubject, emailBody) => {
    if (!intakeUrl || !publishableKey) {
      openEmailFallback(
        form,
        emailSubject,
        emailBody,
        "The secure online form is not connected yet. Your email app is opening so you can review and send the enquiry."
      );
      return;
    }

    setSubmitting(form, true);
    setFormStatus(form, "Sending your information securely...");

    try {
      const response = await fetch(intakeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: publishableKey
        },
        body: JSON.stringify({
          kind,
          ...payload,
          source_page: window.location.pathname
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Request failed");

      form.reset();
      form.querySelectorAll("[data-amount]").forEach((item) => item.classList.remove("is-active"));
      setFormStatus(
        form,
        kind === "donation"
          ? "Thank you. Your donation enquiry has been received. The Trust will respond with verified instructions."
          : "Your initial support request has been received for review. Submission does not guarantee approval.",
        "success"
      );
    } catch {
      openEmailFallback(
        form,
        emailSubject,
        emailBody,
        "The secure form could not connect. Your email app is opening with the same information so the enquiry is not lost."
      );
    } finally {
      setSubmitting(form, false);
    }
  };

  const donationForm = doc.querySelector("[data-donation-form]");
  if (donationForm) {
    const amountInput = donationForm.querySelector("[name='amount']");
    donationForm.querySelectorAll("[data-amount]").forEach((button) => {
      button.addEventListener("click", () => {
        donationForm.querySelectorAll("[data-amount]").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        amountInput.value = button.dataset.amount;
        amountInput.focus();
      });
    });

    donationForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!donationForm.reportValidity()) return;
      const data = new FormData(donationForm);
      const payload = {
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        phone: String(data.get("phone") || ""),
        purpose: String(data.get("purpose") || ""),
        amount: String(data.get("amount") || ""),
        message: String(data.get("message") || ""),
        website: String(data.get("website") || "")
      };
      const subject = "Donation enquiry - JOY Social Welfare Trust";
      const body = [
        "I would like to request verified donation instructions.",
        "",
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Phone: ${payload.phone || "Not provided"}`,
        `Purpose: ${payload.purpose}`,
        `Intended amount: INR ${payload.amount || "To be decided"}`,
        `Message: ${payload.message || "None"}`
      ].join("\n");
      await sendIntake(donationForm, "donation", payload, subject, body);
    });
  }

  const supportForm = doc.querySelector("[data-support-form]");
  if (supportForm) {
    supportForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!supportForm.reportValidity()) return;
      const data = new FormData(supportForm);
      const payload = {
        name: String(data.get("name") || ""),
        phone: String(data.get("phone") || ""),
        email: String(data.get("email") || ""),
        location: String(data.get("location") || ""),
        support_type: String(data.get("support_type") || ""),
        urgency: String(data.get("urgency") || ""),
        requirement: String(data.get("requirement") || ""),
        situation: String(data.get("situation") || ""),
        website: String(data.get("website") || "")
      };
      const subject = `Support request - ${payload.support_type}`;
      const body = [
        "Initial support request for JOY Social Welfare Trust review.",
        "",
        `Applicant name: ${payload.name}`,
        `Phone: ${payload.phone}`,
        `Email: ${payload.email || "Not provided"}`,
        `District / State: ${payload.location}`,
        `Support type: ${payload.support_type}`,
        `Urgency: ${payload.urgency}`,
        `Estimated requirement: ${payload.requirement || "Not specified"}`,
        "",
        "Situation:",
        payload.situation,
        "",
        "No Aadhaar number, medical record, or bank credential is included in this initial email."
      ].join("\n");
      await sendIntake(supportForm, "support", payload, subject, body);
    });
  }
})();
