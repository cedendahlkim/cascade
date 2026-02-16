# Task: gen-func-reduce_product-6312 | Score: 100% | 2026-02-12T19:22:37.031026

from functools import reduce

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

product = reduce(lambda x, y: x * y, numbers)
print(product)