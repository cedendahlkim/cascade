# Task: gen-func-reduce_product-2830 | Score: 100% | 2026-02-12T20:40:06.126524

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)