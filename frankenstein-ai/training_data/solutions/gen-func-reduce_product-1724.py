# Task: gen-func-reduce_product-1724 | Score: 100% | 2026-02-13T13:39:09.511001

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)