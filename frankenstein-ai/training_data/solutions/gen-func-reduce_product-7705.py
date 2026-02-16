# Task: gen-func-reduce_product-7705 | Score: 100% | 2026-02-13T09:10:24.815977

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)