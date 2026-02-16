# Task: gen-func-reduce_product-2720 | Score: 100% | 2026-02-12T15:58:40.647161

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)