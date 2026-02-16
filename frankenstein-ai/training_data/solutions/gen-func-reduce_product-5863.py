# Task: gen-func-reduce_product-5863 | Score: 100% | 2026-02-12T19:38:49.166969

from functools import reduce

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

product = reduce(lambda x, y: x * y, numbers)
print(product)