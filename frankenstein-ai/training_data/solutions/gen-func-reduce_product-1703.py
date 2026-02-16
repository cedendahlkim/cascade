# Task: gen-func-reduce_product-1703 | Score: 100% | 2026-02-13T09:08:53.058193

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)