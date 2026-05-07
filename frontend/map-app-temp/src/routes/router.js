import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import Layout from 'views/layouts/Layout';
import Page404 from "shared-components/views/pages/error/Page404";
import PublicDatabase from "shared-components/views/pages/publicDatabase/PublicDatabase";
import VenturePublicProfile from "shared-components/views/pages/venturePublicProfile/VenturePublicProfile";

const router = createBrowserRouter(
  createRoutesFromElements([
    <Route path='/' element={<Layout><PublicDatabase mapApp /></Layout>} exact />,
    <Route
      path='/ventures/:ventureId'
      element={<Layout><VenturePublicProfile mapApp /></Layout>}
      exact
      handle={{ breadcrumb: 'Venture profile' }}
    />,
    <Route path='*' element={<Page404 />} />
  ])
);

export default router;
