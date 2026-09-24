import { Link } from "@/lib/i18n/navigation";

interface ToolCard {
  slug: string;
  href: string;
  title: string;
  description: string;
  category: string;
  status: string;
  action: string;
  featureLabels: string[];
}

interface ToolsHubProps {
  tools: ToolCard[];
  availableLabel: string;
  localLabel: string;
  privacyTitle: string;
  privacyDescription: string;
}

function PomodoroPreview() {
  return (
    <div className="tool-card-preview" aria-hidden="true">
      <svg viewBox="0 0 240 240" role="presentation">
        <circle className="tool-preview-orbit tool-preview-orbit-outer" cx="120" cy="120" r="91" />
        <circle className="tool-preview-orbit" cx="120" cy="120" r="72" />
        <path className="tool-preview-progress" d="M120 48a72 72 0 1 1-50.9 21.1" />
        <path className="tool-preview-ridge" d="M42 164 79 124l24 22 34-57 61 75" />
        <circle className="tool-preview-marker" cx="137" cy="89" r="4" />
      </svg>
      <div className="tool-card-preview-time">25:00</div>
      <div className="tool-card-preview-caption">FOCUS / 01</div>
    </div>
  );
}

export function ToolsHub({
  tools,
  availableLabel,
  localLabel,
  privacyTitle,
  privacyDescription,
}: ToolsHubProps) {
  return (
    <>
      <section className="tools-shelf" aria-label={availableLabel}>
        <div className="tools-shelf-heading">
          <span>{availableLabel}</span>
          <span>{String(tools.length).padStart(2, "0")} / READY</span>
        </div>

        <div className="tools-grid">
          {tools.map((tool, index) => (
            <article className="tool-card tool-card-featured" key={tool.slug}>
              <div className="tool-card-copy">
                <div className="tool-card-topline">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{tool.category}</span>
                  <span className="tool-status">
                    <i aria-hidden="true" />
                    {tool.status}
                  </span>
                </div>

                <h2>{tool.title}</h2>
                <p>{tool.description}</p>

                <ul className="tool-feature-list" aria-label={localLabel}>
                  {tool.featureLabels.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <Link className="tool-card-action" href={tool.href}>
                  <span>{tool.action}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>

              {tool.slug === "pomodoro" ? <PomodoroPreview /> : null}
            </article>
          ))}
        </div>
      </section>

      <aside className="tools-privacy-note">
        <span className="tools-privacy-mark" aria-hidden="true">LOCAL</span>
        <div>
          <h2>{privacyTitle}</h2>
          <p>{privacyDescription}</p>
        </div>
      </aside>
    </>
  );
}
