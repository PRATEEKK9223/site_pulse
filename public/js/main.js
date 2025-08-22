// // Minimal client-side JS (could be extended)
// document.getElementById && (() => {
//   const form = document.getElementById('scanForm');
//   if (!form) return;
//   form.addEventListener('submit', () => {
//     const btn = form.querySelector('button[type="submit"]');
//     if (btn) btn.textContent = 'Scanning...';
//   });
// })();


// main.js

// URL validation when submitting the scan form
document.getElementById('scanForm').addEventListener('submit', function(e) {
    const urlInput = document.getElementById('urlInput').value.trim();

    // Basic URL regex pattern
    const urlPattern = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)(\/[\w\-./?%&=]*)?$/i;

    if (!urlPattern.test(urlInput)) {
        e.preventDefault(); // Stop form submission
        alert('Invalid URL! Please enter a valid URL like https://example.com');
        return false;
    }
});

