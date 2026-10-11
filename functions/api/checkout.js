/* =========================================================
   JAO — checkout (Cloudflare Pages Function at /api/checkout)
   ---------------------------------------------------------
   The package buttons on Services & Pricing send the chosen
   package and add-ons here. This function looks up the official
   Stripe prices below (the website can never set a price), asks
   Stripe for a checkout with exactly those items, and sends back
   the checkout page address.

   The Stripe key is NOT in this file. It is stored privately in
   Cloudflare: Workers & Pages → (this project) → Settings →
   Variables and Secrets → STRIPE_SECRET_KEY
     - Production: live restricted key (rk_live_…)
     - Preview:    sandbox restricted key (rk_test_…)
   This file picks the matching price list from the kind of key.

   HOW TO EDIT PRICES: change the price in Stripe (add a new price,
   make it the default), then paste its new price_… ID below.
   ========================================================= */

const PRICES = {
  live: {
    packages: {
      kickstart: "price_1UPEA50g0ANURFguRlZNGgLV",   // $80, 10 applications
      sprint:    "price_1UPEBX0g0ANURFguXTgWv1JZ",   // $169, 25 applications
      executive: "price_1UPECU0g0ANURFgu6Gfiou7R"    // $299, 50 applications
    },
    coverLetters: {                                   // matched to the package
      kickstart: "price_1UPEDq0g0ANURFguJ2xYBuEW",   // $19
      sprint:    "price_1UPEEW0g0ANURFgusDl6uiXx",   // $39
      executive: "price_1UPEGC0g0ANURFguryCQkfnM"    // $69
    },
    resume:   "price_1UPEGv0g0ANURFgub5q4Hlu9",      // $49 Resume Refresh
    linkedin: "price_1UPEHo0g0ANURFguedrVzZ9l"       // $49 LinkedIn Refresh
  },
  test: {
    // Sandbox price IDs (used by the Preview copy of the site with an rk_test_ key)
    packages: {
      kickstart: "SANDBOX_KICKSTART",
      sprint:    "SANDBOX_SPRINT",
      executive: "SANDBOX_EXECUTIVE"
    },
    coverLetters: {
      kickstart: "SANDBOX_COVER_KICKSTART",
      sprint:    "SANDBOX_COVER_SPRINT",
      executive: "SANDBOX_COVER_EXECUTIVE"
    },
    resume:   "SANDBOX_RESUME",
    linkedin: "SANDBOX_LINKEDIN"
  }
};

const ADD_ONS = ["cover-letters", "resume", "linkedin"];

const reply = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });

export async function onRequestPost({ request, env }) {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) return reply({ error: "Checkout isn't set up yet." }, 500);

  const prices = /^(rk|sk)_live_/.test(key) ? PRICES.live : PRICES.test;

  // Read and check what the customer picked (only known names are accepted)
  let choice;
  try { choice = await request.json(); } catch { return reply({ error: "Bad request." }, 400); }

  const pkg = String(choice.package || "");
  if (!prices.packages[pkg]) return reply({ error: "Unknown package." }, 400);

  const addOns = Array.isArray(choice.addOns) ? choice.addOns.map(String) : [];
  if (addOns.some((a) => !ADD_ONS.includes(a))) return reply({ error: "Unknown add-on." }, 400);

  const items = [prices.packages[pkg]];
  if (addOns.includes("cover-letters")) items.push(prices.coverLetters[pkg]);
  if (addOns.includes("resume")) items.push(prices.resume);
  if (addOns.includes("linkedin")) items.push(prices.linkedin);

  // Ask Stripe for a checkout page with exactly these items
  const site = new URL(request.url).origin;
  const form = new URLSearchParams();
  form.append("mode", "payment");
  items.forEach((price, i) => {
    form.append(`line_items[${i}][price]`, price);
    form.append(`line_items[${i}][quantity]`, "1");
  });
  form.append("success_url", `${site}/thank-you`);
  form.append("cancel_url", `${site}/services-pricing#packages`);
  form.append("allow_promotion_codes", "true");                  // founding-client codes
  form.append("consent_collection[terms_of_service]", "required"); // needs the Terms URL in Stripe → Public details

  const stripe = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });
  const session = await stripe.json();

  if (!stripe.ok || !session.url) {
    console.log("Stripe checkout error:", session.error && session.error.message);
    return reply({ error: "Couldn't start checkout." }, 502);
  }
  return reply({ url: session.url });
}
