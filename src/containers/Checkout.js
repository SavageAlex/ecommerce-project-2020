import React from "react";
import {
  Elements,
  ElementsConsumer,
  CardElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  Button,
  Container,
  Checkbox,
  Dimmer,
  Divider,
  Form,
  Header,
  Image,
  Item,
  Label,
  Loader,
  Message,
  Segment,
  Select,
} from "semantic-ui-react";
import { Link, withRouter } from "react-router-dom";
import { authAxios } from "../utils";
import {
  createPaymentIntentURL,
  orderSummaryURL,
  addCouponURL,
  addressListURL,
  checkoutURL,
} from "../constants";

const OrderPreview = (props) => {
  const { data } = props;
  return (
    <React.Fragment>
      {data && (
        <React.Fragment>
          <Item.Group relaxed>
            {data.order_items.map((orderItem, i) => {
              return (
                <Item key={orderItem.id}>
                  <Item.Image
                    size="tiny"
                    src={`http://127.0.0.1:8000${orderItem.item.image}`}
                  />

                  <Item.Content verticalAlign="middle">
                    <Item.Header as="a">
                      {orderItem.quantity} x {orderItem.item.title}
                    </Item.Header>
                    <Item.Extra>
                      <Label floated="right">${orderItem.final_price}</Label>
                    </Item.Extra>
                  </Item.Content>
                </Item>
              );
            })}
          </Item.Group>
          <Item.Group>
            <Item>
              <Item.Content>
                <Item.Header>
                  Order Total: ${data.total}
                  {data.coupon && (
                    <Label color="green" style={{ marginLift: "10px" }}>
                      Current coupon: {data.coupon.code} for $
                      {data.coupon.amount}
                    </Label>
                  )}
                </Item.Header>
              </Item.Content>
            </Item>
          </Item.Group>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

/**
 * Use the CSS tab above to style your Element's container.
 */
// import "./CardSectionStyles.css";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

function CardSection() {
  return (
    <label>
      <CardElement options={CARD_ELEMENT_OPTIONS} />
    </label>
  );
}

class CouponForm extends React.Component {
  state = {
    code: "",
  };

  handleChange = (e) => {
    this.setState({
      code: e.target.value,
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { code } = this.state;
    this.props.handleAddCoupon(e, code);
    this.setState({ code: "" });
  };

  render() {
    const { code } = this.state;
    return (
      <React.Fragment>
        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>Coupon code</label>
            <input
              placeholder="Enter a coupon..."
              value={code}
              onChange={this.handleChange}
            />
          </Form.Field>
          <Button type="submit">Submit</Button>
        </Form>
      </React.Fragment>
    );
  }
}

class CheckoutForm extends React.Component {
  state = {
    data: null,
    loading: false,
    error: null,
    success: false,
    shippingAddresses: [],
    billingAddresses: [],
    selectedBillingAddress: "",
    selectedShippingAddress: "",
    clientSecret: null,
    pi_id: null,
  };

  componentDidMount() {
    this.handleFetchOrder();
    this.createPaymentIntent();
    this.handleFetchBillingAddresses();
    this.handleFetchShippingAddresses();
  }

  handleGetDefaultAddress = (addresses) => {
    const filteredAddresses = addresses.filter((el) => el.default === true);
    if (filteredAddresses.length > 0) {
      return filteredAddresses[0].id;
    }
    return "";
  };

  handleFetchBillingAddresses = () => {
    this.setState({ loading: true });
    authAxios
      .get(addressListURL("B"))
      .then((res) => {
        this.setState({
          billingAddresses: res.data.map((a) => {
            return {
              key: a.id,
              text: `${a.street_address}, ${a.apartment_address}, ${a.country}`,
              value: a.id,
            };
          }),
          selectedBillingAddress: this.handleGetDefaultAddress(res.data),
          loading: false,
        });
      })
      .catch((err) => {
        this.setState({ error: err, loading: false });
      });
  };

  handleFetchShippingAddresses = () => {
    this.setState({ loading: true });
    authAxios
      .get(addressListURL("S"))
      .then((res) => {
        this.setState({
          shippingAddresses: res.data.map((a) => {
            return {
              key: a.id,
              text: `${a.street_address}, ${a.apartment_address}, ${a.country}`,
              value: a.id,
            };
          }),
          selectedShippingAddress: this.handleGetDefaultAddress(res.data),
          loading: false,
        });
      })
      .catch((err) => {
        this.setState({ error: err, loading: false });
      });
  };

  handleFetchOrder = () => {
    this.setState({ loading: true });
    authAxios
      .get(orderSummaryURL)
      .then((res) => {
        this.setState({ data: res.data, loading: false });
      })
      .catch((err) => {
        if (err.response.status === 404) {
          this.props.history.push("/products");
          // this.serState({
          //   error: "You currently do not have an order",
          //   loading: false,
          // });
        } else {
          this.setState({ error: err, loading: false });
        }
      });
  };

  handleAddCoupon = (e, code) => {
    e.preventDefault();
    this.setState({ loading: true });
    authAxios
      .post(addCouponURL, { code })
      .then((res) => {
        this.setState({ loading: false });
        this.handleFetchOrder();
        this.createPaymentIntent();
      })
      .catch((err) => {
        this.setState({ error: err, loading: false });
      });
  };

  handleSelectChange = (e, { name, value }) => {
    console.log(name);
    console.log(value);
    this.setState({ [name]: value });
  };

  handleRefresh = () => {};

  createPaymentIntent = () => {
    this.setState({ loading: true });
    authAxios
      .post(createPaymentIntentURL)
      .then((res) => {
        console.log(res);
        this.setState({
          clientSecret: res.data.client_secret,
          pi_id: res.data.id,
          loading: false,
        });
      })
      .catch((err) => {
        this.setState({ error: err, loading: false });
      });
  };

  handleSubmit = async (event) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();
    this.setState({ loading: true });

    const { stripe, elements } = this.props;

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make  sure to disable form submission until Stripe.js has loaded.
      return;
    }
    const result = await stripe.confirmCardPayment(this.state.clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {},
      },
    });

    if (result.error) {
      // Show error to your customer (e.g., insufficient funds)
      this.setState({ error: result.error.message, loading: false });
      console.log(result.error.message);
    } else {
      // The payment has been processed!
      this.setState({ error: null, loading: false });
      if (result.paymentIntent.status === "succeeded") {
        // Show a success message to your customer
        // There's a risk of the customer closing the window before callback
        // execution. Set up a webhook or plugin to listen for the
        // payment_intent.succeeded event that handles any business critical
        // post-payment actions.
        const { selectedBillingAddress, selectedShippingAddress } = this.state;

        authAxios
          .post(checkoutURL, {
            selectedBillingAddress,
            selectedShippingAddress,
          })
          .then((res) => {
            this.setState({ error: null, loading: false, success: true });
          })
          .catch((err) => {
            this.setState({ loadind: false, error: err });
          });
        // redirect the user
      }
    }
  };

  render() {
    const {
      data,
      error,
      loading,
      success,
      billingAddresses,
      shippingAddresses,
      selectedBillingAddress,
      selectedShippingAddress,
      clientSecret,
      pi_id,
    } = this.state;

    return (
      <div>
        {error && (
          <Message
            error
            header="There was some errors with your submission"
            content={JSON.stringify(error)}
          />
        )}
        {loading && (
          <Segment>
            <Dimmer active inverted>
              <Loader inverted>Loading</Loader>
            </Dimmer>

            <Image src="/images/wireframe/short-paragraph.png" />
          </Segment>
        )}
        <OrderPreview data={data} />
        <Divider />
        <CouponForm
          handleAddCoupon={(e, code) => this.handleAddCoupon(e, code)}
        />
        <Divider />
        <Header>Select a shipping address</Header>
        {billingAddresses.length > 0 ? (
          <Select
            name="selectedShippingAddress"
            value={selectedShippingAddress}
            clearable
            options={shippingAddresses}
            selection
            onChange={this.handleSelectChange}
          />
        ) : (
          <p>
            You need to <Link to="/profile">add a shipping addresses</Link>
          </p>
        )}

        <Header>Select a billing address</Header>
        {shippingAddresses.length > 0 ? (
          <Select
            name="selectedBillingAddress"
            value={selectedBillingAddress}
            clearable
            options={billingAddresses}
            selection
            onChange={this.handleSelectChange}
          />
        ) : (
          <p>You need to add addresses before you complete your purchase</p>
        )}

        <Divider />

        {billingAddresses.length < 1 || shippingAddresses.length < 1 ? (
          <p>
            You need to <Link to="/profile">add addresses</Link>
          </p>
        ) : (
          <React.Fragment>
            <Header>Would you like to complete the purchase?</Header>
            <CardSection />

            {success && (
              <Message positive>
                <Message.Header>Your payment was successful</Message.Header>
                <p>
                  Go to your <b>profile</b> to see the order delivery status.
                </p>
              </Message>
            )}

            <Button
              loading={loading}
              disabled={loading}
              primary
              disabled={!this.props.stripe}
              onClick={this.handleSubmit}
              style={{ marginTop: "10px" }}
            >
              Submit
            </Button>
          </React.Fragment>
        )}
      </div>
    );
  }
}

const CheckoutFormWithRouter = withRouter(CheckoutForm);

const InjectedCheckoutForm = () => {
  return (
    <ElementsConsumer>
      {({ stripe, elements }) => (
        <CheckoutFormWithRouter stripe={stripe} elements={elements} />
      )}
    </ElementsConsumer>
  );
};

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe("pk_test_jX6JnohMe3aTRgx4wmMsMSak00abNZwavw");

const WrappedForm = () => (
  <Container text>
    <div>
      <h1>Complete your order</h1>
      <Elements stripe={stripePromise}>
        <InjectedCheckoutForm />
      </Elements>
    </div>
  </Container>
);

export default WrappedForm;

//   const handleSubmit = async (ev) => {
//     ev.preventDefault();
//     setProcessing(true);

//     // Step 3: Use clientSecret from PaymentIntent and the CardElement
//     // to confirm payment with stripe.confirmCardPayment()
//     const payload = await stripe.confirmCardPayment(clientSecret, {
//       payment_method: {
//         card: elements.getElement(CardElement),
//         billing_details: {
//           name: ev.target.name.value,
//         },
//       },
//     });

//     if (payload.error) {
//       setError(`Payment failed: ${payload.error.message}`);
//       setProcessing(false);
//       console.log("[error]", payload.error);
//     } else {
//       setError(null);
//       setSucceeded(true);
//       setProcessing(false);
//       setMetadata(payload.paymentIntent);
//       console.log("[PaymentIntent]", payload.paymentIntent);
//     }
//   };

//   const renderSuccess = () => {
//     return (
//       <div className="sr-field-success message">
//         <h1>Your test payment succeeded</h1>
//         <p>View PaymentIntent response:</p>
//         <pre className="sr-callout">
//           <code>{JSON.stringify(metadata, null, 2)}</code>
//         </pre>
//       </div>
//     );
//   };

//   const renderForm = () => {
//     const options = {
//       style: {
//         base: {
//           color: "#32325d",
//           fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
//           fontSmoothing: "antialiased",
//           fontSize: "16px",
//           "::placeholder": {
//             color: "#aab7c4",
//           },
//         },
//         invalid: {
//           color: "#fa755a",
//           iconColor: "#fa755a",
//         },
//       },
//     };
