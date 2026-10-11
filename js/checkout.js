/* =========================================================
   JAO — package checkout (Services & Pricing page only)
   ---------------------------------------------------------
   - Shows the add-on tick boxes on each package card
   - Keeps the card's total up to date as boxes are ticked
   - "Choose …" sends the package and add-ons to /api/checkout,
     which returns a Stripe checkout page with those items.
   If this script doesn't load, or checkout can't be started,
   the button simply opens that package's Stripe Payment Link
   (its normal link), so a sale is never blocked.
   ========================================================= */

const money = (n) => "$" + n;

document.querySelectorAll(".price-card[data-package]").forEach((card) => {
  const picks  = card.querySelector(".addon-picks");
  const total  = card.querySelector(".bundle-total");
  const button = card.querySelector("[data-checkout]");
  const boxes  = [...picks.querySelectorAll("input[type=checkbox]")];
  const label  = button.textContent;

  picks.hidden = false;
  total.hidden = false;

  // Display only: Stripe charges the official prices from the checkout function
  function updateTotal() {
    const sum = boxes.reduce((n, box) => n + (box.checked ? Number(box.dataset.price) : 0), Number(card.dataset.base));
    total.querySelector("strong").textContent = money(sum);
  }
  boxes.forEach((box) => box.addEventListener("change", updateTotal));
  updateTotal();

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    const fallback = button.href;   // the package's Stripe Payment Link
    button.setAttribute("aria-disabled", "true");
    button.textContent = "Opening secure checkout…";

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package: card.dataset.package,
          addOns: boxes.filter((box) => box.checked).map((box) => box.value)
        })
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "No checkout link");
      window.location.href = result.url;
    } catch (error) {
      window.location.href = fallback;
    }
  });

  // If the visitor comes back from checkout, reset the button
  window.addEventListener("pageshow", () => {
    button.removeAttribute("aria-disabled");
    button.textContent = label;
  });
});
