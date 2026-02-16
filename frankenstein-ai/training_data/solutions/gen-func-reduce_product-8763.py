# Task: gen-func-reduce_product-8763 | Score: 100% | 2026-02-14T12:08:18.189495

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)