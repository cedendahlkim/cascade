# Task: gen-func-reduce_product-3467 | Score: 100% | 2026-02-11T07:25:15.419738

from functools import reduce
import operator

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

product = reduce(operator.mul, numbers)
print(product)