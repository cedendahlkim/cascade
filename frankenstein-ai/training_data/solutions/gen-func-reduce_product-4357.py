# Task: gen-func-reduce_product-4357 | Score: 100% | 2026-02-13T10:40:51.667442

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)