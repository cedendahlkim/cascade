# Task: gen-func-reduce_product-3276 | Score: 100% | 2026-02-12T18:42:47.367100

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)