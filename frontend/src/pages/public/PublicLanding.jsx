// src/pages/PublicLanding.jsx
import { useSearchParams } from "react-router-dom";
import PublicSuccess from "./PublicSuccess.jsx";
import PublicError from "./PublicError.jsx";
const PUBLIC_VIEWS = {
  location_auth_success: {
    component: (
      <PublicSuccess
        successTitle="Authentication Successful"
        successMessage="You can now close this window."
      />
    ),
  },
  location_auth_error: {
    component: (
      <PublicError
        errorTitle="Authentication Failed"
        errorMessage="The authentication failed. Please try again."
        errorCode="401"
      />
    ),
  },
};

export default function PublicLanding() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  const ViewComponent = type && PUBLIC_VIEWS[type] ? PUBLIC_VIEWS[type] : null;
  if (!ViewComponent) {
    return (
      <PublicError
        errorTitle="Invalid Page"
        errorMessage="The page you are trying to access is not valid."
        errorCode="404"
      />
    );
  }

  return ViewComponent.component;
}
