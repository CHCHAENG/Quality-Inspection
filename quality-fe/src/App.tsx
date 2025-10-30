import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy } from "react";
import MtrInspST from "./pages/MtrInspST";

const Dashboard = lazy(() => import("./pages/Dashboard"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quality/mtr-insp/st" element={<MtrInspST />} />
      </Routes>
    </BrowserRouter>
  );
}
