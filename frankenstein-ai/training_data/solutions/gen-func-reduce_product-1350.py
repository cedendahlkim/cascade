# Task: gen-func-reduce_product-1350 | Score: 100% | 2026-02-13T08:55:46.799128

from functools import reduce

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

product = reduce(lambda x, y: x * y, numbers)
print(product)