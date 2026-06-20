import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Pages
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import Calendar from "./pages/Calendar";
import Capture from "./pages/Capture";
import Digest from "./pages/Digest";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import OutfitDetail from "./pages/OutfitDetail";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Search from "./pages/Search";
import Wardrobe from "./pages/Wardrobe";
import WardrobeInsights from "./pages/WardrobeInsights";


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected — all share the Layout (bottom nav) */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/feed"              element={<Feed />} />
            <Route path="/capture"           element={<Capture />} />
            <Route path="/calendar"          element={<Calendar />} />
            <Route path="/wardrobe"          element={<Wardrobe />} />
            <Route path="/profile"           element={<Profile />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/outfit/:id" element={<OutfitDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/wardrobe/insights" element={<WardrobeInsights />} />
            <Route path="/digest" element={<Digest />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
        <PWAInstallPrompt />
      </AuthProvider>
    </BrowserRouter>
  );
}
