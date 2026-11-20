import type { ComponentType, SVGProps } from 'react';

/** Any icon component the settings cards take: lucide's or ours. */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type AnalysisIconProps = SVGProps<SVGSVGElement> & {
  /** Names the icon when it stands alone; without it, the icon is decorative and hidden. */
  title?: string;
};

/**
 * A 40×40 outline icon drawn in `currentColor`, so it follows the text colour and the theme.
 * Decorative by default (beside its label); with a `title`, it is an image with that name.
 */
function outlineIcon(path: string, displayName: string): ComponentType<AnalysisIconProps> {
  function Icon({ title, strokeWidth = 1.5, ...props }: AnalysisIconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={40}
        height={40}
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
        {...props}
      >
        {title ? <title>{title}</title> : null}
        <path d={path} />
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const ExposureIcon = outlineIcon(
  'M20.0007 14.9999C18.5135 14.976 17.0611 15.45 15.8744 16.3466C14.6877 17.2432 13.8349 18.5109 13.4517 19.948C13.0684 21.3851 13.1768 22.9091 13.7595 24.2775C14.3422 25.6459 15.3657 26.7802 16.6673 27.4999M20.0007 4.99992V8.33325M11.0007 30.6666L8.66732 32.9999M6.66732 21.6666H3.33398M10.5673 12.2333L8.21732 9.88325M33.334 6.66659V24.2333C34.6049 24.967 35.5982 26.0997 36.1598 27.4555C36.7215 28.8114 36.82 30.3147 36.4402 31.7322C36.0603 33.1498 35.2234 34.4024 34.0591 35.2958C32.8948 36.1892 31.4682 36.6734 30.0007 36.6734C28.5331 36.6734 27.1065 36.1892 25.9422 35.2958C24.7779 34.4024 23.941 33.1498 23.5611 31.7322C23.1813 30.3147 23.2798 28.8114 23.8415 27.4555C24.4031 26.0997 25.3964 24.967 26.6673 24.2333V6.66659C26.6673 5.78253 27.0185 4.93468 27.6436 4.30956C28.2687 3.68444 29.1166 3.33325 30.0007 3.33325C30.8847 3.33325 31.7326 3.68444 32.3577 4.30956C32.9828 4.93468 33.334 5.78253 33.334 6.66659Z',
  'ExposureIcon',
);

export const SanitaryRiskIcon = outlineIcon(
  'M31.666 11.6665L26.666 14.9998M8.33268 11.6665L13.3327 14.9998M31.666 31.6665L26.666 28.3332M8.33268 31.6665L13.3327 28.3332M33.3327 21.6665H26.666M6.66602 21.6665H13.3327M16.666 6.6665L18.3327 9.99984M23.3327 6.6665L21.666 9.99984M19.9993 9.99984C23.6812 9.99984 26.666 12.9846 26.666 16.6665V26.6665C26.666 30.3484 23.6812 33.3332 19.9993 33.3332C16.3175 33.3332 13.3327 30.3484 13.3327 26.6665V16.6665C13.3327 12.9846 16.3175 9.99984 19.9993 9.99984Z',
  'SanitaryRiskIcon',
);

export const ProductiveRiskIcon = outlineIcon(
  'M35.3494 26.4835C34.2891 28.991 32.6307 31.2005 30.5192 32.919C28.4077 34.6375 25.9073 35.8125 23.2368 36.3415C20.5662 36.8704 17.8067 36.7371 15.1996 35.9532C12.5925 35.1692 10.2171 33.7586 8.28107 31.8446C6.34506 29.9306 4.90739 27.5714 4.09376 24.9734C3.28013 22.3754 3.11531 19.6176 3.6137 16.9412C4.11209 14.2648 5.25853 11.7512 6.95278 9.62021C8.64703 7.48921 10.8375 5.80569 13.3327 4.71683M36.666 20.0002C36.666 17.8115 36.2349 15.6442 35.3974 13.6221C34.5598 11.6 33.3321 9.76269 31.7845 8.21505C30.2368 6.66741 28.3995 5.43975 26.3774 4.60217C24.3553 3.76459 22.1881 3.3335 19.9994 3.3335V20.0002H36.666Z',
  'ProductiveRiskIcon',
);
