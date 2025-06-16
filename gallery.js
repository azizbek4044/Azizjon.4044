<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Azizbek | Portfolio</title>

  <!-- CSS -->
  <link rel="stylesheet" href="css/style.css" />

  <!-- JavaScript -->
  <script src="js/main.js" defer></script>
  <script src="js/contact.js" defer></script>

  <!-- Favicon (agar mavjud bo‘lsa) -->
  <link rel="icon" href="images/favicon.ico" type="image/x-icon" />
</head>
// gallery.js
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const images = document.querySelectorAll(".gallery-item");
const closeBtn = document.querySelector(".close");

images.forEach(img => {
  img.addEventListener("click", () => {
    modal.style.display = "block";
    modalImg.src = img.src;
  });
});

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target == modal) {
    modal.style.display = "none";
  }
});
