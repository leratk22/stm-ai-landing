/**
 * Поп-ап «Обсудить проект» на нативном <dialog>.
 *
 * Ссылки-триггеры ведут на #contact и остаются рабочими без JS —
 * здесь мы только перехватываем клик и открываем модалку.
 */

const texts = {
  sending: "Отправляем…",
  submit: "Отправить",
  error: "Не получилось отправить. Напишите нам в Telegram — так быстрее.",
  notConfigured: "Форма пока не подключена к обработчику заявок.",
  fillRequired: "Заполните имя и контакт и подтвердите согласие.",
};

export function initContactModal(): void {
  const dialog = document.querySelector<HTMLDialogElement>("#contact-modal");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const form = dialog.querySelector<HTMLFormElement>("[data-contact-form]");
  const formView = dialog.querySelector<HTMLElement>('[data-modal-view="form"]');
  const successView = dialog.querySelector<HTMLElement>('[data-modal-view="success"]');
  const errorBox = dialog.querySelector<HTMLElement>("[data-form-error]");
  const submitLabel = dialog.querySelector<HTMLElement>("[data-submit-label]");
  const submitButton = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  const endpoint = dialog.dataset.endpoint ?? "";

  const showError = (message: string) => {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
  };

  const clearError = () => errorBox?.classList.add("hidden");

  const open = () => {
    formView?.classList.remove("hidden");
    successView?.classList.add("hidden");
    clearError();
    dialog.showModal();
    // Фокус на первое поле, но не на мобильном: там это сразу поднимает клавиатуру
    if (window.matchMedia("(min-width: 48rem)").matches) {
      dialog.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
    }
  };

  document.querySelectorAll<HTMLAnchorElement>("[data-contact-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      open();
    });
  });

  dialog.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });

  // Клик по подложке: <dialog> отдаёт его самому диалогу, поэтому
  // отличаем по попаданию курсора в его прямоугольник
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom;
    if (!inside) dialog.close();
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    if (!form.checkValidity()) {
      showError(texts.fillRequired);
      form.reportValidity();
      return;
    }

    if (!endpoint) {
      // Честно говорим, что отправлять некуда, вместо ложного успеха
      showError(texts.notConfigured);
      console.warn("[contact-modal] PUBLIC_FORM_ENDPOINT не задан — заявка никуда не уйдёт.");
      return;
    }

    if (submitButton) submitButton.disabled = true;
    if (submitLabel) submitLabel.textContent = texts.sending;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error(String(response.status));

      form.reset();
      formView?.classList.add("hidden");
      successView?.classList.remove("hidden");
    } catch (error) {
      console.error("[contact-modal]", error);
      showError(texts.error);
    } finally {
      if (submitButton) submitButton.disabled = false;
      if (submitLabel) submitLabel.textContent = texts.submit;
    }
  });
}
