/* =========================================================
   JAO — contact form (FAQ & Contact page only)
   ---------------------------------------------------------
   Sends the form to Web3Forms in the background, then swaps
   the form for a thank-you message without leaving the page.
   If this script doesn't load, the form still works: it just
   shows Web3Forms' own "success" page instead.
   ========================================================= */

const form       = document.getElementById("contact-form");
const errorBox   = document.getElementById("form-error");
const success    = document.getElementById("form-success");
const sendButton = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  sendButton.disabled = true;
  sendButton.textContent = "Sending…";

  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const result = await response.json();

    if (!result.success) throw new Error(result.message);

    // Show the thank-you message and move focus to it (so screen readers announce it)
    form.reset();
    form.hidden = true;
    success.hidden = false;
    success.focus();
  } catch (error) {
    errorBox.textContent = "Sorry, your message couldn't be sent. Please check your connection and try again, or email us at hello@example.com."; // TODO: real email
    errorBox.hidden = false;
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "Send Message";
  }
});

// "Send another message" brings the empty form back
document.getElementById("send-another").addEventListener("click", () => {
  success.hidden = true;
  form.hidden = false;
  document.getElementById("name").focus();
});
