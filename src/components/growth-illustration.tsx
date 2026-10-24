/**
 * 首页水彩插画：种子 → 嫩芽 → 树。
 * 全部为内联 SVG（渐变 + 柔和色块 + 手绘虚线），离线可用，不依赖外链图片。
 */

export function GrowthIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 440 340"
      role="img"
      aria-label="一颗种子沿着虚线生长成嫩芽，再长成小树"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="gi-bloom-teal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8fd3c6" stopOpacity="0.4" />
          <stop offset="62%" stopColor="#8fd3c6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8fd3c6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gi-bloom-mint" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#bfe6d8" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#bfe6d8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gi-bloom-sky" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#cfe3ee" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#cfe3ee" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gi-leaf" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#9dd9cb" />
          <stop offset="55%" stopColor="#57a897" />
          <stop offset="100%" stopColor="#2f8b7c" />
        </linearGradient>
        <linearGradient id="gi-leaf-soft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbeae1" />
          <stop offset="100%" stopColor="#7cc2b2" />
        </linearGradient>
        <linearGradient id="gi-trunk" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b08a63" />
          <stop offset="100%" stopColor="#8a6a4b" />
        </linearGradient>
        <linearGradient id="gi-seed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#edd9b3" />
          <stop offset="100%" stopColor="#c9a878" />
        </linearGradient>
        <linearGradient id="gi-ground" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cfe6df" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#cfe6df" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 水彩晕染底色 */}
      <ellipse cx="340" cy="96" rx="140" ry="104" fill="url(#gi-bloom-teal)" />
      <ellipse cx="104" cy="238" rx="128" ry="92" fill="url(#gi-bloom-mint)" />
      <ellipse cx="252" cy="300" rx="196" ry="66" fill="url(#gi-bloom-sky)" />

      {/* 成长轨迹 */}
      <path
        d="M100 246C140 238 160 208 214 198S288 182 336 180"
        stroke="#2f8b7c"
        strokeOpacity="0.3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 8"
      />

      {/* 地面 */}
      <path
        d="M28 272C92 263 150 279 210 271S330 261 412 272L412 306L28 306Z"
        fill="url(#gi-ground)"
      />
      <path
        d="M28 272C92 263 150 279 210 271S330 261 412 272"
        stroke="#2f8b7c"
        strokeOpacity="0.22"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* ① 种子 */}
      <g>
        <ellipse
          cx="88"
          cy="252"
          rx="14"
          ry="8.5"
          transform="rotate(-28 88 252)"
          fill="url(#gi-seed)"
        />
        <path
          d="M84 247.5c2.4-3.1 6.2-4 9.2-2.8"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M73 230c1.6-4.4 4.6-7.6 8.8-9.2"
          stroke="#c9a878"
          strokeOpacity="0.45"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeDasharray="1 5"
        />
        <path
          d="M62 246c-3-1-5-3.4-5.6-6.4"
          stroke="#c9a878"
          strokeOpacity="0.4"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeDasharray="1 5"
        />
      </g>

      {/* ② 嫩芽 */}
      <g>
        <ellipse
          cx="210"
          cy="268"
          rx="36"
          ry="9"
          fill="#e5dcc6"
          fillOpacity="0.55"
        />
        <path
          d="M210 268c-1-16-1-28 2-44"
          stroke="#2f8b7c"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M211 240c-13 1-23-7-21-21 13 0 21 9 21 21Z"
          fill="url(#gi-leaf)"
        />
        <path
          d="M213 230c14-3 24-13 21-25-13 2-21 12-21 25Z"
          fill="url(#gi-leaf-soft)"
        />
        <path
          d="M198 230c4.5-.6 8.6 1.4 11 4.6"
          stroke="#2a7d6f"
          strokeOpacity="0.32"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <circle cx="211" cy="222" r="1.6" fill="#2f8b7c" fillOpacity="0.45" />
      </g>

      {/* ③ 小树 */}
      <g>
        <ellipse
          cx="344"
          cy="272"
          rx="52"
          ry="10"
          fill="#e5dcc6"
          fillOpacity="0.5"
        />
        <ellipse cx="344" cy="198" rx="60" ry="44" fill="#bfe6d8" fillOpacity="0.22" />
        <path
          d="M344 270c-1-20-1-36 2-54"
          stroke="url(#gi-trunk)"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <path
          d="M345 238c-7-7-13-12-19-18M346 226c7-8 12-13 17-18"
          stroke="url(#gi-trunk)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="344" cy="196" r="31" fill="url(#gi-leaf)" fillOpacity="0.92" />
        <circle cx="317" cy="205" r="21" fill="url(#gi-leaf-soft)" fillOpacity="0.9" />
        <circle cx="370" cy="203" r="22" fill="url(#gi-leaf)" fillOpacity="0.72" />
        <circle cx="343" cy="172" r="19" fill="url(#gi-leaf-soft)" fillOpacity="0.95" />
        <circle cx="357" cy="187" r="14" fill="#b9e3d9" fillOpacity="0.7" />
        <path
          d="M330 186c5-3 10-3 15-1"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>

      {/* 飘浮的种子与手绘点缀 */}
      <g strokeLinecap="round">
        <ellipse
          cx="152"
          cy="112"
          rx="7"
          ry="4"
          transform="rotate(24 152 112)"
          fill="#c9a878"
          fillOpacity="0.35"
        />
        <ellipse
          cx="258"
          cy="86"
          rx="6"
          ry="3.5"
          transform="rotate(-18 258 86)"
          fill="#7cc2b2"
          fillOpacity="0.45"
        />
        <ellipse
          cx="398"
          cy="214"
          rx="6.5"
          ry="3.5"
          transform="rotate(30 398 214)"
          fill="#c9a878"
          fillOpacity="0.3"
        />
        <path
          d="M124 176h10M129 171v10"
          stroke="#2f8b7c"
          strokeOpacity="0.25"
          strokeWidth="1.3"
        />
        <path
          d="M392 146h8M396 142v8"
          stroke="#2f8b7c"
          strokeOpacity="0.22"
          strokeWidth="1.2"
        />
        <circle cx="286" cy="132" r="2" fill="#2f8b7c" fillOpacity="0.2" />
        <circle cx="176" cy="196" r="1.8" fill="#2f8b7c" fillOpacity="0.22" />
        <circle cx="236" cy="255" r="1.6" fill="#c9a878" fillOpacity="0.4" />
        <circle cx="128" cy="274" r="1.6" fill="#2f8b7c" fillOpacity="0.25" />
      </g>
    </svg>
  );
}

/** 空库引导用的小插画：土里的一颗种子刚刚冒头。 */
export function SeedlingMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 168"
      role="img"
      aria-label="土里刚冒出嫩芽的种子"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="sm-bloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8fd3c6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8fd3c6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sm-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9dd9cb" />
          <stop offset="100%" stopColor="#2f8b7c" />
        </linearGradient>
        <linearGradient id="sm-seed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#edd9b3" />
          <stop offset="100%" stopColor="#c9a878" />
        </linearGradient>
      </defs>

      <ellipse cx="104" cy="96" rx="88" ry="72" fill="url(#sm-bloom)" />

      <path
        d="M78 122C96 104 104 96 116 92"
        stroke="#2f8b7c"
        strokeOpacity="0.3"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="2 7"
      />

      <ellipse cx="114" cy="130" rx="46" ry="11" fill="#e5dcc6" fillOpacity="0.65" />
      <path
        d="M68 129c14-3 30-2 46 0s28 2 40-1"
        stroke="#2f8b7c"
        strokeOpacity="0.2"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      <ellipse
        cx="84"
        cy="122"
        rx="13"
        ry="8"
        transform="rotate(-26 84 122)"
        fill="url(#sm-seed)"
      />
      <path
        d="M80 117.5c2.2-2.9 5.8-3.7 8.6-2.6"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      <path
        d="M115 128c-1-14-1-24 1-38"
        stroke="#2f8b7c"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M116 106c-11 1-19-6-18-18 11 0 18 7 18 18Z"
        fill="url(#sm-leaf)"
      />
      <path
        d="M118 98c12-2 20-11 18-21-11 1-18 10-18 21Z"
        fill="url(#sm-leaf)"
        fillOpacity="0.75"
      />
      <path
        d="M104 98c4-.5 7.5 1.2 9.5 4"
        stroke="#2a7d6f"
        strokeOpacity="0.3"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <ellipse
        cx="152"
        cy="66"
        rx="6"
        ry="3.4"
        transform="rotate(22 152 66)"
        fill="#c9a878"
        fillOpacity="0.35"
      />
      <path
        d="M48 92h8M52 88v8"
        stroke="#2f8b7c"
        strokeOpacity="0.25"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="164" cy="118" r="1.8" fill="#2f8b7c" fillOpacity="0.2" />
      <circle cx="58" cy="66" r="1.6" fill="#2f8b7c" fillOpacity="0.22" />
    </svg>
  );
}
