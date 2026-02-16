# Task: gen-func-reduce_product-4109 | Score: 100% | 2026-02-12T15:50:04.928460

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)