import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy } from "react";
import { AlertProvider } from "./context/AlertContext";

// ---- Lazy import
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const MtrInsp = lazy(() => import("./pages/MtrInsp"));
const PrcsSubInsp = lazy(() => import("./pages/PrcsSubInsp"));
const FinalSubInsp = lazy(() => import("./pages/FinalSubInsp"));
const InitFinalInsp = lazy(() => import("./pages/InitFinalInsp"));

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
            <Route path="mtr-insp" element={<MtrInsp />}>
              <Route path="daily" element={<MtrDaliyInspDataGrid />} />
              <Route path=":kind" element={<MtrInspDataGrid />} />
            </Route>
            <Route path="prcs-insp" element={<PrcsSubInsp />}>
              <Route path="we" element={<PrcsSubWEInspDataGrid />} />
              <Route path=":kind" element={<PrcsSubInspDataGrid />} />
            </Route>
            <Route path="final-insp" element={<FinalSubInsp />}>
              <Route path=":kind" element={<FinalInspDataGrid />} />
            </Route>
            <Route path="initFinal-insp" element={<InitFinalInsp />}>
              <Route path=":kind" element={<InitFinalInspDataGrid />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/quality" replace />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </AlertProvider>
    </BrowserRouter>
  );
}
