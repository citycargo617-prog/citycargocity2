/**
 * CITY CARGO — HIGH-PERFORMANCE INTERACTIVE ENGINE
 * Real-time Freight Fare Calculation, Live Telemetry GPS Tracking, 
 * Dynamic Glass Theme Switcher, and Booking Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initFareCalculator();
  initRadarTracking();
  initFleetShowcase();
  initReviewsFilter();
  initModals();
  initScrollEffects();
  initHeroVideo();
});

/* ==========================================================================
   1. THEME PALETTE ENGINE (Cyber Cyan, Emerald, Amethyst, Solar Amber)
   ========================================================================== */
function initThemeEngine() {
  const themeBtn = document.getElementById('themeBtn');
  const themeMenu = document.getElementById('themeMenu');
  const themeOptions = document.querySelectorAll('.theme-option');

  // Load saved theme or default to cyber sapphire
  const savedTheme = localStorage.getItem('citycargo_theme') || 'cyan';
  applyTheme(savedTheme);

  if (themeBtn && themeMenu) {
    themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      themeMenu.classList.remove('show');
    });

    themeOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const theme = opt.dataset.theme;
        applyTheme(theme);
        localStorage.setItem('citycargo_theme', theme);
        themeMenu.classList.remove('show');
        showToast(`Theme switched to ${opt.textContent.trim()}`);
      });
    });
  }
}

function applyTheme(theme) {
  if (theme === 'cyan') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

/* ==========================================================================
   2. CITY DISTANCE MATRIX & DYNAMIC FREIGHT CALCULATOR
   ========================================================================== */
const DISTANCE_MATRIX = {
  'delhi-jaipur': 280,
  'delhi-mumbai': 1420,
  'delhi-lucknow': 550,
  'delhi-bengaluru': 2160,
  'delhi-ahmedabad': 940,
  'delhi-pune': 1450,
  'delhi-kolkata': 1530,
  'delhi-hyderabad': 1570,
  'delhi-chennai': 2200,
  'delhi-indore': 820,
  'delhi-surat': 1180,
  'mumbai-pune': 150,
  'mumbai-ahmedabad': 530,
  'mumbai-surat': 285,
  'mumbai-bengaluru': 980,
  'mumbai-hyderabad': 710,
  'mumbai-chennai': 1330,
  'mumbai-kolkata': 1960,
  'mumbai-jaipur': 1150,
  'mumbai-lucknow': 1380,
  'bengaluru-hyderabad': 570,
  'bengaluru-chennai': 350,
  'bengaluru-pune': 840,
  'bengaluru-ahmedabad': 1500,
  'bengaluru-kolkata': 1870,
  'hyderabad-chennai': 630,
  'hyderabad-pune': 560,
  'hyderabad-kolkata': 1480,
  'kolkata-lucknow': 990,
  'kolkata-patna': 580,
  'jaipur-ahmedabad': 660,
  'jaipur-lucknow': 570,
  'lucknow-kanpur': 85,
  'lucknow-patna': 530
};

const TRUCK_RATES = {
  'tata-ace': { name: 'Tata Ace (1.5 Ton)', ratePerKm: 28, minFare: 2200, speed: 50 },
  'pickup-14ft': { name: '14ft Eicher (4 Ton)', ratePerKm: 42, minFare: 4500, speed: 55 },
  'truck-19ft': { name: '19ft Heavy Haul (9 Ton)', ratePerKm: 65, minFare: 8500, speed: 55 },
  'container-24ft': { name: '24ft Container (14 Ton)', ratePerKm: 85, minFare: 13500, speed: 52 },
  'trailer-32ft': { name: '32ft Multi-Axle Trailer (25 Ton)', ratePerKm: 115, minFare: 21000, speed: 48 }
};

const GOODS_MULTIPLIERS = {
  'general': 1.0,
  'industrial': 1.05,
  'electronics': 1.12,
  'textiles': 1.02,
  'fragile': 1.15,
  'pharma': 1.08,
  'fmcg': 1.0
};

let currentCalculatedFare = null;
let isBankDiscountApplied = false;

function getDistanceBetween(origin, dest) {
  if (origin === dest) return 35; // Intra-city local transport
  const key1 = `${origin}-${dest}`.toLowerCase();
  const key2 = `${dest}-${origin}`.toLowerCase();
  if (DISTANCE_MATRIX[key1]) return DISTANCE_MATRIX[key1];
  if (DISTANCE_MATRIX[key2]) return DISTANCE_MATRIX[key2];

  // Dynamic estimate based on arbitrary city pairs
  return Math.floor(Math.random() * 600) + 400;
}

function initFareCalculator() {
  const originSelect = document.getElementById('pickupCity');
  const destSelect = document.getElementById('dropCity');
  const vehicleSelect = document.getElementById('vehicleType');
  const goodsSelect = document.getElementById('goodsType');
  const insuranceToggle = document.getElementById('insuranceToggle');
  const calcBtn = document.getElementById('calcRateBtn');
  const quoteCard = document.getElementById('liveQuoteCard');

  // Interactive Route Swap Button
  const swapBtn = document.getElementById('swapCitiesBtn');
  if (swapBtn && originSelect && destSelect) {
    swapBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentOrigin = originSelect.value;
      const currentDest = destSelect.value;
      originSelect.value = currentDest;
      destSelect.value = currentOrigin;
      swapBtn.classList.add('rotated');
      setTimeout(() => swapBtn.classList.remove('rotated'), 350);
      if (quoteCard && quoteCard.classList.contains('active')) {
        computeFare();
      }
    });
  }

  // Corridor chips click prefill
  const corridorChips = document.querySelectorAll('.corridor-chip');
  corridorChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const from = chip.dataset.from;
      const to = chip.dataset.to;
      if (originSelect && destSelect) {
        originSelect.value = from;
        destSelect.value = to;
        computeFare();
      }
    });
  });

  if (calcBtn) {
    calcBtn.addEventListener('click', (e) => {
      e.preventDefault();
      computeFare();
    });
  }

  // Auto-recalculate on changes if quote is already visible
  [originSelect, destSelect, vehicleSelect, goodsSelect, insuranceToggle].forEach(el => {
    if (el) {
      el.addEventListener('change', () => {
        if (quoteCard && quoteCard.classList.contains('active')) {
          computeFare();
        }
      });
    }
  });

  // Booking Tab switching (Full Truck Load, Part Load, Packers & Movers)
  const bookingTabs = document.querySelectorAll('.booking-tab');
  bookingTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      bookingTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const serviceType = tab.dataset.service;
      handleServiceTabChange(serviceType);
    });
  });

  // Instant Dispatch Trigger from quote card
  const instantDispatchBtn = document.getElementById('instantDispatchBtn');
  if (instantDispatchBtn) {
    instantDispatchBtn.addEventListener('click', () => {
      openBookingModal();
    });
  }
}

function handleServiceTabChange(serviceType) {
  const vehicleGroup = document.getElementById('vehicleGroup');
  const vehicleLabel = document.getElementById('vehicleLabel');
  
  if (serviceType === 'ptl') {
    if (vehicleLabel) vehicleLabel.textContent = 'Cargo Weight / Volume';
    showToast('Switched to Part Load (PTL) mode. Pay only for used space.');
  } else if (serviceType === 'movers') {
    if (vehicleLabel) vehicleLabel.textContent = 'Home / Office Relocation Type';
    showToast('Packers & Movers mode selected. End-to-end packing included.');
  } else {
    if (vehicleLabel) vehicleLabel.textContent = 'Vehicle Capacity Class';
  }
}

function computeFare() {
  const origin = document.getElementById('pickupCity')?.value || 'delhi';
  const dest = document.getElementById('dropCity')?.value || 'jaipur';
  const vehicleKey = document.getElementById('vehicleType')?.value || 'tata-ace';
  const goodsKey = document.getElementById('goodsType')?.value || 'general';
  const hasInsurance = document.getElementById('insuranceToggle')?.checked ?? true;
  const quoteCard = document.getElementById('liveQuoteCard');

  const distance = getDistanceBetween(origin, dest);
  const truck = TRUCK_RATES[vehicleKey] || TRUCK_RATES['tata-ace'];
  const goodsMultiplier = GOODS_MULTIPLIERS[goodsKey] || 1.0;

  // Base freight
  let baseFreight = Math.max(truck.minFare, Math.round(distance * truck.ratePerKm * goodsMultiplier));
  
  // Fuel & Highway Toll estimated surcharge
  const tollAndSurcharge = Math.round(distance * 3.8);

  // Transit Insurance (Goods Protection)
  const insuranceFee = hasInsurance ? (distance > 800 ? 599 : 299) : 0;

  // Total
  let totalNet = baseFreight + tollAndSurcharge + insuranceFee;

  // If Bank discount applied
  if (isBankDiscountApplied) {
    totalNet = Math.round(totalNet * 0.85);
  }

  // Estimated Transit Time
  const hours = (distance / truck.speed).toFixed(1);
  let timeStr = `${hours} hrs`;
  if (parseFloat(hours) > 24) {
    const days = (parseFloat(hours) / 24).toFixed(1);
    timeStr = `${days} Days`;
  }

  // Save current fare object for modal
  currentCalculatedFare = {
    origin: capitalize(origin),
    dest: capitalize(dest),
    distance,
    timeStr,
    truckName: truck.name,
    baseFreight,
    tollAndSurcharge,
    insuranceFee,
    totalNet,
    trucksAvailable: Math.floor(Math.random() * 12) + 8
  };

  // Update UI Elements
  const quoteRoute = document.getElementById('quoteRoute');
  const quoteDistance = document.getElementById('quoteDistance');
  const quoteTime = document.getElementById('quoteTime');
  const quoteAvailable = document.getElementById('quoteAvailable');
  const quotePrice = document.getElementById('quotePrice');

  if (quoteRoute) quoteRoute.textContent = `${capitalize(origin)} → ${capitalize(dest)}`;
  if (quoteDistance) quoteDistance.textContent = `${distance} km`;
  if (quoteTime) quoteTime.textContent = timeStr;
  if (quoteAvailable) quoteAvailable.textContent = `${currentCalculatedFare.trucksAvailable} Trucks`;
  if (quotePrice) quotePrice.textContent = `₹${totalNet.toLocaleString('en-IN')}`;

  if (quoteCard) {
    quoteCard.classList.add('active');
    quoteCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  showToast(`Real-time quote synced: ₹${totalNet.toLocaleString('en-IN')} (${distance} km)`);
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ==========================================================================
   3. LIVE GPS TELEMETRY & SHIPMENT RADAR SIMULATOR
   ========================================================================== */
const SAMPLE_SHIPMENTS = {
  'CC-9482': {
    lrNumber: 'CC-9482',
    from: 'Delhi Logistics Park',
    to: 'Jaipur Industrial Area',
    vehicle: 'HR-55-AN-3914 (19ft Container)',
    driver: 'Rajesh Singh',
    driverPhone: '+91 96514 29006',
    status: 'In Highway Transit',
    speed: 68,
    progress: 72,
    eta: '3h 15m remaining',
    temp: '22°C Monitored',
    fuel: '76% Full Tank',
    milestones: [
      { name: 'Order Dispatched', done: true, time: '06:30 AM' },
      { name: 'Gurugram Toll', done: true, time: '08:15 AM' },
      { name: 'Kotputli Hub', done: true, time: '11:40 AM' },
      { name: 'Jaipur Arrival', done: false, time: '02:55 PM' }
    ]
  },
  'CC-5104': {
    lrNumber: 'CC-5104',
    from: 'Mumbai JNPT Port',
    to: 'Pune Hinjewadi Phase 2',
    vehicle: 'MH-12-QX-8821 (14ft Eicher)',
    driver: 'Suresh Verma',
    driverPhone: '+91 96514 29006',
    status: 'Out for Final Delivery',
    speed: 46,
    progress: 88,
    eta: '45 mins remaining',
    temp: 'Ambient Normal',
    fuel: '84%',
    milestones: [
      { name: 'Loaded JNPT', done: true, time: '05:00 AM' },
      { name: 'Expressway Toll', done: true, time: '07:20 AM' },
      { name: 'Talegaon Check', done: true, time: '09:00 AM' },
      { name: 'Hinjewadi Gate', done: false, time: '10:15 AM' }
    ]
  },
  'CC-7721': {
    lrNumber: 'CC-7721',
    from: 'Bengaluru Peenya',
    to: 'Hyderabad Shamshabad',
    vehicle: 'KA-04-MB-7023 (32ft Multi-Axle)',
    driver: 'Mahesh Yadav',
    driverPhone: '+91 97218 00444',
    status: 'Inter-State Highway Transit',
    speed: 62,
    progress: 45,
    eta: '6h 40m remaining',
    temp: '20°C Reefer Stable',
    fuel: '69%',
    milestones: [
      { name: 'Loaded Bengaluru', done: true, time: '03:00 AM' },
      { name: 'Anantapur Hub', done: true, time: '08:30 AM' },
      { name: 'Kurnool Toll', done: false, time: '01:15 PM' },
      { name: 'Hyderabad Dock', done: false, time: '05:45 PM' }
    ]
  }
};

let activeTelemetryInterval = null;

function initRadarTracking() {
  const searchBtn = document.getElementById('trackSearchBtn');
  const searchInput = document.getElementById('trackingInput');

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim().toUpperCase();
      loadShipmentTelemetry(query);
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim().toUpperCase();
        loadShipmentTelemetry(query);
      }
    });
  }

  // Load default demo shipment CC-9482
  loadShipmentTelemetry('CC-9482');

  // Start realistic telemetry fluctuations
  startDynamicTelemetryDials();
}

function loadShipmentTelemetry(lrCode) {
  let shipment = SAMPLE_SHIPMENTS[lrCode];
  
  if (!shipment) {
    // Generate simulated dynamic shipment for arbitrary queries
    shipment = {
      lrNumber: lrCode || 'CC-9482',
      from: 'Origin Logistics Center',
      to: 'Destination Warehouse',
      vehicle: 'DL-01-AX-9921 (GPS Verified)',
      driver: 'Verified Partner Driver',
      driverPhone: '+91 96514 29006',
      status: 'Live Satellite Tracking Active',
      speed: 64,
      progress: 60,
      eta: '4h 10m remaining',
      temp: 'Optimal Standard',
      fuel: '78%',
      milestones: [
        { name: 'Consignment Loaded', done: true, time: 'Picked Up' },
        { name: 'Highway Transit', done: true, time: 'Active' },
        { name: 'Regional Hub', done: false, time: 'En Route' },
        { name: 'Consignee Gate', done: false, time: 'Expected' }
      ]
    };
  }

  // Update Radar UI
  const lrDisplay = document.getElementById('telemetryLr');
  const routeDisplay = document.getElementById('telemetryRoute');
  const statusDisplay = document.getElementById('telemetryStatus');
  const progressBar = document.getElementById('radarProgressBarFill');
  const speedDisplay = document.getElementById('telemetrySpeed');
  const etaDisplay = document.getElementById('telemetryEta');
  const driverName = document.getElementById('telemetryDriver');
  const vehicleNumber = document.getElementById('telemetryVehicle');
  const fuelDisplay = document.getElementById('telemetryFuel');

  if (lrDisplay) lrDisplay.textContent = shipment.lrNumber;
  if (routeDisplay) routeDisplay.textContent = `${shipment.from} → ${shipment.to}`;
  if (statusDisplay) statusDisplay.textContent = shipment.status;
  if (progressBar) progressBar.style.width = `${shipment.progress}%`;
  if (speedDisplay) speedDisplay.textContent = `${shipment.speed} km/h`;
  if (etaDisplay) etaDisplay.textContent = shipment.eta;
  if (driverName) driverName.textContent = shipment.driver;
  if (vehicleNumber) vehicleNumber.textContent = shipment.vehicle;
  if (fuelDisplay) fuelDisplay.textContent = shipment.fuel;

  showToast(`GPS Telemetry updated for ${shipment.lrNumber}`);
}

function startDynamicTelemetryDials() {
  if (activeTelemetryInterval) clearInterval(activeTelemetryInterval);

  activeTelemetryInterval = setInterval(() => {
    const speedDisplay = document.getElementById('telemetrySpeed');
    if (speedDisplay) {
      // Fluctuating real-time highway speeds between 58 and 72 km/h
      const newSpeed = Math.floor(Math.random() * 14) + 58;
      speedDisplay.textContent = `${newSpeed} km/h`;
    }
  }, 3500);
}

/* ==========================================================================
   4. FLEET SHOWCASE PREVIEWS & SELECTOR
   ========================================================================== */
function initFleetShowcase() {
  const fleetButtons = document.querySelectorAll('.fleet-tab-btn');
  const truckCards = document.querySelectorAll('.truck-card');

  fleetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      fleetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      truckCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // "Book This Truck" buttons inside fleet cards
  const bookTruckBtns = document.querySelectorAll('.book-truck-btn');
  bookTruckBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const truckType = btn.dataset.truckType;
      const vehicleSelect = document.getElementById('vehicleType');
      if (vehicleSelect && truckType) {
        vehicleSelect.value = truckType;
      }
      const bookingSection = document.getElementById('heroBookingSection');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
        computeFare();
      }
    });
  });
}

/* ==========================================================================
   5. REVIEWS & TESTIMONIALS FILTER
   ========================================================================== */
function initReviewsFilter() {
  const filterBtns = document.querySelectorAll('.review-filter-btn');
  const reviewCards = document.querySelectorAll('.review-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.category;
      reviewCards.forEach(card => {
        if (category === 'all' || card.dataset.type === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   6. INTERACTIVE MODALS (BOOKING, PARTNER, BANK DISCOUNT)
   ========================================================================== */
function initModals() {
  // Close modal backdrops
  const modalBackdrops = document.querySelectorAll('.modal-backdrop');
  modalBackdrops.forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeAllModals();
      }
    });
  });

  const closeBtns = document.querySelectorAll('.modal-close-btn');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  // Bank Privilege Modal Trigger
  const bankPrivilegeBtn = document.getElementById('bankPrivilegeBtn');
  const bankModal = document.getElementById('bankModal');
  if (bankPrivilegeBtn && bankModal) {
    bankPrivilegeBtn.addEventListener('click', () => {
      openModal('bankModal');
    });
  }

  // Truck Owner Partner Modal Trigger
  const partnerBtns = document.querySelectorAll('.partner-modal-trigger');
  partnerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      openModal('partnerModal');
    });
  });

  // Verify Bank Form
  const verifyBankForm = document.getElementById('verifyBankForm');
  if (verifyBankForm) {
    verifyBankForm.addEventListener('submit', (e) => {
      e.preventDefault();
      isBankDiscountApplied = true;
      closeAllModals();
      showToast('🎉 Bank Employee 15% Discount Verified & Applied to Fare!');
      computeFare();
    });
  }

  // Partner Registration Form
  const partnerForm = document.getElementById('partnerRegisterForm');
  if (partnerForm) {
    partnerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      closeAllModals();
      showToast('✅ Truck Owner details submitted. Dispatch team will verify RTO docs within 15 mins.');
    });
  }

  // Confirm Booking in Modal
  const confirmBookingBtn = document.getElementById('modalConfirmDispatchBtn');
  if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener('click', () => {
      closeAllModals();
      showToast('🚀 Vehicle Assigned! Dispatch tracking link sent via SMS & WhatsApp.');
    });
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeAllModals() {
  const modals = document.querySelectorAll('.modal-backdrop');
  modals.forEach(m => m.classList.remove('active'));
  document.body.style.overflow = 'auto';
}

function openBookingModal() {
  if (!currentCalculatedFare) {
    computeFare();
  }

  const modal = document.getElementById('bookingModal');
  if (!modal) return;

  const refNumber = `CC-${Math.floor(1000 + Math.random() * 9000)}`;
  const phone = document.getElementById('contactPhone')?.value || '+91 96514 29006';

  document.getElementById('modalBookingRef').textContent = refNumber;
  document.getElementById('modalRoute').textContent = `${currentCalculatedFare.origin} → ${currentCalculatedFare.dest}`;
  document.getElementById('modalVehicle').textContent = currentCalculatedFare.truckName;
  document.getElementById('modalDistance').textContent = `${currentCalculatedFare.distance} km (${currentCalculatedFare.timeStr})`;
  document.getElementById('modalPrice').textContent = `₹${currentCalculatedFare.totalNet.toLocaleString('en-IN')}`;
  document.getElementById('modalPhone').textContent = phone;

  openModal('bookingModal');
}

/* ==========================================================================
   7. SCROLL EFFECTS, FLOATING BUTTONS & TOASTS
   ========================================================================== */
function initScrollEffects() {
  const navbar = document.getElementById('mainNavbar');
  const backToTop = document.getElementById('backToTop');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      if (navbar) navbar.classList.add('scrolled');
      if (backToTop) backToTop.classList.add('visible');
    } else {
      if (navbar) navbar.classList.remove('scrolled');
      if (backToTop) backToTop.classList.remove('visible');
    }
  });

  if (backToTop) {
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      if (navLinks.classList.contains('active')) {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'rgba(7, 10, 18, 0.98)';
        navLinks.style.padding = '1.5rem';
        navLinks.style.borderBottom = '1px solid var(--border-glass)';
      } else {
        navLinks.style.display = 'none';
      }
    });
  }

  // Smooth scroll for nav anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navLinks && navLinks.classList.contains('active')) {
          navLinks.classList.remove('active');
          navLinks.style.display = 'none';
        }
      }
    });
  });
}

function showToast(message) {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'glass-toast';
  toast.innerHTML = `
    <span style="color: var(--theme-primary);">⚡</span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================================
   8. HERO VIDEO SOUND & PLAYBACK CONTROLS
   ========================================================================== */
function initHeroVideo() {
  const video = document.getElementById('heroTruckVideo');
  const soundBtn = document.getElementById('videoSoundBtn');
  const playBtn = document.getElementById('videoPlayBtn');
  const soundIcon = document.getElementById('soundIcon');
  const playIcon = document.getElementById('playIcon');

  if (!video) return;

  if (soundBtn && soundIcon) {
    soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      if (video.muted) {
        soundIcon.textContent = '🔇';
        soundBtn.title = 'Unmute Sound';
        showToast('Video muted');
      } else {
        soundIcon.textContent = '🔊';
        soundBtn.title = 'Mute Sound';
        showToast('Video unmuted 🔊');
      }
    });
  }

  if (playBtn && playIcon) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (video.paused) {
        video.play();
        playIcon.textContent = '⏸️';
        playBtn.title = 'Pause Video';
      } else {
        video.pause();
        playIcon.textContent = '▶️';
        playBtn.title = 'Play Video';
      }
    });
  }
}

