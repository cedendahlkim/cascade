# Task: gen-func-reduce_product-6692 | Score: 100% | 2026-02-12T21:16:58.741454

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)