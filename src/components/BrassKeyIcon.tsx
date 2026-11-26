interface BrassKeyIconProps {
  className?: string;
}

export function BrassKeyIcon({ className }: BrassKeyIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 32"
      aria-hidden="true"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    >
      <path
        fillRule="evenodd"
        d="M12 4.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21Zm0 6a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"
      />
      <path d="M19 11h25v6h-5v6h-6v-6h-14z" />
      <path
        d="M23 13h18"
        fill="none"
        stroke="#fff0bd"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
