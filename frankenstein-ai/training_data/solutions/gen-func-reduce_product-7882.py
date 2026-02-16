# Task: gen-func-reduce_product-7882 | Score: 100% | 2026-02-13T11:23:14.913061

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)