# Task: gen-func-reduce_product-5083 | Score: 100% | 2026-02-12T19:21:41.561108

from functools import reduce

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

product = reduce(lambda x, y: x * y, numbers)
print(product)