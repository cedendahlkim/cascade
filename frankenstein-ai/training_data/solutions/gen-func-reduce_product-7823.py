# Task: gen-func-reduce_product-7823 | Score: 100% | 2026-02-13T18:19:43.344975

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)