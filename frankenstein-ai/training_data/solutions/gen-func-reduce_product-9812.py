# Task: gen-func-reduce_product-9812 | Score: 100% | 2026-02-12T20:22:39.704244

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)