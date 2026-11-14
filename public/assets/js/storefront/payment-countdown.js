"use strict";

window.RylvaPaymentCountdown =
{
  start(element, options)
  {
    const serverTime = Date.parse(options.serverNow);
    const deadlineTime = Date.parse(options.expiresAt);
    const monotonicStart = performance.now();
    let hasExpired = false;

    function update()
    {
      const elapsedTime = performance.now() - monotonicStart;
      const remainingSeconds = Math.max(
        0,
        Math.ceil((deadlineTime - serverTime - elapsedTime) / 1000)
      );

      if (!Number.isFinite(remainingSeconds))
      {
        element.textContent = "Belum tersedia";
        return;
      }

      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      element.textContent = String(minutes).padStart(2, "0")
        + ":" + String(seconds).padStart(2, "0");

      if (remainingSeconds === 0 && !hasExpired)
      {
        hasExpired = true;
        options.onDeadline?.();
      }
    }

    const intervalId = window.setInterval(update, 1000);
    update();
    return () =>
    {
      window.clearInterval(intervalId);
    };
  }
};
