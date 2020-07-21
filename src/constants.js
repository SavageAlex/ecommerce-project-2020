const localhost = "http://127.0.0.1:8000";

const apiURL = "/api";

export const endpoint = `${localhost}${apiURL}`;

export const userIDURL = `${endpoint}/user-id/`;
export const productListURL = `${endpoint}/products/`;
export const productDetailURL = (id) => `${endpoint}/products/${id}/`;
export const checkoutURL = `${endpoint}/checkout/`;
export const addToCartURL = `${endpoint}/add-to-cart/`;
export const orderSummaryURL = `${endpoint}/order-summary/`;
export const createPaymentIntentURL = `${endpoint}/create-payment-intent/`;
export const addCouponURL = `${endpoint}/add-coupon/`;
export const countryListURL = `${endpoint}/countries/`;
export const addressListURL = (addressType) =>
  `${endpoint}/addresses/?address_type=${addressType}`;
export const addressCreateURL = `${endpoint}/addresses/create/`;
export const addressUpdateURL = (id) => `${endpoint}/addresses/${id}/update/`;
export const addressDeleteURL = (id) => `${endpoint}/addresses/${id}/delete/`;
export const orderItemDeleteURL = (id) =>
  `${endpoint}/order-item/${id}/delete/`;
export const orderItemUpdateQuantityURL = `${endpoint}/order-item/update-quantity/`;
export const paymentListURL = `${endpoint}/payments/`;
