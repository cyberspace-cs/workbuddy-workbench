import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import DashboardPage from './pages/Dashboard/DashboardPage';
import MaterialsPage from './pages/Materials/MaterialsPage';
import ProjectsPage from './pages/Projects/ProjectsPage';
import WeeklyPage from './pages/Weekly/WeeklyPage';
import MonthlyPage from './pages/Monthly/MonthlyPage';
import TimelinePage from './pages/Timeline/TimelinePage';
import GrowthPage from './pages/Growth/GrowthPage';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="weekly" element={<WeeklyPage />} />
        <Route path="monthly" element={<MonthlyPage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="growth" element={<GrowthPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
