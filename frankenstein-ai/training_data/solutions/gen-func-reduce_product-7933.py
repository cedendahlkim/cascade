# Task: gen-func-reduce_product-7933 | Score: 100% | 2026-02-12T13:04:18.681768

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)