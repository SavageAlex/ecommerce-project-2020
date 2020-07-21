from django_countries import countries
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from rest_framework.generics import (
    ListAPIView, RetrieveAPIView, CreateAPIView,
    UpdateAPIView, DestroyAPIView
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST
from core.models import (
    Item, OrderItem, Order, Address, Payment, Coupon, Refund, UserProfile,
    Variation, ItemVariation,
)
from .serializers import (
    ItemSerializer, OrderSerializer, ItemDetailSerializer,
    AddressSerializer, PaymentSerializer,
)

import json


import stripe

stripe.api_key = settings.STIPE_SECRET_KEY
stripe_public_key = settings.STIPE_PUBLIC_KEY


class UserIDView(APIView):
    def get(self, request, *args, **kwargs):
        print("UserIDView")
        print(request.user.id)
        print(request.auth)
        return Response({'userID': request.user.id}, status=HTTP_200_OK)


class ItemListView(ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ItemSerializer
    queryset = Item.objects.all()


class ItemDetailView(RetrieveAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ItemDetailSerializer
    queryset = Item.objects.all()


class OrderQuantityUpdateView(APIView):
    def post(self, request, *args, **kwargs):
        slug = request.data.get('slug', None)
        if slug is None:
            return Response({"message": "Invalid data"}, status=HTTP_400_BAD_REQUEST)
        item = get_object_or_404(Item, slug=slug)
        order_qs = Order.objects.filter(
            user=request.user,
            ordered=False
        )
        if order_qs.exists():
            order = order_qs[0]
            # check if the order item is in the order
            if order.items.filter(item__slug=item.slug).exists():
                order_item = OrderItem.objects.filter(
                    item=item,
                    user=request.user,
                    ordered=False
                )[0]
                if order_item.quantity > 1:
                    order_item.quantity -= 1
                    order_item.save()
                    # order.items.remove(order_item)
                    return Response(status=HTTP_200_OK)
                else:
                    order.items.remove(order_item)
                    return Response(status=HTTP_200_OK)
                    # order_item.delete()
                    # if not OrderItem.objects.filter(user=request.user, ordered=False).exists():
                    #     order_qs.delete()
                    #     return Response(status=HTTP_200_OK)
                    # else:
                    #     # order.items.remove(order_item)
                    #     return Response(status=HTTP_200_OK)
            else:
                return Response({"message": "This item was not in your card"}, status=HTTP_400_BAD_REQUEST)
        else:
            return Response({"message": "You do not have an active order"}, status=HTTP_400_BAD_REQUEST)


class OrderItemDeleteView(DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = OrderItem.objects.all()


class AddToCartView(APIView):
    def post(self, request, *args, **kwargs):
        slug = request.data.get('slug', None)
        variations = request.data.get('variations', [])
        if slug is None:
            return Response({"message": "Invalid request"}, status=HTTP_400_BAD_REQUEST)

        item = get_object_or_404(Item, slug=slug)

        minimum_variation_count = Variation.objects.filter(item=item).count()
        if len(variations) < minimum_variation_count:
            return Response({"message": "Please specify the required variations"}, status=HTTP_400_BAD_REQUEST)

        order_item_qs = OrderItem.objects.filter(
            item=item,
            user=request.user,
            ordered=False
        )

        for v in variations:
            order_item_qs = order_item_qs.filter(
                item_variation__exact=v
            )

        if order_item_qs.exists():
            order_item = order_item_qs.first()
            order_item.quantity += 1
            order_item.save()
        else:
            order_item = OrderItem.objects.create(
                item=item,
                user=request.user,
                ordered=False
            )
            order_item.item_variation.add(*variations)
            order_item.save()

        order_qs = Order.objects.filter(user=request.user, ordered=False)
        if order_qs.exists():
            order = order_qs[0]
            # check if the order item is in the order
            if not order.items.filter(item__id=order_item.id).exists():
                order.items.add(order_item)
            return Response(status=HTTP_200_OK)

        else:
            ordered_date = timezone.now()
            order = Order.objects.create(
                user=request.user, ordered_date=ordered_date)
            order.items.add(order_item)
            return Response(status=HTTP_200_OK)


class OrderDetailView(RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        try:
            print("OrderDetailView")
            print(self.request.user)
            print(self.request.auth)
            order = Order.objects.get(user=self.request.user, ordered=False)
            return order
        except ObjectDoesNotExist:
            return None
            # raise Http404("You do not have an active order")
            # return Response({"message": "You do not have an active order"}, status=HTTP_400_BAD_REQUEST)


def get_or_none(Model, **kwargs):
    try:
        return Model.objects.get(**kwargs)
    except Model.DoesNotExist:
        return None


class CreatePaymentIntent(APIView):
    def post(self, request, *args, **kwargs):
        print("CreatePaymentIntent")
        print(request)
        payment = get_or_none(Payment, user=self.request.user,
                              payment_succeeded=False)
        print("0")
        # try:
        #     payment = Payment.objects.get(user=self.request.user)
        #     return payment
        # except ObjectDoesNotExist:
        #     payment = None
        #     return payment
        order = Order.objects.get(user=self.request.user, ordered=False)
        userprofile = UserProfile.objects.get(user=self.request.user)
        # token = request.data.get('stripeToken')
        # billing_address_id = request.data.get('selectedBillingAddress')
        # shipping_address_id = request.data.get('selectedShippingAddress')

        # billing_address = Address.objects.get(id=billing_address_id)
        # shipping_address = Address.objects.get(id=shipping_address_id)

        if userprofile.stripe_customer_id != '' and userprofile.stripe_customer_id is not None:
            customer = stripe.Customer.retrieve(
                userprofile.stripe_customer_id)
            # customer.sources.create(source=token)

        else:
            customer = stripe.Customer.create(
                email=self.request.user.email,
            )
            # customer.sources.create(source=token)
            userprofile.stripe_customer_id = customer['id']
            userprofile.one_click_purchasing = True
            userprofile.save()

        amount = int(order.get_total() * 100)

        if payment and payment.stripe_intent_id != '' and payment.stripe_intent_id is not None:
            payment_intent = stripe.PaymentIntent.retrieve(
                payment.stripe_intent_id)
        else:
            payment_intent = None
        if payment_intent is not None and payment_intent['amount'] == amount:
            print('1')
            print(payment_intent)
            return Response(payment_intent, status=HTTP_200_OK)
        else:
            print('2')
            try:
                payment_intent = stripe.PaymentIntent.create(
                    amount=amount,  # cents
                    currency="usd",
                    customer=userprofile.stripe_customer_id,
                    # idempotency_key=order.id
                )
                print(payment)
                if payment is None:
                    payment = Payment.objects.create(
                        user=self.request.user,
                        stripe_intent_id=payment_intent['id'],
                        amount=order.get_total()
                    )
                else:
                    payment.stripe_intent_id = payment_intent['id']
                    payment.amount = order.get_total()
                    payment.save()

                print('3')
                print(payment_intent)

                return Response(payment_intent, status=HTTP_200_OK)

            except stripe.error.CardError as e:
                body = e.json_body
                err = body.get('error', {})
                print('4')
                return Response({"message": f"{err.get('message')}"}, status=HTTP_400_BAD_REQUEST)

            except stripe.error.RateLimitError as e:
                # Too many requests made to the API too quickly
                messages.warning(self.request, "Rate limit error")
                return Response({"message": "Rate limit error"}, status=HTTP_400_BAD_REQUEST)

            except stripe.error.InvalidRequestError as e:
                # Invalid parameters were supplied to Stripe's API
                return Response({"message": "Invalid parameters"}, status=HTTP_400_BAD_REQUEST)

            except stripe.error.AuthenticationError as e:
                # Authentication with Stripe's API failed
                # (maybe you changed API keys recently)
                return Response({"message": "Not authenticated"}, status=HTTP_400_BAD_REQUEST)

            except stripe.error.APIConnectionError as e:
                # Network communication with Stripe failed
                return Response({"message": "Network error"}, status=HTTP_400_BAD_REQUEST)

            except stripe.error.StripeError as e:
                # Display a very generic error to the user, and maybe send
                # yourself an email
                return Response({"message": "Something went wrong. You were not charged. Please try again."}, status=HTTP_400_BAD_REQUEST)

            except Exception as e:
                # send an email to ourselves
                return Response({"message": "A serious error occurred. We have been notifed."}, status=HTTP_400_BAD_REQUEST)

            return Response({"message": "Invalid data received"}, status=HTTP_400_BAD_REQUEST)


class PaymentView(APIView):
    def post(self, request, *args, **kwargs):
        order = Order.objects.get(user=self.request.user, ordered=False)
        userprofile = UserProfile.objects.get(user=self.request.user)
        # token = request.data.get('stripeToken')
        billing_address_id = request.data.get('selectedBillingAddress')
        shipping_address_id = request.data.get('selectedShippingAddress')

        billing_address = Address.objects.get(id=billing_address_id)
        shipping_address = Address.objects.get(id=shipping_address_id)

        # if userprofile.stripe_customer_id != '' and userprofile.stripe_customer_id is not None:
        #     customer = stripe.Customer.retrieve(
        #         userprofile.stripe_customer_id)
        #     # customer.sources.create(source=token)

        # else:
        #     customer = stripe.Customer.create(
        #         email=self.request.user.email,
        #     )
        #     # customer.sources.create(source=token)
        #     userprofile.stripe_customer_id = customer['id']
        #     userprofile.one_click_purchasing = True
        #     userprofile.save()

        # amount = int(order.get_total() * 100)

        try:

            # charge the customer because we cannot charge the token more than once
            # charge = stripe.Charge.create(
            #     amount=amount,  # cents
            #     currency="usd",
            #     customer=userprofile.stripe_customer_id
            # )
            # charge once off on the token
            # charge = stripe.Charge.create(
            #     amount=amount,  # cents
            #     currency="usd",
            #     source=token
            # )

            # create the payment
            payment = Payment.objects.get(
                user=self.request.user, payment_succeeded=False)
            payment.amount = order.get_total()
            payment.payment_succeeded = True
            payment.save()

            # assign the payment to the order

            order_items = order.items.all()
            order_items.update(ordered=True)
            for item in order_items:
                item.save()

            order.ordered = True
            order.payment = payment
            order.billing_address = billing_address
            order.shipping_address = shipping_address
            # order.ref_code = create_ref_code()
            order.save()

            return Response(status=HTTP_200_OK)

        except stripe.error.CardError as e:
            body = e.json_body
            err = body.get('error', {})
            return Response({"message": f"{err.get('message')}"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.RateLimitError as e:
            # Too many requests made to the API too quickly
            messages.warning(self.request, "Rate limit error")
            return Response({"message": "Rate limit error"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.InvalidRequestError as e:
            # Invalid parameters were supplied to Stripe's API
            return Response({"message": "Invalid parameters"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.AuthenticationError as e:
            # Authentication with Stripe's API failed
            # (maybe you changed API keys recently)
            return Response({"message": "Not authenticated"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.APIConnectionError as e:
            # Network communication with Stripe failed
            return Response({"message": "Network error"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.StripeError as e:
            # Display a very generic error to the user, and maybe send
            # yourself an email
            return Response({"message": "Something went wrong. You were not charged. Please try again."}, status=HTTP_400_BAD_REQUEST)

        except Exception as e:
            # send an email to ourselves
            return Response({"message": "A serious error occurred. We have been notifed."}, status=HTTP_400_BAD_REQUEST)

        return Response({"message": "Invalid data received"}, status=HTTP_400_BAD_REQUEST)


class AddCouponView(APIView):
    def post(self, request, *args, **kwargs):
        code = request.data.get('code', None)
        if code is None:
            return Response({"message": "Invalid data received"}, status=HTTP_400_BAD_REQUEST)
        order = Order.objects.get(
            user=self.request.user, ordered=False)
        coupon = get_object_or_404(Coupon, code=code)
        order.coupon = coupon
        order.save()
        return Response(status=HTTP_200_OK)


class CountryListView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(countries, status=HTTP_200_OK)


class AddressListView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AddressSerializer

    def get_queryset(self):
        address_type = self.request.query_params.get('address_type', None)
        print(address_type)
        qs = Address.objects.all()
        if address_type is None:
            return qs
        return qs.filter(user=self.request.user, address_type=address_type)


class AddressCreateView(CreateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AddressSerializer
    queryset = Address.objects.all()


class AddressUpdateView(UpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AddressSerializer
    queryset = Address.objects.all()


class AddressDeleteView(DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = Address.objects.all()


class PaymentListView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)
