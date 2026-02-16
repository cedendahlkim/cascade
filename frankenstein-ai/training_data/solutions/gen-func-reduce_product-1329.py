# Task: gen-func-reduce_product-1329 | Score: 100% | 2026-02-12T17:21:22.878736

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)