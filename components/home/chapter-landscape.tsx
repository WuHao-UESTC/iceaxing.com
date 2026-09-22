import { SnowRidge } from "@/components/site/snow-ridge";

/** Each chapter has its own geometry, with shared theme-aware materials. */
export function ChapterLandscape({
  scene,
}: {
  scene: "cover" | "ridge" | "field" | "camp";
}) {
  if (scene === "camp")
    return (
      <svg
        className="journey-landscape journey-landscape-camp"
        data-reveal="landscape"
        viewBox="0 0 1440 800"
        fill="none"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          className="camp-ridge-wash"
          d="M0 690C220 700 360 610 550 626C740 642 816 550 886 416C969 259 1060 270 1148 190C1250 99 1339 126 1440 64V800H0Z"
        />
        <path
          className="landscape-shadow"
          d="M0 754C251 718 420 690 631 710C879 733 961 561 1126 508C1263 464 1350 493 1440 430V800H0Z"
        />
        <path
          className="landscape-line"
          pathLength="1"
          d="M0 690C220 700 360 610 550 626C740 642 816 550 886 416C969 259 1060 270 1148 190C1250 99 1339 126 1440 64"
        />
        <path
          className="landscape-fine"
          d="M0 718C220 728 370 642 556 653C752 665 850 565 915 433C998 287 1090 299 1176 218C1271 135 1353 153 1440 100M0 744C227 748 389 675 579 683C774 691 878 591 948 454C1024 322 1117 327 1204 248C1295 171 1369 183 1440 139"
        />
        <path
          className="camp-ascent-path"
          d="M130 800C259 710 421 762 586 716C738 674 718 570 820 524C917 479 891 371 1002 306C1114 240 1210 280 1330 166"
        />
        <circle className="camp-route-stop" cx="820" cy="524" r="4" />
        <circle className="camp-route-stop" cx="1002" cy="306" r="3" />
        <circle className="landscape-ring" cx="1148" cy="190" r="13" />
        <circle className="landscape-dot" cx="1148" cy="190" r="3" />
      </svg>
    );

  if (scene === "cover")
    return (
      <div
        className="journey-landscape journey-landscape-cover"
        data-reveal="landscape"
      >
        <SnowRidge fillFrame />
      </div>
    );

  return (
    <svg
      className={`journey-landscape journey-landscape-${scene}`}
      data-reveal="landscape"
      viewBox="0 0 1440 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {scene === "ridge" && (
        <>
          <path
            className="landscape-wash"
            d="M0 800V685C168 650 307 577 425 401C512 271 538 160 632 0H803C685 172 655 318 588 474C526 619 403 730 324 800Z"
          />
          <path
            className="landscape-shadow"
            d="M0 800H240C387 701 479 593 538 438C609 251 656 109 729 0H791C689 174 674 345 588 522C528 646 453 731 403 800Z"
          />
          <path
            className="landscape-line"
            pathLength="1"
            d="M52 800C303 683 427 549 496 375C555 224 604 97 668 0"
          />
          <path
            className="landscape-fine"
            d="M91 800C336 687 464 533 530 354C590 191 631 97 694 0M170 800C378 693 497 553 568 383C633 226 651 119 723 0"
          />
          <circle className="landscape-dot" cx="496" cy="375" r="4" />
          <circle className="landscape-ring" cx="496" cy="375" r="13" />
        </>
      )}
      {scene === "field" && (
        <>
          <path
            className="landscape-wash"
            d="M0 481C238 341 465 470 703 460C973 449 1108 300 1440 393V800H0Z"
          />
          <path
            className="landscape-shadow"
            d="M0 644C293 483 468 675 786 603C1054 542 1188 534 1440 588V800H0Z"
          />
          <path
            className="landscape-line"
            pathLength="1"
            d="M0 518C234 379 469 507 703 495C973 481 1146 333 1440 429"
          />
          <path
            className="landscape-fine"
            d="M0 683C282 531 482 717 790 645C1080 577 1230 575 1440 629M0 713C282 561 482 747 790 675C1080 607 1230 605 1440 659"
          />
          <circle className="landscape-dot" cx="1133" cy="415" r="4" />
        </>
      )}
    </svg>
  );
}
