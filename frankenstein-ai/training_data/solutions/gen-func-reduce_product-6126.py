# Task: gen-func-reduce_product-6126 | Score: 100% | 2026-02-12T13:49:21.326698

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)