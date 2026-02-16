# Task: gen-func-reduce_product-9415 | Score: 100% | 2026-02-12T20:40:11.310657

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)