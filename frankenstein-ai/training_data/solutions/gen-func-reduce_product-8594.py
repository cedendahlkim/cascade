# Task: gen-func-reduce_product-8594 | Score: 100% | 2026-02-12T17:03:56.953830

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)