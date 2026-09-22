import { SnowRidge } from "@/components/site/snow-ridge";

/** Each chapter has its own geometry, with shared theme-aware materials. */
export function ChapterLandscape({
  scene,
}: {
  scene: "cover" | "ridge" | "field" | "camp";
}) {
  if (scene === "cover")
    return (
      <div
        className="journey-landscape journey-landscape-cover"
        data-reveal="landscape"
      >
        <SnowRidge />
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
      {scene === "camp" && (
        <>
          <path
            className="landscape-wash"
            d="M0 0H231C83 266 139 504 434 584C751 670 1185 606 1440 406V800H0Z"
          />
          <path
            className="landscape-shadow"
            d="M0 732C234 678 341 646 498 694C669 746 811 599 969 612C1114 624 1264 725 1440 648V800H0Z"
          />
          <path
            className="landscape-line"
            pathLength="1"
            d="M162 0C25 317 192 570 493 624C817 682 1191 588 1440 430"
          />
          <path
            className="landscape-fine"
            d="M128 0C-14 331 172 595 477 652C817 716 1216 617 1440 478"
          />
          <circle className="landscape-halo" cx="1126" cy="599" r="32" />
          <circle className="landscape-ring" cx="1126" cy="599" r="13" />
          <circle className="landscape-dot" cx="1126" cy="599" r="4" />
        </>
      )}
    </svg>
  );
}
