# Task: gen-func-reduce_product-1444 | Score: 100% | 2026-02-10T15:45:07.370022

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)