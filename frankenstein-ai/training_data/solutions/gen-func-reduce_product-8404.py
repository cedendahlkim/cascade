# Task: gen-func-reduce_product-8404 | Score: 100% | 2026-02-15T07:54:02.656410

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)