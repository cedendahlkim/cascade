# Task: gen-func-reduce_product-3543 | Score: 100% | 2026-02-12T20:22:39.941644

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)