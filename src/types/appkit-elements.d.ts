// Reown AppKit web component JSX types.
declare namespace JSX {
  interface IntrinsicElements {
    'appkit-button': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      label?: string;
      balance?: 'show' | 'hide';
      size?: 'md' | 'sm';
      loadingLabel?: string;
      disabled?: boolean;
    };
    'appkit-account-button': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
    'appkit-connect-button': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & { label?: string; loadingLabel?: string; size?: 'md' | 'sm' };
    'appkit-network-button': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & { disabled?: boolean };
  }
}
