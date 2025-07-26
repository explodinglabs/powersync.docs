"use strict";
(() => {
  // src/domSubscriber.ts
  var programmaticEvents = {};
  function withProgrammaticEvent(eventType, callback) {
    programmaticEvents[eventType] = true;
    requestAnimationFrame(() => {
      programmaticEvents[eventType] = false;
    });
    callback();
  }
  var dispatchers = {
    change: (el, _) => {
      el.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    },
    click: (el) => {
      el.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
    },
    input: (el, params) => {
      if (el instanceof HTMLSelectElement) {
        el.value = params.inputValue;
        el.dispatchEvent(
          new Event("change", { bubbles: true, cancelable: true })
        );
      } else if (el instanceof HTMLElement && el.isContentEditable) {
        el.textContent = params.inputValue;
        el.dispatchEvent(
          new Event("input", {
            bubbles: true,
            cancelable: true
          })
        );
      } else {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.value = params.inputValue;
        }
        el.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
      }
    },
    keydown: (el, params) => {
      el.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: params.inputValue
        })
      );
    },
    keyup: (el) => {
      el.dispatchEvent(
        new KeyboardEvent("keyup", {
          bubbles: true,
          cancelable: true,
          key: ""
        })
      );
    },
    pointerdown: (el, params) => {
      el.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          clientX: params.pointer.x,
          clientY: params.pointer.y,
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true
        })
      );
    },
    pointermove: (el, params) => {
      el.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: params.pointer.x,
          clientY: params.pointer.y,
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true
        })
      );
    },
    pointerup: (el, params) => {
      el.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          clientX: params.pointer.x,
          clientY: params.pointer.y,
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true
        })
      );
    },
    popstate: (el) => {
      el.dispatchEvent(
        new PopStateEvent("popstate", {
          bubbles: true,
          cancelable: true,
          state: history.state
        })
      );
    },
    pushState: () => {
      history.pushState({}, "", window.location.href);
    },
    replaceState: () => {
      history.replaceState({}, "", window.location.href);
    },
    reset: (el) => {
      el.dispatchEvent(
        new Event("reset", {
          bubbles: true,
          cancelable: true
        })
      );
    },
    scroll: (el, params) => {
      if (el instanceof HTMLElement) {
        el.scrollTop = params.scroll.y;
      } else if (el instanceof Document) {
        document.documentElement.scrollTop = params.scroll.y;
      } else if (el instanceof Window) {
        el.scrollTo(params.scroll.x, params.scroll.y);
      }
    },
    submit: (el) => {
      el.dispatchEvent(
        new Event("submit", {
          bubbles: true,
          cancelable: true
        })
      );
    },
    touchend: (el) => {
      el.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          cancelable: true,
          touches: [],
          targetTouches: [],
          changedTouches: []
        })
      );
    },
    touchmove: (el) => {
      el.dispatchEvent(
        new TouchEvent("touchmove", {
          bubbles: true,
          cancelable: true,
          touches: [],
          targetTouches: [],
          changedTouches: []
        })
      );
    },
    touchstart: (el) => {
      el.dispatchEvent(
        new TouchEvent("touchstart", {
          bubbles: true,
          cancelable: true,
          touches: [],
          targetTouches: [],
          changedTouches: []
        })
      );
    }
  };
  function handleDomMsg({ type, params }) {
    const dispatcher = dispatchers[type];
    if (dispatcher) {
      let targetElement = window;
      if (params.selector) {
        targetElement = document.querySelector(params.selector) ?? window;
      }
      withProgrammaticEvent(type, () => {
        dispatcher(targetElement, params);
      });
    }
  }

  // src/domPublisher.ts
  function publishMessage(uri2, topic2, msg) {
    fetch(uri2, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJtZXJjdXJlIjp7InB1Ymxpc2giOlsiKiJdfX0.PXwpfIGng6KObfZlcOXvcnWCJOWTFLtswGI5DZuWSK4`
      },
      body: new URLSearchParams({
        topic: topic2,
        data: JSON.stringify(msg)
      })
    });
  }
  function getDomPath(el) {
    const stack = [];
    while (el.parentNode) {
      let sibCount = 0;
      let sibIndex = 0;
      for (let i = 0; i < el.parentNode.children.length; i++) {
        const sibling = el.parentNode.children[i];
        if (sibling.tagName === el.tagName) {
          if (sibling === el) {
            sibIndex = sibCount;
          }
          sibCount++;
        }
      }
      const tag = el.tagName.toLowerCase();
      const selector = sibCount > 1 ? `${tag}:nth-of-type(${sibIndex + 1})` : tag;
      stack.unshift(selector);
      el = el.parentNode;
    }
    return stack.slice(1).join(" > ");
  }
  function republishDomEvent(uri2, topic2, senderId2, event) {
    if (event.target && !programmaticEvents[event.type]) {
      const target = event.target;
      const msg = {
        senderId: senderId2,
        type: event.type,
        params: {
          selector: getDomPath(target),
          inputValue: target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target.value : target instanceof HTMLElement && target.isContentEditable ? target.innerHTML.replace(/&nbsp;/g, " ") : target instanceof HTMLSelectElement ? target.value : null,
          pointer: {
            x: event.clientX,
            y: event.clientY
          },
          scroll: {
            x: window.scrollX,
            y: window.scrollY
          }
        }
      };
      publishMessage(uri2, topic2, msg);
    }
  }

  // src/refresh.ts
  var linkMap = {};
  function refreshLinks() {
    linkMap = {};
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      if (link instanceof HTMLLinkElement && link.href) {
        linkMap[new URL(link.href, location.origin).pathname] = link;
      }
    });
  }
  function isExternal(url2) {
    var match = url2.match(
      /^([^:/?#]+:)?(?:\/\/([^/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/
    );
    if (typeof match[1] === "string" && match[1].length > 0 && match[1].toLowerCase() !== location.protocol)
      return true;
    if (typeof match[2] === "string" && match[2].length > 0 && match[2].replace(
      new RegExp(
        ":(" + { "http:": 80, "https:": 443 }[location.protocol] + ")?$"
      ),
      ""
    ) !== location.host)
      return true;
    return false;
  }
  function handleCss() {
    for (const path in linkMap) {
      if (!isExternal(linkMap[path].href)) {
        linkMap[path].href = `${path}?v=${Date.now()}`;
      }
    }
  }
  function handleJs() {
    document.querySelectorAll("script[src]").forEach((script) => {
      const newScript = document.createElement("script");
      Array.from(script.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.src = `${script.src.split("?")[0]}?v=${Date.now()}`;
      script.replaceWith(newScript);
    });
  }
  function handleRefreshMsg(msg) {
    switch (msg.type) {
      case "refresh":
        window.location.reload();
        break;
      case "css":
        handleCss();
        break;
      case "js":
        handleJs();
        break;
    }
  }

  // src/powersync.ts
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  var senderId = generateUUID();
  var scriptTag = document.getElementById("powersync");
  var uri = scriptTag.dataset.eventsUri;
  if (uri.startsWith(":")) {
    uri = `${window.location.protocol}//${window.location.hostname}${uri}`;
  }
  var topic = scriptTag.dataset.eventsTopic;
  var url = new URL(uri);
  url.searchParams.append("topic", topic);
  var eventSource = new EventSource(url);
  eventSource.onopen = (_) => {
    console.log("eventSource open");
  };
  eventSource.onerror = (_) => {
    console.log("eventSource error");
  };
  eventSource.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.senderId != senderId) {
      handleDomMsg(msg);
      handleRefreshMsg(msg);
    }
  };
  [
    "change",
    "click",
    "input",
    "keydown",
    "keyup",
    "pointerdown",
    "pointermove",
    "pointerup",
    "popstate",
    "pushState",
    "replaceState",
    "reset",
    "scroll",
    "submit",
    "touchend",
    "touchmove",
    "touchstart"
  ].forEach((eventName) => {
    window.addEventListener(
      eventName,
      (event) => {
        republishDomEvent(uri, topic, senderId, event);
      },
      true
      // useCapture = true to catch upstream events
    );
  });
  refreshLinks();
})();
//# sourceMappingURL=powersync.dev.js.map
