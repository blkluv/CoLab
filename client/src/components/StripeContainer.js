import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentForm from "./PaymentForm";
const PUBLIC_KEY =
  "pk_test_51N5TmzEC5zyE604b3qlKrdd1g56JR9th1aM2iTBDPuJiLmMC2nbwYcSiXahYi6QjNv2MhcM7hu4YZKc9zdILGxo600UGrmr0PQ";

const stripeTestPromise = loadStripe(PUBLIC_KEY);

const StripeContainer = ({ project, handleSuccess }) => {
  return (
    <Elements stripe={stripeTestPromise}>
      <PaymentForm project={project} handleSuccess={handleSuccess} />
    </Elements>
  );
};

export default StripeContainer;
