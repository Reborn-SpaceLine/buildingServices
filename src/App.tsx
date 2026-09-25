import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AboutPage } from './pages/About';
import { ServicesPage } from './pages/Services';
import { ServiceDetail } from './pages/ServiceDetail';
import { RealizationsPage } from './pages/Realizations';
import { RealizationDetail } from './pages/RealizationDetail';
import { VideosPage } from './pages/Videos';
import { MaintenancePage } from './pages/Maintenance';
import { ContactPage } from './pages/Contact';
import { RdvPage } from './pages/Rdv';
import { NotFound } from './pages/NotFound';

// L'administration n'est chargée que lorsqu'on l'ouvre
const AdminPage = lazy(() => import('./admin/AdminPage'));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="admin"
          element={<Suspense fallback={null}><AdminPage /></Suspense>}
        />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="a-propos" element={<AboutPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:slug" element={<ServiceDetail />} />
          <Route path="realisations" element={<RealizationsPage />} />
          <Route path="realisations/:slug" element={<RealizationDetail />} />
          <Route path="videos" element={<VideosPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="rdv" element={<RdvPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
