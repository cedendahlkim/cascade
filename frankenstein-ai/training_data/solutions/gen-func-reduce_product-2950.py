# Task: gen-func-reduce_product-2950 | Score: 100% | 2026-02-17T20:02:00.602758

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)