# Task: gen-func-reduce_product-9826 | Score: 100% | 2026-02-12T17:22:25.629345

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)