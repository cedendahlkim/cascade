# Task: gen-func-reduce_product-1645 | Score: 100% | 2026-02-15T11:13:11.529650

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)