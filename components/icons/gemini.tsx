import React from "react";

interface GeminiProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export default function Gemini({ className, ...props }: GeminiProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.48l7 3.5v7.84l-7-3.5V9.48zm9 11.34v-7.84l7-3.5v7.84l-7 3.5z" />
    </svg>
  );
}
