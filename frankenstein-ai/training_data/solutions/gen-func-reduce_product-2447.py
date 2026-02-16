# Task: gen-func-reduce_product-2447 | Score: 100% | 2026-02-12T20:17:18.578570

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)