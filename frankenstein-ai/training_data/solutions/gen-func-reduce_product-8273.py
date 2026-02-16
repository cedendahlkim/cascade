# Task: gen-func-reduce_product-8273 | Score: 100% | 2026-02-11T07:25:22.097059

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)