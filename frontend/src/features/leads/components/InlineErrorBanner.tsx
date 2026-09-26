type InlineErrorBannerProps = {
  message: string;
};

export function InlineErrorBanner({ message }: InlineErrorBannerProps) {
  return (
    <p className="lead-inline-error" role="alert">
      {message}
    </p>
  );
}
