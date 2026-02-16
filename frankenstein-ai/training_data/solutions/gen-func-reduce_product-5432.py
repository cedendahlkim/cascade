# Task: gen-func-reduce_product-5432 | Score: 100% | 2026-02-12T15:49:19.139523

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)