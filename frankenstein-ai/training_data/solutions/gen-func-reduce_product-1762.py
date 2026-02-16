# Task: gen-func-reduce_product-1762 | Score: 100% | 2026-02-12T13:44:31.080358

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)