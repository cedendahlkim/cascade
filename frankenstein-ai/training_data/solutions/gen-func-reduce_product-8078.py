# Task: gen-func-reduce_product-8078 | Score: 100% | 2026-02-12T14:25:57.322933

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)