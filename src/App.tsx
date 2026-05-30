import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Notifications } from "./components/Notifications";
import { CameraPage } from "./routes/CameraPage";
import { DisplayPage } from "./routes/DisplayPage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/generate" replace />} />
          <Route path="/generate" element={<DisplayPage />} />
          <Route path="/display" element={<Navigate to="/generate" replace />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="*" element={<Navigate to="/generate" replace />} />
        </Routes>
      </main>
      <Notifications />
    </div>
  );
}
