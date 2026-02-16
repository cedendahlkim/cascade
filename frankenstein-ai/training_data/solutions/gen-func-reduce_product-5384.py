# Task: gen-func-reduce_product-5384 | Score: 100% | 2026-02-12T18:43:55.698887

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)