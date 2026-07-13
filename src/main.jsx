import "./styles/mobile-polish.css";
import "./styles/storefront-mobile-checkout.css";
import "./styles/storefront-mobile-uat-final.css";
import { I18nProvider } from "./i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CmsProvider } from "./store/CmsStore";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CmsProvider>
      <BrowserRouter>
        <I18nProvider enableLegacyAutoTranslate>
          <App />
        </I18nProvider>
      </BrowserRouter>
    </CmsProvider>
  </React.StrictMode>
);
