/* =============================================================
   common.js
   - 모든 페이지에서 공통으로 동작하는 스크립트
   - (1) 헤더/푸터 컴포넌트 불러오기(include)
   - (2) 모바일 메뉴 토글
   - (3) 헤더 스크롤 효과
   ============================================================= */

/* JS가 동작하면 <html> 에서 no-js 클래스를 제거 (CSS 대비용) */
document.documentElement.classList.remove("no-js");

/* -----------------------------------------------------------
   (1) 컴포넌트 include
   - data-include="경로" 가 있는 요소에 해당 HTML 파일 내용을 넣습니다.
   - 헤더/푸터를 한 곳에서 관리하기 위함입니다.
   - fetch 를 사용하므로 로컬에서 열 때는 반드시 "서버"로 실행하세요.
     (카페24 등 실제 서버에 올리면 자동으로 정상 동작합니다.)
   - 모든 include 가 끝나면 "components:loaded" 이벤트를 발생시킵니다.
   ----------------------------------------------------------- */
async function includeComponents() {
  const targets = document.querySelectorAll("[data-include]");

  const tasks = Array.from(targets).map(async (el) => {
    const url = el.getAttribute("data-include");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url} 불러오기 실패 (${res.status})`);
      el.innerHTML = await res.text();
    } catch (err) {
      console.error("[include] 컴포넌트 로드 오류:", err);
    }
  });

  await Promise.all(tasks);

  // 헤더/푸터가 DOM에 들어온 뒤 초기화
  initHeader();

  // 다른 스크립트(main.js)에 "이제 헤더/푸터 준비됨"을 알림
  document.dispatchEvent(new CustomEvent("components:loaded"));
}

/* -----------------------------------------------------------
   (2) + (3) 헤더 초기화 (모바일 메뉴 + 스크롤 효과)
   ----------------------------------------------------------- */
function initHeader() {
  const header = document.getElementById("header");
  const toggle = document.getElementById("headerToggle");
  if (!header) return;

  /* 모바일 햄버거 메뉴 열고 닫기 */
  if (toggle) {
    toggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
    });

    /* 메뉴 항목 클릭 시 자동으로 닫기 */
    header.querySelectorAll(".header__link").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* 처음 접속 시(첫 섹션)에는 헤더 숨김 */
  header.classList.add("is-hidden");

  /* 헤더 노출 기준: 두 번째 섹션(있으면)을 기준으로,
     없으면 첫 섹션(히어로)을 다 스크롤한 뒤 노출 */
  const secondSection =
    document.getElementById("profile") ||
    document.querySelector("#main > section:nth-of-type(2)");
  const firstSection = document.querySelector("#main > section:nth-of-type(1)");

  /* 헤더 노출 규칙 (단순/안정)
     - 히어로(첫 섹션) 구간/맨 위: 숨김
     - 그 이후로는 항상 표시 (스크롤 방향과 무관 → 자꾸 사라지지 않음) */

  // 현재 히어로 구간(또는 맨 위)에 있는지
  function inHeroZone() {
    if (window.scrollY <= 10) return true;
    if (secondSection) {
      return secondSection.getBoundingClientRect().top > window.innerHeight * 0.5;
    }
    if (firstSection) {
      return firstSection.getBoundingClientRect().bottom > window.innerHeight * 0.5;
    }
    return false;
  }

  // 헤더 표시/숨김 갱신
  function updateHeader() {
    header.style.backgroundColor =
      window.scrollY > 10 ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.7)";
    header.classList.toggle("is-hidden", inHeroZone());
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateHeader();
        ticking = false;
      });
    },
    { passive: true }
  );

  /* 새로고침 등으로 이미 스크롤되어 있을 수 있으니 초기 1회 실행 */
  updateHeader();
}

/* 페이지 로드 시 컴포넌트 불러오기 시작 */
document.addEventListener("DOMContentLoaded", includeComponents);
