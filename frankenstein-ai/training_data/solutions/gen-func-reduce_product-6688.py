# Task: gen-func-reduce_product-6688 | Score: 100% | 2026-02-11T12:09:47.180862

from functools import reduce

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

product = reduce(lambda x, y: x * y, numbers)
print(product)