import './LeadTrackerPage.css';

export function LeadTrackerPage() {
  return (
    <div className="lead-tracker">
      <header className="lead-tracker__header">
        <p className="lead-tracker__eyebrow">Stylework</p>
        <h1 className="lead-tracker__title">Lead Tracker</h1>
        <p className="lead-tracker__subtitle">
          Manage inbound leads from one place.
        </p>
      </header>

      <main className="lead-tracker__main">
        <section
          className="lead-tracker__panel lead-tracker__panel--placeholder"
          aria-label="Search leads"
        >
          <h2 className="lead-tracker__panel-title">Search</h2>
          <p className="lead-tracker__placeholder">
            Search and filter controls will appear here.
          </p>
        </section>

        <section
          className="lead-tracker__panel lead-tracker__panel--placeholder"
          aria-label="Create lead"
        >
          <h2 className="lead-tracker__panel-title">Create lead</h2>
          <p className="lead-tracker__placeholder">
            New lead form will appear here.
          </p>
        </section>

        <section
          className="lead-tracker__panel lead-tracker__panel--list"
          aria-label="Lead list"
        >
          <h2 className="lead-tracker__panel-title">Leads</h2>
          <div className="lead-tracker__list-empty">
            <p>No leads to display yet.</p>
            <p className="lead-tracker__list-hint">
              Your lead list will load in this area.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
