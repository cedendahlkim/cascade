# Task: gen-func-reduce_product-9189 | Score: 100% | 2026-02-12T17:04:46.369816

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)