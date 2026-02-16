# Task: gen-func-reduce_product-1550 | Score: 100% | 2026-02-12T12:21:35.448766

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)