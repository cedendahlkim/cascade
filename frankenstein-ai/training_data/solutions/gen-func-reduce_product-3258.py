# Task: gen-func-reduce_product-3258 | Score: 100% | 2026-02-12T15:49:18.626218

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)