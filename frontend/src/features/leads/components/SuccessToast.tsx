type SuccessToastProps = {
  message: string;
};

export function SuccessToast({ message }: SuccessToastProps) {
  return (
    <div className="lead-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
