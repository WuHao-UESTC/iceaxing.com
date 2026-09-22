/** Shared, theme-aware silhouette. Decorative paths never receive focus. */
export function SnowRidge({
  className = "",
  fillFrame = false,
}: {
  className?: string;
  fillFrame?: boolean;
}) {
  return (
    <svg
      className={`snow-ridge ${className}`}
      viewBox="0 0 1440 760"
      preserveAspectRatio={fillFrame ? "xMidYMid slice" : "xMidYMid meet"}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="snow-ridge-sun" cx="1090" cy="170" r="52" />
      <path
        className="snow-ridge-far"
        d="M350 670C520 625 619 517 713 451C795 394 824 338 892 278C936 339 964 368 1007 399C1052 355 1103 277 1175 228C1241 321 1320 362 1440 403V760H350Z"
      />
      <path
        className="snow-ridge-mid"
        d="M0 722C230 711 410 677 579 570C699 494 773 390 875 295C955 219 983 157 1015 118C1051 196 1074 246 1150 319C1227 393 1320 443 1440 454V760H0Z"
      />
      <path
        className="snow-ridge-snow"
        d="M579 570C699 494 773 390 875 295C955 219 983 157 1015 118C998 213 976 252 987 297C1000 353 1080 395 1077 442C1066 391 942 392 909 349C868 409 748 485 579 570Z"
      />
      <path
        className="snow-ridge-edge"
        d="M410 655C665 565 767 394 875 295C955 219 983 157 1015 118"
      />
      <path
        className="snow-ridge-front"
        d="M0 662C194 605 340 645 492 665C711 695 760 517 963 511C1150 506 1252 643 1440 563V760H0Z"
      />
      <path
        className="snow-ridge-contour"
        d="M0 682C194 625 340 665 492 685C711 715 760 537 963 531C1150 526 1252 663 1440 583"
      />
      <path
        className="snow-ridge-trail"
        d="M722 757C869 706 1105 709 1107 648C1108 604 933 612 935 566C937 540 979 530 1003 526"
      />
      <circle className="snow-ridge-marker" cx="1003" cy="526" r="5" />
      <circle className="snow-ridge-marker-ring" cx="1003" cy="526" r="12" />
    </svg>
  );
}
