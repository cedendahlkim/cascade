# Task: gen-func-reduce_product-8263 | Score: 100% | 2026-02-13T15:28:15.656171

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)