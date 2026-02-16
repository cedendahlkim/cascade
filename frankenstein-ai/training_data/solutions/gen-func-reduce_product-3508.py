# Task: gen-func-reduce_product-3508 | Score: 100% | 2026-02-15T07:49:09.719867

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)