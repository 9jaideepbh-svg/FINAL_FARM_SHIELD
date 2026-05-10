import { Routes, Route } from "react-router-dom";
import Landing from "./Landing";
import LaborFlow from "./LaborFlow";
import FarmerFlow from "./FarmerFlow";

export default function KrishiSetu() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/labor/*" element={<LaborFlow />} />
      <Route path="/farmer/*" element={<FarmerFlow />} />
    </Routes>
  );
}
