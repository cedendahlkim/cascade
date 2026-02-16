# Task: gen-func-reduce_product-5415 | Score: 100% | 2026-02-13T20:16:48.931569

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)