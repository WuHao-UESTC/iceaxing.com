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
        viewBox="0 0 440 300"
        fill="none"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          className="camp-ridge-wash"
          d="M12 252C87 246 122 193 167 151C202 119 236 110 275 42C304 108 327 139 363 158C386 171 407 187 428 214L428 280H12Z"
        />
        <path
          className="landscape-line"
          pathLength="1"
          d="M12 252C87 246 122 193 167 151C202 119 236 110 275 42C304 108 327 139 363 158C386 171 407 187 428 214"
        />
        <path
          className="landscape-fine"
          d="M18 272C107 262 143 219 190 181C225 153 254 133 275 87C292 133 327 168 371 184C396 194 412 210 426 233M48 287C143 273 181 231 219 208C263 182 310 218 345 231C375 242 400 250 425 252"
        />
        <path
          className="camp-ascent-path"
          d="M89 260C130 241 226 268 248 231C269 195 190 198 211 163C225 139 272 139 275 98"
        />
        <circle className="camp-route-stop" cx="89" cy="260" r="4" />
        <circle className="camp-route-stop" cx="211" cy="163" r="3" />
        <circle className="camp-summit-ring" cx="275" cy="42" r="11" />
        <circle className="landscape-dot" cx="275" cy="42" r="3" />
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
