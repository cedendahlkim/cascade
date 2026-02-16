# Task: gen-func-reduce_product-9152 | Score: 100% | 2026-02-15T14:00:43.974201

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)