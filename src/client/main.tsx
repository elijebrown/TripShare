import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './components/App.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Trip } from './components/Trip.tsx';
import { Photos } from './components/Photos.tsx';
import { photosLoader, tripPhotosLoader } from './api/loaders.ts';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'trips/',
        children: [
          {
            index: true,
            element: <h1>index</h1>,
          },
          {
            path: ':tripId',
            element: <Trip />,
            loader: tripPhotosLoader,
          },
        ],
      },
      {
        path: 'memories/',
        children: [
          {
            index: true,
            element: <h1>index</h1>,
          },
          {
            path: ':memoriesid',
            element: <h1>Memory detail — not built yet</h1>,
          },
        ],
      },
      {
        path: 'photos',
        element: <Photos />,
        loader: photosLoader,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
