/* =========================================================
   EZApps — price calculator (Services & Pricing page only)
   ---------------------------------------------------------
   HOW TO EDIT PRICES
   Change the list below. "from" is the smallest quantity
   for that package, and "price" is the price per application.
   Keep the packages in order from smallest to largest.
   Remember to update the prices written in the HTML pages too
   (see EDITING-GUIDE.md for the full list).
   ========================================================= */

const PACKAGES = [
  { name: "Starter",     from: 1,  price: 5.00 },
  { name: "Value",       from: 11, price: 4.75 },
  { name: "Growth",      from: 26, price: 4.50 },
  { name: "Pro",         from: 76, price: 4.25 }
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
    return;
  }

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

update();

// (i) pop-up: tap/click or Enter opens and closes it; Esc or clicking elsewhere closes it
const info    = document.querySelector(".info");
const infoBtn = document.querySelector(".info-btn");

function setInfoOpen(open) {
  info.classList.toggle("is-open", open);
  infoBtn.setAttribute("aria-expanded", String(open));
}

infoBtn.addEventListener("click", () => {
  setInfoOpen(!info.classList.contains("is-open"));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && info.classList.contains("is-open")) {
    setInfoOpen(false);
    infoBtn.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!info.contains(event.target)) setInfoOpen(false);
});
