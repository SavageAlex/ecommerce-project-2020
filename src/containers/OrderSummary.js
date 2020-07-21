import React from "react";
import { connect } from "react-redux";
import {
  Button,
  Container,
  Dimmer,
  Header,
  Icon,
  Image,
  Label,
  Loader,
  Menu,
  Table,
  Message,
  Segment,
} from "semantic-ui-react";
import { Link, Redirect } from "react-router-dom";
import { authAxios } from "../utils";
import {
  orderSummaryURL,
  orderItemDeleteURL,
  addToCartURL,
  orderItemUpdateQuantityURL,
} from "../constants";
import { fetchCart } from "../store/actions/cart";

class OrderSummary extends React.Component {
  state = {
    data: null,
    error: null,
    loading: false,
  };

  componentDidMount() {
    this.handleFetchOrder();
  }

  handleFetchOrder = () => {
    this.setState({ loading: true });
    authAxios
      .get(orderSummaryURL)
      .then((res) => {
        this.setState({ data: res.data, loading: false });
      })
      .catch((err) => {
        if (err.response.status === 404) {
          this.setState({
            error: "You currently do not have an order",
            loading: false,
          });
        } else {
          this.setState({ error: err, loading: false });
        }
      });
  };

  renderVariations = (orderItem) => {
    let text = "";
    orderItem.item_variations.forEach((iv) => {
      text += `${iv.variation.name}: ${iv.value}, `;
    });
    return text;
  };

  handleFormatData = (itemVariations) => {
    return Object.keys(itemVariations).map((key) => {
      return itemVariations[key].id;
    });
  };

  handleAddToCart = (slug, itemVariations) => {
    this.setState({ loading: true });
    const { formData } = this.state;
    const variations = this.handleFormatData(itemVariations);
    authAxios
      .post(addToCartURL, { slug, variations })
      .then((res) => {
        this.handleFetchOrder();
        this.props.fetchCart();
        this.setState({ loading: false });
      })
      .catch((err) => {
        this.setState({ error: err, loading: false });
      });
  };

  handleRemoveQuantityFromCart = (slug) => {
    authAxios
      .post(orderItemUpdateQuantityURL, { slug })
      .then((res) => {
        this.handleFetchOrder();
        this.props.fetchCart();
      })
      .catch((err) => {
        this.setState({ error: err });
      });
  };

  handleRemoveItem = (itemID) => {
    authAxios
      .delete(orderItemDeleteURL(itemID))
      .then((res) => {
        this.handleFetchOrder();
        this.props.fetchCart();
      })
      .catch((err) => {
        this.setState({ error: err });
      });
  };

  render() {
    // const { isAuthenticated } = this.props;
    // if (!isAuthenticated) {
    //   return <Redirect to="/login" />;
    // }
    const { data, error, loading } = this.state;
    return (
      <Container>
        <Header as="h3">Order Summary</Header>
        {error && (
          <Message
            error
            header="There was an error"
            content={JSON.stringify(error)}
          />
        )}
        {loading && (
          <Segment>
            <Dimmer active inverted>
              <Loader inverted>Loading</Loader>
            </Dimmer>
            <Image src="https://react.semantic-ui.com/images/wireframe/short-paragraph.png" />
          </Segment>
        )}
        {data && (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Item #</Table.HeaderCell>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Price</Table.HeaderCell>
                <Table.HeaderCell>Quantity</Table.HeaderCell>
                <Table.HeaderCell>Total item price</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {data.order_items.map((orderItem, i) => {
                return (
                  <Table.Row key={orderItem.id}>
                    <Table.Cell>{`${i + 1}`}</Table.Cell>
                    <Table.Cell>
                      {orderItem.item.title} -{" "}
                      {this.renderVariations(orderItem)}
                    </Table.Cell>
                    <Table.Cell>${orderItem.item.price}</Table.Cell>
                    <Table.Cell textAlign="center">
                      <Icon
                        name="minus"
                        style={{ float: "left", cursor: "pointer" }}
                        onClick={() =>
                          this.handleRemoveQuantityFromCart(orderItem.item.slug)
                        }
                      />
                      {orderItem.quantity}

                      <Icon
                        name="plus"
                        style={{ float: "right", cursor: "pointer" }}
                        onClick={() =>
                          this.handleAddToCart(
                            orderItem.item.slug,
                            orderItem.item_variations
                          )
                        }
                      />
                    </Table.Cell>
                    <Table.Cell>
                      {orderItem.item.discount_price && (
                        <Label color="green" ribbon>
                          ON DISCOUNT
                        </Label>
                      )}
                      ${orderItem.final_price}
                      <Icon
                        name="trash"
                        color="red"
                        style={{ float: "right", cursor: "pointer" }}
                        onClick={() => this.handleRemoveItem(orderItem.id)}
                      />
                    </Table.Cell>
                  </Table.Row>
                );
              })}
              <Table.Row>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell colSpan="2" textAlign="center">
                  Total: ${data.total}
                </Table.Cell>
              </Table.Row>
            </Table.Body>

            <Table.Footer>
              <Table.Row>
                <Table.HeaderCell colSpan="5">
                  <Link to="/checkout">
                    <Button floated="right" color="yellow">
                      Checkout
                    </Button>
                  </Link>
                </Table.HeaderCell>
              </Table.Row>
            </Table.Footer>
          </Table>
        )}
      </Container>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchCart: () => dispatch(fetchCart()),
  };
};

export default connect(null, mapDispatchToProps)(OrderSummary);

// const mapStateToProps = (state) => {
//   return {
//     isAuthenticated: state.auth.token !== null,
//   };
// };
