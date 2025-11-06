import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy } from "react";

// ---- Lazy import
const MtrInsp = lazy(() => import("./pages/MtrInsp"));
const PrcsSubInsp = lazy(() => import("./pages/PrcsSubInsp"));
const FinalSubInsp = lazy(() => import("./pages/FinalSubInsp"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const MtrInspDataGrid = lazy(
  () => import("./components/Quality/MtrInspDataGrid")
);
const PrcsSubWEInspDataGrid = lazy(
  () => import("./components/Quality/PrcsSubWEInspDataGrid")
);
const PrcsSubInspDataGrid = lazy(
  () => import("./components/Quality/PrcsSubInspDataGrid")
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/quality" element={<Dashboard />}>
          <Route path="mtr-insp" element={<MtrInsp />}>
            <Route path=":kind" element={<MtrInspDataGrid />} />
          </Route>
          <Route path="prcs" element={<PrcsSubInsp />}>
            <Route path="we" element={<PrcsSubWEInspDataGrid />} />
            <Route path=":kind" element={<PrcsSubInspDataGrid />} />
          </Route>
          <Route path="final" element={<FinalSubInsp />} />
        </Route>

        <Route path="/" element={<Navigate to="/quality" replace />} />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
