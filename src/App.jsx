import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import FarmerLayout from './layouts/FarmerLayout';
import OfficerLayout from './layouts/OfficerLayout';
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import FarmerDashboard from './pages/farmer/Dashboard';
import Plan from './pages/farmer/Plan';
import Today from './pages/farmer/Today';
import CropDoctor from './pages/farmer/CropDoctor';
import Help from './pages/farmer/Help';
import Harvest from './pages/farmer/Harvest';
import MyFarm from './pages/farmer/MyFarm';
import OfficerDashboard from './pages/officer/Dashboard';
import Requests from './pages/officer/Requests';
import RequestDetail from './pages/officer/RequestDetail';
import Farmers, { FarmDetail } from './pages/officer/Farmers';
import AreaMap from './pages/officer/AreaMap';
import Alerts from './pages/officer/Alerts';
import Planting from './pages/officer/Planting';
import { Upazila, Supply } from './pages/officer/UpazilaSupply';
import { WhyDrawer, DataInfo, Toast } from './components/Overlays';

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}><Route path="/" element={<Home />} /></Route>
        <Route path="/login" element={<Login />} />
        <Route path="/farmer" element={<FarmerLayout />}>
          <Route index element={<FarmerDashboard />} />
          <Route path="plan" element={<Plan />} />
          <Route path="today" element={<Today />} />
          <Route path="doctor" element={<CropDoctor />} />
          <Route path="help" element={<Help />} />
          <Route path="harvest" element={<Harvest />} />
          <Route path="farm" element={<MyFarm />} />
        </Route>
        <Route path="/officer" element={<OfficerLayout />}>
          <Route index element={<OfficerDashboard />} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="farmers" element={<Farmers />} />
          <Route path="farmers/:id" element={<FarmDetail />} />
          <Route path="map" element={<AreaMap />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="planting" element={<Planting />} />
          <Route path="supply" element={<Supply />} />
          <Route path="upazila" element={<Upazila />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <WhyDrawer />
      <DataInfo />
      <Toast />
    </>
  );
}
