# Task: gen-func-reduce_product-4175 | Score: 100% | 2026-02-10T19:18:21.545523

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)