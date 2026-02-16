# Task: gen-func-reduce_product-3146 | Score: 100% | 2026-02-12T13:25:46.255541

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)