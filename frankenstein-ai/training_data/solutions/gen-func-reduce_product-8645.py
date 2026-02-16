# Task: gen-func-reduce_product-8645 | Score: 100% | 2026-02-12T18:44:56.524091

n = int(input())
product = 1
for _ in range(n):
    num = int(input())
    product *= num
print(product)