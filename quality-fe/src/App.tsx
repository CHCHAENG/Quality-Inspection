import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy } from "react";
import { AlertProvider } from "./context/AlertContextProvider";

// ---- Lazy import
const Login = lazy(() => import("./pages/Login"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const Insp = lazy(() => import("./pages/Insp"));

const MtrInspDataGrid = lazy(
  () => import("./components/Quality/MtrInspDataGrid")
);
const MtrDaliyInspDataGrid = lazy(
  () => import("./components/Quality/MtrDaliyInspDataGrid")
);
const PrcsSubWEInspDataGrid = lazy(
  () => import("./components/Quality/PrcsSubWEInspDataGrid")
);
const PrcsSubInspDataGrid = lazy(
  () => import("./components/Quality/PrcsSubInspDataGrid")
);
const FinalInspDataGrid = lazy(
  () => import("./components/Quality/FinalInspDataGrid")
);
const InitFinalInspDataGrid = lazy(
  () => import("./components/Quality/InitFinalInspDataGrid")
);

export default function App() {
  return (
    <BrowserRouter>
      <AlertProvider>
        <Routes>
          <Route path="/quality" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="mtr-insp" element={<Insp />}>
              <Route path="daily" element={<MtrDaliyInspDataGrid />} />
              <Route path=":kind" element={<MtrInspDataGrid />} />
            </Route>
            <Route path="prcs-insp" element={<Insp />}>
              <Route path="we" element={<PrcsSubWEInspDataGrid />} />
              <Route path=":kind" element={<PrcsSubInspDataGrid />} />
            </Route>
            <Route path="final-insp" element={<Insp />}>
              <Route path=":kind" element={<FinalInspDataGrid />} />
            </Route>
            <Route path="initFinal-insp" element={<Insp />}>
              <Route path=":kind" element={<InitFinalInspDataGrid />} />
            </Route>
          </Route>

          {/* <Route path="/" element={<Navigate to="/quality" replace />} /> */}
          <Route path="/" element={<Login />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </AlertProvider>
    </BrowserRouter>
  );
}
