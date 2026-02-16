# Task: gen-func-reduce_product-1412 | Score: 100% | 2026-02-12T17:18:09.392117

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)