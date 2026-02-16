# Task: gen-func-reduce_product-8066 | Score: 100% | 2026-02-12T13:50:30.418121

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)