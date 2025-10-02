;(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel)
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel))

  // Header nav toggle
  const nav = $("#primary-nav")
  const toggle = $(".nav-toggle")

  function closeNav() {
    if (!nav) return
    nav.classList.remove("open")
    if (toggle) toggle.setAttribute("aria-expanded", "false")
  }
  function openNav() {
    if (!nav) return
    nav.classList.add("open")
    if (toggle) toggle.setAttribute("aria-expanded", "true")
  }

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true"
      expanded ? closeNav() : openNav()
    })

    // Close on link click (mobile)
    nav.addEventListener("click", (e) => {
      const target = e.target
      if (target instanceof HTMLAnchorElement) {
        closeNav()
      }
    })

    // Close on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav()
    })
  }

  // Smooth scroll for internal links
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href")
      if (!id || id === "#") return
      const el = $(id)
      if (!el) return
      e.preventDefault()
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      el.focus({ preventScroll: true })
    })
  })

  // IntersectionObserver reveal animations
  const reveals = $$(".reveal")
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view")
          io.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.15 },
  )
  reveals.forEach((el) => io.observe(el))

  // Footer year
  const year = $("#year")
  if (year) year.textContent = String(new Date().getFullYear())

  // Prefill booking from packages
  const packageSelect = $("#package")
  $$(".select-package").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pkg = btn.getAttribute("data-package") || ""
      if (packageSelect) {
        packageSelect.value = pkg
        packageSelect.dispatchEvent(new Event("change", { bubbles: true }))
      }
      const booking = $("#booking")
      if (booking) booking.scrollIntoView({ behavior: "smooth", block: "start" })
      closeNav()
    })
  })

  // Booking form validation
  const form = $("#booking-form")
  const status = $("#form-status")

  // Set min date to today
  const dateInput = $("#date")
  if (dateInput instanceof HTMLInputElement) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const pad = (n) => String(n).padStart(2, "0")
    const iso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    dateInput.min = iso
  }

  function setError(input, message) {
    const id = input.id
    const errEl = $(`#err-${id}`)
    input.setAttribute("aria-invalid", "true")
    if (errEl) errEl.textContent = message || ""
  }

  function clearError(input) {
    const id = input.id
    const errEl = $(`#err-${id}`)
    input.setAttribute("aria-invalid", "false")
    if (errEl) errEl.textContent = ""
  }

  function validateField(input) {
    if (!(input instanceof HTMLElement)) return true

    const el = /** @type {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} */ (input)
    if (el.disabled) return true

    // Use built-in validity and add friendly messages
    const v = el.validity
    if (v.valid) {
      clearError(el)
      return true
    }

    let msg = "Please correct this field."
    if (v.valueMissing) {
      msg = "This field is required."
    } else if (v.typeMismatch) {
      msg = "Please enter a valid value."
    } else if (v.patternMismatch) {
      msg = "Please match the requested format."
    } else if (v.rangeUnderflow) {
      msg = `Value must be at least ${el.getAttribute("min")}.`
    } else if (v.rangeOverflow) {
      msg = `Value must be at most ${el.getAttribute("max")}.`
    } else if (v.tooShort) {
      msg = `Please lengthen to ${el.getAttribute("minlength")}+ characters.`
    } else if (v.tooLong) {
      msg = `Please shorten to ${el.getAttribute("maxlength")} characters or fewer.`
    } else if (v.stepMismatch) {
      msg = "Please select a valid value."
    } else if (v.badInput) {
      msg = "Please enter a number."
    }

    setError(el, msg)
    return false
  }

  if (form) {
    // Live validation on blur/change
    $$("input, select, textarea", form).forEach((el) => {
      el.addEventListener("blur", () => validateField(el))
      el.addEventListener("input", () => {
        // clear errors as user types/selects
        clearError(el)
      })
      el.addEventListener("change", () => validateField(el))
    })

    form.addEventListener("submit", (e) => {
      e.preventDefault()

      let allValid = true
      const fields = $$("input, select, textarea", form)
      fields.forEach((f) => {
        const valid = validateField(f)
        if (!valid) allValid = false
      })

      const agree = $("#agree")
      if (agree instanceof HTMLInputElement && !agree.checked) {
        setError(agree, "You must agree to the Safety Rules.")
        allValid = false
      }

      if (!allValid) {
        if (status) {
          status.textContent = "Please fix the errors highlighted below."
        }
        // Focus first invalid field
        const firstInvalid = fields.find((f) => f instanceof HTMLElement && f.getAttribute("aria-invalid") === "true")
        if (firstInvalid) firstInvalid.focus()
        return
      }

      // Success: summarize booking (client-side only demo)
      const summary = {
        name: $("#fullName")?.value,
        email: $("#email")?.value,
        phone: $("#phone")?.value,
        date: $("#date")?.value,
        time: $("#time")?.value,
        participants: $("#participants")?.value,
        package: $("#package")?.value,
        notes: $("#notes")?.value?.trim(),
      }

      if (status) {
        status.textContent = `Thanks, ${summary.name}! Your ${summary.package} session on ${summary.date} at ${summary.time} for ${summary.participants} will be confirmed by email shortly.`
      }

      form.reset()
      // Reset aria-invalid and error messages
      $$("input, select, textarea", form).forEach((f) => clearError(f))
    })

    form.addEventListener("reset", () => {
      if (status) status.textContent = ""
      $$("input, select, textarea", form).forEach((f) => clearError(f))
    })
  }
})()
