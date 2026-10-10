/* =========================================================
   JAO — price calculator (Services & Pricing page only)
   ---------------------------------------------------------
   HOW TO EDIT PRICES
   Change the list below. "from" is the smallest quantity
   for that package, and "price" is the price per application.
   Keep the packages in order from smallest to largest.
   Remember to update the prices written in the HTML pages too
   (see EDITING-GUIDE.md for the full list).

   CHECKOUT LINKS (Stripe Payment Links)
   "checkout" is the Stripe Payment Link for each package. Each
   price here must match the price on that Stripe product, and
   each link's quantity limits must match the package range
   (Starter 1–10, Value 11–25, Growth 26–75, Pro 76–500).
   Links starting with "test_" are Sandbox links (no real charge):
   swap in the live links before taking real payments.
   ========================================================= */

const PACKAGES = [
  { name: "Starter", from: 1,  price: 5.00, checkout: "https://buy.stripe.com/test_fZueV569K7pAes9g9cbbG00" },
  { name: "Value",   from: 11, price: 4.75, checkout: "https://buy.stripe.com/test_3cI6oz8hS11cabT0aebbG01" },
  { name: "Growth",  from: 26, price: 4.50, checkout: "https://buy.stripe.com/test_7sY14fbu411c0Bj0aebbG02" },
  { name: "Pro",     from: 76, price: 4.25, checkout: "https://buy.stripe.com/test_7sY9ALaq011c1Fne14bbG03" }
];

const MAX_APPLICATIONS = 500; // largest order the calculator accepts


/* ----- You shouldn't need to edit below this line ----- */

const qtyInput   = document.getElementById("qty");
const message    = document.getElementById("calc-message");
const outPackage = document.getElementById("out-package");
const outEach    = document.getElementById("out-each");
const outSave    = document.getElementById("out-save");
const outTotal   = document.getElementById("out-total");
const announcer  = document.getElementById("calc-announce");
const checkout   = document.getElementById("checkout-btn");
const outQty     = document.getElementById("out-qty");

const basePrice = PACKAGES[0].price;
const money = (amount) => "$" + amount.toFixed(2);

function packageFor(qty) {
  let match = PACKAGES[0];
  for (const pkg of PACKAGES) {
    if (qty >= pkg.from) match = pkg;
  }
  return match;
}

function update() {
  const qty = Number(qtyInput.value);
  const valid = Number.isInteger(qty) && qty >= 1 && qty <= MAX_APPLICATIONS;

  if (!valid) {
    message.textContent = "Please enter a whole number from 1 to " + MAX_APPLICATIONS + ".";
    qtyInput.setAttribute("aria-invalid", "true");
    outPackage.textContent = outEach.textContent = outSave.textContent = outTotal.textContent = "—";
    checkout.dataset.blocked = "true";
    return;
  }

  delete checkout.dataset.blocked;

  message.textContent = "";
  qtyInput.removeAttribute("aria-invalid");

  const pkg = packageFor(qty);
  // Work in cents so the totals are always exact
  const totalCents = Math.round(pkg.price * 100) * qty;
  const saveCents  = Math.round((basePrice - pkg.price) * 100) * qty;

  outPackage.textContent = pkg.name;
  outEach.textContent    = money(pkg.price);
  outSave.textContent    = saveCents > 0 ? money(saveCents / 100) : "$0.00";
  outTotal.textContent   = money(totalCents / 100);

  // Send the checkout button to this package's Stripe page
  checkout.href = pkg.checkout;
  outQty.textContent = qty;

  announcer.textContent = qty + " applications, " + pkg.name + " package, total " + money(totalCents / 100) + ".";
}

// Wait until typing pauses before updating the screen-reader announcement
let timer;
qtyInput.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(update, 250);
});

// "Choose ..." buttons on the package cards fill in the calculator
document.querySelectorAll("[data-qty]").forEach((button) => {
  button.addEventListener("click", () => {
    qtyInput.value = button.dataset.qty;
    update();
    // Let the page scroll to the calculator, then put the cursor in the box
    setTimeout(() => qtyInput.focus({ preventScroll: true }), 300);
  });
});

// Don't go to checkout while the number is invalid; point back to the box instead
checkout.addEventListener("click", (event) => {
  if (checkout.dataset.blocked) {
    event.preventDefault();
    qtyInput.focus();
  }
});

update();

// (i) pop-up: tap/click or Enter opens and closes it; Esc or clicking elsewhere closes it
const info    = document.querySelector(".info");
const infoBtn = document.querySelector(".info-btn");

function setInfoOpen(open) {
  info.classList.toggle("is-open", open);
  infoBtn.setAttribute("aria-expanded", String(open));
}

infoBtn.addEventListener("click", () => {
  info.classList.remove("is-dismissed");
  setInfoOpen(!info.classList.contains("is-open"));
});

// Esc closes the pop-up — even when it's only showing because the mouse is over it
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const wasOpen = info.classList.contains("is-open");
  if (wasOpen || info.matches(":hover")) {
    setInfoOpen(false);
    info.classList.add("is-dismissed");   // stays hidden until the mouse moves away
    if (wasOpen) infoBtn.focus();
  }
});

info.addEventListener("mouseleave", () => info.classList.remove("is-dismissed"));

document.addEventListener("click", (event) => {
  if (!info.contains(event.target)) setInfoOpen(false);
});
