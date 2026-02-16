# Task: gen-func-reduce_product-4184 | Score: 100% | 2026-02-12T14:05:42.953466

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)