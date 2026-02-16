# Task: gen-func-reduce_product-5851 | Score: 100% | 2026-02-10T19:19:41.168047

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)