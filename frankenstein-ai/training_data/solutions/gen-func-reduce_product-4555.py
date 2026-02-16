# Task: gen-func-reduce_product-4555 | Score: 100% | 2026-02-13T20:33:17.050308

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)