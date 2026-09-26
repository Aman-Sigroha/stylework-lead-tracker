type CreateLeadSectionProps = {
  onOpenCreate: () => void;
};

export function CreateLeadSection({ onOpenCreate }: CreateLeadSectionProps) {
  return (
    <section className="lead-tracker__panel" aria-label="Create lead">
      <h2 className="lead-tracker__panel-title">Create lead</h2>
      <p className="lead-tracker__create-copy">
        Add a new lead to your pipeline.
      </p>
      <button
        type="button"
        className="lead-tracker__create-button"
        onClick={onOpenCreate}
      >
        Create lead
      </button>
    </section>
  );
}
