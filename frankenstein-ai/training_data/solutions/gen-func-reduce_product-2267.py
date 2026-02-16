# Task: gen-func-reduce_product-2267 | Score: 100% | 2026-02-13T10:38:21.699550

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)