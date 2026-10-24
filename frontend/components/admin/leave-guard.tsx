"use client";

import { App } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// Warning "Changes are not saved" for admin pages with a form (page builder, subcategory).
// While there are unsaved changes, leaving the page in any way asks first:
// - a click on any link (menu on the left, "Back to the list", logo, "Open site" in this tab...);
// - the "Log out" button;
// - the browser "Back" button;
// - closing or reloading the tab (the browser shows its own question).

const TEXT = {
  title: "Зміни не збережено",
  content: "Якщо піти зі сторінки зараз, незбережені зміни пропадуть.",
  okText: "Піти без збереження",
  cancelText: "Лишитися",
};

export function useLeaveGuard(dirty: boolean) {
  const { modal } = App.useApp();
  const router = useRouter();
  // The question is already on the screen: a second click does not open another one
  const asking = useRef(false);
  // The extra step in the history for the "Back" button is put only once per page
  const stepAdded = useRef(false);

  useEffect(() => {
    if (!dirty) return;

    const ask = (leave: () => void, stay?: () => void) => {
      if (asking.current) return;
      asking.current = true;
      modal.confirm({
        ...TEXT,
        okButtonProps: { danger: true },
        onOk: () => {
          asking.current = false;
          leave();
        },
        onCancel: () => {
          asking.current = false;
          stay?.();
        },
      });
    };

    // Links: caught before Next.js handles them
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; // opens in a new tab
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      const here = url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search;
      if (here) return;
      event.preventDefault();
      event.stopPropagation();
      ask(() => {
        if (url.origin === window.location.origin) router.push(`${url.pathname}${url.search}${url.hash}`);
        else window.location.href = url.href;
      });
    };

    // Forms that go to another address (e.g. "Log out"); forms inside the page are not touched
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.getAttribute("action")) return;
      event.preventDefault();
      event.stopPropagation();
      ask(() => form.submit());
    };

    // The browser "Back" button: an extra step in the history is put on this page, so "Back"
    // first lands here again and the question can be asked
    let leaving = false;
    if (!stepAdded.current) {
      window.history.pushState(window.history.state, "", window.location.href);
      stepAdded.current = true;
    }
    const onPopState = () => {
      if (leaving) return;
      stepAdded.current = false;
      ask(
        () => {
          leaving = true;
          window.history.back();
        },
        () => {
          window.history.pushState(window.history.state, "", window.location.href);
          stepAdded.current = true;
        },
      );
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty, modal, router]);
}
