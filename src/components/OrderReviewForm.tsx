"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitOrderReview } from "@/app/orders/review-actions";

type OrderReviewFormProps = {
  orderId: string;
};

export default function OrderReviewForm({
  orderId,
}: OrderReviewFormProps) {
  const [kitchenRating, setKitchenRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);

  return (
    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
      <h2 className="text-xl font-bold text-orange-950">
        Rate your order
      </h2>

      <p className="mt-2 text-sm leading-6 text-orange-900">
        Tell us about the kitchen service and the food quality.
      </p>

      <form
        action={submitOrderReview}
        className="mt-6 space-y-6"
      >
        <input
          type="hidden"
          name="order_id"
          value={orderId}
        />

        <RatingField
          name="kitchen_rating"
          label="Kitchen and service"
          value={kitchenRating}
          onChange={setKitchenRating}
        />

        <RatingField
          name="food_rating"
          label="Food quality"
          value={foodRating}
          onChange={setFoodRating}
        />

        <div>
          <label
            htmlFor={`review-comment-${orderId}`}
            className="mb-2 block text-sm font-bold text-orange-950"
          >
            Written review
            <span className="ml-2 font-normal text-orange-800">
              Optional
            </span>
          </label>

          <textarea
            id={`review-comment-${orderId}`}
            name="comment"
            rows={4}
            maxLength={1000}
            placeholder="Tell us what you liked or what could be improved."
            className="w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </div>

        <button
          type="submit"
          disabled={kitchenRating === 0 || foodRating === 0}
          className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit review
        </button>
      </form>
    </section>
  );
}

function RatingField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-bold text-orange-950">
        {label}
      </legend>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <label
            key={rating}
            className="cursor-pointer"
            title={`${rating} star${rating === 1 ? "" : "s"}`}
          >
            <input
              type="radio"
              name={name}
              value={rating}
              checked={value === rating}
              onChange={() => onChange(rating)}
              className="sr-only"
            />

            <Star
              size={30}
              className={
                rating <= value
                  ? "fill-orange-500 text-orange-500"
                  : "text-orange-300"
              }
            />
          </label>
        ))}
      </div>

      <p className="mt-1 text-xs text-orange-800">
        {value === 0
          ? "Select a rating"
          : `${value} out of 5 stars`}
      </p>
    </fieldset>
  );
}