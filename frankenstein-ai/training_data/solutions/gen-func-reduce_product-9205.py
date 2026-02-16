# Task: gen-func-reduce_product-9205 | Score: 100% | 2026-02-12T14:25:28.974423

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)