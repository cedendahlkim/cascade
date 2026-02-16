# Task: gen-func-reduce_product-9861 | Score: 100% | 2026-02-13T10:27:23.049965

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)