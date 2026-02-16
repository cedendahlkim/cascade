# Task: gen-func-reduce_product-2849 | Score: 100% | 2026-02-13T13:42:40.535608

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)