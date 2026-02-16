# Task: gen-func-reduce_product-9611 | Score: 100% | 2026-02-15T07:45:55.395290

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)