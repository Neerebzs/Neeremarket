-- Order numbers come from a sequence so concurrent checkouts never collide.
CREATE SEQUENCE IF NOT EXISTS "order_number_seq";

SELECT setval(
  'order_number_seq',
  GREATEST(
    10000,
    COALESCE(
      (SELECT MAX(CAST(SUBSTRING("order_number" FROM 5) AS BIGINT))
       FROM "orders"
       WHERE "order_number" ~ '^ORD-[0-9]+$'),
      10000
    )
  )
);
