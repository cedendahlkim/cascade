# Task: gen-func-reduce_product-5062 | Score: 100% | 2026-02-13T15:11:20.595091

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)