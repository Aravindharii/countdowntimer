// Vanilla JS Countdown Timer Widget with Popup
(function () {
  'use strict';

  const CountdownTimer = {
    init: function () {
      const target = document.getElementById('countdown-timer-root');
      if (!target) return;

      let productId = target.dataset.productId;
      const shopDomain = target.dataset.shopDomain;

      // Fallback: Try to get product ID from meta tags or page context
      if (!productId || productId === '') {
        // Try from window.ShopifyAnalytics if available
        if (typeof window.ShopifyAnalytics !== 'undefined') {
          const analytics = window.ShopifyAnalytics;
          if (analytics.meta && analytics.meta.product && analytics.meta.product.id) {
            productId = String(analytics.meta.product.id);
          }
        }

        // If still no product ID, show error
        if (!productId || productId === '') {
          console.warn('Could not detect product ID from page context');
          target.innerHTML = `
            <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #856404;">⚠️ Unable to detect product ID</p>
              <p style="margin: 10px 0 0 0; font-size: 0.8em; color: #666;">Make sure this block is added to a product page</p>
            </div>
          `;
          return;
        }
      }

      console.log('Product ID detected:', productId);
      this.fetchTimerData(productId, shopDomain, target);
    },

    fetchTimerData: function (productId, shopDomain, target) {
      // Try both numeric ID and GID format
      const productGid = target.dataset.productGid || `gid://shopify/Product/${productId}`;

      console.log('Fetching timer data:', { productId, productGid, shopDomain });

      // Try with GID first
      const url = `/apps/countdown/api/proxy/timer?shop=${shopDomain}&product=${encodeURIComponent(productGid)}`;
      console.log('Fetching from:', url);

      fetch(url)
        .then(async res => {
          console.log('Response status:', res.status);
          const text = await res.text();
          console.log('Response body:', text);

          if (res.ok) {
            try {
              return JSON.parse(text);
            } catch (e) {
              console.error('JSON parse error:', e);
              throw new Error('Invalid JSON response from server');
            }
          }

          // If GID fails, try with numeric ID
          // Note: We already consumed the stream with res.text(), so we can't clone it easily for the fallback if we wanted to reuse it, 
          // but here we are making a NEW fetch request anyway.
          return fetch(`/apps/countdown/api/proxy/timer?shop=${shopDomain}&product=${productId}`)
            .then(async res => {
              const text = await res.text();
              console.log('Raw response:', text.substring(0, 200)); // Log first 200 chars

              if (!res.ok) {
                console.log('Server returned error:', res.status, res.statusText);
                throw new Error(`HTTP error! status: ${res.status}`);
              }

              try {
                return JSON.parse(text);
              } catch (e) {
                console.error('Failed to parse JSON:', e);
                throw new Error('Invalid JSON response from server');
              }
            });
        })
        .then(data => {
          console.log('Timer data received:', data);
          this.renderTimer(data, target);
          this.startCountdown(data, target);
        })
        .catch(err => {
          console.error('Timer widget error:', err);
          target.innerHTML = `
            <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #856404;">⚠️ No active countdown timer for this product</p>
              <p style="margin: 10px 0 0 0; font-size: 0.8em; color: #666;">Create a timer in the app admin to display it here</p>
            </div>
          `;
        });
    },

    renderTimer: function (timerData, target) {
      const fontSize = timerData.settings.size === 'Large' ? '2em' :
        timerData.settings.size === 'Small' ? '1.2em' : '1.5em';

      target.innerHTML = `
        <style>
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
            70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
          }
          .countdown-popup-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 9999;
            justify-content: center;
            align-items: center;
          }
          .countdown-popup-overlay.active {
            display: flex;
          }
          .countdown-popup {
            background: white;
            padding: 40px;
            border-radius: 16px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: popupSlide 0.3s ease-out;
          }
          @keyframes popupSlide {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .countdown-popup h2 {
            color: #ff0000;
            margin: 0 0 20px 0;
            font-size: 1.8em;
          }
          .countdown-popup-close {
            background: #333;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            margin-top: 20px;
          }
          .countdown-popup-close:hover {
            background: #000;
          }
        </style>
        <div class="countdown-timer-container" style="
          color: ${timerData.settings.color};
          padding: 20px;
          border: 1px solid #e1e3e5;
          border-radius: 12px;
          text-align: center;
          background-color: white;
          margin: 20px auto;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          max-width: 400px;
        ">
          <div style="text-transform: uppercase; font-size: 0.8em; letter-spacing: 1px; margin-bottom: 10px; color: #666;">
            Your Special Offer Ends In
          </div>
          <div class="timer-display" style="font-size: ${fontSize}; font-weight: bold; font-family: monospace;">
            Loading...
          </div>
          ${timerData.description ? `<div style="margin-top: 10px; font-size: 0.9em;">${timerData.description}</div>` : ''}
          <div class="urgency-banner" style="display: none; background-color: #ffea8a; color: #4a4a4a; padding: 5px; margin-top: 10px; border-radius: 4px; font-size: 0.8em;">
            Hurry! Offer ends soon!
          </div>
        </div>
        <div class="countdown-popup-overlay" id="countdown-popup">
          <div class="countdown-popup">
            <h2>⏰ HURRY! TIME IS RUNNING OUT!</h2>
            <p style="font-size: 1.2em; margin: 20px 0;">This special offer expires in:</p>
            <div class="popup-timer-display" style="font-size: 2em; font-weight: bold; color: #ff0000; font-family: monospace; margin: 20px 0;"></div>
            <p style="font-size: 1em; color: #666;">Don't miss out on this amazing deal!</p>
            <button class="countdown-popup-close">Continue Shopping</button>
          </div>
        </div>
      `;
    },

    startCountdown: function (timerData, target) {
      let popupShown = false;
      const container = target.querySelector('.countdown-timer-container');
      const timerDisplay = target.querySelector('.timer-display');
      const urgencyBanner = target.querySelector('.urgency-banner');
      const popup = target.querySelector('#countdown-popup');
      const popupTimer = target.querySelector('.popup-timer-display');
      const closeBtn = target.querySelector('.countdown-popup-close');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          popup.classList.remove('active');
        });
      }

      const interval = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(timerData.endDate).getTime();
        const distance = end - now;

        if (distance < 0) {
          clearInterval(interval);
          timerDisplay.textContent = 'EXPIRED';
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        timerDisplay.textContent = timeString;
        if (popupTimer) popupTimer.textContent = timeString;

        // Urgency check
        const minutesLeft = distance / (1000 * 60);
        if (minutesLeft <= timerData.settings.urgencyTriggerMinutes) {
          // Show popup once
          if (!popupShown && popup) {
            popup.classList.add('active');
            popupShown = true;
          }

          // Apply urgency effects
          if (timerData.settings.urgencyNotificationType === 'Color pulse') {
            container.style.backgroundColor = '#fff0f0';
            container.style.animation = 'pulse 2s infinite';
          } else if (timerData.settings.urgencyNotificationType === 'Notification banner') {
            urgencyBanner.style.display = 'block';
          }
        }
      }, 1000);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CountdownTimer.init());
  } else {
    CountdownTimer.init();
  }
})();