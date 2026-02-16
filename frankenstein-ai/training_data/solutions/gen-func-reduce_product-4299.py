# Task: gen-func-reduce_product-4299 | Score: 100% | 2026-02-12T12:21:10.801150

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)