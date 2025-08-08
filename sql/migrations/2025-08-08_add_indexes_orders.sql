-- Optimize common queries for orders listing
create index if not exists idx_orders_orderdate_desc on orders("orderDate" desc);
create index if not exists idx_orders_seller_orderdate_desc on orders("seller", "orderDate" desc);
create index if not exists idx_orders_status_orderdate_desc on orders("status", "orderDate" desc);

