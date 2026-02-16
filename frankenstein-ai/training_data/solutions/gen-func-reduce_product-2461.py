# Task: gen-func-reduce_product-2461 | Score: 100% | 2026-02-12T16:10:47.066628

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)