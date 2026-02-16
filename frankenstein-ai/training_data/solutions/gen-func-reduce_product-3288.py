# Task: gen-func-reduce_product-3288 | Score: 100% | 2026-02-12T14:08:06.851129

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)