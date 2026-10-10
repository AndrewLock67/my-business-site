/* =========================================================
   JAO — customer details form (thank-you page only)
   ---------------------------------------------------------
   - Shows a "tell us more" box when "Other" is chosen
   - Lets customers drag and drop files onto the upload box
   - Sends the answers and files to Web3Forms in the background,
     then swaps the form for a confirmation message.
   If this script doesn't load, the form still works: the
   "tell us more" boxes simply stay visible, and Web3Forms
   shows its own "success" page.
   ========================================================= */

const MAX_UPLOAD_MB = 5;   // total size allowed for all files together (match your Web3Forms plan)

const form      = document.getElementById("onboarding-form");
const errorBox  = document.getElementById("ob-error");
const success   = document.getElementById("ob-success");
const submitBtn = form.querySelector('button[type="submit"]');
const fileInput = document.getElementById("ob-files");
const dropzone  = document.getElementById("dropzone");
const fileList  = document.getElementById("file-list");


/* ----- "Other" → show the "tell us more" box ----- */
form.querySelectorAll("select[data-other]").forEach((select) => {
  const box   = document.getElementById(select.dataset.other);
  const input = box.querySelector("input");

  function toggle() {
    const isOther = select.value === "Other";
    box.hidden = !isOther;
    input.required = isOther;          // only required when it's showing
    if (!isOther) input.value = "";
  }

  select.addEventListener("change", () => {
    toggle();
    if (select.value === "Other") input.focus();
  });
  toggle();
});


/* ----- Work experience: "Add another" shows the next box (up to 3) ----- */
const jobs   = [1, 2, 3].map((n) => document.getElementById("job-" + n));
const addJob = document.getElementById("add-job");
let jobCount = 1;   // how many work experience boxes are showing

function showJobs() {
  jobs.forEach((job, i) => {
    const showing = i < jobCount;
    job.hidden = !showing;
    // Hidden boxes are switched off, so they're never sent or checked
    job.querySelectorAll("input, textarea").forEach((field) => (field.disabled = !showing));
    // Only the last box can be removed (box 1 always stays)
    const remove = job.querySelector(".job-remove");
    if (remove) remove.hidden = i !== jobCount - 1;
  });
  addJob.hidden = jobCount >= jobs.length;
}

addJob.addEventListener("click", () => {
  jobCount++;
  showJobs();
  jobs[jobCount - 1].querySelector("input").focus();
});

jobs.forEach((job) => {
  const remove = job.querySelector(".job-remove");
  if (!remove) return;
  remove.addEventListener("click", () => {
    job.querySelectorAll("input, textarea").forEach((field) => (field.value = ""));
    jobCount--;
    showJobs();
    addJob.hidden ? jobs[jobCount - 1].querySelector("input").focus() : addJob.focus();
  });
});

showJobs();


/* ----- File upload box ----- */
const totalMB = (files) => [...files].reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);

function showFiles() {
  fileList.innerHTML = "";
  for (const file of fileInput.files) {
    const item = document.createElement("li");
    item.textContent = file.name + " (" + Math.max(1, Math.round(file.size / 1024)) + " KB)";
    fileList.appendChild(item);
  }
  // Too big? Tell the browser, so it blocks sending and shows the message
  fileInput.setCustomValidity(
    totalMB(fileInput.files) > MAX_UPLOAD_MB
      ? "Your files add up to more than " + MAX_UPLOAD_MB + " MB. Please choose smaller files."
      : ""
  );
}

fileInput.addEventListener("change", showFiles);

["dragenter", "dragover"].forEach((type) =>
  dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragging");
  })
);

["dragleave", "drop"].forEach((type) =>
  dropzone.addEventListener(type, () => dropzone.classList.remove("is-dragging"))
);

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  if (event.dataTransfer.files.length) {
    fileInput.files = event.dataTransfer.files;
    showFiles();
  }
});


/* ----- Send ----- */
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  try {
    // FormData (not JSON) so the files are included
    const response = await fetch(form.action, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form)
    });
    const result = await response.json();

    if (!result.success) throw new Error(result.message);

    // Show the confirmation and move focus to it (so screen readers announce it)
    form.hidden = true;
    success.hidden = false;
    success.focus();
  } catch (error) {
    errorBox.textContent = "Sorry, your details couldn't be sent. Please check your connection and try again, or email them to support@jobappoffice.com.";
    errorBox.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit My Details";
  }
});
