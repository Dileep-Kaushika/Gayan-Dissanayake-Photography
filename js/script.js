// Helpers
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', () => {

  // ✅ Firebase init (ADD THIS HERE)
  const firebaseConfig = {
    apiKey: "AIzaSyC1Olo4qZivm6z7FV_896mVZTLdzkHoHmc",
    authDomain: "gd-ph-53a6f.firebaseapp.com",
    databaseURL: "https://gd-ph-53a6f-default-rtdb.firebaseio.com",
    projectId: "gd-ph-53a6f",
    storageBucket: "gd-ph-53a6f.firebasestorage.app",
    messagingSenderId: "236376174800",
    appId: "1:236376174800:web:6c60a7571055800b6a2ed5"
  };

  firebase.initializeApp(firebaseConfig);
  const messagesRef = firebase.database().ref("contactMessages");


  // Navbar
  const hamburger = $('#hamburger');
  const navMenu = $('#navMenu');
  const navbar = $('#navbar');
  const navLinks = $$('.nav-link');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetEl = $(targetId);
      if (targetEl) {
        const offsetTop = targetEl.offsetTop - 70;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
      hamburger?.classList.remove('active');
      navMenu?.classList.remove('active');
    });
  });

  function updateActiveNavLink() {
    const sections = $$('section[id]');
    const scrollPos = window.scrollY + 100;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(l => {
          l.classList.remove('active');
          if (l.getAttribute('href') === `#${id}`) l.classList.add('active');
        });
      }
    });
  }
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
    updateActiveNavLink();
  });

  // Scroll indicator
  const scrollIndicator = $('.scroll-indicator');
  scrollIndicator?.addEventListener('click', () => {
    const about = $('#about');
    if (about) window.scrollTo({ top: about.offsetTop - 70, behavior: 'smooth' });
  });

  // Gallery Filter
  const filterBtns = $$('.filter-btn');
  const galleryGrid = $('#galleryGrid');
  const galleryItems = $$('.gallery-item', galleryGrid);

  // Assign persistent IDs for items (used by lightbox)
  galleryItems.forEach((item, i) => item.dataset.lbId = String(i));

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filterValue = btn.dataset.filter;
      galleryItems.forEach(item => {
        const match = filterValue === 'all' || item.dataset.category === filterValue;
        item.classList.toggle('hide', !match);
      });
    });
  });

  // Lightbox
  const lbModal = $('#galleryModal');
  const lbImg = $('#modalImage');
  const lbTitle = $('#modalTitle');
  const lbDesc = $('#modalDescription');
  const lbClose = $('#modalClose');
  const lbPrev = $('.lightbox-nav.prev');
  const lbNext = $('.lightbox-nav.next');

  let lbItems = []; // visible items with images
  let lbIndex = 0;

  function getVisibleImageItems() {
    const visibleItems = $$('.gallery-item', galleryGrid).filter(item => !item.classList.contains('hide'));
    const imageItems = visibleItems
      .map(item => {
        const img = $('img', item);
        if (!img) return null;
        const title = $('.gallery-overlay h3', item)?.textContent?.trim() || '';
        const desc = $('.gallery-overlay p', item)?.textContent?.trim() || '';
        const id = parseInt(item.dataset.lbId || '-1', 10);
        return { id, src: img.getAttribute('src'), title, desc };
      })
      .filter(Boolean);
    return imageItems;
  }

  function openLightboxById(id) {
    lbItems = getVisibleImageItems();
    const index = lbItems.findIndex(x => x.id === id);
    if (index === -1) return;
    lbIndex = index;
    const data = lbItems[lbIndex];
    lbImg.src = data.src;
    lbTitle.textContent = data.title;
    lbDesc.textContent = data.desc;
    lbModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    lbModal.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    lbModal.classList.remove('active');
    document.body.style.overflow = '';
    lbModal.setAttribute('aria-hidden', 'true');
  }

  function changeLightboxImage(direction) {
    if (!lbItems.length) return;
    lbIndex = (lbIndex + direction + lbItems.length) % lbItems.length;
    const data = lbItems[lbIndex];
    lbImg.src = data.src;
    lbTitle.textContent = data.title;
    lbDesc.textContent = data.desc;
  }

  // Open when clicking an image or the “view” button
  if (galleryGrid) {
    galleryGrid.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery-item');
      if (!item) return;

      const clickedImg = e.target.tagName === 'IMG';
      const clickedViewBtn = !!e.target.closest('.view-btn');
      const hasImg = !!$('img', item);
      if ((clickedImg || clickedViewBtn) && hasImg) {
        const id = parseInt(item.dataset.lbId || '-1', 10);
        openLightboxById(id);
      }
    });
  }

  lbClose?.addEventListener('click', closeLightbox);
  lbPrev?.addEventListener('click', () => changeLightboxImage(-1));
  lbNext?.addEventListener('click', () => changeLightboxImage(1));

  // Click outside to close
  lbModal?.addEventListener('click', (e) => {
    if (e.target === lbModal) closeLightbox();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!lbModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') changeLightboxImage(-1);
    if (e.key === 'ArrowRight') changeLightboxImage(1);
  });

// ✅ Contact form (Firebase)
const contactForm = $('#contactForm');
const formMessage = $('#formMessage');

contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  formMessage.style.display = 'block';
  formMessage.className = 'form-message';
  formMessage.textContent = 'Sending...';

  const fd = new FormData(contactForm);

  const data = {
    groomName: (fd.get('firstName') || '').toString().trim(),
    brideName: (fd.get('lastName') || '').toString().trim(),
    email: (fd.get('email') || '').toString().trim(),
    phone: (fd.get('phone') || '').toString().trim(),
    eventDate: (fd.get('eventDate') || '').toString().trim(),
    service: (fd.get('service') || '').toString().trim(),
    message: (fd.get('message') || '').toString().trim(),
    createdAt: firebase.database.ServerValue.TIMESTAMP
  };

  try {
    await messagesRef.push(data);

    formMessage.className = 'form-message success';
    formMessage.textContent = 'Thank you! Your message has been sent.';
    contactForm.reset();

    setTimeout(() => {
      formMessage.style.display = 'none';
    }, 5000);

  } catch (err) {
    console.error(err);
    formMessage.className = 'form-message error';
    formMessage.textContent = 'Error sending message. Please try again.';
  }
});
  // Initial
  updateActiveNavLink();
  console.log('Wedding Photography Website Loaded Successfully! 📸');
});

