# Task: gen-func-reduce_product-6903 | Score: 100% | 2026-02-13T13:43:02.764593

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)