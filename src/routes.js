import React from "react";
import { Route } from "react-router-dom";
import Hoc from "./hoc/hoc";

import AuthenticatedOnlyAccess from "./containers/AuthenticatedOnlyAccess";
import Login from "./containers/Login";
import Signup from "./containers/Signup";
import HomepageLayout from "./containers/Home";
import ProductList from "./containers/ProductList";
import ProductDetail from "./containers/ProductDetail";
import OrderSummary from "./containers/OrderSummary";
import Checkout from "./containers/Checkout";
import Profile from "./containers/Profile";

const BaseRouter = () => (
  <Hoc>
    <Route exact path="/products">
      <ProductList />
    </Route>
    <Route path="/products/:productID" component={ProductDetail} />
    <Route path="/login" component={Login} />
    <Route path="/signup" component={Signup} />
    <AuthenticatedOnlyAccess path="/order-summary">
      <OrderSummary />
    </AuthenticatedOnlyAccess>
    <AuthenticatedOnlyAccess path="/checkout">
      <Checkout />
    </AuthenticatedOnlyAccess>
    <AuthenticatedOnlyAccess path="/profile">
      <Profile />
    </AuthenticatedOnlyAccess>
    <Route exact path="/" component={HomepageLayout} />
  </Hoc>
);

export default BaseRouter;
