import { Route, Routes } from 'react-router-dom';
import { FeedbackDetailPage } from './pages/FeedbackDetailPage';
import { FeedbackFormPage } from './pages/FeedbackFormPage';
import { FeedbackListPage } from './pages/FeedbackListPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<FeedbackListPage />} />
      <Route path="/new" element={<FeedbackFormPage />} />
      <Route path="/feedback/:id" element={<FeedbackDetailPage />} />
      <Route path="/edit/:id" element={<FeedbackFormPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
