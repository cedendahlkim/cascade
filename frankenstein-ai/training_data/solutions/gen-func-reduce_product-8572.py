# Task: gen-func-reduce_product-8572 | Score: 100% | 2026-02-12T15:56:39.870460

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)