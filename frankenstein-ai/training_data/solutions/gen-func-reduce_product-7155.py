# Task: gen-func-reduce_product-7155 | Score: 100% | 2026-02-12T13:04:52.785202

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)