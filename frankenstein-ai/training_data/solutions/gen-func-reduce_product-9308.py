# Task: gen-func-reduce_product-9308 | Score: 100% | 2026-02-15T09:02:35.672107

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)