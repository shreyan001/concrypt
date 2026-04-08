import { JSX as ReactJSX } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "w3m-button": any;
      "w3m-network-button": any;
      "w3m-connect-button": any;
      "w3m-account-button": any;
    }
  }
}

// Support for Next.js and other JSX environments
declare namespace JSX {
  interface IntrinsicElements {
    "w3m-button": any;
    "w3m-network-button": any;
    "w3m-connect-button": any;
    "w3m-account-button": any;
  }
}
